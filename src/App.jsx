import { useState, useEffect, lazy, Suspense } from 'react'
import { authHelpers, chatHelpers } from './lib/supabase'
import Login from './components/Login'
import './App.css'

// Lazy load heavy components for better initial load performance
const DepartmentSelect = lazy(() => import('./components/DepartmentSelect'))
const ChatInterface = lazy(() => import('./components/ChatInterface'))
const AdminPanel = lazy(() => import('./components/AdminPanel'))
const DatabaseExample = lazy(() => import('./components/DatabaseExample'))
const Signup = lazy(() => import('./components/Signup'))

// Loading fallback component
const LoadingFallback = () => (
  <div className="loading-screen">
    <div className="spinner"></div>
    <p>Loading...</p>
  </div>
)

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentChat, setCurrentChat] = useState(null)
  const [showSignup, setShowSignup] = useState(false)

  // Check if we should show database example (for testing)
  const showDatabaseExample = new URLSearchParams(window.location.search).get('debug') === 'db'

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const currentUser = await authHelpers.getCurrentUser()
      setUser(currentUser)

      // FIXED: Auto-restore last active chat for non-admin users
      if (currentUser && !currentUser.is_admin) {
        await restoreLastChat(currentUser.id)
      }
    } catch (err) {
      console.error('Error checking user:', err)
    } finally {
      setLoading(false)
    }
  }

  const restoreLastChat = async (userId) => {
    try {
      // Get user's most recent open chat
      const chats = await chatHelpers.getUserChats(userId)
      const lastOpenChat = chats.find(chat => chat.status === 'open')

      if (lastOpenChat) {
        console.log('Restoring last active chat:', lastOpenChat)
        setCurrentChat(lastOpenChat)
      }
    } catch (err) {
      console.error('Error restoring chat:', err)
      // Don't throw - just let user select department
    }
  }

  const handleLogin = async (userData) => {
    setUser(userData)

    // FIXED: Auto-restore last active chat after login
    if (userData && !userData.is_admin) {
      await restoreLastChat(userData.id)
    }
  }

  const handleLogout = async () => {
    try {
      await authHelpers.signOut()
      setUser(null)
      setCurrentChat(null)
    } catch (err) {
      console.error('Error logging out:', err)
    }
  }

  const handleSelectDepartment = (chat) => {
    setCurrentChat(chat)
  }

  const handleBackToDepartments = () => {
    setCurrentChat(null)
  }

  // Show database example if debug mode is enabled
  if (showDatabaseExample) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <DatabaseExample />
      </Suspense>
    )
  }

  if (loading) {
    return <LoadingFallback />
  }

  // Not logged in - show signup or login
  if (!user) {
    if (showSignup) {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <Signup
            onSignupSuccess={(loggedInUser) => {
              // User is already logged in after signup
              setUser(loggedInUser)
              setShowSignup(false)
              console.log('✅ User logged in after signup:', loggedInUser)
            }}
            onBackToLogin={() => setShowSignup(false)}
          />
        </Suspense>
      )
    }
    return <Login onLogin={handleLogin} onShowSignup={() => setShowSignup(true)} />
  }

  // Admin user - show admin panel
  if (user.is_admin) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AdminPanel user={user} onLogout={handleLogout} />
      </Suspense>
    )
  }

  // Regular user with active chat - show chat interface
  if (currentChat) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ChatInterface
          chat={currentChat}
          user={user}
          onBack={handleBackToDepartments}
        />
      </Suspense>
    )
  }

  // Regular user - show department selection
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DepartmentSelect
        user={user}
        onSelectDepartment={handleSelectDepartment}
        onLogout={handleLogout}
      />
    </Suspense>
  )
}

export default App
