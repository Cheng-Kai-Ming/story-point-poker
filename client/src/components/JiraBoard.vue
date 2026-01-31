<template>
  <div class="jira-board">
    <div class="board-header">
      <h2>Jira Tickets</h2>
      <div class="ticket-count">{{ tickets.length }} tickets</div>
    </div>

    <div class="tickets-container">
      <div 
        v-for="ticket in tickets" 
        :key="ticket.id"
        class="ticket-card"
        :class="`priority-${ticket.priority.toLowerCase()}`"
      >
        <div class="ticket-header">
          <span class="ticket-id">{{ ticket.id }}</span>
          <span class="ticket-priority" :class="`priority-${ticket.priority.toLowerCase()}`">
            {{ ticket.priority }}
          </span>
        </div>
        
        <h3 class="ticket-title">{{ ticket.title }}</h3>
        
        <p class="ticket-description">{{ ticket.description }}</p>
        
        <div class="ticket-footer">
          <div class="ticket-assignee">
            <div class="assignee-avatar">
              {{ getInitial(ticket.assignee) }}
            </div>
            <span>{{ ticket.assignee }}</span>
          </div>
          
          <div class="ticket-status" :class="`status-${ticket.status.toLowerCase().replace(' ', '-')}`">
            {{ ticket.status }}
          </div>
        </div>
      </div>

      <div v-if="tickets.length === 0" class="no-tickets">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="9" x2="15" y2="9"></line>
          <line x1="9" y1="15" x2="15" y2="15"></line>
        </svg>
        <p>No tickets available</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  tickets: {
    type: Array,
    required: true,
    default: () => []
  }
})

const getInitial = (name) => {
  return name ? name.charAt(0).toUpperCase() : '?'
}
</script>

<style scoped>
.jira-board {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: white;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.board-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.ticket-count {
  font-size: 0.9rem;
  opacity: 0.8;
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 12px;
}

.tickets-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  overflow-y: auto;
  flex: 1;
}

.ticket-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
  animation: slideIn 0.3s ease;
  height: fit-content;
}

.ticket-card:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.ticket-card.priority-high {
  border-left-color: #ef4444;
}

.ticket-card.priority-medium {
  border-left-color: #f59e0b;
}

.ticket-card.priority-low {
  border-left-color: #10b981;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.ticket-id {
  font-family: monospace;
  font-size: 0.85rem;
  font-weight: 600;
  color: #93c5fd;
}

.ticket-priority {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 10px 0;
  line-height: 1.3;
}

.ticket-description {
  font-size: 0.9rem;
  opacity: 0.9;
  margin: 0 0 16px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ticket-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.ticket-assignee {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.assignee-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.8rem;
}

.ticket-status {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
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

.ticket-status.status-done {
  background: rgba(16, 185, 129, 0.3);
  color: #6ee7b7;
}

.ticket-status.status-blocked {
  background: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.no-tickets {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  opacity: 0.6;
}

.no-tickets svg {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-tickets p {
  font-size: 1.1rem;
  margin: 0;
}

.tickets-container::-webkit-scrollbar {
  width: 8px;
}

.tickets-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.tickets-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}
</style>
