import { ref } from 'vue'

export function useWebSocket(url, username) {
  const ws = ref(null)
  const isConnected = ref(false)
  const messages = ref([])
  const error = ref(null)
  const users = ref([])
  const currentUser = ref(null)
  let shouldReconnect = true
  let isConnecting = false

  const connect = () => {
    // Prevent multiple simultaneous connections
    if (isConnecting || (ws.value && (ws.value.readyState === WebSocket.CONNECTING || ws.value.readyState === WebSocket.OPEN))) {
      console.log('Already connecting or connected, skipping...')
      return
    }
    
    isConnecting = true
    
    try {
      console.log('Creating new WebSocket connection...')
      ws.value = new WebSocket(url)

      ws.value.onopen = () => {
        isConnected.value = true
        isConnecting = false
        error.value = null
        console.log('WebSocket connected')
        
        // Send join message with username
        if (username) {
          send({
            type: 'join',
            username: username
          })
        }
      }

      ws.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // Handle different message types
          if (data.type === 'users') {
            console.log('Received users update:', data.users)
            users.value = data.users
          } else if (data.type === 'currentUser') {
            currentUser.value = data.user
          } else {
            messages.value.push(data)
          }
        } catch (e) {
          console.error('Failed to parse message:', e)
        }
      }

      ws.value.onerror = (err) => {
        error.value = 'WebSocket error occurred'
        isConnecting = false
        console.error('WebSocket error:', err)
      }

      ws.value.onclose = () => {
        isConnected.value = false
        isConnecting = false
        console.log('WebSocket disconnected')
        
        // Don't reconnect if disconnect was intentional
        if (shouldReconnect) {
          setTimeout(() => {
            if (!isConnected.value && shouldReconnect) {
              console.log('Attempting to reconnect...')
              connect()
            }
          }, 3000)
        }
      }
    } catch (e) {
      error.value = 'Failed to connect to WebSocket'
      isConnecting = false
      console.error('Connection error:', e)
    }
  }

  const send = (data) => {
    if (ws.value && isConnected.value) {
      ws.value.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  const disconnect = () => {
    shouldReconnect = false
    if (ws.value) {
      ws.value.close()
    }
  }

  return {
    isConnected,
    messages,
    error,
    users,
    currentUser,
    send,
    disconnect,
    connect
  }
}
