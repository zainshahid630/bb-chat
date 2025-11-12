import { useState } from 'react'
import { authHelpers, supabase } from '../lib/supabase'
import { sendOTP, verifyOTP, formatPhoneNumber, isValidPhoneNumber } from '../lib/otpService'
import DisclaimerMarquee from './DisclaimerMarquee'
import './Login.css'
import logo from './Logo.png'

export default function Login({ onLogin, onShowSignup }) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSendOTP = async () => {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // Validate username first
      if (!username || username.trim().length < 3) {
        setError('Please enter a username (at least 3 characters)')
        setLoading(false)
        return
      }

      // Validate phone number
      const formattedPhone = formatPhoneNumber(phoneNumber)
      if (!isValidPhoneNumber(formattedPhone)) {
        setError('Please enter a valid Pakistani mobile number (03XX-XXXXXXX)')
        setLoading(false)
        return
      }

      // Check if username or phone number already exists (for signup)
      if (!isLogin) {
        // Check username
        const { data: existingUsername } = await supabase
          .from('users')
          .select('id')
          .eq('username', username.trim())
          .maybeSingle()

        if (existingUsername) {
          setError('Username already taken. Please choose another one.')
          setLoading(false)
          return
        }

        // Check phone number
        const { data: existingPhone } = await supabase
          .from('users')
          .select('id')
          .eq('phone_number', formattedPhone)
          .maybeSingle()

        if (existingPhone) {
          setError('Phone number already registered. Please login instead.')
          setLoading(false)
          return
        }
      }

      // Send OTP
      const result = await sendOTP(formattedPhone)

      if (result.success) {
        setOtpSent(true)
        setSuccess('OTP sent successfully! Check your phone.')
        console.log('✅ OTP sent to:', formattedPhone)
      } else {
        setError(result.message || 'Failed to send OTP. Please try again.')
      }
    } catch (err) {
      console.error('Error sending OTP:', err)
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isLogin) {
        // Login (no OTP required for existing users)
        const { userData } = await authHelpers.signIn(username, password)

        // Check if user is blocked
        if (userData.is_blocked) {
          setError('Your account has been blocked. Please contact support.')
          await authHelpers.signOut()
          setLoading(false)
          return
        }

        onLogin(userData)
      } else {
        // Register - requires OTP verification
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters')
          setLoading(false)
          return
        }

        if (!otpSent) {
          setError('Please verify your phone number first')
          setLoading(false)
          return
        }

        if (!otpCode || otpCode.length < 4) {
          setError('Please enter the OTP code')
          setLoading(false)
          return
        }

        // Verify OTP (pass phone number instead of sessionId for Twilio)
        const formattedPhone = formatPhoneNumber(phoneNumber)
        const otpResult = await verifyOTP(formattedPhone, otpCode)

        if (!otpResult.success) {
          setError(otpResult.message || 'Invalid OTP. Please try again.')
          setLoading(false)
          return
        }

        // OTP verified - proceed with signup
        await authHelpers.signUp(username, password, formattedPhone)

        // Auto login after signup
        const { userData } = await authHelpers.signIn(username, password)
        onLogin(userData)
      }
    } catch (err) {
      console.error('Auth error:', err)

      // Handle specific error cases
      let errorMessage = err.message || 'Authentication failed'

      // Check for duplicate phone number error
      if (errorMessage.includes('users_phone_number_key') ||
          errorMessage.includes('duplicate key value')) {
        errorMessage = 'This phone number is already registered. Please login instead.'
      }

      // Check for duplicate username error
      if (errorMessage.includes('users_username_key')) {
        errorMessage = 'This username is already taken. Please choose another one.'
      }

      // Check for user already registered error
      if (errorMessage.includes('User already registered')) {
        errorMessage = 'This account already exists. Please login instead.'
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      {/* Disclaimer Marquee */}
      <DisclaimerMarquee />
      
      <div className="login-content-wrapper">
        <div className="login-box">
      <h1 className="login-title" style={{ display: "flex", alignItems: "center", gap: "8px"  , placeContent:'center'}}>
  <img src={logo} style={{ width: "40px" }} />
   Exchange
</h1>

        <p className="login-subtitle">
          {isLogin ? 'Login to your account' : 'Create new account'}
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number (Pakistan)</label>
                <div className="phone-input-group">
                  <span className="phone-prefix">+92</span>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="0300 1234567"
                    required
                    maxLength="11"
                    disabled={otpSent}
                  />
                  <button
                    type="button"
                    className="send-otp-button"
                    onClick={handleSendOTP}
                    disabled={loading || otpSent || phoneNumber.length < 10}
                  >
                    {otpSent ? '✓ Sent' : 'Send OTP'}
                  </button>
                </div>
                <small className="input-hint">Enter mobile number starting with 03 (e.g., 03001234567)</small>
              </div>

              {otpSent && (
                <div className="form-group">
                  <label htmlFor="otpCode">Enter OTP</label>
                  <input
                    id="otpCode"
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    required
                    maxLength="6"
                    autoComplete="one-time-code"
                  />
                  <small className="input-hint">
                    Check your phone for the OTP code
                  </small>
                </div>
              )}
            </>
          )}

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
          </button>

          {isLogin && onShowSignup && (
            <button
              type="button"
              className="signup-link-button"
              onClick={onShowSignup}
              disabled={loading}
            >
              Don't have an account? Sign Up
            </button>
          )}
        </form>

        {/* <div className="login-footer">
          <button
            type="button"
            className="toggle-button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
              setSuccess('')
              setPassword('')
              setConfirmPassword('')
              setPhoneNumber('')
              setOtpCode('')
              setOtpSent(false)
            }}
          >
            {isLogin
              ? "Don't have an account? Register"
              : 'Already have an account? Login'}
          </button>
        </div> */}

        {/* <div className="login-info">
          {isLogin ? (
            <>
              <p>✅ Secure authentication</p>
              <p>✅ Quick login with username & password</p>
              <p>✅ Private and confidential</p>
            </>
          ) : (
            <>
              <p>✅ Phone verification required</p>
              <p>✅ One-time OTP during signup</p>
              <p>✅ Secure and private</p>
            </>
          )}
        </div> */}
        </div>
      </div>
    </div>
  )
}

