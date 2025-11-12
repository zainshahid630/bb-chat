import { useState, useEffect } from 'react'
import { withdrawHelpers, exchangeHelpers, bankHelpers, clientHelpers, userHelpers } from '../lib/database'
import './WithdrawForm.css'

export default function WithdrawForm({ selectedChat }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Today's date
    bank: '',
    clientId: '',
    exchange: '',
    amount: '',
    referenceNo: '',
    staffUserId: '' // Staff user handling the withdrawal
  })

  const [clients, setClients] = useState([])
  const [filteredClients, setFilteredClients] = useState([])
  const [clientSearch, setClientSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [clientSearchLoading, setClientSearchLoading] = useState(false)
  const [exchanges, setExchanges] = useState([])
  const [banks, setBanks] = useState([])
  const [staffUsers, setStaffUsers] = useState([])
  const [loading, setLoading] = useState(false)

  // Load banks from database
  useEffect(() => {
    const loadBanks = async () => {
      try {
        const bankData = await bankHelpers.getBanks()
        setBanks(bankData)
      } catch (error) {
        console.error('Error loading banks:', error)
        setBanks([])
      }
    }
    
    loadBanks()
  }, [])

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

  // Load initial clients from database
  useEffect(() => {
    const loadInitialClients = async () => {
      try {
        const clientData = await clientHelpers.getClients()
        setClients(clientData)
        setFilteredClients(clientData)
      } catch (error) {
        console.error('Error loading clients:', error)
        setClients([])
        setFilteredClients([])
      }
    }
    
    loadInitialClients()
  }, [])

  // Auto-select client if chat is open
  useEffect(() => {
    if (selectedChat && selectedChat.users) {
      const chatUser = selectedChat.users
      setClientSearch(chatUser.username || '')
      setFormData(prev => ({
        ...prev,
        clientId: chatUser.id || ''
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

  const handleClientSearch = async (e) => {
    const searchValue = e.target.value
    setClientSearch(searchValue)
    setShowClientDropdown(true)

    if (searchValue.trim().length >= 1) {
      setClientSearchLoading(true)
      try {
        // Search clients from API with clientId priority
        const searchResults = await clientHelpers.searchClients(searchValue)
        setFilteredClients(searchResults)
      } catch (error) {
        console.error('Error searching clients:', error)
        // Fallback to local filtering
        const filtered = clients.filter(client =>
          client.name.toLowerCase().includes(searchValue.toLowerCase()) ||
          client.clientId.toLowerCase().includes(searchValue.toLowerCase()) ||
          client.userId.toLowerCase().includes(searchValue.toLowerCase()) ||
          (client.phoneNumber && client.phoneNumber.includes(searchValue))
        )
        setFilteredClients(filtered)
      } finally {
        setClientSearchLoading(false)
      }
    } else {
      // Show all clients if search is empty
      setFilteredClients(clients)
    }
  }

  const selectClient = (client) => {
    setClientSearch(`${client.name} (${client.clientId})`)
    setFormData(prev => ({
      ...prev,
      clientId: client._id
    }))
    setShowClientDropdown(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.bank || !formData.clientId || !formData.exchange || !formData.amount || !formData.staffUserId) {
        alert('Please fill in all required fields including staff member')
        return
      }

      // Validate amount
      if (parseFloat(formData.amount) <= 0) {
        alert('Amount must be greater than 0')
        return
      }

      console.log('Creating withdrawal:', formData)

      // Create withdrawal using the database helper
      const withdrawalData = {
        date: formData.date,
        bank: formData.bank,
        clientId: formData.clientId,
        exchange: formData.exchange,
        amount: parseFloat(formData.amount),
        referenceNo: formData.referenceNo || null,
        staffUserId: formData.staffUserId
      }

      const result = await withdrawHelpers.createWithdrawal(withdrawalData)
      console.log('Withdrawal created:', result)

      // Show success message with balance changes
      const balanceInfo = result.balanceChanges
      alert(`Withdrawal created successfully!\n\nBank: ${balanceInfo.bank.name}\nPrevious Balance: ${balanceInfo.bank.previousBalance}\nNew Balance: ${balanceInfo.bank.newBalance}\nAmount Deducted: ${Math.abs(balanceInfo.bank.change)}`)
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        bank: '',
        clientId: '',
        exchange: '',
        amount: '',
        referenceNo: '',
        staffUserId: ''
      })
      setClientSearch('')

    } catch (error) {
      console.error('Error creating withdrawal:', error)
      alert('Failed to create withdrawal: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Get today's date for min attribute
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="withdraw-form-container">
      <div className="withdraw-form-header">
        <h3>💸 Create Withdrawal</h3>
      </div>

      <form className="withdraw-form" onSubmit={handleSubmit}>
        {/* Date Field */}
        <div className="form-group">
          <label htmlFor="date">Date *</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            min={today}
            required
            className="form-input"
          />
        </div>

        {/* Bank Selection */}
        <div className="form-group">
          <label htmlFor="bank">Bank *</label>
          <select
            id="bank"
            name="bank"
            value={formData.bank}
            onChange={handleInputChange}
            required
            className="form-select"
          >
            <option value="">Select Bank</option>
            {banks.length > 0 ? (
              banks.map(bank => (
                <option key={bank._id} value={bank._id}>
                  {bank.name} {bank.currentAmount ? `(Balance: $${bank.currentAmount.toLocaleString()})` : ''}
                </option>
              ))
            ) : (
              <option value="" disabled>Loading banks from MongoDB...</option>
            )}
          </select>
        </div>

        {/* Client ID Search */}
        <div className="form-group">
          <label htmlFor="clientId">Client ID *</label>
          <div className="client-search-container">
            <input
              type="text"
              id="clientSearch"
              value={clientSearch}
              onChange={handleClientSearch}
              onFocus={() => setShowClientDropdown(true)}
              placeholder="Search by client ID, name, user ID, or phone"
              required
              className="form-input"
            />
            {showClientDropdown && (
              <div className="client-dropdown">
                {clientSearchLoading ? (
                  <div className="client-option">
                    <span>Searching clients...</span>
                  </div>
                ) : filteredClients.length > 0 ? (
                  filteredClients.map(client => (
                    <div
                      key={client._id}
                      className="client-option"
                      onClick={() => selectClient(client)}
                    >
                      <div className="client-info">
                        <span className="client-username">{client.name}</span>
                        <span className="client-id">ID: {client.clientId}</span>
                        <span className="client-exchange">Exchange: {client.exchangeName}</span>
                      </div>
                      <span className="client-phone">{client.phoneNumber || 'No phone'}</span>
                    </div>
                  ))
                ) : (
                  <div className="client-option">
                    <span>No clients found</span>
                  </div>
                )}
              </div>
            )}
          </div>
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
                  {exchange.name} {exchange.currentAmount ? `(Balance: $${exchange.currentAmount.toLocaleString()})` : ''}
                </option>
              ))
            ) : (
              <option value="" disabled>Loading exchanges from MongoDB...</option>
            )}
          </select>
        </div>

        {/* Amount */}
        <div className="form-group">
          <label htmlFor="amount">Amount (PKR) *</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            min="1"
            step="0.01"
            placeholder="Enter amount"
            required
            className="form-input"
          />
        </div>

        {/* Reference Number */}
        <div className="form-group">
          <label htmlFor="referenceNo">Reference Number</label>
          <input
            type="text"
            id="referenceNo"
            name="referenceNo"
            value={formData.referenceNo}
            onChange={handleInputChange}
            placeholder="Enter reference number (optional)"
            className="form-input"
          />
        </div>

        {/* Staff User Selection */}
        <div className="form-group">
          <label htmlFor="staffUserId">Handled By (Staff) *</label>
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
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="withdraw-submit-btn"
        >
          {loading ? 'Creating...' : '💸 Create Withdrawal'}
        </button>
      </form>

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