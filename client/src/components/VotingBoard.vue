<template>
  <div class="voting-container">
    <!-- Current Ticket Display -->
    <div v-if="ticket" class="ticket-display">
      <div class="ticket-header">
        <span class="ticket-id">{{ ticket.id }}</span>
        <span class="ticket-priority" :class="`priority-${ticket.priority.toLowerCase()}`">
          {{ ticket.priority }}
        </span>
      </div>
      
      <h2 class="ticket-title">{{ ticket.title }}</h2>
      <p class="ticket-description">{{ ticket.description }}</p>
      
      <div class="ticket-meta">
        <div class="assignee-info">
          <div class="assignee-avatar">{{ getInitial(ticket.assignee) }}</div>
          <span>{{ ticket.assignee }}</span>
        </div>
        <div class="ticket-status" :class="`status-${ticket.status.toLowerCase().replace(' ', '-')}`">
          {{ ticket.status }}
        </div>
      </div>
    </div>

    <!-- No Ticket Selected -->
    <div v-else class="no-ticket">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="9" y1="9" x2="15" y2="9"></line>
        <line x1="9" y1="15" x2="15" y2="15"></line>
      </svg>
      <p v-if="totalTickets === 0">No tickets loaded. Host needs to fetch tickets from Jira.</p>
      <p v-else>Waiting for host to select a ticket...</p>
    </div>

    <!-- Voting Section -->
    <div v-if="ticket" class="voting-section">
      <h3>Vote for Story Points</h3>
      
      <!-- Fibonacci Number Buttons -->
      <div class="fibonacci-buttons">
        <button
          v-for="point in fibonacciNumbers"
          :key="point"
          class="vote-button"
          :class="{ selected: userVote === point, disabled: votingRevealed }"
          :disabled="votingRevealed"
          @click="castVote(point)"
        >
          {{ point }}
        </button>
      </div>

      <!-- Voting Status -->
      <div class="voting-status">
        <div class="votes-count">
          {{ votedCount }} / {{ totalUsers }} voted
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: voteProgress + '%' }"></div>
        </div>
      </div>

      <!-- Host Controls -->
      <div v-if="isHost && !votingRevealed" class="host-controls">
        <button class="reveal-button" @click="revealVotes" :disabled="votedCount === 0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          Reveal Votes
        </button>
      </div>

      <!-- Vote Results (shown after reveal) -->
      <div v-if="votingRevealed" class="vote-results">
        <h3>Vote Results</h3>
        <div class="results-grid">
          <div
            v-for="vote in revealedVotes"
            :key="vote.userId"
            class="vote-card"
            :class="{ 'current-user': vote.userId === currentUser?.id }"
          >
            <div class="voter-info">
              <div class="voter-avatar">{{ getInitial(vote.username) }}</div>
              <span class="voter-name">{{ vote.username }}</span>
            </div>
            <div class="vote-value">{{ vote.points }}</div>
          </div>
        </div>

        <!-- Final Result -->
        <div class="vote-summary">
          <div class="summary-item">
            <span class="label">Most Common:</span>
            <span class="value">{{ mostCommonVote }}</span>
          </div>
          <div class="summary-item final-result-item">
            <span class="label">Final Result:</span>
            <input 
              v-if="isHost"
              type="number"
              class="final-result-input"
              :value="finalResult"
              @input="updateFinalResult($event.target.value)"
              placeholder="Enter final story points"
            />
            <span v-else class="value">{{ finalResult !== null ? finalResult : 'N/A' }}</span>
          </div>
        </div>

        <!-- Host Controls for Next Ticket -->
        <div v-if="isHost" class="host-controls">
          <button class="next-button" @click="completeVoting" :disabled="finalResult === null">
            Complete & Next Ticket
          </button>
          <span v-if="finalResult === null" class="button-hint">
            Set final result before completing
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue'

const props = defineProps({
  ticket: {
    type: Object,
    default: null
  },
  ticketIndex: {
    type: Number,
    default: 0
  },
  totalTickets: {
    type: Number,
    default: 0
  },
  voteCount: {
    type: Number,
    default: 0
  },
  totalUsers: {
    type: Number,
    default: 0
  },
  userVote: {
    type: [Number, String],
    default: null
  },
  votingRevealed: {
    type: Boolean,
    default: false
  },
  revealedVotes: {
    type: Array,
    default: () => []
  },
  statistics: {
    type: Object,
    default: null
  },
  currentUser: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['cast-vote', 'reveal-votes', 'complete-voting', 'set-final-result'])

const fibonacciNumbers = [0, 1, 2, 3, 5, 8, 13, 21, '?']

const isHost = computed(() => props.currentUser?.isHost || false)

const votedCount = computed(() => props.voteCount)

const voteProgress = computed(() => {
  if (props.totalUsers === 0) return 0
  return (votedCount.value / props.totalUsers) * 100
})

const mostCommonVote = computed(() => {
  if (!props.statistics || props.statistics.mostCommon === null) return 'N/A'
  return props.statistics.mostCommon
})

const finalResult = computed(() => {
  if (!props.statistics) return null
  return props.statistics.finalResult
})

const getInitial = (name) => {
  return name ? name.charAt(0).toUpperCase() : '?'
}

const castVote = (points) => {
  emit('cast-vote', points)
}

const revealVotes = () => {
  emit('reveal-votes')
}

const completeVoting = () => {
  emit('complete-voting')
}

const updateFinalResult = (value) => {
  const numValue = value === '' ? null : parseInt(value)
  emit('set-final-result', numValue)
}
</script>

<style scoped>
.voting-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%;
}

.ticket-display {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: white;
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.ticket-id {
  font-family: monospace;
  font-size: 0.9rem;
  font-weight: 600;
  color: #93c5fd;
}

.ticket-priority {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 10px;
  text-transform: uppercase;
}

.ticket-priority.priority-high {
  background: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.ticket-priority.priority-medium {
  background: rgba(245, 158, 11, 0.3);
  color: #fcd34d;
}

.ticket-priority.priority-low {
  background: rgba(16, 185, 129, 0.3);
  color: #6ee7b7;
}

.ticket-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.ticket-description {
  font-size: 1rem;
  opacity: 0.9;
  line-height: 1.6;
  margin-bottom: 20px;
}

.ticket-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.assignee-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.assignee-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
}

.ticket-status {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 10px;
  text-transform: uppercase;
}

.ticket-status.status-to-do {
  background: rgba(107, 114, 128, 0.3);
  color: #d1d5db;
}

.ticket-status.status-in-progress {
  background: rgba(59, 130, 246, 0.3);
  color: #93c5fd;
}

.no-ticket {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 60px 24px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: white;
  text-align: center;
  opacity: 0.8;
}

.no-ticket svg {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.voting-section {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: white;
  flex: 1;
}

.voting-section h3 {
  font-size: 1.2rem;
  margin-bottom: 20px;
}

.fibonacci-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}

.vote-button {
  min-width: 70px;
  height: 70px;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.vote-button:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-3px);
}

.vote-button.selected {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.5);
}

.vote-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.voting-status {
  margin-bottom: 24px;
}

.votes-count {
  font-size: 0.9rem;
  margin-bottom: 8px;
  opacity: 0.9;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.host-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.button-hint {
  font-size: 0.85rem;
  opacity: 0.8;
  text-align: center;
  color: #fcd34d;
}

.reveal-button,
.next-button {
  flex: 1;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.reveal-button svg {
  width: 20px;
  height: 20px;
}

.reveal-button:hover:not(:disabled),
.next-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.reveal-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vote-results {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px solid rgba(255, 255, 255, 0.2);
}

.vote-results h3 {
  font-size: 1.2rem;
  margin-bottom: 16px;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.vote-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.vote-card.current-user {
  border-color: rgba(102, 126, 234, 0.6);
  background: rgba(102, 126, 234, 0.2);
}

.voter-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.voter-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1rem;
}

.voter-name {
  font-size: 0.85rem;
  font-weight: 500;
}

.vote-value {
  font-size: 2rem;
  font-weight: 700;
  color: #fcd34d;
}

.vote-summary {
  display: flex;
  gap: 24px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: 20px;
}

.summary-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-item .label {
  font-size: 0.85rem;
  opacity: 0.8;
}

.summary-item .value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #fcd34d;
}

.final-result-item {
  position: relative;
}

.final-result-input {
  font-size: 1.8rem;
  font-weight: 700;
  color: #fcd34d;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  width: 100%;
  outline: none;
  transition: all 0.3s ease;
}

.final-result-input:focus {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.2);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.final-result-input::placeholder {
  color: rgba(252, 211, 77, 0.5);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .fibonacci-buttons {
    justify-content: center;
  }
  
  .vote-button {
    min-width: 60px;
    height: 60px;
    font-size: 1.2rem;
  }
}
</style>
