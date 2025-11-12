# Chat Backend API Server

A Node.js/Express server that provides MongoDB integration for the chat system, specifically for managing exchanges and related data.

## Features

- ✅ **MongoDB Integration**: Direct connection to MongoDB Atlas
- ✅ **Exchange Management**: Full CRUD operations for exchanges
- ✅ **Transaction Tracking**: Add and track exchange transactions
- ✅ **Company Filtering**: Filter exchanges by company
- ✅ **CORS Enabled**: Configured for frontend integration
- ✅ **Error Handling**: Comprehensive error handling and logging

## Quick Start

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Environment Setup
Create `.env` file with:
```env
MONGODB_URI=mongodb+srv://zain:FUl4okKUlh3lGGuL@cluster0.jktbexf.mongodb.net/ledger
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Seed Sample Data
```bash
npm run seed
```

### 4. Start Server
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:3001`

## API Endpoints

### Health Check
```
GET /api/health
```
Returns server status and MongoDB connection info.

### Exchanges

#### Get All Exchanges
```
GET /api/exchanges
GET /api/exchanges?companyId=507f1f77bcf86cd799439001
```
Returns list of exchanges with basic info.

#### Get Exchange Details
```
GET /api/exchanges/:id
```
Returns detailed exchange info including transactions.

#### Create Exchange
```
POST /api/exchanges
Content-Type: application/json

{
  "name": "New Exchange",
  "currentAmount": 50000,
  "companyId": "507f1f77bcf86cd799439001"
}
```

#### Update Exchange
```
PUT /api/exchanges/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "currentAmount": 75000
}
```

#### Add Transaction
```
POST /api/exchanges/:id/transactions
Content-Type: application/json

{
  "amount": 25000,
  "performedBy": "507f1f77bcf86cd799439031",
  "performedByName": "Admin User",
  "note": "Monthly funding"
}
```

## Sample Response

### Exchange List
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Binance",
    "currentAmount": 125000.50,
    "companyId": "507f1f77bcf86cd799439001",
    "clientCount": 2
  }
]
```

### Exchange Details
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Binance",
  "currentAmount": 125000.50,
  "companyId": "507f1f77bcf86cd799439001",
  "clients": [...],
  "clientCount": 2,
  "transactions": [
    {
      "type": "ADD_FUNDS",
      "amount": 50000,
      "previousBalance": 75000.50,
      "newBalance": 125000.50,
      "performedBy": "507f1f77bcf86cd799439031",
      "performedByName": "Admin User",
      "note": "Initial funding",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

## Frontend Integration

Update your frontend `.env` file:
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

The frontend will automatically connect to this server for exchange data.

## Scripts

```bash
# Start development server
npm run dev

# Start production server
npm start

# Seed sample data
npm run seed
```

## Project Structure

```
server/
├── config/
│   └── database.js         # MongoDB connection
├── models/
│   └── Exchange.js         # Exchange model
├── routes/
│   └── exchanges.js        # Exchange API routes
├── scripts/
│   └── seedExchanges.js    # Sample data seeder
├── .env                    # Environment variables
├── package.json            # Dependencies and scripts
├── server.js              # Main server file
└── README.md              # This file
```

## Development

### Adding New Models
1. Create model in `models/` directory
2. Create routes in `routes/` directory
3. Add routes to `server.js`

### Database Schema
The Exchange model matches the TypeScript interface provided:
- `name`: String (required)
- `currentAmount`: Number (default: 0)
- `companyId`: ObjectId reference
- `clients`: Array of ObjectId references
- `transactions`: Array of transaction objects

### Error Handling
- All routes have try-catch error handling
- Detailed error messages in development
- Generic error messages in production
- MongoDB connection errors are handled gracefully

## Production Deployment

1. Set `NODE_ENV=production`
2. Use process manager (PM2, etc.)
3. Set up reverse proxy (Nginx)
4. Configure proper CORS origins
5. Add authentication middleware
6. Set up logging and monitoring

## Security Notes

⚠️ **Current Implementation**: No authentication for demo purposes
🔒 **Production**: Add JWT authentication, rate limiting, input validation

## Troubleshooting

### MongoDB Connection Issues
- Check MongoDB URI in `.env`
- Verify network connectivity
- Check MongoDB Atlas IP whitelist

### CORS Issues
- Verify `FRONTEND_URL` in `.env`
- Check browser console for CORS errors

### Port Conflicts
- Change `PORT` in `.env`
- Update frontend `VITE_API_BASE_URL`