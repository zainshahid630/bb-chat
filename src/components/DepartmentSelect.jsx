import { useState, useEffect } from 'react'
import { chatHelpers, supabase } from '../lib/supabase'
import './DepartmentSelect.css'

const departments = [
  {
    id: 'deposit',
    name: 'Deposit',
    icon: '💰',
    description: 'Add funds to your account',
    color: '#10b981',
  },
  {
    id: 'withdraw',
    name: 'Withdraw',
    icon: '💸',
    description: 'Withdraw your winnings',
    color: '#f59e0b',
  },
  {
    id: 'new_id',
    name: 'New User ID',
    icon: '🆔',
    description: 'Create a new user ID',
    color: '#3b82f6',
  },
  {
    id: 'complaint',
    name: 'Complaint',
    icon: '⚠️',
    description: 'Report an issue or complaint',
    color: '#ef4444',
  },
]

export default function DepartmentSelect({ user, onSelectDepartment, onLogout }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unreadCounts, setUnreadCounts] = useState({})

  useEffect(() => {
    console.log('🔄 DepartmentSelect mounted, loading unread counts...')
    loadUnreadCounts()

    // Subscribe to message changes to update unread counts in real-time
    const subscription = supabase
      .channel('client-unread-counts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('📨 Message change detected:', payload)
          loadUnreadCounts()
        }
      )
      .subscribe()

    return () => {
      console.log('🔌 Unsubscribing from client-unread-counts')
      subscription.unsubscribe()
    }
  }, [user.id])

  const loadUnreadCounts = async () => {
    try {
      console.log('📊 Loading unread counts for user:', user.id)

      // Get all chats for this user
      const { data: chats, error } = await supabase
        .from('chats')
        .select(`
          id,
          department,
          messages (
            id,
            sender_type,
            status
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error

      console.log('📦 Loaded chats:', chats)

      // Calculate unread counts per department
      const counts = {}
      chats?.forEach(chat => {
        const unreadCount = chat.messages?.filter(
          msg => msg.sender_type === 'admin' && msg.status !== 'read'
        ).length || 0

        console.log(`📈 Chat ${chat.id} (${chat.department}): ${unreadCount} unread`)

        if (unreadCount > 0) {
          counts[chat.department] = (counts[chat.department] || 0) + unreadCount
        }
      })

      console.log('✅ Final unread counts:', counts)
      setUnreadCounts(counts)
    } catch (err) {
      console.error('❌ Error loading unread counts:', err)
    }
  }

  const handleDepartmentClick = async (departmentId) => {
    setLoading(true)
    setError('')

    try {
      // Create a new chat for this department
      const chat = await chatHelpers.createChat(user.id, departmentId)
      onSelectDepartment(chat)
    } catch (err) {
      console.error('Error creating chat:', err)
      setError('Failed to start chat. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="department-container">
      <div className="department-header">
        <h1>Welcome, {user.username}! 👋</h1>
        <p>How can we help you today?</p>
        <button className="logout-button" onClick={onLogout}>
          Logout
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="department-grid">
        {departments.map((dept) => (
          <button
            key={dept.id}
            className="department-card"
            onClick={() => handleDepartmentClick(dept.id)}
            disabled={loading}
            style={{ '--dept-color': dept.color }}
          >
            <div className="department-icon">
              {dept.icon}
              {unreadCounts[dept.id] > 0 && (
                <span className="dept-unread-badge">{unreadCounts[dept.id]}</span>
              )}
            </div>
            <h3 className="department-name">{dept.name}</h3>
            <p className="department-description">{dept.description}</p>
          </button>
        ))}
      </div>

      <div className="department-footer">
        <div className="info-box">
          <h4>🔒 Secure & Private</h4>
          <p>All conversations are encrypted and confidential</p>
        </div>
        <div className="info-box">
          <h4>⚡ Fast Response</h4>
          <p>Our team will respond to you shortly</p>
        </div>
      </div>
    </div>
  )
}

