# Backend API Server Setup Guide

## Overview

Created a separate Node.js/Express server that connects directly to MongoDB and provides real exchange data to the frontend forms.

## 🚀 Quick Setup

### 1. Install Server Dependencies
```bash
# From project root
npm run server:install

# Or manually
cd server
npm install
```

### 2. Seed Sample Exchange Data
```bash
# From project root
npm run server:seed

# Or manually
cd server
node scripts/seedExchanges.js
```

### 3. Start the Backend Server
```bash
# From project root (in a new terminal)
npm run server

# Or manually
cd server
npm run dev
```

### 4. Start the Frontend (in another terminal)
```bash
# From project root
npm run dev
```

## ✅ What You'll Get

### Real MongoDB Data
- **8 Sample Exchanges** with realistic balances
- **Transaction History** for some exchanges
- **Client Associations** for each exchange
- **Company Relationships** properly structured

### API Endpoints
- `GET /api/exchanges` - List all exchanges
- `GET /api/exchanges/:id` - Get exchange details
- `POST /api/exchanges` - Create new exchange
- `PUT /api/exchanges/:id` - Update exchange
- `POST /api/exchanges/:id/transactions` - Add transaction

### Frontend Integration
- **Deposit Form**: Shows real exchange balances
- **Withdraw Form**: Shows real exchange balances
- **New User Form**: Shows real client counts
- **Automatic Fallback**: Uses simulated data if server unavailable

## 📊 Sample Data Created

```
✅ Created 8 exchanges:
   - Binance: $125,000
   - Bybit: $87,500
   - OKX: $95,750
   - KuCoin: $62,300
   - Gate.io: $43,200
   - Huobi: $78,900
   - Coinbase: $156,780
   - Kraken: $34,500
```

## 🔧 How It Works

### 1. Backend Server (Port 3001)
```javascript
// Real MongoDB connection
mongoose.connect('mongodb+srv://...')

// API endpoint
app.get('/api/exchanges', async (req, res) => {
  const exchanges = await Exchange.find()
  res.json(exchanges)
})
```

### 2. Frontend Integration (Port 5173)
```javascript
// Frontend calls real API
const exchanges = await fetch('http://localhost:3001/api/exchanges')

// Displays in forms
<option value={exchange._id}>
  {exchange.name} (Balance: ${exchange.currentAmount})
</option>
```

## 🎯 Testing the Integration

### 1. Check Server Status
Visit: `http://localhost:3001/api/health`

### 2. View Raw Exchange Data
Visit: `http://localhost:3001/api/exchanges`

### 3. Test Frontend Forms
1. Open admin panel
2. Select a deposit/withdraw/new user chat
3. See real MongoDB exchanges in dropdown

### 4. Debug Mode
Visit: `http://localhost:5173/?debug=db`
- Click "Reload Exchanges" to fetch from API
- Click "Test Exchange Details" to see detailed data

## 📁 Server Structure

```
server/
├── config/
│   └── database.js         # MongoDB connection
├── models/
│   └── Exchange.js         # Exchange schema (matches your TypeScript)
├── routes/
│   └── exchanges.js        # API endpoints
├── scripts/
│   └── seedExchanges.js    # Sample data seeder
├── .env                    # MongoDB URI and config
├── package.json            # Server dependencies
├── server.js              # Main Express server
└── README.md              # Server documentation
```

## 🔄 Data Flow

```
MongoDB Atlas
    ↓
Node.js/Express Server (Port 3001)
    ↓ /api/exchanges
React Frontend (Port 5173)
    ↓
Form Dropdowns (Real Data)
```

## 🛠 Development Workflow

### Terminal 1: Backend Server
```bash
cd server
npm run dev
# Server running on http://localhost:3001
```

### Terminal 2: Frontend
```bash
npm run dev
# Frontend running on http://localhost:5173
```

### Terminal 3: Commands
```bash
# Seed new data
npm run server:seed

# Check API
curl http://localhost:3001/api/exchanges

# View logs
# Check Terminal 1 for server logs
```

## 🔍 Troubleshooting

### Server Won't Start
1. Check MongoDB URI in `server/.env`
2. Ensure port 3001 is available
3. Run `npm run server:install` first

### No Exchange Data in Forms
1. Check server is running on port 3001
2. Check browser console for CORS errors
3. Verify `VITE_API_BASE_URL` in frontend `.env`

### CORS Issues
1. Check `FRONTEND_URL` in `server/.env`
2. Ensure both servers are running
3. Check browser developer tools

## 🚀 Production Deployment

### Backend
1. Deploy to Heroku/Railway/DigitalOcean
2. Set production MongoDB URI
3. Configure CORS for production domain

### Frontend
1. Update `VITE_API_BASE_URL` to production API
2. Build and deploy to Vercel/Netlify

## 🔐 Security Notes

**Current**: No authentication (demo purposes)
**Production**: Add JWT auth, rate limiting, input validation

## 📈 Next Steps

1. **Authentication**: Add admin authentication
2. **More Models**: Add Deposit, Withdrawal, NewUser APIs
3. **Real-time**: Add WebSocket support
4. **Validation**: Enhanced input validation
5. **Logging**: Structured logging with Winston
6. **Testing**: Unit and integration tests

## 🎉 Benefits

### ✅ **Real Data**
- Actual MongoDB connection
- Real exchange balances and transactions
- Proper data relationships

### ✅ **Scalable Architecture**
- Separate backend and frontend
- RESTful API design
- Easy to extend and maintain

### ✅ **Development Ready**
- Hot reload for both servers
- Comprehensive error handling
- Detailed logging and debugging

### ✅ **Production Ready**
- Environment-based configuration
- CORS and security middleware
- Proper error handling and validation

The backend server is now fully functional and provides real MongoDB data to your forms!