import { WebSocketServer } from 'ws'
import axios from 'axios'

const PORT = 8080

const wss = new WebSocketServer({ port: PORT })

console.log(`WebSocket server is running on ws://localhost:${PORT}`)
console.log('Server started fresh - no users in memory')

// Store connected users
const users = new Map()
let hostId = null

// Jira configuration (set by host)
let jiraConfig = null

// Voting state
let currentTicketIndex = 0
let currentVotes = new Map() // userId -> points
let votingRevealed = false
let finalResult = null // Final story point value set by host

// Store Jira tickets (shared by all users)
let jiraTickets = [
  {
    id: 'JIRA-101',
    title: 'Implement user authentication',
    description: 'Add JWT-based authentication system with login and registration endpoints',
    priority: 'High',
    status: 'In Progress',
    assignee: 'John Doe'
  },
  {
    id: 'JIRA-102',
    title: 'Fix database connection issues',
    description: 'Resolve intermittent connection drops to PostgreSQL database',
    priority: 'High',
    status: 'To Do',
    assignee: 'Jane Smith'
  },
  {
    id: 'JIRA-103',
    title: 'Update API documentation',
    description: 'Document all REST endpoints with request/response examples',
    priority: 'Medium',
    status: 'In Progress',
    assignee: 'Mike Johnson'
  },
  {
    id: 'JIRA-104',
    title: 'Optimize dashboard performance',
    description: 'Reduce page load time by implementing lazy loading and caching',
    priority: 'Medium',
    status: 'To Do',
    assignee: 'Sarah Wilson'
  },
  {
    id: 'JIRA-105',
    title: 'Add unit tests',
    description: 'Write comprehensive unit tests for core business logic',
    priority: 'Low',
    status: 'Done',
    assignee: 'Tom Brown'
  },
  {
    id: 'JIRA-106',
    title: 'Design mobile responsive layout',
    description: 'Create mobile-friendly UI components for all dashboard pages',
    priority: 'Medium',
    status: 'In Progress',
    assignee: 'Lisa Garcia'
  }
]

// Function to fetch Jira tickets using REST API
async function fetchJiraTickets(filters = {}) {
  if (!jiraConfig) {
    throw new Error('Jira configuration not set')
  }
  
  let { domain, email, apiToken, projectKey } = jiraConfig
  
  // Clean up domain - remove protocol if present
  domain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
  
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64')
  
  // Build JQL query based on filters
  let jqlParts = []
  
  if (projectKey) {
    jqlParts.push(`project = ${projectKey}`)
  }
  
  if (filters.sprint) {
    if (filters.sprint === 'active') {
      jqlParts.push('sprint in openSprints()')
    } else if (filters.sprint === 'future') {
      jqlParts.push('sprint in futureSprints()')
    } else if (filters.sprint === 'backlog') {
      jqlParts.push('sprint is EMPTY')
    }
  }
  
  if (filters.assignee) {
    jqlParts.push(`assignee = "${filters.assignee}"`)
  }
  
  if (filters.status) {
    jqlParts.push(`status = "${filters.status}"`)
  }
  
  if (filters.issueType) {
    jqlParts.push(`issuetype = "${filters.issueType}"`)
  }
  
  if (filters.priority) {
    jqlParts.push(`priority = "${filters.priority}"`)
  }
  
  const jql = jqlParts.length > 0 ? jqlParts.join(' AND ') : ''
  const maxResults = filters.maxResults || 50
  
  const apiUrl = `https://${domain}/rest/api/3/search/jql`
  console.log('Fetching Jira tickets with JQL:', jql)
  console.log('API URL:', apiUrl)
  
  try {
    const response = await axios({
      method: 'POST',
      url: apiUrl,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      data: {
        jql: jql || 'order by created DESC',
        maxResults,
        fields: ['summary', 'description', 'status', 'priority', 'assignee', 'issuetype']
      }
    })
    
    // Transform Jira issues to our ticket format
    const tickets = response.data.issues.map(issue => ({
      id: issue.key,
      title: issue.fields.summary,
      description: issue.fields.description?.content?.[0]?.content?.[0]?.text || 
                   issue.fields.description || 
                   'No description available',
      priority: issue.fields.priority?.name || 'Medium',
      status: issue.fields.status?.name || 'Unknown',
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      issueType: issue.fields.issuetype?.name || 'Task'
    }))
    
    console.log(`Fetched ${tickets.length} tickets from Jira`)
    return tickets
  } catch (error) {
    console.error('Jira API Error:', error.response?.data || error.message)
    throw new Error(error.response?.data?.errorMessages?.[0] || 'Failed to fetch from Jira API')
  }
}

// Function to update story points in Jira
async function updateJiraStoryPoints(issueKey, storyPoints) {
  if (!jiraConfig) {
    throw new Error('Jira configuration not set')
  }
  
  let { domain, email, apiToken, storyPointsField } = jiraConfig
  domain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64')
  
  // Default to common story points field if not configured
  const fieldId = storyPointsField || 'customfield_10016'
  
  const apiUrl = `https://${domain}/rest/api/3/issue/${issueKey}`
  console.log(`Updating ${issueKey} story points to ${storyPoints}`)
  console.log('API URL:', apiUrl)
  
  try {
    await axios({
      method: 'PUT',
      url: apiUrl,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      data: {
        fields: {
          [fieldId]: storyPoints
        }
      }
    })
    
    console.log(`Successfully updated ${issueKey} story points to ${storyPoints}`)
    return true
  } catch (error) {
    console.error('Jira Update Error:', error.response?.data || error.message)
    throw new Error(error.response?.data?.errorMessages?.[0] || error.response?.data?.errors?.[fieldId] || 'Failed to update Jira story points')
  }
}

wss.on('connection', (ws) => {
  console.log('New client connected')
  
  let userId = null
  let hasJoined = false

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message)
      console.log('Received:', data)
      
      if (data.type === 'join') {
        // Prevent duplicate joins from the same connection
        if (hasJoined) {
          console.log('User already joined, ignoring duplicate join message')
          return
        }
        
        hasJoined = true
        
        // Generate unique user ID
        userId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
        
        // If this is the first user, make them the host
        if (users.size === 0) {
          hostId = userId
        }
        
        // Store user information
        const user = {
          id: userId,
          username: data.username,
          isHost: userId === hostId,
          ws: ws
        }
        
        users.set(userId, user)
        
        console.log(`User ${data.username} joined. Total users: ${users.size}`)
        
        // Send current user info
        ws.send(JSON.stringify({
          type: 'currentUser',
          user: {
            id: user.id,
            username: user.username,
            isHost: user.isHost
          }
        }))
        
        // Broadcast user list to all clients
        broadcastUserList()
        
        // Send Jira tickets to the new user
        ws.send(JSON.stringify({
          type: 'jiraTickets',
          tickets: jiraTickets
        }))
        
        // Send current ticket and voting state
        broadcastCurrentTicket()
        broadcastVotingState()
      } else if (data.type === 'cast-vote') {
        // Handle vote casting
        if (!userId || !users.has(userId)) {
          console.log('Invalid user trying to vote')
          return
        }
        
        if (votingRevealed) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Voting has already been revealed for this ticket'
          }))
          return
        }
        
        const points = data.points
        currentVotes.set(userId, points)
        
        console.log(`User ${users.get(userId).username} voted: ${points}`)
        
        // Broadcast updated voting state (hidden votes)
        broadcastVotingState()
      } else if (data.type === 'reveal-votes') {
        // Handle vote reveal (host only)
        if (userId !== hostId) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Only the host can reveal votes'
          }))
          return
        }
        
        votingRevealed = true
        console.log('Host revealed votes')
        
        // Broadcast revealed votes with details
        broadcastVotesRevealed()
      } else if (data.type === 'set-final-result') {
        // Handle host setting the final result (host only)
        if (userId !== hostId) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Only the host can set the final result'
          }))
          return
        }
        
        if (!votingRevealed) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Cannot set final result before revealing votes'
          }))
          return
        }
        
        finalResult = data.result
        console.log(`Host set final result to: ${finalResult}`)
        
        // Broadcast updated final result
        broadcastVotesRevealed()
      } else if (data.type === 'complete-voting') {
        // Handle completing current ticket and moving to next (host only)
        if (userId !== hostId) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Only the host can complete voting'
          }))
          return
        }
        
        console.log('Host completed voting, moving to next ticket')
        
        // Update Jira story points if finalResult is set and we have a valid ticket
        const currentTicket = jiraTickets[currentTicketIndex]
        if (finalResult !== null && currentTicket && currentTicket.id && jiraConfig) {
          try {
            await updateJiraStoryPoints(currentTicket.id, finalResult)
            console.log(`Updated ${currentTicket.id} in Jira with story points: ${finalResult}`)
            
            // Send success notification to host
            ws.send(JSON.stringify({
              type: 'jira-update-success',
              issueKey: currentTicket.id,
              storyPoints: finalResult
            }))
          } catch (error) {
            console.error(`Failed to update Jira story points: ${error.message}`)
            
            // Send error notification to host
            ws.send(JSON.stringify({
              type: 'jira-update-error',
              issueKey: currentTicket.id,
              error: error.message
            }))
          }
        } else if (finalResult === null) {
          console.log('No final result set, skipping Jira update')
        } else if (!jiraConfig) {
          console.log('No Jira config, skipping Jira update')
        }
        
        // Move to next ticket
        currentTicketIndex = (currentTicketIndex + 1) % jiraTickets.length
        
        // Reset voting state
        currentVotes.clear()
        votingRevealed = false
        finalResult = null
        
        // Broadcast new ticket and reset voting state
        broadcastCurrentTicket()
        broadcastVotingState()
      } else if (data.type === 'set-jira-config') {
        // Handle host setting Jira configuration (host only)
        if (userId !== hostId) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Only the host can set Jira configuration'
          }))
          return
        }
        
        jiraConfig = data.config
        console.log('Host set Jira configuration:', jiraConfig.domain)
        
        ws.send(JSON.stringify({
          type: 'jira-config-saved',
          success: true
        }))
      } else if (data.type === 'fetch-jira-tickets') {
        // Handle fetching Jira tickets (host only)
        if (userId !== hostId) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Only the host can fetch Jira tickets'
          }))
          return
        }
        
        if (!jiraConfig) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Jira configuration not set'
          }))
          return
        }
        
        try {
          const tickets = await fetchJiraTickets(data.filters)
          jiraTickets = tickets
          
          // Reset to first ticket
          currentTicketIndex = 0
          currentVotes.clear()
          votingRevealed = false
          finalResult = null
          
          ws.send(JSON.stringify({
            type: 'jira-tickets-fetched',
            tickets: jiraTickets,
            count: jiraTickets.length
          }))
          
          // Broadcast new current ticket to all users
          broadcastCurrentTicket()
          broadcastVotingState()
        } catch (error) {
          console.error('Error fetching Jira tickets:', error)
          ws.send(JSON.stringify({
            type: 'error',
            message: `Failed to fetch Jira tickets: ${error.message}`
          }))
        }
      } else if (data.type === 'select-ticket') {
        // Handle host selecting a specific ticket (host only)
        if (userId !== hostId) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Only the host can select tickets'
          }))
          return
        }
        
        const ticketIndex = data.ticketIndex
        if (ticketIndex >= 0 && ticketIndex < jiraTickets.length) {
          currentTicketIndex = ticketIndex
          
          // Reset voting state for new ticket
          currentVotes.clear()
          votingRevealed = false
          finalResult = null
          
          // Broadcast new ticket and reset voting state
          broadcastCurrentTicket()
          broadcastVotingState()
          
          console.log(`Host selected ticket: ${jiraTickets[ticketIndex].id}`)
        }
      }
    } catch (e) {
      console.error('Failed to parse message:', e)
    }
  })

  ws.on('close', () => {
    if (userId && users.has(userId)) {
      const user = users.get(userId)
      console.log(`User ${user.username} disconnected`)
      
      users.delete(userId)
      
      // Remove user's vote if they had one
      if (currentVotes.has(userId)) {
        currentVotes.delete(userId)
        console.log(`Removed vote from disconnected user ${user.username}`)
        
        // Broadcast updated voting state if voting not revealed yet
        if (!votingRevealed) {
          broadcastVotingState()
        }
      }
      
      // If the host left, assign new host
      if (userId === hostId && users.size > 0) {
        const newHostId = users.keys().next().value
        hostId = newHostId
        const newHost = users.get(newHostId)
        newHost.isHost = true
        
        console.log(`New host: ${newHost.username}`)
        
        // Notify new host
        newHost.ws.send(JSON.stringify({
          type: 'currentUser',
          user: {
            id: newHost.id,
            username: newHost.username,
            isHost: true
          }
        }))
      } else if (users.size === 0) {
        hostId = null
        // Reset voting state when all users leave
        currentTicketIndex = 0
        currentVotes.clear()
        votingRevealed = false
        finalResult = null
      }
      
      // Broadcast updated user list
      broadcastUserList()
    }
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })
})

function broadcastUserList() {
  const userList = Array.from(users.values()).map(user => ({
    id: user.id,
    username: user.username,
    isHost: user.isHost
  }))
  
  console.log('Broadcasting user list:', JSON.stringify(userList, null, 2))
  
  broadcast({
    type: 'users',
    users: userList
  })
}

function broadcastCurrentTicket() {
  const currentTicket = jiraTickets[currentTicketIndex]
  
  broadcast({
    type: 'currentTicket',
    ticket: currentTicket,
    ticketIndex: currentTicketIndex,
    totalTickets: jiraTickets.length
  })
}

function broadcastVotingState() {
  // Send voting state with vote count but not individual votes (unless revealed)
  const voteCount = currentVotes.size
  const totalUsers = users.size
  
  broadcast({
    type: 'votingState',
    voteCount,
    totalUsers,
    revealed: votingRevealed
  })
  
  // Send each user their own vote
  currentVotes.forEach((points, uid) => {
    const user = users.get(uid)
    if (user && user.ws.readyState === 1) {
      user.ws.send(JSON.stringify({
        type: 'userVote',
        points
      }))
    }
  })
}

function broadcastVotesRevealed() {
  // Gather all votes with user information
  const votesWithUsers = []
  
  currentVotes.forEach((points, uid) => {
    const user = users.get(uid)
    if (user) {
      votesWithUsers.push({
        userId: uid,
        username: user.username,
        points
      })
    }
  })
  
  // Calculate most common vote
  const numericVotes = votesWithUsers
    .filter(v => v.points !== '?')
    .map(v => parseInt(v.points))
  
  let mostCommon = null
  
  if (numericVotes.length > 0) {
    // Find most common vote
    const voteCounts = {}
    numericVotes.forEach(vote => {
      voteCounts[vote] = (voteCounts[vote] || 0) + 1
    })
    
    let maxCount = 0
    Object.entries(voteCounts).forEach(([vote, count]) => {
      if (count > maxCount) {
        maxCount = count
        mostCommon = parseInt(vote)
      }
    })
  }
  
  // If finalResult not set yet, default to mostCommon
  if (finalResult === null) {
    finalResult = mostCommon
  }
  
  broadcast({
    type: 'votesRevealed',
    votes: votesWithUsers,
    statistics: {
      mostCommon,
      finalResult,
      totalVotes: votesWithUsers.length
    },
    revealed: true
  })
}

// Broadcast to all connected clients
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN = 1
      client.send(JSON.stringify(data))
    }
  })
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing WebSocket server')
  wss.close(() => {
    console.log('WebSocket server closed')
    process.exit(0)
  })
})
