<template>
  <div>
    <Login v-if="!username" @join="handleJoin" />
    
    <div v-else class="dashboard-container">
      <aside class="sidebar">
        <UserList :users="uniqueUsers" :currentUser="currentUser" />
      </aside>
      
      <main class="dashboard">
        <header class="dashboard-header">
          <div>
            <h1>Story Point Voting</h1>
            <div class="welcome-text">Welcome, {{ currentUser?.username }}!</div>
          </div>
          <div class="connection-status">
            <span 
              class="status-dot" 
              :class="{ connected: isConnected, disconnected: !isConnected }"
            ></span>
            <span>{{ isConnected ? 'Connected' : 'Disconnected' }}</span>
          </div>
        </header>

        <!-- Notification Toast -->
        <div v-if="notification.show" class="notification" :class="notification.type">
          <span>{{ notification.message }}</span>
          <button @click="closeNotification" class="close-notification">×</button>
        </div>

        <!-- Jira Configuration (Host Only) -->
        <div v-if="currentUser?.isHost" class="jira-management">
          <JiraConfig 
            :config="jiraConfig"
            @save="handleSaveJiraConfig"
          />
          
          <JiraFilter 
            v-if="isJiraConfigured"
            :filters="jiraFilters"
            :loading="fetchingTickets"
            :error="fetchError"
            :ticketCount="fetchedTicketsCount"
            @apply="handleApplyFilters"
            @clear="handleClearFilters"
          />
          
          <TicketSelector
            v-if="isJiraConfigured && fetchedTickets.length > 0"
            :tickets="fetchedTickets"
            :currentTicketIndex="ticketIndex"
            :isHost="currentUser?.isHost"
            @select="handleSelectTicket"
          />
        </div>

        <!-- Voting Board Section -->
        <div class="voting-section">
          <VotingBoard 
            v-if="currentTicket"
            :ticket="currentTicket"
            :ticketIndex="ticketIndex"
            :totalTickets="totalTickets"
            :currentUser="currentUser"
            :voteCount="voteCount"
            :totalUsers="totalUsers"
            :userVote="userVote"
            :votingRevealed="votingRevealed"
            :revealedVotes="revealedVotes"
            :statistics="statistics"
            @cast-vote="handleCastVote"
            @reveal-votes="handleRevealVotes"
            @complete-voting="handleCompleteVoting"
            @set-final-result="handleSetFinalResult"
          />
          <div v-else class="loading-message">
            Waiting for ticket data...
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount, onMounted } from 'vue'
import { useWebSocket } from './composables/useWebSocket'
import { secureStorage } from './utils/secureStorage'
import Login from './components/Login.vue'
import UserList from './components/UserList.vue'
import VotingBoard from './components/VotingBoard.vue'
import JiraConfig from './components/JiraConfig.vue'
import JiraFilter from './components/JiraFilter.vue'
import TicketSelector from './components/TicketSelector.vue'

// Determine WebSocket URL based on environment
const getWebSocketUrl = () => {
  if (import.meta.env.PROD) {
    // In production, use same host with wss:// if HTTPS or ws:// if HTTP
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}`
  } else {
    // In development, use localhost
    return 'ws://localhost:8080'
  }
}

const WS_URL = getWebSocketUrl()

const username = ref('')
const isConnected = ref(false)
const users = ref([])
const currentUser = ref(null)
const messages = ref([])

// Jira state
const jiraConfig = ref({})
const jiraFilters = ref({
  sprint: '',
  assignee: '',
  status: '',
  issueType: '',
  priority: '',
  maxResults: 50
})
const fetchingTickets = ref(false)
const fetchError = ref(null)
const fetchedTickets = ref([])
const fetchedTicketsCount = ref(null)

// Notification state
const notification = ref({
  show: false,
  message: '',
  type: 'success' // 'success' or 'error'
})
let notificationTimeout = null

// Voting state
const currentTicket = ref(null)
const ticketIndex = ref(0)
const totalTickets = ref(0)
const voteCount = ref(0)
const totalUsers = ref(0)
const userVote = ref(null)
const votingRevealed = ref(false)
const revealedVotes = ref([])
const statistics = ref(null)

let websocketInstance = null
let hasJoinedRoom = false

const isJiraConfigured = computed(() => {
  return jiraConfig.value?.domain && jiraConfig.value?.email && jiraConfig.value?.apiToken
})

const uniqueUsers = computed(() => {
  // Deduplicate users by ID
  const seen = new Set()
  const unique = users.value.filter(user => {
    if (seen.has(user.id)) {
      console.warn('Duplicate user detected:', user)
      return false
    }
    seen.add(user.id)
    return true
  })
  console.log('Unique users:', unique)
  return unique
})

async function handleJoin(name) {
  // Prevent joining multiple times
  if (hasJoinedRoom) {
    console.log('Already joined room, ignoring duplicate join')
    return
  }
  
  hasJoinedRoom = true
  username.value = name
  
  // Create WebSocket instance
  websocketInstance = useWebSocket(WS_URL, name)
  
  // Set up watchers for the WebSocket reactive properties
  watch(() => websocketInstance.isConnected.value, (val) => {
    isConnected.value = val
  })
  
  watch(() => websocketInstance.users.value, (val) => {
    console.log('Raw users from server:', JSON.stringify(val, null, 2))
    users.value = val
  }, { deep: true })
  
  watch(() => websocketInstance.currentUser.value, (val) => {
    currentUser.value = val
  }, { deep: true })
  
  watch(() => websocketInstance.messages.value, (val) => {
    messages.value = val
  }, { deep: true })
  
  // Connect to WebSocket
  websocketInstance.connect()
  
  // Load Jira config from localStorage
  loadJiraConfig()
}

function loadJiraConfig() {
  const savedConfig = secureStorage.getItem('jiraConfig')
  if (savedConfig) {
    try {
      jiraConfig.value = savedConfig
      console.log('Loaded encrypted Jira config from storage')
    } catch (e) {
      console.error('Failed to load Jira config:', e)
      // Clear corrupted data
      secureStorage.removeItem('jiraConfig')
    }
  }
}

function saveJiraConfigToLocalStorage() {
  if (secureStorage.setItem('jiraConfig', jiraConfig.value)) {
    console.log('Saved encrypted Jira config to storage')
  } else {
    console.error('Failed to save Jira config')
  }
}

function handleSaveJiraConfig(config) {
  jiraConfig.value = config
  saveJiraConfigToLocalStorage()
  
  // Send to server
  if (websocketInstance) {
    websocketInstance.send({
      type: 'set-jira-config',
      config
    })
  }
}

function handleApplyFilters(filters) {
  jiraFilters.value = filters
  fetchingTickets.value = true
  fetchError.value = null
  
  if (websocketInstance) {
    websocketInstance.send({
      type: 'fetch-jira-tickets',
      filters
    })
  }
}

function handleClearFilters() {
  jiraFilters.value = {
    sprint: '',
    assignee: '',
    status: '',
    issueType: '',
    priority: '',
    maxResults: 50
  }
  fetchError.value = null
  fetchedTicketsCount.value = null
}

function handleSelectTicket(ticketIndex) {
  if (websocketInstance) {
    websocketInstance.send({
      type: 'select-ticket',
      ticketIndex
    })
  }
}

watch(messages, (newMessages) => {
  if (newMessages && newMessages.length > 0) {
    const latestMessage = newMessages[newMessages.length - 1]
    if (latestMessage) {
      handleMessage(latestMessage)
    }
  }
}, { deep: true })

function handleMessage(message) {
  console.log('Handling message:', message)
  
  if (message.type === 'currentTicket') {
    currentTicket.value = message.ticket
    ticketIndex.value = message.ticketIndex
    totalTickets.value = message.totalTickets
  } else if (message.type === 'votingState') {
    voteCount.value = message.voteCount
    totalUsers.value = message.totalUsers
    votingRevealed.value = message.revealed
    
    // If votes were revealed, we'll get a separate votesRevealed message
    if (!message.revealed) {
      revealedVotes.value = []
      statistics.value = null
    }
  } else if (message.type === 'userVote') {
    userVote.value = message.points
  } else if (message.type === 'votesRevealed') {
    votingRevealed.value = true
    revealedVotes.value = message.votes
    statistics.value = message.statistics
  } else if (message.type === 'jira-config-saved') {
    console.log('Jira config saved successfully')
  } else if (message.type === 'jira-tickets-fetched') {
    fetchingTickets.value = false
    fetchedTickets.value = message.tickets
    fetchedTicketsCount.value = message.count
    console.log(`Fetched ${message.count} Jira tickets`)
  } else if (message.type === 'jira-update-success') {
    showNotification(`Successfully updated ${message.issueKey} with story points: ${message.storyPoints}`, 'success')
  } else if (message.type === 'jira-update-error') {
    showNotification(`Failed to update ${message.issueKey}: ${message.error}`, 'error')
  } else if (message.type === 'error') {
    if (fetchingTickets.value) {
      fetchingTickets.value = false
      fetchError.value = message.message
    }
    console.error('Server error:', message.message)
  }
}

function showNotification(message, type = 'success') {
  // Clear existing timeout
  if (notificationTimeout) {
    clearTimeout(notificationTimeout)
  }
  
  notification.value = {
    show: true,
    message,
    type
  }
  
  // Auto-hide after 5 seconds
  notificationTimeout = setTimeout(() => {
    closeNotification()
  }, 5000)
}

function closeNotification() {
  notification.value.show = false
  if (notificationTimeout) {
    clearTimeout(notificationTimeout)
  }
}

function handleCastVote(points) {
  if (websocketInstance) {
    websocketInstance.send({
      type: 'cast-vote',
      points
    })
  }
}

function handleRevealVotes() {
  if (websocketInstance) {
    websocketInstance.send({
      type: 'reveal-votes'
    })
  }
}

function handleSetFinalResult(result) {
  if (websocketInstance) {
    websocketInstance.send({
      type: 'set-final-result',
      result
    })
  }
}

function handleCompleteVoting() {
  if (websocketInstance) {
    websocketInstance.send({
      type: 'complete-voting'
    })
  }
  
  // Reset local voting state
  userVote.value = null
  votingRevealed.value = false
  revealedVotes.value = []
  statistics.value = null
}

function cleanupConnection() {
  if (websocketInstance) {
    console.log('Disconnecting WebSocket...')
    websocketInstance.disconnect()
  }
}

// Handle page unload (close tab, refresh, navigate away)
onMounted(() => {
  window.addEventListener('beforeunload', cleanupConnection)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', cleanupConnection)
  cleanupConnection()
})
</script>

<style scoped>
.dashboard-container {
  display: flex;
  gap: 20px;
  min-height: 100vh;
}

.sidebar {
  width: 300px;
  flex-shrink: 0;
}

.dashboard {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.welcome-text {
  font-size: 0.95rem;
  opacity: 0.9;
  margin-top: 5px;
  font-weight: 400;
}

.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 16px 20px;
  border-radius: 12px;
  color: white;
  font-size: 0.95rem;
  font-weight: 500;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: slideIn 0.3s ease;
  max-width: 400px;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification.success {
  background: rgba(16, 185, 129, 0.9);
  border: 1px solid rgba(16, 185, 129, 1);
}

.notification.error {
  background: rgba(239, 68, 68, 0.9);
  border: 1px solid rgba(239, 68, 68, 1);
}

.close-notification {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  margin-left: auto;
  line-height: 1;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.close-notification:hover {
  opacity: 1;
}

.jira-management {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.voting-section {
  flex: 1;
  min-height: 400px;
}

.loading-message {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  font-size: 1.1rem;
  color: #666;
}

@media (max-width: 968px) {
  .dashboard-container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
  }

  .voting-section {
    min-height: 500px;
  }
}
</style>
