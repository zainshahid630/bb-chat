# Installation Instructions

## Prerequisites

You need Node.js version 20 or higher. Your current version (18.16.0) is too old.

### Upgrade Node.js

```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Close and reopen your terminal, then:
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version  # Should show v20.x.x
```

## Step 1: Install Dependencies

```bash
cd Businesss-chat-system
npm install @supabase/supabase-js
```

## Step 2: Set Up Supabase

1. Go to https://supabase.com and create a free account
2. Create a new project
3. Wait for the project to be ready (takes ~2 minutes)
4. Go to Project Settings → API
5. Copy your:
   - Project URL
   - Anon/Public Key

## Step 3: Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your Supabase credentials
# Use any text editor:
nano .env
# or
code .env
```

Replace the values with your actual Supabase URL and key.

## Step 4: Set Up Database

1. Go to your Supabase project
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the SQL from `SETUP_GUIDE.md` (Step 2)
5. Click "Run" to execute

## Step 5: Create Admin User

In Supabase SQL Editor, run:

```sql
-- Replace 'admin' and 'your_password' with your desired credentials
INSERT INTO users (username, password_hash, is_admin) 
VALUES ('admin', crypt('your_password', gen_salt('bf')), TRUE);
```

**Important**: Remember these credentials - you'll need them to access the admin panel!

## Step 6: Run the Application

```bash
npm run dev
```

Visit: http://localhost:5173

## Testing

### Test as Client:
1. Click "Register" and create a new account
2. Login with your credentials
3. Click on any department (Deposit, Withdraw, etc.)
4. Send a test message

### Test as Admin:
1. Logout from client account
2. Login with admin credentials
3. You should see the admin panel
4. Click on the chat you created
5. Reply to the message

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure you created the `.env` file
- Check that the values are correct (no quotes needed)
- Restart the dev server after changing `.env`

### "Failed to create chat"
- Check that you ran all the SQL scripts
- Verify Row Level Security policies are set up
- Check Supabase logs for errors

### "Cannot access microphone"
- Allow microphone permissions in your browser
- Voice messages only work on HTTPS or localhost

### Dev server won't start
- Make sure you upgraded to Node.js 20+
- Delete `node_modules` and run `npm install` again
- Check for port conflicts (default is 5173)

## Deployment

When ready to deploy:

```bash
npm run build
```

Deploy the `dist` folder to:
- **Vercel** (recommended): https://vercel.com
- **Netlify**: https://netlify.com
- **Your own server**

### Environment Variables in Production

Don't forget to add your environment variables in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Security Notes

1. **Never commit `.env` file** - it's already in `.gitignore`
2. **Use strong passwords** for admin accounts
3. **Enable 2FA** on your Supabase account
4. **Regularly backup** your database
5. **Monitor usage** to prevent abuse

## Support

If you encounter issues:
1. Check browser console for errors (F12)
2. Check Supabase logs
3. Verify all SQL scripts ran successfully
4. Make sure environment variables are set correctly

