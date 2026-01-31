// Simple XOR encryption for localStorage
// Note: This is obfuscation, not cryptographic security
// For production, consider using Web Crypto API or a library like crypto-js

const ENCRYPTION_KEY = 'story-point-poker-key-2024'

export function encryptData(data) {
  try {
    const jsonStr = JSON.stringify(data)
    let encrypted = ''
    
    for (let i = 0; i < jsonStr.length; i++) {
      const charCode = jsonStr.charCodeAt(i)
      const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      encrypted += String.fromCharCode(charCode ^ keyChar)
    }
    
    // Base64 encode to make it storage-safe
    return btoa(encrypted)
  } catch (e) {
    console.error('Encryption failed:', e)
    return null
  }
}

export function decryptData(encryptedData) {
  try {
    // Base64 decode
    const encrypted = atob(encryptedData)
    let decrypted = ''
    
    for (let i = 0; i < encrypted.length; i++) {
      const charCode = encrypted.charCodeAt(i)
      const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      decrypted += String.fromCharCode(charCode ^ keyChar)
    }
    
    return JSON.parse(decrypted)
  } catch (e) {
    console.error('Decryption failed:', e)
    return null
  }
}

// Secure storage wrapper
export const secureStorage = {
  setItem(key, value) {
    const encrypted = encryptData(value)
    if (encrypted) {
      localStorage.setItem(key, encrypted)
      return true
    }
    return false
  },
  
  getItem(key) {
    const encrypted = localStorage.getItem(key)
    if (!encrypted) return null
    return decryptData(encrypted)
  },
  
  removeItem(key) {
    localStorage.removeItem(key)
  },
  
  clear() {
    localStorage.clear()
  }
}
