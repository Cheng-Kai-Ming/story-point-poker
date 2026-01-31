import { WebSocketServer } from 'ws'
import axios from 'axios'
import http from 'http'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PORT = process.env.PORT || 8080
const NODE_ENV = process.env.NODE_ENV || 'development'

// Security configuration
const SECURITY_CONFIG = {
  MAX_USERNAME_LENGTH: 50,
  MAX_MESSAGE_SIZE: 10000, // 10KB
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  RATE_LIMIT_MAX_MESSAGES: 100,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  VALID_VOTE_OPTIONS: ['0', '1', '2', '3', '5', '8', '13', '21', '?', '∞'],
}

// Security headers
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' wss: ws:;",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
}

// Rate limiting per connection
const rateLimitMap = new Map()

function checkRateLimit(connectionId) {
  const now = Date.now()
  const record = rateLimitMap.get(connectionId) || { count: 0, resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW }
  
  // Reset if window expired
  if (now > record.resetTime) {
    record.count = 0
    record.resetTime = now + SECURITY_CONFIG.RATE_LIMIT_WINDOW
  }
  
  record.count++
  rateLimitMap.set(connectionId, record)
  
  return record.count <= SECURITY_CONFIG.RATE_LIMIT_MAX_MESSAGES
}

// Input validation functions
function sanitizeUsername(username) {
  if (!username || typeof username !== 'string') {
    return null
  }
  
  // Remove any HTML/script tags
  const sanitized = username
    .replace(/<[^>]*>/g, '')
    .trim()
  
  if (sanitized.length === 0 || sanitized.length > SECURITY_CONFIG.MAX_USERNAME_LENGTH) {
    return null
  }
  
  return sanitized
}

function validateVote(vote) {
  if (vote === undefined || vote === null) {
    return false
  }
  
  // Convert number to string for comparison
  const voteStr = String(vote)
  return SECURITY_CONFIG.VALID_VOTE_OPTIONS.includes(voteStr)
}

function sanitizeString(str, maxLength = 500) {
  if (!str || typeof str !== 'string') {
    return ''
  }
  return str.replace(/<[^>]*>/g, '').trim().substring(0, maxLength)
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // Serve static files from client/dist in production
  if (NODE_ENV === 'production') {
    const clientPath = join(__dirname, '../client/dist')
    let filePath = join(clientPath, req.url === '/' ? 'index.html' : req.url)
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      filePath = join(clientPath, 'index.html') // Fallback to index.html for SPA routing
    }
    
    const ext = filePath.split('.').pop()
    const contentTypes = {
      'html': 'text/html',
      'js': 'text/javascript',
      'css': 'text/css',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon'
    }
    
    const contentType = contentTypes[ext] || 'text/plain'
    
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { 
          'Content-Type': 'text/plain',
          ...SECURITY_HEADERS
        })
        res.end('404 Not Found')
      } else {
        res.writeHead(200, { 
          'Content-Type': contentType,
          ...SECURITY_HEADERS
        })
        res.end(content)
      }
    })
  } else {
    // In development, just return a message
    res.writeHead(200, { 
      'Content-Type': 'text/plain',
      ...SECURITY_HEADERS
    })
    res.end('WebSocket server is running. Use the Vue dev server for the client.')
  }
})

// Create WebSocket server attached to HTTP server
const wss = new WebSocketServer({ server })

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`Environment: ${NODE_ENV}`)
  if (NODE_ENV === 'production') {
    console.log(`Access the app at: http://localhost:${PORT}`)
  }
  console.log('Server started fresh - no users in memory')
})

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

// Store Jira tickets (shared by all users) - starts empty until fetched from Jira
let jiraTickets = []

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
  let lastActivity = Date.now()
  let heartbeatInterval = null
  
  // Generate connection ID for rate limiting
  const connectionId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
  
  // Setup heartbeat
  ws.isAlive = true
  ws.on('pong', () => {
    ws.isAlive = true
    lastActivity = Date.now()
  })
  
  heartbeatInterval = setInterval(() => {
    if (ws.isAlive === false) {
      console.log('Connection timeout, closing')
      return ws.terminate()
    }
    
    // Check session timeout
    if (Date.now() - lastActivity > SECURITY_CONFIG.SESSION_TIMEOUT) {
      console.log('Session timeout')
      ws.send(JSON.stringify({
        type: 'session-timeout',
        message: 'Session expired due to inactivity'
      }))
      return ws.terminate()
    }
    
    ws.isAlive = false
    ws.ping()
  }, SECURITY_CONFIG.HEARTBEAT_INTERVAL)

  ws.on('message', async (message) => {
    try {
      // Update activity timestamp
      lastActivity = Date.now()
      
      // Rate limiting check
      if (!checkRateLimit(connectionId)) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Rate limit exceeded. Please slow down.'
        }))
        return
      }
      
      // Check message size
      if (message.length > SECURITY_CONFIG.MAX_MESSAGE_SIZE) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Message too large'
        }))
        return
      }
      
      const data = JSON.parse(message)
      console.log('Received:', data.type, userId ? `from user ${userId}` : '')
      
      if (data.type === 'join') {
        // Prevent duplicate joins from the same connection
        if (hasJoined) {
          console.log('User already joined, ignoring duplicate join message')
          return
        }
        
        // Validate and sanitize username
        const sanitizedUsername = sanitizeUsername(data.username)
        if (!sanitizedUsername) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid username. Must be 1-50 characters with no HTML.'
          }))
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
          username: sanitizedUsername,
          isHost: userId === hostId,
          ws: ws,
          lastActivity: Date.now()
        }
        
        users.set(userId, user)
        
        console.log(`User ${sanitizedUsername} joined. Total users: ${users.size}`)
        
        // Send current user info
        ws.send(JSON.stringify({
          type: 'currentUser',
          user: {
            id: user.id,
            username: user.username,
            isHost: user.isHost
          }
        }))
        
        // Send Jira config status (but not the credentials)
        ws.send(JSON.stringify({
          type: 'jira-config-status',
          configured: jiraConfig !== null
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
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Authentication required'
          }))
          return
        }
        
        if (votingRevealed) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Voting has already been revealed for this ticket'
          }))
          return
        }
        
        // Validate vote
        if (!validateVote(data.points)) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid vote value'
          }))
          return
        }
        
        const points = String(data.points)
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
        
        // Validate final result is a number
        const result = data.result
        if (result !== null && (isNaN(result) || result < 0 || result > 1000)) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid story point value. Must be 0-1000.'
          }))
          return
        }
        
        finalResult = result
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
        
        // Validate Jira config
        const config = data.config
        if (!config || !config.domain || !config.email || !config.apiToken) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid Jira configuration. Domain, email, and API token are required.'
          }))
          return
        }
        
        // Sanitize domain
        const sanitizedDomain = sanitizeString(config.domain, 200)
          .replace(/^https?:\/\//, '')
          .replace(/\/$/, '')
        
        if (!sanitizedDomain || sanitizedDomain.length < 5) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid Jira domain'
          }))
          return
        }
        
        // Store sanitized config (server-side only)
        jiraConfig = {
          domain: sanitizedDomain,
          email: sanitizeString(config.email, 100),
          apiToken: config.apiToken, // Keep as-is for authentication
          projectKey: config.projectKey ? sanitizeString(config.projectKey, 50) : '',
          storyPointsField: config.storyPointsField ? sanitizeString(config.storyPointsField, 50) : 'customfield_10016'
        }
        
        console.log('Host set Jira configuration:', jiraConfig.domain, 'for project:', jiraConfig.projectKey || 'All')
        
        ws.send(JSON.stringify({
          type: 'jira-config-saved',
          success: true
        }))
        
        // Broadcast to all users that Jira is now configured
        broadcast({
          type: 'jira-config-status',
          configured: true
        })
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
        
        // Validate ticket index
        if (typeof ticketIndex !== 'number' || ticketIndex < 0 || ticketIndex >= jiraTickets.length) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid ticket index'
          }))
          return
        }
        
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
      } else {
        // Unknown message type
        console.warn('Unknown message type:', data.type)
      }
    } catch (e) {
      console.error('Failed to parse message:', e)
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }))
      }
    }
  })

  ws.on('close', () => {
    // Clear heartbeat interval
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
    }
    
    // Clean up rate limiting
    rateLimitMap.delete(connectionId)
    
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
        
        // Send Jira config status to new host
        newHost.ws.send(JSON.stringify({
          type: 'jira-config-status',
          configured: jiraConfig !== null
        }))
      } else if (users.size === 0) {
        hostId = null
        // Reset voting state when all users leave
        currentTicketIndex = 0
        currentVotes.clear()
        votingRevealed = false
        finalResult = null
        // Clear Jira config for security when all users leave
        jiraConfig = null
      }
      
      // Broadcast updated user list
      broadcastUserList()
    }
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
    // Clear heartbeat interval on error
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
    }
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
