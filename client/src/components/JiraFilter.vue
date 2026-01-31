<template>
  <div class="jira-filter">
    <div class="filter-header">
      <h3>Filter Jira Tickets</h3>
      <button @click="toggleExpanded" class="toggle-button">
        {{ isExpanded ? '▼' : '▶' }}
      </button>
    </div>

    <div v-if="isExpanded" class="filter-content">
      <div class="filter-row">
        <div class="filter-group">
          <label>Sprint</label>
          <select v-model="localFilters.sprint" class="filter-select">
            <option value="">All Sprints</option>
            <option value="active">Active Sprint</option>
            <option value="future">Future Sprints</option>
            <option value="backlog">Backlog</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Assignee</label>
          <input
            v-model="localFilters.assignee"
            type="text"
            placeholder="Enter username or leave empty"
            class="filter-input"
          />
        </div>

        <div class="filter-group">
          <label>Status</label>
          <select v-model="localFilters.status" class="filter-select">
            <option value="">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="In Review">In Review</option>
            <option value="Done">Done</option>
          </select>
        </div>
      </div>

      <div class="filter-row">
        <div class="filter-group">
          <label>Issue Type</label>
          <select v-model="localFilters.issueType" class="filter-select">
            <option value="">All Types</option>
            <option value="Story">Story</option>
            <option value="Bug">Bug</option>
            <option value="Task">Task</option>
            <option value="Epic">Epic</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Priority</label>
          <select v-model="localFilters.priority" class="filter-select">
            <option value="">All Priorities</option>
            <option value="Highest">Highest</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            <option value="Lowest">Lowest</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Max Results</label>
          <input
            v-model.number="localFilters.maxResults"
            type="number"
            min="1"
            max="100"
            class="filter-input"
          />
        </div>
      </div>

      <div class="filter-actions">
        <button @click="applyFilters" class="apply-button" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? 'Fetching...' : 'Fetch Tickets' }}
        </button>
        <button @click="clearFilters" class="clear-button">
          Clear Filters
        </button>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="ticketCount !== null" class="result-info">
        Found {{ ticketCount }} ticket{{ ticketCount !== 1 ? 's' : '' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  filters: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  ticketCount: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['apply', 'clear'])

const isExpanded = ref(true)

const localFilters = ref({
  sprint: '',
  assignee: '',
  status: '',
  issueType: '',
  priority: '',
  maxResults: 50
})

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const applyFilters = () => {
  emit('apply', { ...localFilters.value })
}

const clearFilters = () => {
  localFilters.value = {
    sprint: '',
    assignee: '',
    status: '',
    issueType: '',
    priority: '',
    maxResults: 50
  }
  emit('clear')
}

// Initialize with existing filters
watch(() => props.filters, (newFilters) => {
  if (newFilters) {
    localFilters.value = { ...newFilters }
  }
}, { immediate: true, deep: true })
</script>

<style scoped>
.jira-filter {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: white;
  margin-bottom: 24px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-header h3 {
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

.filter-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-size: 0.85rem;
  font-weight: 600;
  opacity: 0.9;
}

.filter-select,
.filter-input {
  padding: 10px 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.3s ease;
}

.filter-select option {
  background: #2d3748;
  color: white;
}

.filter-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.filter-select:focus,
.filter-input:focus {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.2);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}

.apply-button,
.clear-button {
  flex: 1;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.apply-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.apply-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.apply-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.clear-button {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.clear-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  padding: 12px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 8px;
  color: #fca5a5;
  font-size: 0.9rem;
}

.result-info {
  padding: 12px;
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid rgba(16, 185, 129, 0.4);
  border-radius: 8px;
  color: #6ee7b7;
  font-size: 0.9rem;
  text-align: center;
}

@media (max-width: 768px) {
  .filter-row {
    grid-template-columns: 1fr;
  }
  
  .filter-actions {
    flex-direction: column;
  }
}
</style>
