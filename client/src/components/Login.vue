<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Join Dashboard Room</h1>
      <p class="subtitle">Enter your name to join the live dashboard</p>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="username">Your Name</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="Enter your name"
            maxlength="20"
            required
            autofocus
          />
        </div>
        
        <button type="submit" class="join-button" :disabled="!username.trim()">
          Join Room
        </button>
      </form>
      
      <div class="info-box">
        <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span>The first person to join becomes the host</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const username = ref('')

const emit = defineEmits(['join'])

const handleSubmit = () => {
  if (username.value.trim()) {
    emit('join', username.value.trim())
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
  max-width: 450px;
  width: 100%;
  color: white;
  text-align: center;
}

.login-card h1 {
  font-size: 2rem;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  opacity: 0.9;
  margin-bottom: 30px;
  font-size: 1rem;
}

.form-group {
  margin-bottom: 25px;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 0.95rem;
}

.form-group input {
  width: 100%;
  padding: 14px 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-group input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.form-group input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.15);
}

.join-button {
  width: 100%;
  padding: 14px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px 0 rgba(102, 126, 234, 0.5);
}

.join-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px 0 rgba(102, 126, 234, 0.7);
}

.join-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.info-box {
  margin-top: 25px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  opacity: 0.9;
}

.info-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}
</style>
