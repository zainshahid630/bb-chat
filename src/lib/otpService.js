// OTP Service using Twilio API
// Most reliable OTP service for Pakistan (PKR 1.35/SMS)
// Twilio is recommended for Pakistan due to:
// - Best delivery rates (99.5%+)
// - 24/7 support
// - Easy integration
// - Free trial credits

const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID || 'YOUR_ACCOUNT_SID'
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN || 'YOUR_AUTH_TOKEN'
const TWILIO_PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER || '+1234567890' // Your Twilio number
const TWILIO_VERIFY_SERVICE_SID = import.meta.env.VITE_TWILIO_VERIFY_SERVICE_SID || 'YOUR_VERIFY_SERVICE_SID'

const API_BASE_URL = 'https://api.twilio.com/2010-04-01'
const VERIFY_API_URL = 'https://verify.twilio.com/v2'

// Create Basic Auth header
const getAuthHeader = () => {
  const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
  return `Basic ${credentials}`
}

/**
 * Send OTP to phone number using Twilio Verify API
 * @param {string} phoneNumber - 11-digit phone number (03XXXXXXXXX)
 * @returns {Promise<{success: boolean, sessionId: string, message: string}>}
 */
export async function sendOTP(phoneNumber) {
  try {
    // Format and validate phone number
    const cleaned = formatPhoneNumber(phoneNumber)

    if (!isValidPhoneNumber(cleaned)) {
      throw new Error('Phone number must start with 03 and be 11 digits (e.g., 03001234567)')
    }

    // Remove leading 0 and add +92 country code
    // 03001234567 → +923001234567
    const formattedPhone = `+92${cleaned.slice(1)}`

    console.log('📱 Sending OTP to:', formattedPhone)

    // Call Twilio Verify API to send OTP
    const response = await fetch(
      `${VERIFY_API_URL}/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`,
      {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formattedPhone,
          Channel: 'sms', // Can be 'sms', 'call', or 'email'
        }),
      }
    )

    const data = await response.json()

    if (response.ok && data.status === 'pending') {
      console.log('✅ OTP sent successfully:', data)
      return {
        success: true,
        sessionId: data.sid, // Verification SID for tracking
        message: 'OTP sent successfully',
      }
    } else {
      console.error('❌ Failed to send OTP:', data)
      return {
        success: false,
        sessionId: null,
        message: data.message || 'Failed to send OTP',
      }
    }
  } catch (error) {
    console.error('❌ Error sending OTP:', error)
    return {
      success: false,
      sessionId: null,
      message: error.message || 'Failed to send OTP',
    }
  }
}

/**
 * Verify OTP using Twilio Verify API
 * @param {string} phoneNumber - 11-digit phone number (same as used in sendOTP)
 * @param {string} otpCode - 6-digit OTP code entered by user
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function verifyOTP(phoneNumber, otpCode) {
  try {
    // Validate OTP code (must be 4-6 digits)
    if (!/^\d{4,6}$/.test(otpCode)) {
      throw new Error('OTP must be 4-6 digits')
    }

    // Format and validate phone number
    const cleaned = formatPhoneNumber(phoneNumber)

    // Remove leading 0 and add +92 country code
    // 03001234567 → +923001234567
    const formattedPhone = `+92${cleaned.slice(1)}`

    console.log('🔍 Verifying OTP for:', formattedPhone)

    // Call Twilio Verify API to check OTP
    const response = await fetch(
      `${VERIFY_API_URL}/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
      {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formattedPhone,
          Code: otpCode,
        }),
      }
    )

    const data = await response.json()

    if (response.ok && data.status === 'approved') {
      console.log('✅ OTP verified successfully')
      return {
        success: true,
        message: 'OTP verified successfully',
      }
    } else {
      console.error('❌ OTP verification failed:', data)
      return {
        success: false,
        message: data.message || 'Invalid OTP',
      }
    }
  } catch (error) {
    console.error('❌ Error verifying OTP:', error)
    return {
      success: false,
      message: error.message || 'Failed to verify OTP',
    }
  }
}

/**
 * Send OTP via Voice Call (fallback if SMS fails)
 * @param {string} phoneNumber - 11-digit phone number (03XXXXXXXXX)
 * @returns {Promise<{success: boolean, sessionId: string, message: string}>}
 */
export async function sendVoiceOTP(phoneNumber) {
  try {
    // Format and validate phone number
    const cleaned = formatPhoneNumber(phoneNumber)

    if (!isValidPhoneNumber(cleaned)) {
      throw new Error('Phone number must start with 03 and be 11 digits')
    }

    // Remove leading 0 and add +92 country code
    const formattedPhone = `+92${cleaned.slice(1)}`

    console.log('📞 Sending Voice OTP to:', formattedPhone)

    // Call Twilio Verify API to send Voice OTP
    const response = await fetch(
      `${VERIFY_API_URL}/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`,
      {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formattedPhone,
          Channel: 'call', // Voice call instead of SMS
        }),
      }
    )

    const data = await response.json()

    if (response.ok && data.status === 'pending') {
      console.log('✅ Voice OTP sent successfully:', data)
      return {
        success: true,
        sessionId: data.sid,
        message: 'Voice OTP sent successfully',
      }
    } else {
      console.error('❌ Failed to send Voice OTP:', data)
      return {
        success: false,
        sessionId: null,
        message: data.message || 'Failed to send Voice OTP',
      }
    }
  } catch (error) {
    console.error('❌ Error sending Voice OTP:', error)
    return {
      success: false,
      sessionId: null,
      message: error.message || 'Failed to send Voice OTP',
    }
  }
}

/**
 * Send SMS using Twilio Programmable SMS (for custom messages)
 * @param {string} phoneNumber - 11-digit phone number (03XXXXXXXXX)
 * @param {string} message - Custom message to send
 * @returns {Promise<{success: boolean, messageId: string, message: string}>}
 */
export async function sendCustomSMS(phoneNumber, message) {
  try {
    // Format and validate phone number
    const cleaned = formatPhoneNumber(phoneNumber)

    if (!isValidPhoneNumber(cleaned)) {
      throw new Error('Phone number must start with 03 and be 11 digits')
    }

    // Remove leading 0 and add +92 country code
    const formattedPhone = `+92${cleaned.slice(1)}`

    console.log('📱 Sending custom SMS to:', formattedPhone)

    // Call Twilio Programmable SMS API
    const response = await fetch(
      `${API_BASE_URL}/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: TWILIO_PHONE_NUMBER,
          To: formattedPhone,
          Body: message,
        }),
      }
    )

    const data = await response.json()

    if (response.ok && data.sid) {
      console.log('✅ Custom SMS sent successfully:', data)
      return {
        success: true,
        messageId: data.sid,
        message: 'SMS sent successfully',
      }
    } else {
      console.error('❌ Failed to send custom SMS:', data)
      return {
        success: false,
        messageId: null,
        message: data.message || 'Failed to send SMS',
      }
    }
  } catch (error) {
    console.error('❌ Error sending custom SMS:', error)
    return {
      success: false,
      messageId: null,
      message: error.message || 'Failed to send SMS',
    }
  }
}

/**
 * Check Twilio account balance
 * @returns {Promise<{success: boolean, balance: number, currency: string, message: string}>}
 */
export async function checkBalance() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Accounts/${TWILIO_ACCOUNT_SID}/Balance.json`,
      {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
        },
      }
    )

    const data = await response.json()

    if (response.ok && data.balance) {
      console.log('💰 Account balance:', data.balance, data.currency)
      return {
        success: true,
        balance: parseFloat(data.balance),
        currency: data.currency,
        message: `Balance: ${data.currency} ${data.balance}`,
      }
    } else {
      return {
        success: false,
        balance: 0,
        currency: 'USD',
        message: 'Failed to fetch balance',
      }
    }
  } catch (error) {
    console.error('❌ Error checking balance:', error)
    return {
      success: false,
      balance: 0,
      currency: 'USD',
      message: error.message || 'Failed to check balance',
    }
  }
}

/**
 * Format phone number (add +92 prefix if needed)
 * @param {string} phoneNumber - Phone number
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phoneNumber) {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '')

  // If starts with 92, remove it (we'll add it back later)
  if (cleaned.startsWith('92')) {
    cleaned = cleaned.slice(2)
  }

  // If starts with 0, keep it (Pakistani format: 03001234567)
  // If doesn't start with 0, assume user forgot it
  if (!cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '0' + cleaned
  }

  // Return the cleaned number (should be 11 digits: 03XXXXXXXXX)
  return cleaned
}

/**
 * Validate Pakistani phone number
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} True if valid
 */
export function isValidPhoneNumber(phoneNumber) {
  const cleaned = formatPhoneNumber(phoneNumber)
  // Pakistani mobile numbers: 03XX-XXXXXXX (11 digits starting with 03)
  // Examples: 03001234567, 03331234567, 03451234567
  return /^03\d{9}$/.test(cleaned)
}

// Export all functions
export default {
  sendOTP,
  verifyOTP,
  sendVoiceOTP,
  sendCustomSMS,
  checkBalance,
  formatPhoneNumber,
  isValidPhoneNumber,
}

