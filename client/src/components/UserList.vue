<template>
  <div class="user-list">
    <h2>Room Members</h2>
    <div class="user-count">{{ users.length }} {{ users.length === 1 ? 'user' : 'users' }} online</div>
    
    <ul class="users">
      <li 
        v-for="user in users" 
        :key="user.id"
        class="user-item"
        :class="{ 'current-user': user.id === currentUser?.id }"
      >
        <div class="user-info">
          <div class="user-avatar">
            {{ getUserInitial(user.username) }}
          </div>
          <div class="user-details">
            <div class="user-name">
              {{ user.username }}
              <span v-if="user.id === currentUser?.id" class="you-badge">(You)</span>
            </div>
            <div v-if="user.isHost" class="host-badge">
              <svg class="crown-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
              </svg>
              Host
            </div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  users: {
    type: Array,
    required: true
  },
  currentUser: {
    type: Object,
    default: null
  }
})

const getUserInitial = (username) => {
  return username ? username.charAt(0).toUpperCase() : '?'
}
</script>

<style scoped>
.user-list {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  height: 100%;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: white;
}

.user-list h2 {
  font-size: 1.3rem;
  margin-bottom: 12px;
  font-weight: 600;
}

.user-count {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.users {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  transition: all 0.3s ease;
  animation: fadeIn 0.3s ease;
}

.user-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(5px);
}

.user-item.current-user {
  background: rgba(102, 126, 234, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 500;
  font-size: 1rem;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.you-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
}

.host-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85rem;
  color: #ffd700;
  font-weight: 600;
}

.crown-icon {
  width: 16px;
  height: 16px;
  color: #ffd700;
  filter: drop-shadow(0 0 2px rgba(255, 215, 0, 0.5));
}
</style>
