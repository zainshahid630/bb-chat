# 📋 Copy-Paste Performance Optimizations

Quick code snippets you can copy directly into your files.

---

## 1. Optimized Image Compression (WebP)

**File:** `src/lib/supabase.js`  
**Find:** Line ~600 in `compressImage` function

**Replace this:**
```javascript
canvas.toBlob(
  (blob) => {
    if (blob) {
      console.log(`📦 Compressed: ${(file.size / 1024).toFixed(2)}KB → ${(blob.size / 1024).toFixed(2)}KB`)
      resolve(new File([blob], file.name, { type: 'image/jpeg' }))
    } else {
      reject(new Error('Compression failed'))
    }
  },
  'image/jpeg',
  quality
)
```

**With this:**
```javascript
canvas.toBlob(
  (blob) => {
    if (blob) {
      console.log(`📦 Compressed: ${(file.size / 1024).toFixed(2)}KB → ${(blob.size / 1024).toFixed(2)}KB`)
      // Use WebP for 50% smaller file size
      const fileName = file.name.replace(/\.(jpg|jpeg|png)$/i, '.webp')
      resolve(new File([blob], fileName, { type: 'image/webp' }))
    } else {
      reject(new Error('Compression failed'))
    }
  },
  'image/webp', // Changed from 'image/jpeg'
  quality
)
```

---

## 2. Add Performance Monitoring

**File:** `src/main.jsx`  
**Add after imports:**

```javascript
import { performanceMonitor } from './lib/performanceMonitor'

// Log performance summary every 30 seconds
if (import.meta.env.DEV) {
  setInterval(() => {
    performanceMonitor.logSummary()
  }, 30000)
}
```

---

## 3. Debounced Typing Indicator

**File:** `src/components/ChatInterface.jsx`  
**Add this helper function at the top:**

```javascript
// Debounce helper
const debounce = (func, wait) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
```

**Then find the input onChange handler and wrap it:**

```javascript
// Create debounced version
const debouncedSetTyping = debounce((chatId, userId, isTyping) => {
  typingHelpers.setTyping(chatId, userId, isTyping)
}, 300)

// In your input onChange
const handleInputChange = (e) => {
  setNewMessage(e.target.value)
  
  // Only send typing indicator every 300ms
  if (e.target.value.length > 0) {
    debouncedSetTyping(chat.id, user.id, true)
  }
}
```

---

## 4. Optimized Chat List Query

**File:** `src/lib/supabase.js`  
**Find:** `getAllChats` function  
**Add limit to prevent loading all chats:**

```javascript
async getAllChats() {
  return cached('all-chats', async () => {
    console.time('⏱️ getAllChats')

    // Add LIMIT to prevent loading thousands of chats
    const { data: chatsData, error: chatsError } = await supabase
      .from('chats')
      .select(`
        *,
        users!chats_user_id_fkey (
          id,
          username
        )
      `)
      .order('updated_at', { ascending: false })
      .limit(100) // ← ADD THIS LINE
      
    // ... rest of function
  }, 5000)
}
```

---

## 5. Lazy Load Heavy Components

**File:** `src/App.jsx`  
**Replace imports:**

```javascript
// OLD
import AdminPanel from './components/AdminPanel'
import ChatInterface from './components/ChatInterface'
import DepartmentSelect from './components/DepartmentSelect'

// NEW
import { lazy, Suspense } from 'react'

const AdminPanel = lazy(() => import('./components/AdminPanel'))
const ChatInterface = lazy(() => import('./components/ChatInterface'))
const DepartmentSelect = lazy(() => import('./components/DepartmentSelect'))

// Add loading component
const LoadingFallback = () => (
  <div className="loading-screen">
    <div className="spinner"></div>
    <p>Loading...</p>
  </div>
)
```

**Then wrap components in Suspense:**

```javascript
// Admin user - show admin panel
if (user.is_admin) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AdminPanel user={user} onLogout={handleLogout} />
    </Suspense>
  )
}

// Regular user with active chat
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
```

---

## 6. Reduce Console Logs in Production

**File:** `vite.config.js`  
**Replace entire file with:**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    
    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
  },
})
```

---

## 7. Optimize Message Loading

**File:** `src/components/ChatInterface.jsx`  
**Find:** `loadInitialMessages` function  
**Reduce initial load:**

```javascript
const loadInitialMessages = async () => {
  try {
    setLoading(true)
    // Load only 20 messages initially (was 30)
    const msgs = await messageHelpers.getLatestMessages(chat.id, 20)
    
    setMessages(msgs)
    setHasMore(msgs.length === 20)
    
    if (msgs.length > 0) {
      setOldestMessageId(msgs[0].id)
    }
    
    // Scroll to bottom after messages load
    setTimeout(() => {
      const container = messagesContainerRef.current
      if (container) {
        container.scrollTop = container.scrollHeight
      }
      firstLoadDone.current = true
    }, 100) // Reduced from 200ms
    
    // Mark as read
    await messageHelpers.markMessagesRead(chat.id, user.id)
  } catch (err) {
    console.error('Error loading messages:', err)
  } finally {
    setLoading(false)
  }
}
```

---

## 8. Batch Message Updates

**File:** `src/components/AdminPanel.jsx`  
**Find:** The message subscription code (around line 150)  
**Increase batch delay:**

```javascript
// Process batch after short delay (allows multiple messages to accumulate)
processingTimeout = setTimeout(processMessageBatch, 500) // Increased from 200ms
```

---

## 9. Optimize Unread Count Query

**File:** `src/lib/supabase.js`  
**In `getAllChats` function, optimize unread query:**

```javascript
// Query 2: Get unread counts - use COUNT instead of fetching all rows
const { data: unreadData } = await supabase
  .rpc('get_unread_counts') // Use RPC function instead
```

**Then create this RPC function in Supabase SQL Editor:**

```sql
CREATE OR REPLACE FUNCTION get_unread_counts()
RETURNS TABLE (chat_id uuid, unread_count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.chat_id,
    COUNT(*) as unread_count
  FROM messages m
  WHERE m.sender_type = 'client'
    AND m.status != 'read'
  GROUP BY m.chat_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 10. Add Request Caching

**File:** `src/lib/supabase.js`  
**Add at the top:**

```javascript
// Simple request cache
const requestCache = new Map()
const CACHE_TTL = 5000 // 5 seconds

const cachedRequest = async (key, fn, ttl = CACHE_TTL) => {
  const cached = requestCache.get(key)
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    console.log('📦 Using cached data for:', key)
    return cached.data
  }
  
  const data = await fn()
  requestCache.set(key, { data, timestamp: Date.now() })
  
  return data
}
```

**Then use it in functions:**

```javascript
async getAllChats() {
  return cachedRequest('all-chats', async () => {
    // ... existing query code
  })
}
```

---

## 11. Optimize File Upload

**File:** `src/lib/supabase.js`  
**In `uploadFile` function, add parallel upload:**

```javascript
async uploadFile(file, chatId) {
  let fileToUpload = file

  // Compress if it's an image
  if (file.type.startsWith('image/')) {
    try {
      // Create thumbnail and full size in parallel
      const [thumbnail, fullSize] = await Promise.all([
        this.compressImage(file, 300, 0.5),
        this.compressImage(file, 1920, 0.8)
      ])
      
      fileToUpload = fullSize
      
      // Upload thumbnail for faster preview (optional)
      // You can store both URLs if needed
    } catch (err) {
      console.warn('Image compression failed, uploading original:', err)
      fileToUpload = file
    }
  }

  const fileExt = fileToUpload.name.split('.').pop()
  const fileName = `${chatId}/${Date.now()}.${fileExt}`

  const { error } = await supabase.storage
    .from('chat-files')
    .upload(fileName, fileToUpload, {
      cacheControl: '3600', // Cache for 1 hour
      upsert: false
    })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('chat-files')
    .getPublicUrl(fileName)

  return publicUrl
}
```

---

## 12. Add Connection Status Indicator

**File:** `src/components/ChatInterface.jsx`  
**Add this component:**

```javascript
const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: '#ef4444',
      color: 'white',
      padding: '8px',
      textAlign: 'center',
      zIndex: 9999
    }}>
      ⚠️ No internet connection
    </div>
  )
}

// Add to ChatInterface return
return (
  <div className="chat-container">
    <ConnectionStatus />
    {/* ... rest of component */}
  </div>
)
```

---

## 🎯 Quick Implementation Order

1. **Database indexes** (5 min) - Biggest impact
2. **Image WebP** (2 min) - Easy win
3. **Lazy loading** (10 min) - Reduces initial load
4. **Debounced typing** (5 min) - Reduces API calls
5. **Performance monitoring** (2 min) - Track improvements
6. **Vite config** (5 min) - Smaller bundle
7. **Message limit** (2 min) - Faster initial load
8. **Console removal** (1 min) - Cleaner production

**Total time: ~30 minutes for major improvements**

---

## 📊 Test Your Changes

```bash
# 1. Build
npm run build

# 2. Check bundle size
ls -lh dist/assets/*.js

# 3. Test locally
npm run preview

# 4. Open DevTools → Network
# Reload and check:
# - Total size transferred
# - Load time
# - Number of requests
```

---

## ✅ Verification

After each change:
- [ ] No console errors
- [ ] Chat still works
- [ ] Messages send/receive
- [ ] Images upload
- [ ] Real-time updates work

---

**Pro Tip:** Implement one change at a time and test before moving to the next!
