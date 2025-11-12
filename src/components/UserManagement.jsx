import { useState, useEffect } from 'react'
import { supabase, authHelpers } from '../lib/supabase'
import { formatPhoneNumber, isValidPhoneNumber } from '../lib/otpService'
import './UserManagement.css'

export default function UserManagement({ currentUser, onOpenChat }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'active', 'blocked'
  const [searchQuery, setSearchQuery] = useState('') // Search query
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedDepartment, setSelectedDepartment] = useState('complaint')
  
  // Create user form
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')
  const [creating, setCreating] = useState(false)
  
  // Block user form
  const [blockReason, setBlockReason] = useState('')
  const [blocking, setBlocking] = useState(false)

  useEffect(() => {
    loadUsers()
    
    // Subscribe to user changes
    const subscription = supabase
      .channel('user-management')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
        },
        () => {
          loadUsers()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setCreateError('')
    setCreateSuccess('')
    setCreating(true)

    try {
      // Validate inputs
      if (!newUsername || newUsername.trim().length < 3) {
        setCreateError('Username must be at least 3 characters')
        setCreating(false)
        return
      }

      if (!newPassword || newPassword.length < 6) {
        setCreateError('Password must be at least 6 characters')
        setCreating(false)
        return
      }

      const formattedPhone = formatPhoneNumber(newPhone)
      if (!isValidPhoneNumber(formattedPhone)) {
        setCreateError('Please enter a valid Pakistani mobile number (03XX-XXXXXXX)')
        setCreating(false)
        return
      }

      // Check if username already exists
      const { data: existingUsername } = await supabase
        .from('users')
        .select('id')
        .eq('username', newUsername.trim())
        .maybeSingle()

      if (existingUsername) {
        setCreateError('Username already taken')
        setCreating(false)
        return
      }

      // Check if phone already exists
      const { data: existingPhone } = await supabase
        .from('users')
        .select('id')
        .eq('phone_number', formattedPhone)
        .maybeSingle()

      if (existingPhone) {
        setCreateError('Phone number already registered')
        setCreating(false)
        return
      }

      // Create user using admin function (doesn't log out admin)
      await authHelpers.createUserByAdmin(newUsername.trim(), newPassword, formattedPhone)

      setCreateSuccess('User created successfully!')
      setNewUsername('')
      setNewPassword('')
      setNewPhone('')

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowCreateModal(false)
        setCreateSuccess('')
      }, 2000)

      loadUsers()
    } catch (err) {
      console.error('Error creating user:', err)
      setCreateError(err.message || 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const handleBlockUser = async () => {
    if (!selectedUser || !blockReason.trim()) {
      return
    }

    setBlocking(true)
    try {
      const { error } = await supabase.rpc('block_user', {
        p_user_id: selectedUser.id,
        p_blocked_by: currentUser.id,
        p_reason: blockReason.trim()
      })

      if (error) throw error

      setShowBlockModal(false)
      setBlockReason('')
      setSelectedUser(null)
      loadUsers()
    } catch (err) {
      console.error('Error blocking user:', err)
      alert('Failed to block user: ' + err.message)
    } finally {
      setBlocking(false)
    }
  }

  const handleUnblockUser = async (userId) => {
    if (!confirm('Are you sure you want to unblock this user?')) {
      return
    }

    try {
      const { error } = await supabase.rpc('unblock_user', {
        p_user_id: userId
      })

      if (error) throw error
      loadUsers()
    } catch (err) {
      console.error('Error unblocking user:', err)
      alert('Failed to unblock user: ' + err.message)
    }
  }

  const openBlockModal = (user) => {
    setSelectedUser(user)
    setBlockReason('')
    setShowBlockModal(true)
  }

  const openMessageModal = (user) => {
    setSelectedUser(user)
    setSelectedDepartment('complaint')
    setShowMessageModal(true)
  }

  const handleSendMessage = async () => {
    if (!selectedUser || !selectedDepartment) return

    try {
      // Create or get existing chat for this user and department
      const { data: existingChat } = await supabase
        .from('chats')
        .select('*, users(username)')
        .eq('user_id', selectedUser.id)
        .eq('department', selectedDepartment)
        .maybeSingle()

      let chat
      if (existingChat) {
        // Reopen if closed
        const { data: updatedChat } = await supabase
          .from('chats')
          .update({ status: 'open', updated_at: new Date().toISOString() })
          .eq('id', existingChat.id)
          .select('*, users(username)')
          .single()
        
        chat = updatedChat || existingChat
      } else {
        // Create new chat
        const { data: newChat, error } = await supabase
          .from('chats')
          .insert({
            user_id: selectedUser.id,
            department: selectedDepartment,
            status: 'open'
          })
          .select('*, users(username)')
          .single()

        if (error) throw error
        chat = newChat
      }

      // Close modal
      setShowMessageModal(false)
      
      // Switch to chats tab and open the chat
      if (onOpenChat && chat) {
        onOpenChat(chat)
      } else {
        alert(`Chat opened for ${selectedUser.username} in ${selectedDepartment} department. Switch to Chats tab to send messages.`)
      }
      
    } catch (err) {
      console.error('Error creating chat:', err)
      alert('Failed to create chat: ' + err.message)
    }
  }

  const filteredUsers = users.filter(user => {
    // Don't show admin users
    if (user.is_admin) return false
    
    // Apply status filter
    let matchesFilter = true
    if (filter === 'active') matchesFilter = !user.is_blocked
    else if (filter === 'blocked') matchesFilter = user.is_blocked
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const username = (user.username || '').toLowerCase()
      const phone = (user.phone_number || '').toLowerCase()
      const matchesSearch = username.includes(query) || phone.includes(query)
      return matchesFilter && matchesSearch
    }
    
    return matchesFilter
  })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <div>
          <h2>👥 User Management</h2>
          <p>Manage all registered users</p>
        </div>
        <button 
          className="create-user-button"
          onClick={() => setShowCreateModal(true)}
        >
          ➕ Create User
        </button>
      </div>

      {/* Search Bar */}
      <div className="user-search-container">
        <input
          type="text"
          className="user-search-input"
          placeholder="🔍 Search by username or phone number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="user-search-clear"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      <div className="user-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Users ({users.filter(u => !u.is_admin).length})
        </button>
        <button
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          ✅ Active ({users.filter(u => !u.is_admin && !u.is_blocked).length})
        </button>
        <button
          className={`filter-btn ${filter === 'blocked' ? 'active' : ''}`}
          onClick={() => setFilter('blocked')}
        >
          🚫 Blocked ({users.filter(u => !u.is_admin && u.is_blocked).length})
        </button>
      </div>

      <div className="users-table-container">
        {loading ? (
          <div className="loading-state">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <p>👤 No users found</p>
            <p className="empty-subtitle">
              {filter === 'blocked' 
                ? 'No blocked users' 
                : 'Users will appear here when they register'}
            </p>
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Phone Number</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className={user.is_blocked ? 'blocked-row' : ''}>
                  <td>
                    <div className="user-username">
                      {user.username}
                      {user.phone_verified && <span className="verified-badge">✓</span>}
                    </div>
                  </td>
                  <td>
                    <div className="user-phone">
                      {user.phone_number ? `+92${user.phone_number.slice(1)}` : 'N/A'}
                    </div>
                  </td>
                  <td>
                    {user.is_blocked ? (
                      <span className="status-badge blocked">🚫 Blocked</span>
                    ) : (
                      <span className="status-badge active">✅ Active</span>
                    )}
                  </td>
                  <td className="user-date">{formatDate(user.created_at)}</td>
                  <td>
                    <div className="user-actions">
                      <button
                        className="action-btn message-btn"
                        onClick={() => openMessageModal(user)}
                        title="Send message to user"
                      >
                        💬 Message
                      </button>
                      {user.is_blocked ? (
                        <>
                          <button
                            className="action-btn unblock-btn"
                            onClick={() => handleUnblockUser(user.id)}
                          >
                            Unblock
                          </button>
                          <div className="block-reason" title={user.block_reason}>
                            Reason: {user.block_reason}
                          </div>
                        </>
                      ) : (
                        <button
                          className="action-btn block-btn"
                          onClick={() => openBlockModal(user)}
                        >
                          Block
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ Create New User</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  minLength="3"
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <div className="phone-input-group">
                  <span className="phone-prefix">+92</span>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="0300 1234567"
                    required
                    maxLength="11"
                  />
                </div>
                <small className="input-hint">Enter mobile number starting with 03</small>
              </div>

              {createError && <div className="error-message">{createError}</div>}
              {createSuccess && <div className="success-message">{createSuccess}</div>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block User Modal */}
      {showBlockModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowBlockModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🚫 Block User</h3>
              <button className="modal-close" onClick={() => setShowBlockModal(false)}>×</button>
            </div>
            
            <p>Are you sure you want to block <strong>{selectedUser.username}</strong>?</p>
            
            <div className="form-group">
              <label>Reason for blocking</label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Enter reason for blocking this user..."
                rows="4"
                required
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowBlockModal(false)}
                disabled={blocking}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleBlockUser}
                disabled={blocking || !blockReason.trim()}
              >
                {blocking ? 'Blocking...' : 'Block User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showMessageModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowMessageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💬 Send Message to {selectedUser.username}</h3>
              <button className="modal-close" onClick={() => setShowMessageModal(false)}>×</button>
            </div>
            
            <p>Select a department to start a conversation:</p>
            
            <div className="form-group">
              <label>Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="department-select"
              >
                <option value="deposit">💰 Deposit</option>
                <option value="withdraw">💸 Withdraw</option>
                <option value="new_id">🆔 New User ID</option>
                <option value="complaint">⚠️ Complaint</option>
              </select>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowMessageModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSendMessage}
              >
                Open Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

