# MongoDB Integration Guide

## Overview

This project now supports both **Supabase** (existing chat system) and **MongoDB** (for new features) in a hybrid configuration.

## Current Status

✅ **Supabase** - Fully functional
- Chat system
- User authentication  
- Real-time messaging
- File uploads
- Admin panel

✅ **MongoDB** - Ready for new features
- Connection established
- Mongoose models created
- Hybrid database helpers
- Backward compatibility maintained

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# MongoDB Configuration (Frontend)
VITE_MONGODB_URI=mongodb+srv://zain:FUl4okKUlh3lGGuL@cluster0.jktbexf.mongodb.net/ledger

# API Base URL (for backend integration)
VITE_API_BASE_URL=http://localhost:3001/api
```

### Frontend Architecture

**Frontend-Ready MongoDB Integration:**
- API-based database helpers
- Environment variable configuration
- Graceful fallback to Supabase-only mode
- Ready for backend API integration

**Backend Models (for implementation):**
- `User.js` - User accounts
- `Chat.js` - Chat sessions  
- `Message.js` - Chat messages
- `TypingStatus.js` - Typing indicators

## Usage

### Existing Functionality (Supabase)
```javascript
import { authHelpers, chatHelpers } from './lib/supabase'

// All existing code continues to work
const user = await authHelpers.signIn(username, password)
const chats = await chatHelpers.getAllChats()
```

### New Functionality (MongoDB API)
```javascript
import { authHelpers, chatHelpers, mongoStatus } from './lib/database'

// Check if MongoDB API is available
if (mongoStatus.isAvailable()) {
  // Use MongoDB API methods (requires backend)
  const mongoUser = await authHelpers.signUpMongo(username, password)
  const mongoChats = await chatHelpers.getAllChatsMongo()
}
```

### Hybrid Approach
```javascript
import { authHelpers } from './lib/database'

// This will use Supabase by default, with MongoDB methods available
const user = await authHelpers.signIn(username, password) // Supabase
const mongoUser = await authHelpers.signUpMongo(username, password) // MongoDB
```

## Testing

Visit your app with `?debug=db` parameter to see the database status:
```
http://localhost:5173/?debug=db
```

This will show:
- Connection status for both databases
- Available features
- Test functions
- Usage examples

## Next Steps

1. **Create Backend API Server**
   ```bash
   # Create a separate Node.js/Express backend
   mkdir chat-backend
   cd chat-backend
   npm init -y
   npm install express mongoose cors dotenv bcryptjs
   ```

2. **Implement API Endpoints**
   - `/api/auth/signup` - User registration
   - `/api/auth/signin` - User authentication
   - `/api/chats` - Chat management
   - `/api/messages` - Message handling

3. **Add Real-time Features**
   - Socket.IO for live updates
   - WebSocket connections
   - Real-time notifications

4. **Implement New Features**
   - Ledger system
   - Advanced analytics
   - Custom reporting
   - File storage with GridFS

## Architecture Benefits

- **Zero Downtime**: Existing chat system continues working
- **Gradual Migration**: Move features to MongoDB incrementally  
- **Flexibility**: Use the best database for each feature
- **Scalability**: MongoDB for complex queries, Supabase for real-time

## Dependencies Added

```json
{
  "mongoose": "^latest",
  "bcryptjs": "^latest",
  "dotenv": "^latest"
}
```

## File Structure

```
src/
├── lib/
│   ├── mongodb.js          # MongoDB connection
│   ├── database.js         # Hybrid database helpers
│   ├── supabase.js         # Existing Supabase helpers
│   └── models/             # MongoDB schemas
│       ├── User.js
│       ├── Chat.js
│       ├── Message.js
│       └── TypingStatus.js
└── components/
    └── DatabaseExample.jsx # Testing component
```

## Troubleshooting

### Frontend Issues
1. **Environment Variables**: Ensure `VITE_MONGODB_URI` is set in `.env`
2. **Browser Console**: Check for connection status messages
3. **API Endpoints**: Verify backend server is running (when implemented)

### Backend Integration (When Implemented)
1. **CORS Issues**: Configure CORS for frontend domain
2. **MongoDB Connection**: Check backend MongoDB connection
3. **API Routes**: Verify all endpoints are properly configured

### Compatibility
- ✅ All existing Supabase functionality remains unchanged
- ✅ MongoDB methods are additive, not replacing
- ✅ Graceful fallback when MongoDB API is unavailable

## Support

The system gracefully handles MongoDB unavailability:
- Falls back to Supabase-only mode
- Logs warnings instead of errors
- Maintains full chat functionality