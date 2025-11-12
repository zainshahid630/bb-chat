import { useState } from 'react'
import { authHelpers } from '../lib/supabase'
import './Signup.css'

export default function Signup({ onSignupSuccess, onBackToLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!username.trim()) {
      setError('Username is required')
      return
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    if (username.length > 7) {
      setError('Username must not exceed 7 characters')
      return
    }

    if (!password) {
      setError('Password is required')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      console.log('📝 Creating new user:', username)
      
      // Create user account
      const user = await authHelpers.signupWithUsername(username, password)
      
      console.log('✅ User created successfully:', user)
      
      // Auto-login after signup
      console.log('🔐 Auto-logging in...')
      const loginData = await authHelpers.signIn(username, password)
      
      console.log('✅ Auto-login successful!', loginData)
      
      // Extract proper user object
      const loggedInUser = {
        ...loginData.userData,
        id: loginData.user.id
      }
      
      console.log('👤 User object:', loggedInUser)
      
      // Call success callback with logged in user
      if (onSignupSuccess) {
        onSignupSuccess(loggedInUser)
      }
    } catch (err) {
      console.error('❌ Signup error:', err)
      setError(err.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h1>Create Account</h1>
          <p>Sign up to start chatting</p>
        </div>

        <form onSubmit={handleSignup} className="signup-form">
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={loading}
              autoFocus
              autoComplete="username"
              maxLength={7}
            />
            <small>3-7 characters only</small>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              autoComplete="new-password"
            />
            <small>Minimum 6 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <button 
            type="submit" 
            className="signup-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>

          <button
            type="button"
            className="back-to-login-button"
            onClick={onBackToLogin}
            disabled={loading}
          >
            Already have an account? Login
          </button>
        </form>

        <div className="signup-footer">
          <p>By signing up, you agree to our terms and conditions</p>
        </div>
      </div>
    </div>
  )
}
