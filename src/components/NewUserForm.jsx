import { useState, useEffect } from 'react'
import { newUserHelpers, exchangeHelpers, userHelpers } from '../lib/database'
import './NewUserForm.css'

export default function NewUserForm({ selectedChat }) {
  const [formData, setFormData] = useState({
    clientName: '',
    userId: '',
    phoneNumber: '',
    exchange: '',
    staffUserId: '' // Staff user creating the new user
  })

  const [exchanges, setExchanges] = useState([])
  const [staffUsers, setStaffUsers] = useState([])
  const [loading, setLoading] = useState(false)

  // Load exchanges from database
  useEffect(() => {
    const loadExchanges = async () => {
      try {
        const exchangeData = await exchangeHelpers.getExchanges()
        setExchanges(exchangeData)
      } catch (error) {
        console.error('Error loading exchanges:', error)
        // Fallback to empty array, will show "No exchanges available"
        setExchanges([])
      }
    }
    
    loadExchanges()
  }, [])

  // Load staff users from database
  useEffect(() => {
    const loadStaffUsers = async () => {
      try {
        const staffData = await userHelpers.getStaffUsers()
        setStaffUsers(staffData)
      } catch (error) {
        console.error('Error loading staff users:', error)
        setStaffUsers([])
      }
    }
    
    loadStaffUsers()
  }, [])

  // Auto-fill from chat user if available
  useEffect(() => {
    if (selectedChat && selectedChat.users) {
      const chatUser = selectedChat.users
      setFormData(prev => ({
        ...prev,
        clientName: chatUser.username || '',
        userId: chatUser.id || '',
        phoneNumber: chatUser.phone_number || ''
      }))
    }
  }, [selectedChat])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    const errors = []

    // Client Name validation
    if (!formData.clientName.trim()) {
      errors.push('Client Name is required')
    } else if (formData.clientName.trim().length < 2) {
      errors.push('Client Name must be at least 2 characters')
    }

    // User ID validation
    if (!formData.userId.trim()) {
      errors.push('User ID is required')
    } else if (formData.userId.trim().length < 3) {
      errors.push('User ID must be at least 3 characters')
    }

    // Phone Number validation (optional but if provided, should be valid)
    if (formData.phoneNumber.trim()) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/
      if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ''))) {
        errors.push('Please enter a valid phone number')
      }
    }

    // Exchange validation
    if (!formData.exchange) {
      errors.push('Exchange is required')
    }

    // Staff User validation
    if (!formData.staffUserId) {
      errors.push('Staff member is required')
    }

    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate form
      const errors = validateForm()
      if (errors.length > 0) {
        alert('Please fix the following errors:\n' + errors.join('\n'))
        return
      }

      console.log('Creating new user:', formData)

      // Create new client using the database helper
      const newUserData = {
        name: formData.clientName.trim(),
        userId: formData.userId.trim(),
        phoneNumber: formData.phoneNumber.trim() || null,
        exchangeId: formData.exchange,
        staffUserId: formData.staffUserId
      }

      const result = await newUserHelpers.createNewUser(newUserData)
      console.log('New client created:', result)

      // Show success message with client details
      const client = result.client
      alert(`Client created successfully!\n\nName: ${client.name}\nClient ID: ${client.clientId}\nUser ID: ${client.userId}\nExchange: ${client.exchangeId.name}${client.phoneNumber ? `\nPhone: ${client.phoneNumber}` : ''}`)
      
      // Reset form
      setFormData({
        clientName: '',
        userId: '',
        phoneNumber: '',
        exchange: '',
        staffUserId: ''
      })

    } catch (error) {
      console.error('Error creating new user:', error)
      alert('Failed to create new user: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="newuser-form-container">
      <div className="newuser-form-header">
        <h3>🆔 Create New User ID</h3>
      </div>

      <form className="newuser-form" onSubmit={handleSubmit}>
        {/* Client Name Field */}
        <div className="form-group">
          <label htmlFor="clientName">Client Name *</label>
          <input
            type="text"
            id="clientName"
            name="clientName"
            value={formData.clientName}
            onChange={handleInputChange}
            placeholder="Enter client's full name"
            required
            className="form-input"
            minLength="2"
            maxLength="50"
          />
          <small className="field-hint">Full name of the client</small>
        </div>

        {/* User ID Field */}
        <div className="form-group">
          <label htmlFor="userId">User ID *</label>
          <input
            type="text"
            id="userId"
            name="userId"
            value={formData.userId}
            onChange={handleInputChange}
            placeholder="Enter unique user ID"
            required
            className="form-input"
            minLength="3"
            maxLength="30"
            pattern="[a-zA-Z0-9_-]+"
            title="User ID can only contain letters, numbers, underscores, and hyphens"
          />
          <small className="field-hint">Unique identifier for the user (letters, numbers, _, -)</small>
        </div>

        {/* Phone Number Field */}
        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number</label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            placeholder="Enter phone number (optional)"
            className="form-input"
          />
          <small className="field-hint">Optional: Include country code (e.g., +92300123456)</small>
        </div>

        {/* Exchange Selection */}
        <div className="form-group">
          <label htmlFor="exchange">Exchange *</label>
          <select
            id="exchange"
            name="exchange"
            value={formData.exchange}
            onChange={handleInputChange}
            required
            className="form-select"
          >
            <option value="">Select Exchange</option>
            {exchanges.length > 0 ? (
              exchanges.map(exchange => (
                <option key={exchange._id} value={exchange._id}>
                  {exchange.name} {exchange.clientCount ? `(${exchange.clientCount} clients)` : ''}
                </option>
              ))
            ) : (
              <option value="" disabled>Loading exchanges from MongoDB...</option>
            )}
          </select>
          <small className="field-hint">Select exchange from MongoDB database</small>
        </div>

        {/* Staff User Selection */}
        <div className="form-group">
          <label htmlFor="staffUserId">Created By (Staff) *</label>
          <select
            id="staffUserId"
            name="staffUserId"
            value={formData.staffUserId}
            onChange={handleInputChange}
            required
            className="form-select"
          >
            <option value="">Select staff member</option>
            {staffUsers.map(user => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.username})
              </option>
            ))}
          </select>
          <small className="field-hint">Select staff member creating this user</small>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="newuser-submit-btn"
        >
          {loading ? 'Creating...' : '🆔 Create New User'}
        </button>
      </form>

      {/* Form Guidelines */}
      <div className="form-guidelines">
        <h4>Guidelines</h4>
        <ul>
          <li><strong>Client Name:</strong> Use full legal name</li>
          <li><strong>User ID:</strong> Must be unique, 3-30 characters</li>
          <li><strong>Phone:</strong> Include country code if provided</li>
          <li><strong>Exchange:</strong> Primary trading platform</li>
        </ul>
      </div>

      {/* Selected Chat Info */}
      {selectedChat && (
        <div className="selected-chat-info">
          <h4>Chat Information</h4>
          <p><strong>User:</strong> {selectedChat.users?.username || 'Unknown'}</p>
          <p><strong>Department:</strong> {selectedChat.department}</p>
          <p><strong>Status:</strong> {selectedChat.status}</p>
        </div>
      )}
    </div>
  )
}