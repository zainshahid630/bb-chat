# 💼 Business Chat System

A secure, web-based chat system to replace WhatsApp for managing business operations.

## ✨ Features

### For Clients
- ✅ **Secure Authentication** - Username/password login (no phone numbers!)
- ✅ **4 Departments** - Deposit, Withdraw, New User ID, Complaint
- ✅ **Rich Messaging** - Text, images, files, and voice messages
- ✅ **Real-time Chat** - Instant message delivery
- ✅ **Chat History** - All conversations saved

### For Admins
- ✅ **Admin Dashboard** - View all customer chats
- ✅ **Department Filtering** - Filter by department or status
- ✅ **Real-time Updates** - See new messages instantly
- ✅ **Chat Management** - Close/resolve conversations
- ✅ **Multi-department Support** - Handle all departments from one panel

## 🔒 Why This is Better Than WhatsApp

| Feature | WhatsApp | This System |
|---------|----------|-------------|
| **Phone Number** | Required & Exposed | Not needed |
| **Ban Risk** | High (can lose account) | None (you control it) |
| **Authentication** | Phone-based | Secure username/password |
| **Organization** | Manual groups | Auto-routed departments |
| **Professional** | Personal app | Business platform |
| **Data Control** | WhatsApp owns it | You own everything |

## 🚀 Quick Start

### 1. Upgrade Node.js (REQUIRED)

Your current Node.js (18.16.0) is too old. Upgrade to 20+:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
# Close and reopen terminal
nvm install 20
nvm use 20
```

### 2. Install Dependencies

```bash
cd betting-chat-system
npm install @supabase/supabase-js
```

### 3. Set Up Supabase

1. Go to https://supabase.com
2. Create new project
3. Run SQL scripts (see SETUP_GUIDE.md)

### 4. Configure

```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 5. Run

```bash
npm run dev
```

## 📚 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup
- **[INSTALLATION.md](./INSTALLATION.md)** - Step-by-step guide

## 🏗️ Tech Stack

- React + Vite
- Supabase (PostgreSQL + Real-time + Storage)
- Custom CSS

## 📝 Project Structure

```
src/
├── components/
│   ├── Login.jsx          # Login/Register
│   ├── DepartmentSelect.jsx  # 4 department buttons
│   ├── ChatInterface.jsx  # Chat UI
│   └── AdminPanel.jsx     # Admin dashboard
├── lib/
│   └── supabase.js        # Supabase helpers
└── App.jsx                # Main app
```

---

**Need Help?** Check SETUP_GUIDE.md and INSTALLATION.md
