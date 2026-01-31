<template>
  <div class="ticket-selector">
    <div class="selector-header">
      <h3>Select Ticket to Discuss ({{ tickets.length }} available)</h3>
      <button @click="toggleExpanded" class="toggle-button">
        {{ isExpanded ? '▼' : '▶' }}
      </button>
    </div>

    <div v-if="isExpanded" class="selector-content">
      <div class="current-ticket-display" v-if="currentTicketIndex !== null">
        <span class="current-label">Currently discussing:</span>
        <span class="current-value">
          {{ tickets[currentTicketIndex]?.id }} - {{ tickets[currentTicketIndex]?.title }}
        </span>
      </div>

      <div class="tickets-list">
        <div
          v-for="(ticket, index) in tickets"
          :key="ticket.id"
          class="ticket-item"
          :class="{ 
            'selected': index === currentTicketIndex,
            'clickable': isHost 
          }"
          @click="isHost && selectTicket(index)"
        >
          <div class="ticket-item-header">
            <span class="ticket-id">{{ ticket.id }}</span>
            <span class="ticket-type">{{ ticket.issueType }}</span>
            <span 
              class="ticket-priority" 
              :class="`priority-${ticket.priority.toLowerCase()}`"
            >
              {{ ticket.priority }}
            </span>
          </div>
          
          <div class="ticket-item-title">{{ ticket.title }}</div>
          
          <div class="ticket-item-footer">
            <span class="ticket-status" :class="`status-${ticket.status.toLowerCase().replace(' ', '-')}`">
              {{ ticket.status }}
            </span>
            <span class="ticket-assignee">{{ ticket.assignee }}</span>
          </div>
          
          <div v-if="index === currentTicketIndex" class="selected-badge">
            ✓ Current
          </div>
        </div>
      </div>

      <div v-if="tickets.length === 0" class="empty-state">
        <p>No tickets available. Please fetch tickets using the filter above.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  tickets: {
    type: Array,
    default: () => []
  },
  currentTicketIndex: {
    type: Number,
    default: null
  },
  isHost: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select'])

const isExpanded = ref(true)

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const selectTicket = (index) => {
  if (props.isHost && index !== props.currentTicketIndex) {
    emit('select', index)
  }
}
</script>

<style scoped>
.ticket-selector {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: white;
  margin-bottom: 24px;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.selector-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.toggle-button {
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.selector-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.current-ticket-display {
  padding: 12px 16px;
  background: rgba(102, 126, 234, 0.2);
  border: 2px solid rgba(102, 126, 234, 0.4);
  border-radius: 8px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.current-label {
  font-weight: 600;
  opacity: 0.9;
}

.current-value {
  font-weight: 500;
  color: #93c5fd;
}

.tickets-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;
}

.tickets-list::-webkit-scrollbar {
  width: 8px;
}

.tickets-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.tickets-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.tickets-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.ticket-item {
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
}

.ticket-item.clickable {
  cursor: pointer;
}

.ticket-item.clickable:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateX(4px);
}

.ticket-item.selected {
  background: rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.6);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.ticket-item-header {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.ticket-id {
  font-family: monospace;
  font-size: 0.85rem;
  font-weight: 600;
  color: #93c5fd;
}

.ticket-type {
  font-size: 0.75rem;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  font-weight: 600;
}

.ticket-priority {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
}

.ticket-priority.priority-highest,
.ticket-priority.priority-high {
  background: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.ticket-priority.priority-medium {
  background: rgba(245, 158, 11, 0.3);
  color: #fcd34d;
}

.ticket-priority.priority-low,
.ticket-priority.priority-lowest {
  background: rgba(16, 185, 129, 0.3);
  color: #6ee7b7;
}

.ticket-item-title {
  font-size: 0.95rem;
  font-weight: 500;
  margin-bottom: 8px;
  line-height: 1.4;
}

.ticket-item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ticket-status {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
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

.ticket-status.status-in-review {
  background: rgba(245, 158, 11, 0.3);
  color: #fcd34d;
}

.ticket-status.status-done {
  background: rgba(16, 185, 129, 0.3);
  color: #6ee7b7;
}

.ticket-assignee {
  font-size: 0.85rem;
  opacity: 0.8;
}

.selected-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
}

.empty-state {
  padding: 40px;
  text-align: center;
  opacity: 0.7;
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
}

@media (max-width: 768px) {
  .ticket-item-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .ticket-item-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
