#!/bin/bash

# Simple BBExch.net Deployment Script
# Run this if you want to deploy step by step

echo "🚀 BBExch.net Simple Deployment"
echo "================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Step 1: Install Node.js 22 (required for Vite)
print_step "1. Installing Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# Step 2: Install global packages
print_step "2. Installing global packages..."
npm install -g pm2 serve

# Step 3: Install project dependencies
print_step "3. Installing project dependencies..."
npm install
cd server && npm install && cd ..

# Step 4: Build frontend
print_step "4. Building frontend..."
npm run build

# Step 5: Create logs directory
print_step "5. Creating logs directory..."
mkdir -p logs

# Step 6: Install and configure Nginx
print_step "6. Installing and configuring Nginx..."
apt install -y nginx
cp nginx.conf /etc/nginx/sites-available/bbexch.net
ln -sf /etc/nginx/sites-available/bbexch.net /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t

# Step 7: Install SSL certificate
print_step "7. Installing SSL certificate..."
apt install -y certbot python3-certbot-nginx

print_info "Getting SSL certificate for bbexch.net..."
print_info "Make sure your DNS records are pointing to this server!"
certbot --nginx -d bbexch.net -d www.bbexch.net -d api.bbexch.net --non-interactive --agree-tos --email admin@bbexch.net

# Step 8: Start applications
print_step "8. Starting applications with PM2..."
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Step 9: Configure firewall
print_step "9. Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp  
ufw allow 443/tcp
ufw --force enable

# Step 10: Restart services
print_step "10. Restarting services..."
systemctl restart nginx
systemctl enable nginx

echo ""
echo "✅ Deployment completed!"
echo "🌐 Your application should be available at:"
echo "   Frontend: https://bbexch.net"
echo "   API: https://api.bbexch.net"
echo ""
echo "📊 Check status with:"
echo "   pm2 status"
echo "   pm2 logs"
echo "   systemctl status nginx"