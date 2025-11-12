import { useState, useEffect, useRef } from 'react'
import { chatHelpers, supabase } from '../lib/supabase'
import ChatInterface from './ChatInterface'
import UserManagement from './UserManagement'
import DisclaimerManager from './DisclaimerManager'
import DepositForm from './DepositForm'
import WithdrawForm from './WithdrawForm'
import NewUserForm from './NewUserForm'
import { playSound, showMessageNotification, clearNotificationsForChat, initNotificationSound} from '../lib/notifications'
import './AdminPanel.css'

export default function AdminPanel({ user, onLogout }) {
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('chats') // 'chats' or 'users'
  const [showMobileForms, setShowMobileForms] = useState(false) // Mobile form toggle
  const [showFormsOverlay, setShowFormsOverlay] = useState(false) // Forms overlay toggle for chat view
  const [openMenuChatId, setOpenMenuChatId] = useState(null) // Track which chat menu is open
  const [searchQuery, setSearchQuery] = useState('') // Search query for filtering chats

  // Handle mobile form toggle with body scroll lock
  const toggleMobileForms = (show) => {
    setShowMobileForms(show)
    
    // Prevent body scroll when mobile form is open
    if (show) {
      document.body.classList.add('mobile-form-open')
    } else {
      document.body.classList.remove('mobile-form-open')
    }
  }

  // Handle forms overlay toggle for chat view
  const toggleFormsOverlay = (show) => {
    setShowFormsOverlay(show)
    
    // Prevent body scroll when forms overlay is open
    if (show) {
      document.body.classList.add('forms-overlay-open')
    } else {
      document.body.classList.remove('forms-overlay-open')
    }
  }

  // Cleanup body class on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('mobile-form-open')
      document.body.classList.remove('forms-overlay-open')
    }
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuChatId) {
        setOpenMenuChatId(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [openMenuChatId])
  const subscriptionsRef = useRef(new Map())
  const chatsRef = useRef([])
  
  // Keep chatsRef in sync with chats state
  useEffect(() => {
    chatsRef.current = chats
  }, [chats])

  const departmentNames = {
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    new_id: 'New User ID (Form)',
    complaint: 'Complaint',
  }

  const departmentIcons = {
    deposit: '💰',
    withdraw: '💸',
    new_id: '🆔',
    complaint: '⚠️',
  }

  useEffect(() => {
    loadChats()

    // Initialize notification sound
    initNotificationSound()

    // OPTIMIZED: Use real-time updates instead of polling
    // Subscribe to chat table changes (new chats, status changes)
    const chatSubscription = supabase
      .channel('admin-chats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
        },
        (payload) => {
          console.log('🔄 Chat table changed:', payload)
          console.log('🔄 Event type:', payload.eventType)
          
          if (payload.eventType === 'INSERT') {
            console.log('✨ New chat created! Reloading chat list...')
          }
          
          // Reload chats when any chat is created/updated/deleted
          loadChats()
        }
      )
      .subscribe((status, err) => {
        console.log('📡 Chat subscription status:', status)
        if (err) {
          console.error('❌ Chat subscription error:', err)
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to chat table changes')
        }
      })

    return () => {
      chatSubscription.unsubscribe()
      // Cleanup all subscriptions
      subscriptionsRef.current.forEach(sub => sub.unsubscribe())
      subscriptionsRef.current.clear()
    }
  }, [])

  // SUPER OPTIMIZED: Batched message processing with throttling
  useEffect(() => {
    // Don't check chats.length - we want subscription even if no chats yet
    console.log('🔌 Setting up message subscription, current chats:', chats.length)

    let messageBuffer = []
    let processingTimeout = null

    // Process messages in batches to reduce UI updates
    const processMessageBatch = () => {
      if (messageBuffer.length === 0) return

      const batch = [...messageBuffer]
      messageBuffer = []

      // Group messages by chat for efficient processing
      const messagesByChat = new Map()
      batch.forEach(msg => {
        if (!messagesByChat.has(msg.chat_id)) {
          messagesByChat.set(msg.chat_id, [])
        }
        messagesByChat.get(msg.chat_id).push(msg)
      })

      // Process each chat's messages
      messagesByChat.forEach((messages, chatId) => {
        const chat = chatsRef.current.find(c => c.id === chatId)
        if (!chat) {
          console.log('⚠️ Chat not found in list:', chatId)
          console.log('🔄 Reloading chat list to fetch new chat...')
          // Chat doesn't exist in list yet, reload to get it
          loadChats()
          return
        }

        // Only process if not currently viewing this chat
        if (!selectedChat || selectedChat.id !== chatId) {
          // Show notification for the latest message only
          const latestMessage = messages[messages.length - 1]
          
          if (latestMessage.sender_type === 'client') {
            // Throttled sound (max once per 2 seconds)
            const now = Date.now()
            if (!window.lastSoundTime || now - window.lastSoundTime > 2000) {
              playSound()
              window.lastSoundTime = now
            }

            // Show notification
            const username = chat.users?.username || 'Client'
            const messagePreview = latestMessage.message_type === 'text'
              ? latestMessage.content.substring(0, 50) + (latestMessage.content.length > 50 ? '...' : '')
              : `${latestMessage.message_type === 'image' ? '📷 Image' : latestMessage.message_type === 'voice' ? '🎤 Voice' : '📎 File'}`

            showMessageNotification(messagePreview, username, chatId, (clickedChatId) => {
              const chatToOpen = chats.find(c => c.id === clickedChatId)
              if (chatToOpen) {
                setSelectedChat(chatToOpen)
                clearNotificationsForChat(clickedChatId)
              }
            })
          }
        }
      })

      // Update unread counts in state (real-time, no reload needed)
      messagesByChat.forEach((messages, chatId) => {
        setChats(prevChats => 
          prevChats.map(chat => {
            if (chat.id === chatId) {
              // Count new unread messages from client
              const newUnreadCount = messages.filter(
                msg => msg.sender_type === 'client' && msg.status !== 'read'
              ).length
              
              console.log('📊 Updating unread count for chat:', chatId, 'adding:', newUnreadCount)
              
              return {
                ...chat,
                unread_count: (chat.unread_count || 0) + newUnreadCount,
                updated_at: new Date().toISOString()
              }
            }
            return chat
          })
        )
      })
    }

    // Subscribe to ALL messages with batching
    console.log('🔌 Admin: Setting up message subscription for ALL messages')
    
    const messagesSubscription = supabase
      .channel('admin-all-messages-optimized')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('📨 Admin: New message INSERT received!', payload.new)
          
          try {
            // Check if this chat exists in current list
            console.log('🔍 Checking if chat exists:', payload.new.chat_id)
            console.log('🔍 Current chats count:', chatsRef.current.length)
            
            const chatExists = chatsRef.current.find(c => c.id === payload.new.chat_id)
            console.log('🔍 Chat exists?', !!chatExists)
            
            if (!chatExists) {
              console.log('⚠️ New chat detected! Reloading chat list immediately...')
              loadChats()
            }
            
            // Add to buffer instead of processing immediately
            messageBuffer.push(payload.new)
          console.log('📦 Buffer size:', messageBuffer.length)

          // Clear existing timeout
          if (processingTimeout) {
            clearTimeout(processingTimeout)
            console.log('⏱️ Cleared existing timeout')
          }

          // Process batch after short delay (allows multiple messages to accumulate)
          // OPTIMIZED: Increased from 200ms to 500ms to batch more messages
          console.log('⏱️ Setting timeout to process batch in 500ms...')
          processingTimeout = setTimeout(() => {
            console.log('⏰ Timeout triggered! Processing batch...')
            processMessageBatch()
          }, 500)
          } catch (error) {
            console.error('❌ Error processing message:', error)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: 'status=eq.read'
        },
        (payload) => {
          // Message marked as read - decrement unread count
          const msg = payload.new
          console.log('✅ Message marked as read:', msg.id, 'chat:', msg.chat_id)
          
          if (msg.sender_type === 'client') {
            setChats(prevChats =>
              prevChats.map(chat => {
                if (chat.id === msg.chat_id) {
                  const newCount = Math.max(0, (chat.unread_count || 0) - 1)
                  console.log('📉 Decrementing unread count for chat:', msg.chat_id, 'from', chat.unread_count, 'to', newCount)
                  return {
                    ...chat,
                    unread_count: newCount
                  }
                }
                return chat
              })
            )
          }
        }
      )
      .subscribe((status, err) => {
        console.log('📡 Admin message subscription status:', status)
        if (err) {
          console.error('❌ Admin message subscription error:', err)
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Admin successfully subscribed to ALL messages')
        }
      })

    // Store subscription for cleanup
    subscriptionsRef.current.set('all-messages', messagesSubscription)

    return () => {
      if (processingTimeout) {
        clearTimeout(processingTimeout)
      }
      if (window.chatUpdateTimeout) {
        clearTimeout(window.chatUpdateTimeout)
        window.chatUpdateTimeout = null
      }
      messagesSubscription.unsubscribe()
      subscriptionsRef.current.delete('all-messages')
    }
  }, [selectedChat]) // Removed 'chats' dependency to prevent re-subscription

  const loadChats = async () => {
    try {
      const allChats = await chatHelpers.getAllChats()
      setChats(allChats)
      console.log(allChats,'allChats')
    } catch (err) {
      console.error('Error loading chats:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredChats = chats.filter((chat) => {
    // First apply department/status filter
    let matchesFilter = true
    if (filter === 'all') matchesFilter = true
    else if (filter === 'open') matchesFilter = chat.status === 'open'
    else if (filter === 'closed') matchesFilter = chat.status === 'closed'
    else matchesFilter = chat.department === filter

    // Then apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const username = (chat.users?.username || '').toLowerCase()
      const department = departmentNames[chat.department].toLowerCase()
      const matchesSearch = username.includes(query) || department.includes(query)
      return matchesFilter && matchesSearch
    }

    return matchesFilter
  })

  // Calculate total unread messages (moved before return for use in JSX)
  const totalUnread = chats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0)

  // Calculate unread by department
  const unreadByDept = {
    deposit: chats.filter(c => c.department === 'deposit').reduce((sum, c) => sum + (c.unread_count || 0), 0),
    withdraw: chats.filter(c => c.department === 'withdraw').reduce((sum, c) => sum + (c.unread_count || 0), 0),
    new_id: chats.filter(c => c.department === 'new_id').reduce((sum, c) => sum + (c.unread_count || 0), 0),
    complaint: chats.filter(c => c.department === 'complaint').reduce((sum, c) => sum + (c.unread_count || 0), 0),
  }

  const getLastMessage = (chat) => {
    if (!chat.messages || chat.messages.length === 0) {
      return 'No messages yet'
    }
    const lastMsg = chat.messages[chat.messages.length - 1]
    if (lastMsg.message_type === 'text') {
      return lastMsg.content.substring(0, 50) + (lastMsg.content.length > 50 ? '...' : '')
    }
    return `${lastMsg.message_type === 'image' ? '📷' : lastMsg.message_type === 'voice' ? '🎤' : '📎'} ${lastMsg.message_type}`
  }

const formatDate = (dateString) => {
  // Force UTC if no timezone exists
  if (!dateString?.endsWith("Z")) {
    dateString = dateString + "Z";
  }

  const date = new Date(dateString);
  const now = new Date();

  let diffMs = now - date;
  if (diffMs < 0) diffMs = 0;

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};



  const handleCloseChat = async (chatId) => {
    try {
      await chatHelpers.updateChatStatus(chatId, 'closed')
      loadChats()
      setSelectedChat(null)
    } catch (err) {
      console.error('Error closing chat:', err)
      alert('Failed to close chat')
    }
  }

  const handleDeleteChat = async (chatId, event) => {
    // Prevent chat from being selected when clicking delete
    if (event) {
      event.stopPropagation()
    }

    if (!confirm('Are you sure you want to permanently delete this chat? This action cannot be undone.')) {
      setOpenMenuChatId(null)
      return
    }

    try {
      console.log('🗑️ Deleting chat:', chatId)
      
      // Optimistically remove from UI immediately
      setChats(prevChats => prevChats.filter(c => c.id !== chatId))
      
      // Close the selected chat if it's the one being deleted
      if (selectedChat && selectedChat.id === chatId) {
        setSelectedChat(null)
      }
      
      // Delete from database
      await chatHelpers.deleteChat(chatId)
      
      // Wait a moment for database to process
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Force reload chats to ensure consistency
      console.log('🔄 Reloading chats after deletion')
      await loadChats()
      
      setOpenMenuChatId(null)
      console.log('✅ Chat deleted and list refreshed')
    } catch (err) {
      console.error('❌ Error deleting chat:', err)
      alert('Failed to delete chat: ' + err.message)
      // Reload to restore state if deletion failed
      await loadChats()
      setOpenMenuChatId(null)
    }
  }

  const toggleChatMenu = (chatId, event) => {
    event.stopPropagation()
    setOpenMenuChatId(openMenuChatId === chatId ? null : chatId)
  }

  // Clear notifications when chat is opened
  if (selectedChat) {
    clearNotificationsForChat(selectedChat.id)
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h1>Admin Panel 👨‍💼</h1>
          <p>Manage all customer conversations and users</p>
        </div>
        <button className="logout-button" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'chats' ? 'active' : ''}`}
          onClick={() => setActiveTab('chats')}
        >
          💬 Chats
          {totalUnread > 0 && (
            <span className="tab-unread-badge">{totalUnread}</span>
          )}
        </button>
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button
          className={`tab-button ${activeTab === 'disclaimers' ? 'active' : ''}`}
          onClick={() => setActiveTab('disclaimers')}
        >
          📢 Disclaimers
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="admin-main-layout">
          <div className="admin-content">
            <UserManagement 
              currentUser={user}
              onOpenChat={(chat) => {
                setActiveTab('chats')
                setSelectedChat(chat)
              }}
            />
          </div>
        </div>
      ) : activeTab === 'disclaimers' ? (
        <div className="admin-main-layout">
          <div className="admin-content">
            <DisclaimerManager />
          </div>
        </div>
      ) : (
        <div className="admin-chat-with-sidebar">
          {/* Left Sidebar - Chat List */}
          <div className="admin-sidebar-chats">
            {/* Search Bar */}
            <div className="chat-search-container">
              <input
                type="text"
                className="chat-search-input"
                placeholder="🔍 Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="chat-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="admin-filters">
        <button
          className={`filter-button ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({chats.length})
          {totalUnread > 0 && <span className="unread-badge">{totalUnread}</span>}
        </button>
        <button
          className={`filter-button ${filter === 'open' ? 'active' : ''}`}
          onClick={() => setFilter('open')}
        >
          Open ({chats.filter((c) => c.status === 'open').length})
        </button>
        <button
          className={`filter-button ${filter === 'deposit' ? 'active' : ''}`}
          onClick={() => setFilter('deposit')}
        >
          💰 Deposit (Form)
          {unreadByDept.deposit > 0 && <span className="unread-badge">{unreadByDept.deposit}</span>}
        </button>
        <button
          className={`filter-button ${filter === 'withdraw' ? 'active' : ''}`}
          onClick={() => setFilter('withdraw')}
        >
          💸 Withdraw (Form)
          {unreadByDept.withdraw > 0 && <span className="unread-badge">{unreadByDept.withdraw}</span>}
        </button>
        <button
          className={`filter-button ${filter === 'new_id' ? 'active' : ''}`}
          onClick={() => setFilter('new_id')}
        >
          🆔 New ID
          {unreadByDept.new_id > 0 && <span className="unread-badge">{unreadByDept.new_id}</span>}
        </button>
        <button
          className={`filter-button ${filter === 'complaint' ? 'active' : ''}`}
          onClick={() => setFilter('complaint')}
        >
          ⚠️ Complaint
          {unreadByDept.complaint > 0 && <span className="unread-badge">{unreadByDept.complaint}</span>}
        </button>
      </div>

      <div className="chats-list">
        {loading ? (
          <div className="loading-state">Loading chats...</div>
        ) : filteredChats.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? (
              <div key="search-empty">
                <p>🔍 No results found</p>
                <p className="empty-subtitle">No chats match "{searchQuery}"</p>
                <button 
                  className="clear-search-button"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div key="no-chats">
                <p>📭 No chats found</p>
                <p className="empty-subtitle">Chats will appear here when customers contact you</p>
              </div>
            )}
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${chat.unread_count > 0 ? 'has-unread' : ''}`}
              onClick={() => {
                setSelectedChat(chat)
                // Clear unread count immediately in UI
                if (chat.unread_count > 0) {
                  setChats(prevChats =>
                    prevChats.map(c =>
                      c.id === chat.id ? { ...c, unread_count: 0 } : c
                    )
                  )
                }
              }}
            >
              <div className="chat-item-icon">
                {departmentIcons[chat.department]}
                {chat.unread_count > 0 && (
                  <span className="chat-unread-badge">{chat.unread_count}</span>
                )}
              </div>
              <div className="chat-item-content">
                <div className="chat-item-header">
                  <span className="chat-item-user">
                    {chat.users?.username || 'Unknown User'}
                  </span>
                  <span className="chat-item-time">
                    {formatDate(chat.updated_at)}
                  </span>
                </div>
                <div className="chat-item-department">
                  {departmentNames[chat.department]}
                </div>
                <div className="chat-item-preview">
                  {getLastMessage(chat)}
                </div>
              </div>
              <div className="chat-item-menu">
                <button
                  className="chat-menu-button"
                  onClick={(e) => toggleChatMenu(chat.id, e)}
                  aria-label="Chat options"
                >
                  ⋮
                </button>
                {openMenuChatId === chat.id && (
                  <div className="chat-menu-dropdown">
                    <button
                      className="chat-menu-option delete"
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                    >
                      🗑️ Delete Chat
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
          </div>
          
          {/* Right Side - Chat Interface or Empty State */}
          <div className={`admin-chat-area ${selectedChat ? 'has-chat' : ''}`}>
            {selectedChat ? (
              <>
                <ChatInterface
                  chat={selectedChat}
                  user={user}
                  onBack={() => {
                    setSelectedChat(null)
                    setShowFormsOverlay(false)
                    loadChats()
                  }}
                  onToggleForms={() => toggleFormsOverlay(!showFormsOverlay)}
                  showFormsButton={selectedChat.department !== 'complaint'}
                />
                
                {/* Chat Actions */}
                <div className="chat-actions-bottom">
                  <button
                    className="close-chat-button"
                    onClick={() => handleCloseChat(selectedChat.id)}
                  >
                    Close Chat
                  </button>
                  <button
                    className="delete-chat-button"
                    onClick={() => handleDeleteChat(selectedChat.id)}
                  >
                    🗑️ Delete Chat
                  </button>
                </div>
                
                {/* Forms Overlay */}
                {showFormsOverlay && (
                  <div 
                    className="forms-overlay"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) {
                        toggleFormsOverlay(false)
                      }
                    }}
                  >
                    <div className="forms-overlay-content">
                      <div className="forms-overlay-header">
                        <h3>📝 {departmentNames[selectedChat.department]} Form</h3>
                        <button
                          className="forms-overlay-close"
                          onClick={() => toggleFormsOverlay(false)}
                        >
                          ✕ Close
                        </button>
                      </div>
                      <div className="forms-overlay-body">
                        {selectedChat.department === 'deposit' && (
                          <DepositForm selectedChat={selectedChat} />
                        )}
                        {selectedChat.department === 'withdraw' && (
                          <WithdrawForm selectedChat={selectedChat} />
                        )}
                        {selectedChat.department === 'new_id' && (
                          <NewUserForm selectedChat={selectedChat} />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="no-chat-selected">
                <div className="no-chat-icon">💬</div>
                <h2>Select a chat to start</h2>
                <p>Choose a conversation from the list to view messages</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

