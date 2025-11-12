import { useState, useEffect } from 'react'
import { authHelpers, chatHelpers, mongoStatus, exchangeHelpers, bankHelpers, clientHelpers, userHelpers } from '../lib/database'
import { authHelpers as supabaseAuth } from '../lib/supabase'

export default function DatabaseExample() {
  const [mongoConnected, setMongoConnected] = useState(false)
  const [supabaseUsers, setSupabaseUsers] = useState([])
  const [mongoUsers, setMongoUsers] = useState([])
  const [exchanges, setExchanges] = useState([])
  const [banks, setBanks] = useState([])
  const [clients, setClients] = useState([])
  const [staffUsers, setStaffUsers] = useState([])

  useEffect(() => {
    // Check MongoDB connection status
    const checkStatus = async () => {
      const status = await mongoStatus.getStatus()
      setMongoConnected(status.connected)
    }
    
    checkStatus()
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load Supabase chats (existing functionality)
      const supabaseChats = await chatHelpers.getAllChats()
      console.log('Supabase chats:', supabaseChats)

      // Try to load MongoDB chats (new functionality)
      if (mongoStatus.isAvailable()) {
        const mongoChats = await chatHelpers.getAllChatsMongo()
        console.log('MongoDB chats (simulated):', mongoChats)
      }

      // Load exchanges
      const exchangeData = await exchangeHelpers.getExchanges()
      setExchanges(exchangeData)
      console.log('Loaded exchanges:', exchangeData)

      // Load banks
      const bankData = await bankHelpers.getBanks()
      setBanks(bankData)
      console.log('Loaded banks:', bankData)

      // Load clients
      const clientData = await clientHelpers.getClients()
      setClients(clientData)
      console.log('Loaded clients:', clientData)

      // Load staff users
      const staffData = await userHelpers.getStaffUsers()
      setStaffUsers(staffData)
      console.log('Loaded staff users:', staffData)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const createTestUser = async () => {
    try {
      // Create user in Supabase (existing system)
      const supabaseUser = await authHelpers.signUp(
        `test_user_${Date.now()}`,
        'password123',
        '+1234567890'
      )
      console.log('Created Supabase user:', supabaseUser)

      // Create user in MongoDB (new system) - only if available
      if (mongoStatus.isAvailable()) {
        const mongoUser = await authHelpers.signUpMongo(
          `mongo_user_${Date.now()}`,
          'password123',
          '+1234567891'
        )
        console.log('Created MongoDB user (simulated):', mongoUser)
      } else {
        console.log('MongoDB not available - skipping MongoDB user creation')
      }

      loadData()
    } catch (error) {
      console.error('Error creating test user:', error)
      alert('Error: ' + error.message)
    }
  }

  const testExchangeDetails = async () => {
    try {
      if (exchanges.length > 0) {
        const firstExchange = exchanges[0]
        const details = await exchangeHelpers.getExchangeById(firstExchange._id)
        console.log('Exchange details:', details)
        alert(`Exchange Details:\nName: ${details.name}\nBalance: $${details.currentAmount?.toLocaleString() || 'N/A'}\nClients: ${details.clientCount || 0}`)
      } else {
        alert('No exchanges loaded yet. Click "Reload Exchanges" first.')
      }
    } catch (error) {
      console.error('Error getting exchange details:', error)
      alert('Error: ' + error.message)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🔗 Hybrid Database System</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Database Status:</h3>
        <p>✅ Supabase: Connected (Chat System)</p>
        <p>{mongoConnected ? '✅' : '⚠️'} MongoDB: {mongoConnected ? 'Ready for API Integration' : 'Frontend-only Mode'} (New Features)</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Available Features:</h3>
        <ul>
          <li>✅ Chat System (Supabase) - Fully functional</li>
          <li>✅ User Management (Supabase) - Fully functional</li>
          <li>✅ Real-time messaging (Supabase) - Fully functional</li>
          <li>{mongoConnected ? '✅' : '⚠️'} MongoDB API Layer - {mongoConnected ? 'Ready for backend integration' : 'Needs backend implementation'}</li>
          <li>{mongoConnected ? '✅' : '⚠️'} Hybrid System - {mongoConnected ? 'Ready for new features' : 'Supabase only mode'}</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Test Functions:</h3>
        <button 
          onClick={createTestUser}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Create Test Users (Both DBs)
        </button>
        
        <button 
          onClick={loadData}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Reload Exchanges
        </button>

        <button 
          onClick={testExchangeDetails}
          style={{
            padding: '10px 20px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test Exchange Details
        </button>
      </div>

      <div>
        <h3>Next Steps for MongoDB Integration:</h3>
        <ol>
          <li>✅ Frontend MongoDB integration prepared</li>
          <li>✅ API-ready database helpers created</li>
          <li>✅ Hybrid system architecture established</li>
          <li>✅ Dynamic exchange loading implemented</li>
          <li>⏳ Create backend API endpoints (Node.js/Express)</li>
          <li>⏳ Implement MongoDB models on backend</li>
          <li>⏳ Add real-time functionality with Socket.IO</li>
          <li>⏳ Connect frontend to backend APIs</li>
        </ol>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h4>📊 Loaded Data:</h4>
        <div style={{ marginBottom: '15px' }}>
          <strong>MongoDB Exchanges ({exchanges.length}):</strong>
          <ul style={{ fontSize: '12px', marginTop: '5px' }}>
            {exchanges.map(exchange => (
              <li key={exchange._id} style={{ marginBottom: '5px' }}>
                <strong>{exchange.name}</strong><br />
                ID: {exchange._id}<br />
                {exchange.currentAmount && (
                  <>Balance: ${exchange.currentAmount.toLocaleString()}<br /></>
                )}
                {exchange.clientCount && (
                  <>Clients: {exchange.clientCount}<br /></>
                )}
                Company: {exchange.companyId}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <strong>MongoDB Banks ({banks.length}):</strong>
          <ul style={{ fontSize: '12px', marginTop: '5px' }}>
            {banks.map(bank => (
              <li key={bank._id} style={{ marginBottom: '5px' }}>
                <strong>{bank.name}</strong><br />
                ID: {bank._id}<br />
                {bank.currentAmount && (
                  <>Balance: ${bank.currentAmount.toLocaleString()}<br /></>
                )}
                Company: {bank.companyId}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <strong>MongoDB Clients ({clients.length}):</strong>
          <ul style={{ fontSize: '12px', marginTop: '5px' }}>
            {clients.length > 0 ? clients.map(client => (
              <li key={client._id} style={{ marginBottom: '5px' }}>
                <strong>{client.name}</strong><br />
                Client ID: {client.clientId}<br />
                User ID: {client.userId}<br />
                {client.phoneNumber && (
                  <>Phone: {client.phoneNumber}<br /></>
                )}
                Exchange: {client.exchangeName}<br />
                Company: {client.companyId}
              </li>
            )) : (
              <li>No clients found in database</li>
            )}
          </ul>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <strong>MongoDB Staff Users ({staffUsers.length}):</strong>
          <ul style={{ fontSize: '12px', marginTop: '5px' }}>
            {staffUsers.length > 0 ? staffUsers.map(user => (
              <li key={user._id} style={{ marginBottom: '5px' }}>
                <strong>{user.name}</strong><br />
                Username: {user.username}<br />
                Role: {user.role}<br />
                Company: {user.companyId}
              </li>
            )) : (
              <li>No staff users found in database</li>
            )}
          </ul>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h4>💡 Usage Examples:</h4>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
{`// Use existing Supabase functionality
const chats = await chatHelpers.getAllChats()
const user = await authHelpers.signIn(username, password)

// Use new MongoDB functionality (when available)
if (mongoStatus.isConnected()) {
  const mongoChats = await chatHelpers.getAllChatsMongo()
  const mongoUser = await authHelpers.signUpMongo(username, password)
}

// Load dynamic exchanges
const exchanges = await exchangeHelpers.getExchanges()
console.log('Available exchanges:', exchanges)`}
        </pre>
      </div>
    </div>
  )
}