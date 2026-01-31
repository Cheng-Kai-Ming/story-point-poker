<template>
  <div class="jira-config">
    <div class="config-header">
      <h3>Jira Configuration</h3>
      <button v-if="isConfigured" @click="toggleEdit" class="edit-button">
        {{ isEditing ? 'Cancel' : 'Edit' }}
      </button>
    </div>

    <div v-if="!isConfigured || isEditing" class="config-form">
      <div class="form-group">
        <label>Jira Domain</label>
        <input
          v-model="localConfig.domain"
          type="text"
          placeholder="your-company.atlassian.net"
          class="config-input"
          @blur="cleanupDomain"
        />
        <span class="input-hint">Your Jira cloud domain (without https://)</span>
      </div>

      <div class="form-group">
        <label>Email</label>
        <input
          v-model="localConfig.email"
          type="email"
          placeholder="your-email@company.com"
          class="config-input"
        />
        <span class="input-hint">Your Jira account email</span>
      </div>

      <div class="form-group">
        <label>API Token</label>
        <input
          v-model="localConfig.apiToken"
          type="password"
          placeholder="Enter your Jira API token"
          class="config-input"
        />
        <span class="input-hint">
          <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank">
            Generate API token here
          </a>
        </span>
      </div>

      <div class="form-group">
        <label>Project Key (Optional)</label>
        <input
          v-model="localConfig.projectKey"
          type="text"
          placeholder="PROJ"
          class="config-input"
        />
        <span class="input-hint">Filter by specific project (e.g., PROJ, DEV)</span>
      </div>

      <div class="form-group">
        <label>Story Points Field</label>
        <input
          v-model="localConfig.storyPointsField"
          type="text"
          placeholder="customfield_10016"
          class="config-input"
        />
        <span class="input-hint">
          Story points custom field ID (find it in Jira field configuration)
          <a href="https://confluence.atlassian.com/jirakb/how-to-find-id-for-custom-field-s-744522503.html" target="_blank">
            How to find?
          </a>
        </span>
      </div>

      <div class="form-actions">
        <button @click="saveConfig" class="save-button" :disabled="!isValid">
          {{ isConfigured ? 'Update' : 'Save' }} Configuration
        </button>
      </div>
    </div>

    <div v-else class="config-summary">
      <div class="summary-item">
        <span class="summary-label">Domain:</span>
        <span class="summary-value">{{ config.domain }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Email:</span>
        <span class="summary-value">{{ config.email }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Project:</span>
        <span class="summary-value">{{ config.projectKey || 'All Projects' }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Story Points Field:</span>
        <span class="summary-value">{{ config.storyPointsField || 'Not Set' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  config: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['save', 'update'])

const localConfig = ref({
  domain: '',
  email: '',
  apiToken: '',
  projectKey: '',
  storyPointsField: 'customfield_10016'
})

const isEditing = ref(false)

const isConfigured = computed(() => {
  return props.config?.domain && props.config?.email && props.config?.apiToken
})

const isValid = computed(() => {
  return localConfig.value.domain && localConfig.value.email && localConfig.value.apiToken
})

const toggleEdit = () => {
  if (isEditing.value) {
    // Cancel - restore original config
    localConfig.value = { ...props.config }
  }
  isEditing.value = !isEditing.value
}

const cleanupDomain = () => {
  if (localConfig.value.domain) {
    // Remove protocol and trailing slash
    localConfig.value.domain = localConfig.value.domain
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
  }
}

const saveConfig = () => {
  cleanupDomain()
  emit('save', { ...localConfig.value })
  isEditing.value = false
}

// Initialize with existing config
watch(() => props.config, (newConfig) => {
  if (newConfig) {
    localConfig.value = { ...newConfig }
  }
}, { immediate: true, deep: true })

onMounted(() => {
  if (props.config) {
    localConfig.value = { ...props.config }
  }
})
</script>

<style scoped>
.jira-config {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: white;
  margin-bottom: 24px;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.config-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.edit-button {
  padding: 8px 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  opacity: 0.9;
}

.config-input {
  padding: 12px 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  outline: none;
  transition: all 0.3s ease;
}

.config-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.config-input:focus {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.2);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.input-hint {
  font-size: 0.75rem;
  opacity: 0.7;
}

.input-hint a {
  color: #93c5fd;
  text-decoration: none;
}

.input-hint a:hover {
  text-decoration: underline;
}

.form-actions {
  margin-top: 10px;
}

.save-button {
  width: 100%;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.save-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.config-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.summary-label {
  font-weight: 600;
  opacity: 0.8;
  min-width: 80px;
}

.summary-value {
  opacity: 0.9;
}
</style>
