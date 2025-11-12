// Notification helper for sound and toast notifications

// Create notification sound (using Web Audio API)
const createNotificationSound = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  
  return () => {
    // Create a simple notification beep
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Configure sound
    oscillator.frequency.value = 800 // Hz
    oscillator.type = 'sine'
    
    // Fade in and out
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01)
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2)
    
    // Play
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)
  }
}

// Initialize sound
let playNotificationSound = null

// Initialize on first user interaction (browsers require user gesture)
export const initNotificationSound = () => {
  if (!playNotificationSound) {
    try {
      playNotificationSound = createNotificationSound()
      console.log('🔔 Notification sound initialized')
    } catch (err) {
      console.error('Failed to initialize notification sound:', err)
    }
  }
}

// Play notification sound
export const playSound = () => {
  try {
    if (!playNotificationSound) {
      initNotificationSound()
    }
    if (playNotificationSound) {
      playNotificationSound()
    }
  } catch (err) {
    console.error('Failed to play notification sound:', err)
  }
}

// Toast notification manager
class ToastManager {
  constructor() {
    this.toasts = []
    this.container = null
    this.listeners = []
  }

  init() {
    if (this.container) return

    // Create toast container
    this.container = document.createElement('div')
    this.container.id = 'toast-container'
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `
    document.body.appendChild(this.container)
  }

  show(message, options = {}) {
    this.init()

    const {
      duration = 0, // 0 = until clicked
      type = 'info',
      onClick = null,
      chatId = null,
      username = 'User'
    } = options

    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.style.cssText = `
      background: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 300px;
      max-width: 400px;
      pointer-events: auto;
      cursor: pointer;
      animation: slideIn 0.3s ease-out;
      border-left: 4px solid ${type === 'message' ? '#10b981' : '#3b82f6'};
      transition: transform 0.2s, opacity 0.2s;
    `

    toast.innerHTML = `
      <div style="display: flex; align-items: start; gap: 12px;">
        <div style="font-size: 24px;">
          ${type === 'message' ? '💬' : 'ℹ️'}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
            ${username}
          </div>
          <div style="color: #6b7280; font-size: 14px;">
            ${message}
          </div>
        </div>
        <div style="color: #9ca3af; font-size: 12px; cursor: pointer;" class="toast-close">
          ✕
        </div>
      </div>
    `

    // Add hover effect
    toast.addEventListener('mouseenter', () => {
      toast.style.transform = 'translateX(-5px)'
    })
    toast.addEventListener('mouseleave', () => {
      toast.style.transform = 'translateX(0)'
    })

    // Click to open chat
    toast.addEventListener('click', (e) => {
      if (!e.target.classList.contains('toast-close')) {
        if (onClick) {
          onClick(chatId)
        }
      }
      this.remove(toast)
    })

    // Close button
    const closeBtn = toast.querySelector('.toast-close')
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.remove(toast)
    })

    this.container.appendChild(toast)
    this.toasts.push({ element: toast, chatId })

    // Auto-remove after duration (if specified)
    if (duration > 0) {
      setTimeout(() => {
        this.remove(toast)
      }, duration)
    }

    // Notify listeners
    this.notifyListeners()

    return toast
  }

  remove(toast) {
    if (toast && toast.parentNode) {
      toast.style.animation = 'slideOut 0.3s ease-out'
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
          this.toasts = this.toasts.filter(t => t.element !== toast)
          this.notifyListeners()
        }
      }, 300)
    }
  }

  removeForChat(chatId) {
    const toastsForChat = this.toasts.filter(t => t.chatId === chatId)
    toastsForChat.forEach(t => this.remove(t.element))
  }

  removeAll() {
    this.toasts.forEach(t => this.remove(t.element))
  }

  getCount() {
    return this.toasts.length
  }

  getCountForChat(chatId) {
    return this.toasts.filter(t => t.chatId === chatId).length
  }

  // Subscribe to toast changes
  subscribe(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback)
    }
  }

  notifyListeners() {
    this.listeners.forEach(cb => cb(this.toasts.length))
  }
}

// Create singleton instance
export const toastManager = new ToastManager()

// Add CSS animations
const style = document.createElement('style')
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }

  .toast:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
`
document.head.appendChild(style)

// Helper function to show message notification
export const showMessageNotification = (message, username, chatId, onClick) => {
  playSound()
  return toastManager.show(message, {
    type: 'message',
    username,
    chatId,
    onClick,
    duration: 3000 // Auto-dismiss after 3 seconds
  })
}

// Helper function to clear notifications for a chat
export const clearNotificationsForChat = (chatId) => {
  toastManager.removeForChat(chatId)
}

// Helper function to get notification count
export const getNotificationCount = () => {
  return toastManager.getCount()
}

