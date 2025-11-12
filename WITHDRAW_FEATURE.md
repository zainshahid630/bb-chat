# Withdrawal Management Feature

## Overview

Added a comprehensive withdrawal creation form that appears on the right side when an admin opens a chat from the "Withdraw" department. This feature allows admins to quickly create withdrawals for clients directly from withdrawal-related conversations.

## Features

### ✅ Withdrawal Form Components

1. **Date Field**
   - Auto-populated with today's date
   - Previous dates not allowed (validation)
   - Required field

2. **Bank Selection**
   - Dropdown with Pakistani banks
   - Options: HBL, UBL, MCB, Allied, NBP, JS Bank, Meezan, Askari
   - Required field

3. **Client ID Search**
   - Smart search and select dropdown
   - Search by username, client ID, or phone number
   - Auto-populated from selected chat user
   - Required field

4. **Exchange Selection**
   - Dropdown with popular exchanges
   - Options: Binance, Bybit, OKX, KuCoin, Gate.io, Huobi, Coinbase, Kraken
   - Required field

5. **Amount Input**
   - PKR currency
   - Minimum value validation (> 0)
   - Decimal support
   - Required field
   - **No Bonus Amount** (key difference from Deposit form)

6. **Reference Number**
   - Optional text field
   - For transaction references

7. **Create Button**
   - Validates all required fields
   - Shows loading state
   - Creates withdrawal record

## Key Differences from Deposit Form

### ❌ **Removed Fields**
- **Bonus Amount**: Not applicable for withdrawals

### 🎨 **Visual Differences**
- **Color Scheme**: Red gradient (vs green for deposits)
- **Icon**: 💸 (vs 💰 for deposits)
- **Button Text**: "Create Withdrawal" (vs "Create Deposit")

### 🔧 **Functional Differences**
- **API Endpoints**: Uses `/api/withdrawals` endpoints
- **Database Model**: Uses `Withdrawal` schema (no bonus_amount field)
- **Validation**: No bonus amount validation needed

## User Interface

### Layout
- **Position**: Right side panel when withdraw chat is open
- **Width**: 350px (responsive)
- **Height**: Full viewport height
- **Scroll**: Vertical scroll for overflow

### Design
- **Header**: Red gradient with withdrawal icon
- **Form**: Clean, organized form fields (one less field than deposit)
- **Validation**: Real-time field validation
- **Responsive**: Mobile-friendly design

### Interactions
- **Auto-show**: Appears when withdraw department chat is selected
- **Auto-fill**: Client info from selected chat
- **Search**: Live client search with dropdown
- **Validation**: Form validation before submit

## Technical Implementation

### Frontend Components
```
src/components/
├── WithdrawForm.jsx     # Main withdrawal form component
├── WithdrawForm.css     # Styling for withdrawal form
└── AdminPanel.jsx       # Updated to include withdrawal form
```

### Database Models
```
src/lib/models/
└── Withdrawal.js        # MongoDB schema for withdrawals
```

### API Integration
```
src/lib/database.js      # Withdrawal helpers for API calls
```

### Features
- **MongoDB Ready**: Schema and API helpers prepared
- **Validation**: Client-side and server-side validation
- **Responsive**: Works on all screen sizes
- **Accessible**: Proper labels and keyboard navigation

## Usage

### For Admins
1. Open any chat from "Withdraw" department in admin panel
2. Withdrawal form automatically appears on right side
3. Fill in the withdrawal form (client auto-selected)
4. Click "Create Withdrawal" to submit

### Form Validation
- **Date**: Must be today or future date
- **Bank**: Must select from dropdown
- **Client**: Must search and select valid client
- **Exchange**: Must select from dropdown
- **Amount**: Must be positive number
- **Reference**: Optional field

## Database Schema

### Withdrawal Model
```javascript
{
  date: Date,              // Withdrawal date (required)
  bank: String,            // Bank code (required)
  client_id: ObjectId,     // Reference to User (required)
  exchange: String,        // Exchange code (required)
  amount: Number,          // Withdrawal amount (required)
  reference_no: String,    // Reference number (optional)
  status: String,          // pending/approved/rejected/processing
  created_by: ObjectId,    // Admin who created (required)
  approved_by: ObjectId,   // Admin who approved (optional)
  approved_at: Date,       // Approval timestamp (optional)
  notes: String,           // Additional notes (optional)
  created_at: Date,        // Creation timestamp
  updated_at: Date         // Last update timestamp
}
```

### Key Differences from Deposit Schema
- **No bonus_amount field**
- **Same validation and structure otherwise**

### Indexes
- `client_id + created_at` (compound)
- `status`
- `bank`
- `exchange`
- `date`
- `created_by`

## API Endpoints (Backend Implementation)

### Create Withdrawal
```
POST /api/withdrawals
Body: {
  date, bank, client_id, exchange, 
  amount, reference_no
}
```

### Get Withdrawals
```
GET /api/withdrawals?status=pending&client_id=123
```

### Update Status
```
PATCH /api/withdrawals/:id/status
Body: { status, notes }
```

## Conditional Display Logic

### Show Withdrawal Form When:
1. ✅ Admin has selected a chat
2. ✅ Chat department is "withdraw"
3. ✅ Chat is open in admin panel

### Hide Withdrawal Form When:
- ❌ No chat selected
- ❌ Chat is from different department (deposit, new_id, complaint)
- ❌ User management tab is active

## Responsive Design

### Desktop (>1200px)
- Form width: 350px
- Full feature set
- Side-by-side with chat

### Tablet (768px - 1200px)
- Form width: 300px
- Compact spacing
- Overlay on smaller screens

### Mobile (<768px)
- Full-width at bottom
- Touch-friendly inputs
- Optimized for mobile use

## Integration with Existing System

### Seamless Integration
- **Same Architecture**: Follows deposit form pattern
- **Consistent UI**: Matches admin panel design
- **Shared Components**: Uses same client search logic
- **Responsive**: Works with existing mobile layout

### Department-Specific Forms
- **Deposit Department**: Shows green deposit form
- **Withdraw Department**: Shows red withdrawal form
- **Other Departments**: No form shown
- **User Management**: No forms shown

## Future Enhancements

### Phase 2 Features
1. **Withdrawal History**: View all withdrawals for a client
2. **Status Updates**: Approve/reject withdrawals
3. **Bulk Operations**: Handle multiple withdrawals
4. **Reports**: Generate withdrawal reports
5. **Notifications**: Real-time withdrawal alerts

### Integration Points
1. **Chat Integration**: Link withdrawals to chat messages
2. **User Profiles**: Show withdrawal history in user profiles
3. **Dashboard**: Withdrawal analytics and summaries
4. **Audit Trail**: Track all withdrawal changes

## Security Considerations

### Validation
- Server-side validation for all fields
- Amount limits and business rules
- User permission checks
- No bonus amount manipulation

### Audit Trail
- Track who created each withdrawal
- Log all status changes
- Maintain approval history

### Access Control
- Admin-only feature
- Role-based permissions
- Secure API endpoints

## Testing

### Manual Testing
1. Form validation (required fields)
2. Date restrictions (no past dates)
3. Amount validation (positive numbers)
4. Client search functionality
5. Responsive design on all devices
6. Department-specific display logic

### Integration Testing
1. Chat integration
2. Database operations
3. API error handling
4. Real-time updates
5. Form switching between departments

## Deployment Notes

### Environment Variables
```env
VITE_MONGODB_URI=mongodb://...
VITE_API_BASE_URL=http://localhost:3001/api
```

### Dependencies
- No additional frontend dependencies
- Backend requires MongoDB and Mongoose
- API server for full functionality

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design for all screen sizes