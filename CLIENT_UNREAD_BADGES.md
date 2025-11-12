# ✅ Client Unread Message Badges

## 🎯 **Feature Added**

Clients now see **unread message count badges** on department buttons when they have new messages from the admin!

---

## 🚨 **The Problem**

**Before:**
```
Client logs out and comes back later
↓
Admin sent 3 messages while client was away
↓
Client sees department buttons (no indication of new messages)
↓
Client doesn't know admin replied ❌
```

**Issues:**
- ❌ No way to know if admin replied
- ❌ Client might miss important messages
- ❌ Have to open each department to check
- ❌ Poor user experience

---

## ✅ **The Solution**

**After:**
```
Client logs out and comes back later
↓
Admin sent 3 messages in Deposit chat
↓
Client sees: Deposit button with red badge "3"
↓
Client knows admin replied! ✅
↓
Opens Deposit chat immediately
```

**Benefits:**
- ✅ Clear visual indication of new messages
- ✅ Shows count per department
- ✅ Red badge with pulse animation
- ✅ Real-time updates
- ✅ Never miss admin replies

---

## 🎨 **Visual Design**

### **Department Selection Screen:**

```
┌──────────────────────────────────────────────┐
│  Welcome, john123! 👋                        │
│  How can we help you today?                  │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─────────────┐  ┌─────────────┐          │
│  │   💰  3     │  │   💸        │          │
│  │   ↑         │  │             │          │
│  │   └─ Badge  │  │             │          │
│  │  Deposit    │  │  Withdraw   │          │
│  │  Add funds  │  │  Withdraw   │          │
│  └─────────────┘  └─────────────┘          │
│                                              │
│  ┌─────────────┐  ┌─────────────┐          │
│  │   🆔        │  │   ⚠️  1     │          │
│  │             │  │   ↑         │          │
│  │             │  │   └─ Badge  │          │
│  │  New ID     │  │  Complaint  │          │
│  │  Create ID  │  │  Report     │          │
│  └─────────────┘  └─────────────┘          │
└──────────────────────────────────────────────┘
```

**Badge Position:**
- Top-right corner of department icon
- Red background (`#ef4444`)
- White text
- Pulse animation

---

## 🔧 **Implementation**

### **1. Updated `src/components/DepartmentSelect.jsx`:**

#### **Added State:**

```jsx
const [unreadCounts, setUnreadCounts] = useState({})
```

#### **Load Unread Counts:**

```jsx
useEffect(() => {
  loadUnreadCounts()

  // Subscribe to message changes for real-time updates
  const subscription = supabase
    .channel('client-unread-counts')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'messages',
    }, () => {
      loadUnreadCounts()
    })
    .subscribe()

  return () => subscription.unsubscribe()
}, [user.id])

const loadUnreadCounts = async () => {
  // Get all chats for this user
  const { data: chats } = await supabase
    .from('chats')
    .select(`
      id,
      department,
      messages (
        id,
        sender_type,
        status
      )
    `)
    .eq('user_id', user.id)

  // Calculate unread counts per department
  const counts = {}
  chats?.forEach(chat => {
    const unreadCount = chat.messages?.filter(
      msg => msg.sender_type === 'admin' && msg.status !== 'read'
    ).length || 0

    if (unreadCount > 0) {
      counts[chat.department] = (counts[chat.department] || 0) + unreadCount
    }
  })

  setUnreadCounts(counts)
}
```

**Logic:**
1. Load all user's chats
2. For each chat, count admin messages that are not read
3. Group counts by department
4. Update state

#### **Display Badge:**

```jsx
<div className="department-icon">
  {dept.icon}
  {unreadCounts[dept.id] > 0 && (
    <span className="dept-unread-badge">{unreadCounts[dept.id]}</span>
  )}
</div>
```

---

### **2. Updated `src/components/DepartmentSelect.css`:**

```css
.department-icon {
  font-size: 60px;
  margin-bottom: 20px;
  position: relative;
  display: inline-block;
}

.dept-unread-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  background: #ef4444;
  color: white;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  animation: pulse-badge 2s infinite;
}

@keyframes pulse-badge {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.9;
  }
}
```

**Features:**
- Positioned absolutely in top-right corner
- Red background for urgency
- Pulse animation to grab attention
- Box shadow for depth
- Scales slightly on pulse

---

## 📊 **How It Works**

### **Calculation:**

```javascript
// For each department:
unreadCount = messages.filter(
  msg => msg.sender_type === 'admin' && msg.status !== 'read'
).length
```

**Counts:**
- ✅ Messages from admin
- ✅ Messages not marked as read
- ❌ Excludes client's own messages
- ❌ Excludes already-read messages

### **Real-time Updates:**

The badge updates automatically when:
- ✅ Admin sends a new message
- ✅ Client reads a message (badge decreases)
- ✅ Message status changes
- ✅ New chat is created

**Technology:** Supabase real-time subscriptions

---

## 🎯 **Use Cases**

### **Scenario 1: Admin Replies While Client is Away**

```
1. Client asks about deposit in Deposit chat
2. Client logs out
3. Admin replies: "Send to account 123456"
4. Client logs back in
5. Sees: Deposit button with badge "1"
6. Opens Deposit chat
7. Reads admin's reply ✅
```

### **Scenario 2: Multiple Messages**

```
1. Client has open chats in Deposit and Complaint
2. Client logs out
3. Admin sends 3 messages in Deposit
4. Admin sends 1 message in Complaint
5. Client logs back in
6. Sees:
   - Deposit button: badge "3"
   - Complaint button: badge "1"
7. Opens both chats to read ✅
```

### **Scenario 3: Reading Messages**

```
1. Client sees Deposit badge "3"
2. Opens Deposit chat
3. Reads all 3 messages
4. Goes back to department selection
5. Badge disappears (all read) ✅
```

---

## 💡 **Benefits**

### **For Clients:**

1. **Never Miss Messages** - Clear visual indication
2. **Know Where to Look** - Badge shows which department
3. **See Message Count** - Know how many unread
4. **Real-time Updates** - Always accurate
5. **Better Experience** - No need to check each department

### **For Admins:**

1. **Faster Responses** - Clients see replies immediately
2. **Better Communication** - Clients don't miss messages
3. **Professional** - Shows attention to detail

### **For Business:**

1. **Better Customer Service** - Clients stay informed
2. **Faster Resolution** - Clients respond quicker
3. **Higher Satisfaction** - No missed messages
4. **Professional Image** - Modern, polished UI

---

## 🎨 **Visual Examples**

### **Example 1: Single Unread in Deposit**

```
┌─────────────┐
│   💰  1     │  ← Red badge with "1"
│             │
│  Deposit    │
│  Add funds  │
└─────────────┘
```

### **Example 2: Multiple Unread in Complaint**

```
┌─────────────┐
│   ⚠️  5     │  ← Red badge with "5"
│             │
│  Complaint  │
│  Report     │
└─────────────┘
```

### **Example 3: No Unread Messages**

```
┌─────────────┐
│   💸        │  ← No badge (clean)
│             │
│  Withdraw   │
│  Withdraw   │
└─────────────┘
```

---

## 📊 **Before vs After**

### **❌ Before:**

```
Client logs in
↓
Sees 4 department buttons (no indication)
↓
Doesn't know if admin replied
↓
Has to open each department to check
↓
Might miss important messages ❌
```

### **✅ After:**

```
Client logs in
↓
Sees Deposit button with badge "3"
↓
Knows admin sent 3 messages
↓
Opens Deposit chat immediately
↓
Reads all messages ✅
```

---

## 🔄 **Real-time Flow**

```
1. Client is on department selection screen
   ↓
2. Admin sends message in Deposit chat
   ↓
3. Real-time subscription triggers
   ↓
4. loadUnreadCounts() is called
   ↓
5. Badge appears on Deposit button: "1"
   ↓
6. Client sees badge immediately ✅
```

**No refresh needed!**

---

## 🧪 **Testing**

### **Test Case 1: Admin Sends Message**

1. Login as client (john123)
2. Go to department selection
3. **In another browser:** Login as admin
4. Admin sends message to john123 in Deposit chat
5. **Back to client browser:** Badge appears on Deposit button ✅

### **Test Case 2: Multiple Messages**

1. Login as client
2. Admin sends 3 messages in Deposit
3. Admin sends 2 messages in Withdraw
4. Client sees:
   - Deposit badge: "3"
   - Withdraw badge: "2"

### **Test Case 3: Reading Messages**

1. Client sees Deposit badge "3"
2. Opens Deposit chat
3. Reads all messages
4. Goes back to department selection
5. Badge disappears ✅

---

## 📝 **Files Modified**

### **1. `src/components/DepartmentSelect.jsx`**

**Added:**
- `unreadCounts` state
- `loadUnreadCounts()` function
- Real-time subscription to messages
- Badge display in department icon

### **2. `src/components/DepartmentSelect.css`**

**Added:**
- `.dept-unread-badge` styles
- Pulse animation
- Positioning styles

---

## 📋 **Summary**

| Feature | Status |
|---------|--------|
| Unread badges on department buttons | ✅ Done |
| Count per department | ✅ Done |
| Real-time updates | ✅ Done |
| Pulse animation | ✅ Done |
| Red color for urgency | ✅ Done |
| Badge disappears when read | ✅ Done |

---

## 🎉 **Result**

Clients now see **unread message count badges** on department buttons!

### **Benefits:**

- ✅ Never miss admin replies
- ✅ Know which department has messages
- ✅ See exact count of unread messages
- ✅ Real-time updates
- ✅ Eye-catching red badge with animation

---

## 🚀 **Ready to Use!**

The badges are now live and will:
1. Show unread count on department buttons
2. Update in real-time as admin sends messages
3. Pulse to grab attention
4. Disappear when all messages are read

**Perfect for keeping clients informed!** 🎯

