import { useState, useEffect, useRef } from 'react'
import { messageHelpers, fileHelpers, supabase } from '../lib/supabase'
import { playSound, showMessageNotification, clearNotificationsForChat, initNotificationSound } from '../lib/notifications'
import { isMobile, takePhoto, selectFromGallery, dataUrlToFile, checkCameraPermissions, requestCameraPermissions, showPhotoActionSheet } from '../lib/capacitorHelpers'
import depositDoneImage from '../assets/Deposit_done.webp'
import './ChatInterface.css'

// Debounce helper to reduce API calls
const debounce = (func, wait) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export default function ChatInterface({ chat, user, onBack, onToggleForms, showFormsButton }) {
  // Early return if chat is not provided
  if (!chat || !chat.id) {
    return (
      <div className="chat-container">
        <div className="chat-header">
          <button className="back-button" onClick={onBack}>
            ← Back
          </button>
          <div className="chat-header-info">
            <h2>Error</h2>
          </div>
        </div>
        <div className="messages-container">
          <div className="empty-state">
            <p>❌ Chat not found</p>
            <p className="empty-subtitle">Please select a chat from the list</p>
          </div>
        </div>
      </div>
    )
  }
  
  // State declarations
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [oldestMessageId, setOldestMessageId] = useState(null)
  const [userBlockedStatus, setUserBlockedStatus] = useState(user.is_blocked || false)
  
  // Check if user is blocked (for clients only) - use state for real-time updates
  const isUserBlocked = !user.is_admin && userBlockedStatus
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const fileInputRef = useRef(null)
  const messageInputRef = useRef(null)
  const firstLoadDone = useRef(false)
  const backgroundLoadingRef = useRef(false)
  const allMessagesCache = useRef([]) // Cache for all messages
  
  const MESSAGES_LIMIT = 30
  const INITIAL_LOAD = 20 // Fast initial load

  const departmentNames = {
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    new_id: 'New User ID',
    complaint: 'Complaint',
  }

  useEffect(() => {
    // Safety check: Ensure chat and chat.id exist
    if (!chat || !chat.id) {
      console.error('❌ Chat or chat.id is undefined!')
      return
    }

    // Reset state and load initial messages
    setMessages([])
    setHasMore(true)
    setOldestMessageId(null)
    firstLoadDone.current = false
    backgroundLoadingRef.current = false
    allMessagesCache.current = []
    
    loadInitialMessages()

    // Clear notifications when opening chat
    clearNotificationsForChat(chat.id)

    // Initialize notification sound on first interaction
    initNotificationSound()

    // Subscribe to new messages
    console.log('� Seteting up real-time subscription for chat:', chat.id)
    const messageSubscription = messageHelpers.subscribeToMessages(chat.id, (newMsg, eventType) => {
      console.log('📨 Received message update via real-time:', newMsg, eventType)

      if (eventType === 'update') {
        // Update existing message (for status changes)
        console.log('🔄 Updating message:', newMsg.id)
        setMessages((prev) =>
          prev.map((m) => (m.id === newMsg.id ? newMsg : m))
        )
        // Also update cache
        allMessagesCache.current = allMessagesCache.current.map((m) => 
          m.id === newMsg.id ? newMsg : m
        )
      } else {
        // New message
        console.log('✨ Adding new message:', newMsg.id)

        // Check if message is from other person (not from current user)
        const isFromOther = newMsg.sender_id !== user.id

        if (isFromOther) {
          // Play sound and show notification
          console.log('🔔 Playing notification sound for new message')
          playSound()

          // Show toast notification
          const senderName = user.is_admin ? (newMsg.users?.username || 'Client') : 'Admin'
          const messagePreview = newMsg.message_type === 'text'
            ? newMsg.content.substring(0, 50) + (newMsg.content.length > 50 ? '...' : '')
            : `${newMsg.message_type === 'image' ? '📷 Image' : newMsg.message_type === 'voice' ? '🎤 Voice' : '📎 File'}`

          showMessageNotification(messagePreview, senderName, chat.id, null)
        }

        // Check if user is near bottom before adding message
        const container = messagesContainerRef.current
        const isNearBottom = container 
          ? (container.scrollHeight - container.scrollTop - container.clientHeight) < 100
          : true
        
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.find(m => m.id === newMsg.id)) {
            console.log('⚠️ Duplicate message detected, skipping:', newMsg.id)
            return prev
          }
          return [...prev, newMsg]
        })
        
        // Also add to cache
        if (!allMessagesCache.current.find(m => m.id === newMsg.id)) {
          allMessagesCache.current = [...allMessagesCache.current, newMsg]
        }
        
        // Auto-scroll only if user was near bottom (not reading old messages)
        if (isNearBottom) {
          console.log('📜 Auto-scrolling to new message')
          // Use requestAnimationFrame for better timing
          requestAnimationFrame(() => {
            setTimeout(() => scrollToBottom(true), 100)
          })
        } else {
          console.log('📜 User reading old messages, not auto-scrolling')
        }
      }
    })

    return () => {
      console.log('🔌 Unsubscribing from chat:', chat.id)
      messageSubscription.unsubscribe()
      // Clear cache on unmount
      allMessagesCache.current = []
    }
  }, [chat.id, user.id, user.is_admin])
  
  // Real-time user blocking status subscription (for clients only)
  useEffect(() => {
    if (user.is_admin) return // Admins cannot be blocked
    
    console.log('🔌 Setting up user blocking status subscription for user:', user.id)
    
    const userSubscription = supabase
      .channel(`user-blocking-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('👤 User status updated:', payload.new)
          const updatedUser = payload.new
          
          // Update blocked status in state
          setUserBlockedStatus(updatedUser.is_blocked || false)
          
          if (updatedUser.is_blocked) {
            console.log('🚫 User has been blocked!')
            alert('🚫 Your account has been blocked by an administrator. You can no longer send messages.')
          } else {
            console.log('✅ User has been unblocked!')
            alert('✅ Your account has been unblocked. You can now send messages again.')
          }
        }
      )
      .subscribe()
    
    return () => {
      console.log('🔌 Unsubscribing from user blocking status')
      userSubscription.unsubscribe()
    }
  }, [user.id, user.is_admin])
  
  // IMPROVED: Scroll listener with better handling for fast scrolling
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    
    let scrollTimer = null
    let isLoadingRef = false // Track loading state locally
    let lastScrollTop = 0
    let lastScrollTime = Date.now()
    
    const handleScroll = () => {
      const currentScrollTop = container.scrollTop
      const currentTime = Date.now()
      const timeDiff = currentTime - lastScrollTime
      const scrollDiff = Math.abs(currentScrollTop - lastScrollTop)
      
      // Calculate scroll speed (pixels per millisecond)
      const scrollSpeed = timeDiff > 0 ? scrollDiff / timeDiff : 0
      
      // Update tracking variables
      lastScrollTop = currentScrollTop
      lastScrollTime = currentTime
      
      // Debounce scroll events (longer delay for fast scrolling)
      if (scrollTimer) clearTimeout(scrollTimer)
      
      // Adaptive debounce: longer delay for faster scrolling
      const debounceDelay = scrollSpeed > 2 ? 500 : 300
      
      scrollTimer = setTimeout(() => {
        // Check if initial load is done
        if (!firstLoadDone.current) return
        
        // Prevent multiple simultaneous loads
        if (isLoadingRef) {
          console.log('⏳ Already loading, skipping...')
          return
        }
        
        // If scrolled near top and not already loading, load older messages
        if (container.scrollTop < 200 && !loadingOlder) {
          console.log('📜 Scroll near top detected, checking for older messages...')
          console.log('📊 Scroll state:', {
            scrollTop: container.scrollTop,
            hasMore: hasMore,
            cacheSize: allMessagesCache.current.length,
            displayedMessages: messages.length
          })
          
          // Load if we have more in cache OR if hasMore is true
          const shouldLoad = hasMore || (allMessagesCache.current.length > messages.length)
          
          if (shouldLoad) {
            console.log('✅ Loading older messages...')
            isLoadingRef = true
            loadOlderMessages().finally(() => {
              // Reset loading flag after load completes
              setTimeout(() => {
                isLoadingRef = false
              }, 500) // Cooldown period
            })
          } else {
            console.log('⛔ No more messages to load')
          }
        }
      }, debounceDelay)
    }
    
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimer) clearTimeout(scrollTimer)
      isLoadingRef = false
    }
  }, [hasMore, loadingOlder, oldestMessageId, messages.length])

  // Background loading function - silently loads all older messages
  const loadRemainingMessagesInBackground = async (startFromId) => {
    if (backgroundLoadingRef.current) {
      console.log('⏳ Background loading already in progress')
      return
    }
    
    if (!startFromId) {
      console.log('❌ No starting message ID for background loading')
      return
    }
    
    backgroundLoadingRef.current = true
    
    try {
      let currentOldestId = startFromId
      let allOlderMessages = []
      let hasMoreToLoad = true
      
      console.log('📥 Background loading started from message:', currentOldestId)
      
      // Load in batches until we have all messages
      while (hasMoreToLoad && currentOldestId) {
        console.log('🔄 Fetching batch before:', currentOldestId)
        
        const olderBatch = await messageHelpers.getMessagesBeforeId(
          chat.id,
          currentOldestId,
          MESSAGES_LIMIT
        )
        
        console.log('📦 Received batch:', olderBatch.length, 'messages')
        
        if (olderBatch.length > 0) {
          allOlderMessages = [...olderBatch, ...allOlderMessages]
          currentOldestId = olderBatch[0].id
          
          console.log('📦 Loaded batch:', olderBatch.length, 'messages, new oldest:', currentOldestId)
          
          // Update cache immediately
          allMessagesCache.current = [...olderBatch, ...allMessagesCache.current]
          
          // Check if we got less than limit (means no more messages)
          if (olderBatch.length < MESSAGES_LIMIT) {
            hasMoreToLoad = false
            setHasMore(false)
            console.log('✅ Background loading complete - all messages cached')
          }
          
          // Small delay between batches to not overload
          await new Promise(resolve => setTimeout(resolve, 200))
        } else {
          hasMoreToLoad = false
          setHasMore(false)
          console.log('✅ Background loading complete - no more messages')
        }
      }
      
      console.log('🎉 Total messages in cache:', allMessagesCache.current.length)
      
    } catch (err) {
      console.error('❌ Error in background loading:', err)
    } finally {
      backgroundLoadingRef.current = false
    }
  }

  // Load initial messages fast, then background load rest
  const loadInitialMessages = async () => {
    try {
      setLoading(true)
      console.log('⚡ Fast loading initial', INITIAL_LOAD, 'messages...')
      
      // STEP 1: Fast initial load - only 20 messages
      const msgs = await messageHelpers.getLatestMessages(chat.id, INITIAL_LOAD)
      
      setMessages(msgs)
      allMessagesCache.current = [...msgs] // Initialize cache
      
      let oldestId = null
      if (msgs.length > 0) {
        oldestId = msgs[0].id
        setOldestMessageId(oldestId)
        console.log('📌 Oldest message ID set:', oldestId)
      }
      
      // Smooth scroll to bottom after messages load
      requestAnimationFrame(() => {
        const container = messagesContainerRef.current
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          })
          console.log('✅ Smoothly scrolled to bottom')
        }
        firstLoadDone.current = true
      })
      
      // Mark as read
      await messageHelpers.markMessagesRead(chat.id, user.id)
      
      setLoading(false)
      
      // STEP 2: Background load remaining messages silently
      if (msgs.length === INITIAL_LOAD && oldestId) {
        console.log('🔄 Starting background load of older messages...')
        console.log('📊 Initial load stats:', {
          messagesLoaded: msgs.length,
          oldestId: oldestId,
          willStartBackground: true
        })
        // Use setTimeout to ensure it runs after state updates
        setTimeout(() => {
          console.log('⏰ Background loading timeout triggered')
          loadRemainingMessagesInBackground(oldestId)
        }, 500)
      } else {
        setHasMore(false)
        console.log('✅ All messages loaded (less than', INITIAL_LOAD, ')')
        console.log('📊 Stats:', { messagesLoaded: msgs.length, hasOldestId: !!oldestId })
      }
      
    } catch (err) {
      console.error('Error loading messages:', err)
      setLoading(false)
    }
  }
  
  // Load older messages from cache (instant) or fetch if needed
  const loadOlderMessages = async () => {
    if (loadingOlder || !oldestMessageId) {
      return
    }
    
    const container = messagesContainerRef.current
    if (!container) return
    
    try {
      setLoadingOlder(true)
      
      // Save current scroll position
      const scrollHeightBefore = container.scrollHeight
      const scrollTopBefore = container.scrollTop
      
      console.log('� Loadding older messages from cache...')
      
      // Find current oldest message index in cache
      const currentOldestIndex = allMessagesCache.current.findIndex(
        m => m.id === oldestMessageId
      )
      
      console.log('🔍 Debug:', {
        cacheSize: allMessagesCache.current.length,
        currentOldestIndex: currentOldestIndex,
        oldestMessageId: oldestMessageId
      })
      
      if (currentOldestIndex > 0) {
        // We have older messages in cache - instant load!
        const startIndex = Math.max(0, currentOldestIndex - MESSAGES_LIMIT)
        const olderMsgs = allMessagesCache.current.slice(startIndex, currentOldestIndex)
        
        console.log('⚡ Instantly loaded', olderMsgs.length, 'messages from cache (from index', startIndex, 'to', currentOldestIndex, ')')
        
        if (olderMsgs.length > 0) {
          // Prepend older messages
          setMessages(prev => [...olderMsgs, ...prev])
          setOldestMessageId(olderMsgs[0].id)
          
          // Check if we have more in cache
          setHasMore(startIndex > 0)
          
          // Instant scroll position restore
          const originalScrollBehavior = container.style.scrollBehavior
          container.style.scrollBehavior = 'auto'
          
          requestAnimationFrame(() => {
            const scrollHeightAfter = container.scrollHeight
            const heightDifference = scrollHeightAfter - scrollHeightBefore
            container.scrollTop = scrollTopBefore + heightDifference
            
            setTimeout(() => {
              container.style.scrollBehavior = originalScrollBehavior
            }, 50)
          })
        }
      } else if (currentOldestIndex === 0) {
        // We're at the beginning of cache, no more messages
        console.log('✅ Reached the beginning - no more messages')
        setHasMore(false)
      } else if (hasMore && !backgroundLoadingRef.current) {
        // Cache doesn't have older messages, fetch from API
        console.log('📥 Fetching older messages from API...')
        console.log('📊 Fallback to API because:', {
          currentOldestIndex: currentOldestIndex,
          hasMore: hasMore,
          backgroundLoading: backgroundLoadingRef.current
        })
        
        const olderMsgs = await messageHelpers.getMessagesBeforeId(
          chat.id, 
          oldestMessageId, 
          MESSAGES_LIMIT
        )
        
        console.log('✅ Fetched', olderMsgs.length, 'older messages')
        
        if (olderMsgs.length > 0) {
          // Add to cache
          allMessagesCache.current = [...olderMsgs, ...allMessagesCache.current]
          
          // Prepend to displayed messages
          setMessages(prev => [...olderMsgs, ...prev])
          setOldestMessageId(olderMsgs[0].id)
          setHasMore(olderMsgs.length === MESSAGES_LIMIT)
          
          // Instant scroll position restore
          const originalScrollBehavior = container.style.scrollBehavior
          container.style.scrollBehavior = 'auto'
          
          requestAnimationFrame(() => {
            const scrollHeightAfter = container.scrollHeight
            const heightDifference = scrollHeightAfter - scrollHeightBefore
            container.scrollTop = scrollTopBefore + heightDifference
            
            setTimeout(() => {
              container.style.scrollBehavior = originalScrollBehavior
            }, 50)
          })
        } else {
          setHasMore(false)
        }
      } else {
        console.log('✅ No more messages to load')
        setHasMore(false)
      }
    } catch (err) {
      console.error('❌ Error loading older messages:', err)
    } finally {
      setLoadingOlder(false)
    }
  }

  const scrollToBottom = (smooth = true) => {
    const container = messagesContainerRef.current
    if (container) {
      // Calculate the maximum scroll position
      const maxScroll = container.scrollHeight - container.clientHeight
      
      console.log('📜 Scroll Debug:', {
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
        maxScroll: maxScroll,
        currentScrollTop: container.scrollTop,
        smooth: smooth
      })
      
      if (smooth) {
        // Try both methods for maximum compatibility
        container.scrollTo({
          top: maxScroll,
          behavior: 'smooth'
        })
        // Fallback
        container.scrollTop = maxScroll
        console.log('📜 Smooth scrolling to bottom:', maxScroll)
      } else {
        // Instant scroll (for initial load)
        container.scrollTop = maxScroll
        console.log('📜 Instant scrolling to bottom:', maxScroll)
      }
      
      // Force scroll after a tiny delay
      setTimeout(() => {
        container.scrollTop = maxScroll
      }, 50)
    } else {
      console.log('⚠️ Container not found for scrolling')
      console.log('⚠️ messagesContainerRef:', messagesContainerRef)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || loading) return
    
    // Check if user is blocked
    if (isUserBlocked) {
      alert('🚫 Your account has been blocked. You cannot send messages.')
      setNewMessage('') // Clear input
      return
    }

    setLoading(true)
    const messageText = newMessage.trim()
    setNewMessage('') // Clear input immediately for better UX

    try {
      console.log('📤 Sending message:', {
        chatId: chat.id,
        userId: user.id,
        senderType: user.is_admin ? 'admin' : 'client',
        content: messageText
      })

      await messageHelpers.sendMessage(
        chat.id,
        user.id,
        user.is_admin ? 'admin' : 'client',
        'text',
        messageText
      )

      console.log('✅ Message sent successfully')
      // Real-time subscription will add it to the UI
      // Multiple scroll attempts to ensure it works
      setTimeout(() => {
        scrollToBottom(true)
        // Also try window scroll as fallback
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      }, 100)
      setTimeout(() => {
        scrollToBottom(true)
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      }, 300)
      setTimeout(() => {
        scrollToBottom(true)
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      }, 500)
      
      // Keep input focused for next message
      requestAnimationFrame(() => {
        messageInputRef.current?.focus()
      })
    } catch (err) {
      console.error('❌ Error sending message:', err)
      alert('Failed to send message: ' + err.message)
      setNewMessage(messageText) // Restore message on error
    } finally {
      setLoading(false)
    }
  }

  // Debounced typing indicator (reduces API calls by 90%)
  const debouncedSetTyping = useRef(
    debounce((chatId, userId, isTyping) => {
      // Only send if typing helpers are available
      if (window.typingHelpers) {
        window.typingHelpers.setTyping(chatId, userId, isTyping)
      }
    }, 300)
  ).current

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check if user is blocked
    if (isUserBlocked) {
      alert('🚫 Your account has been blocked. You cannot send files.')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setUploading(true)
    try {
      console.log('📎 Uploading file:', file.name)
      const fileUrl = await fileHelpers.uploadFile(file, chat.id)
      const messageType = file.type.startsWith('image/') ? 'image' : 'file'

      console.log('📤 Sending file message:', messageType)
      await messageHelpers.sendMessage(
        chat.id,
        user.id,
        user.is_admin ? 'admin' : 'client',
        messageType,
        file.name,
        fileUrl
      )

      console.log('✅ File sent successfully')
      // Real-time subscription will add it to the UI
      // Multiple scroll attempts to ensure it works
      setTimeout(() => scrollToBottom(true), 100)
      setTimeout(() => scrollToBottom(true), 300)
      setTimeout(() => scrollToBottom(true), 500)
      
      // Keep input focused
      requestAnimationFrame(() => messageInputRef.current?.focus())
    } catch (err) {
      console.error('❌ Error uploading file:', err)
      alert('Failed to upload file: ' + err.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleMobileFileUpload = async () => {
    // Check if user is blocked
    if (isUserBlocked) {
      alert('🚫 Your account has been blocked. You cannot send files.')
      return
    }
    
    const mobile = await isMobile()
    
    if (!mobile) {
      // On web, use regular file input
      fileInputRef.current?.click()
      return
    }

    setUploading(true)
    try {
      // Check camera permissions first
      const hasPermission = await checkCameraPermissions()
      if (!hasPermission) {
        const granted = await requestCameraPermissions()
        if (!granted) {
          alert('Camera permission is required to take photos')
          return
        }
      }

      // Show action sheet to choose camera or gallery
      const source = await showPhotoActionSheet()
      
      let result
      if (source === 'camera') {
        result = await takePhoto()
      } else {
        result = await selectFromGallery()
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to get image')
      }

      // Convert to file
      const filename = `image_${Date.now()}.${result.format || 'jpg'}`
      const file = dataUrlToFile(result.dataUrl, filename)

      console.log('📎 Uploading mobile image:', filename)
      const fileUrl = await fileHelpers.uploadFile(file, chat.id)

      console.log('📤 Sending image message')
      await messageHelpers.sendMessage(
        chat.id,
        user.id,
        user.is_admin ? 'admin' : 'client',
        'image',
        filename,
        fileUrl
      )

      console.log('✅ Image sent successfully')
      // Multiple scroll attempts
      setTimeout(() => scrollToBottom(true), 100)
      setTimeout(() => scrollToBottom(true), 300)
      setTimeout(() => scrollToBottom(true), 500)
      
      // Keep input focused
      requestAnimationFrame(() => messageInputRef.current?.focus())
    } catch (err) {
      console.error('❌ Error uploading mobile image:', err)
      alert('Failed to upload image: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const startRecording = async () => {
    // Check if user is blocked
    if (isUserBlocked) {
      alert('🚫 Your account has been blocked. You cannot send voice messages.')
      return
    }
    
    try {
      // Check if we're on mobile and request permissions
      const mobile = await isMobile()
      
      if (mobile) {
        // On mobile, we might need to show a permission dialog
        console.log('🎤 Requesting microphone permission on mobile...')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach((track) => track.stop())

        setUploading(true)
        try {
          console.log('🎤 Uploading voice message')
          const voiceUrl = await fileHelpers.uploadVoice(audioBlob, chat.id)

          console.log('📤 Sending voice message')
          await messageHelpers.sendMessage(
            chat.id,
            user.id,
            user.is_admin ? 'admin' : 'client',
            'voice',
            'Voice message',
            voiceUrl
          )

          console.log('✅ Voice message sent successfully')
          // Real-time subscription will add it to the UI
          // Multiple scroll attempts to ensure it works
          setTimeout(() => scrollToBottom(true), 100)
          setTimeout(() => scrollToBottom(true), 300)
          setTimeout(() => scrollToBottom(true), 500)
          
          // Keep input focused
          requestAnimationFrame(() => messageInputRef.current?.focus())
        } catch (err) {
          console.error('❌ Error uploading voice:', err)
          alert('Failed to send voice message: ' + err.message)
        } finally {
          setUploading(false)
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error)
        alert('Recording error: ' + event.error.message)
        setRecording(false)
      }

      mediaRecorder.start(1000) // Collect data every second
      setRecording(true)
      console.log('🎤 Recording started')
    } catch (err) {
      console.error('Error starting recording:', err)
      
      if (err.name === 'NotAllowedError') {
        alert('Microphone permission denied. Please allow microphone access in your browser settings.')
      } else if (err.name === 'NotFoundError') {
        alert('No microphone found. Please check your device.')
      } else {
        alert('Could not access microphone: ' + err.message)
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  const handleDepositDone = async () => {
    if (!user.is_admin || uploading || loading) return

    setUploading(true)
    try {
      console.log('✅ Sending deposit done confirmation')
      
      // Convert the imported image to a blob
      const response = await fetch(depositDoneImage)
      const blob = await response.blob()
      
      // Create a file object from the blob
      const file = new File([blob], 'Deposit_done.webp', { type: 'image/webp' })
      
      // Upload the image
      console.log('📤 Uploading deposit done image')
      const imageUrl = await fileHelpers.uploadFile(file, chat.id)
      
      // Send the image message with the confirmation text
      console.log('📤 Sending deposit done message')
      await messageHelpers.sendMessage(
        chat.id,
        user.id,
        'admin',
        'image',
        'Deposit Done Thanks',
        imageUrl
      )

      console.log('✅ Deposit done confirmation sent successfully')
      // Multiple scroll attempts to ensure it works
      setTimeout(() => scrollToBottom(true), 100)
      setTimeout(() => scrollToBottom(true), 300)
      setTimeout(() => scrollToBottom(true), 500)
    } catch (err) {
      console.error('❌ Error sending deposit done confirmation:', err)
      alert('Failed to send deposit confirmation: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleWithdrawDone = async () => {
    if (!user.is_admin || loading) return

    setLoading(true)
    try {
      console.log('💸 Sending withdraw done confirmation')
      
      // Send text message only
      await messageHelpers.sendMessage(
        chat.id,
        user.id,
        'admin',
        'text',
        'Withdraw is done'
      )

      console.log('✅ Withdraw done confirmation sent successfully')
      // Multiple scroll attempts to ensure it works
      setTimeout(() => scrollToBottom(true), 100)
      setTimeout(() => scrollToBottom(true), 300)
      setTimeout(() => scrollToBottom(true), 500)
    } catch (err) {
      console.error('❌ Error sending withdraw done confirmation:', err)
      alert('Failed to send withdraw confirmation: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

const formatTime = (timestamp) => {
  // console.log(timestamp, 'timestamp');

  // ✅ Force timestamp to be treated as UTC
  const utcDate = new Date(timestamp?.endsWith("Z") ? timestamp : timestamp + "Z");

  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();

  // Local date strings for comparison
  const todayStr = now.toLocaleDateString("en-US", { timeZone: localTimeZone });
  const msgDateStr = utcDate.toLocaleDateString("en-US", { timeZone: localTimeZone });

  // Yesterday logic
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString("en-US", { timeZone: localTimeZone });

  // If today → only time
  if (msgDateStr === todayStr) {
    return utcDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: localTimeZone
    });
  }

  // If yesterday
  if (msgDateStr === yesterdayStr) {
    return (
      "Yesterday " +
      utcDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: localTimeZone
      })
    );
  }

  // Older dates
  return utcDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: localTimeZone
  });
};


  const getMessageStatusIcon = (msg) => {
    // Only show status for messages sent by current user (clients only)
    if (msg.sender_id !== user.id || user.is_admin) return null

    // Default to 'sent' if no status
    const status = msg.status || 'sent'

    switch (status) {
      case 'sent':
        return <span className="status-icon sent">✓</span>
      case 'delivered':
        return <span className="status-icon delivered">✓✓</span>
      case 'read':
        return <span className="status-icon read">✓✓</span>
      default:
        return null
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button className="back-button sidebar-hidden" onClick={onBack}>
          ← Back
        </button>
        <div className="chat-header-info">
          {user.is_admin ? (
            <>
              <h2>{chat.users?.username || 'Unknown User'}</h2>
              <div className="chat-header-meta">
                <span className="chat-department">{departmentNames[chat.department]}</span>
              </div>
            </>
          ) : (
            <>
              <h2>{departmentNames[chat.department]}</h2>
            </>
          )}
        </div>
        
        {/* Forms Toggle Button - Only show for admin and departments with forms */}
        {user.is_admin && showFormsButton && onToggleForms && (
          <button 
            className="forms-toggle-button"
            onClick={onToggleForms}
            title="Toggle forms"
          >
            📝 Forms
          </button>
        )}
      </div>

      <div className="messages-container" ref={messagesContainerRef}>
        {/* Loading indicator for older messages */}
        {loadingOlder && (
          <div className="loading-more">
            <div className="loading-spinner"></div>
            <span>Loading...</span>
          </div>
        )}
        
        {messages.length === 0 && !loading ? (
          <div className="empty-state">
            <p>👋 Start the conversation!</p>
            <p className="empty-subtitle">Send a message to get help</p>
          </div>
        ) : loading && messages.length === 0 ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <span>Loading messages...</span>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.sender_type === 'admin' ? 'admin' : 'client'} ${
                msg.sender_id === user.id ? 'own' : 'other'
              }`}
            >
              <div className="message-content" style={{marginTop:"40px"}}>
                {msg.message_type === 'text' && <p>{msg.content}</p>}

                {msg.message_type === 'image' && (
                  <div className="message-image" onClick={() => setImagePreview(msg.file_url)}>
                    <img src={msg.file_url} alt={msg.content} />
                    <p className="image-caption">{msg.content}</p>
                    <div className="image-overlay">
                      <span>🔍 Click to view full size</span>
                    </div>
                  </div>
                )}

                {msg.message_type === 'file' && (
                  <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="file-link">
                    📎 {msg.content}
                  </a>
                )}

                {msg.message_type === 'voice' && (
                  <audio controls src={msg.file_url} className="voice-player" />
                )}
              </div>
              <div className="message-footer">
                <span className="message-time">{formatTime(msg.created_at)}</span>
                {getMessageStatusIcon(msg)}
              </div>
            </div>
          ))
        )}



        <div ref={messagesEndRef} className="messages-end-anchor" />
      </div>

      <form className="message-input-container" onSubmit={handleSendMessage}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          accept="image/*,.pdf,.doc,.docx"
        />
        
        <button
          type="button"
          className="icon-button"
          onClick={handleMobileFileUpload}
          disabled={uploading || isUserBlocked}
          title={isUserBlocked ? "Account blocked" : "Upload file or image"}
        >
          📎
        </button>

        <button
          type="button"
          className={`icon-button ${recording ? 'recording' : ''}`}
          onClick={recording ? stopRecording : startRecording}
          disabled={uploading || isUserBlocked}
          title={isUserBlocked ? "Account blocked" : (recording ? 'Stop recording' : 'Record voice message')}
        >
          🎤
        </button>

        {/* Department-specific action buttons - Only show for admin users */}
        {user.is_admin && chat.department === 'deposit' && (
          <button
            type="button"
            className="deposit-done-button"
            onClick={handleDepositDone}
            disabled={uploading || loading}
            title="Send deposit confirmation with image"
          >
            ✅ Deposit Done
          </button>
        )}

        {user.is_admin && chat.department === 'withdraw' && (
          <button
            type="button"
            className="withdraw-done-button"
            onClick={handleWithdrawDone}
            disabled={loading}
            title="Send withdraw confirmation"
          >
            💸 Withdraw Done
          </button>
        )}

        <div className="input-send-wrapper">
          <input
            ref={messageInputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={
              isUserBlocked 
                ? '🚫 Your account has been blocked' 
                : uploading 
                  ? 'Uploading...' 
                  : recording 
                    ? 'Recording...' 
                    : 'Type a message...'
            }
            disabled={loading || uploading || recording || isUserBlocked}
            className="message-input"
            autoFocus
          />

          <button
            type="submit"
            className="send-button"
            disabled={!newMessage.trim() || loading || uploading || isUserBlocked}
            title={isUserBlocked ? "Account blocked" : "Send message"}
          >
            Send
          </button>
        </div>
      </form>
      
      {/* Blocked User Warning */}
      {isUserBlocked && (
        <div className="blocked-warning">
          <p>🚫 Your account has been blocked. You cannot send messages.</p>
        </div>
      )}

      {/* Image Preview Modal */}
      {imagePreview && (
        <div className="image-preview-modal" onClick={() => setImagePreview(null)}>
          <div className="image-preview-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-preview" onClick={() => setImagePreview(null)}>
              ✕
            </button>
            <img src={imagePreview} alt="Full size preview" />
            <div className="preview-actions">
              <a href={imagePreview} download target="_blank" rel="noopener noreferrer" className="download-button">
                ⬇️ Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

