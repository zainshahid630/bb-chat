#!/bin/bash

# BBExch.net Deployment Script
# Run this script on your server to deploy the application

echo "🚀 Starting BBExch.net Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root and warn (but allow)
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. This is not recommended for production."
    print_warning "Consider creating a non-root user for better security."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled."
        exit 1
    fi
fi

# Update system packages
print_status "Updating system packages..."
if [ "$EUID" -eq 0 ]; then
    apt update && apt upgrade -y
else
    sudo apt update && sudo apt upgrade -y
fi

# Install Node.js 22 (required for Vite)
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    if [ "$EUID" -eq 0 ]; then
        apt-get install -y nodejs
    else
        sudo apt-get install -y nodejs
    fi
else
    # Check if Node.js version is compatible
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        print_warning "Node.js version $NODE_VERSION detected. Vite requires Node.js 20+. Upgrading..."
        curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
        if [ "$EUID" -eq 0 ]; then
            apt-get install -y nodejs
        else
            sudo apt-get install -y nodejs
        fi
    fi
fi

# Install PM2 globally (if not installed)
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    if [ "$EUID" -eq 0 ]; then
        npm install -g pm2
    else
        sudo npm install -g pm2
    fi
fi

# Install serve globally for frontend (if not installed)
if ! command -v serve &> /dev/null; then
    print_status "Installing serve..."
    if [ "$EUID" -eq 0 ]; then
        npm install -g serve
    else
        sudo npm install -g serve
    fi
fi

# Install Nginx (if not installed)
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    if [ "$EUID" -eq 0 ]; then
        apt install -y nginx
    else
        sudo apt install -y nginx
    fi
fi

# Create logs directory
print_status "Creating logs directory..."
mkdir -p logs

# Install dependencies
print_status "Installing frontend dependencies..."
npm install

print_status "Installing backend dependencies..."
cd server && npm install && cd ..

# Build frontend
print_status "Building frontend for production..."
npm run build

# Update backend server.js to use port 3003
print_status "Updating backend port configuration..."
sed -i 's/const PORT = process.env.PORT || 3001/const PORT = process.env.PORT || 3003/g' server/server.js

# Setup Nginx configuration
print_status "Setting up Nginx configuration..."
if [ "$EUID" -eq 0 ]; then
    cp nginx.conf /etc/nginx/sites-available/bbexch.net
    ln -sf /etc/nginx/sites-available/bbexch.net /etc/nginx/sites-enabled/
    nginx -t
else
    sudo cp nginx.conf /etc/nginx/sites-available/bbexch.net
    sudo ln -sf /etc/nginx/sites-available/bbexch.net /etc/nginx/sites-enabled/
    sudo nginx -t
fi

# Install SSL certificate with Let's Encrypt
print_status "Setting up SSL certificate..."
if ! command -v certbot &> /dev/null; then
    if [ "$EUID" -eq 0 ]; then
        apt install -y certbot python3-certbot-nginx
    else
        sudo apt install -y certbot python3-certbot-nginx
    fi
fi

# Get SSL certificate
print_status "Getting SSL certificate for bbexch.net..."
if [ "$EUID" -eq 0 ]; then
    certbot --nginx -d bbexch.net -d www.bbexch.net -d api.bbexch.net --non-interactive --agree-tos --email admin@bbexch.net
else
    sudo certbot --nginx -d bbexch.net -d www.bbexch.net -d api.bbexch.net --non-interactive --agree-tos --email admin@bbexch.net
fi

# Start applications with PM2
print_status "Starting applications with PM2..."
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Restart Nginx
print_status "Restarting Nginx..."
if [ "$EUID" -eq 0 ]; then
    systemctl restart nginx
else
    sudo systemctl restart nginx
fi

# Setup firewall
print_status "Configuring firewall..."
if [ "$EUID" -eq 0 ]; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
else
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
fi

print_status "✅ Deployment completed successfully!"
print_status "🌐 Your application is now available at:"
print_status "   Frontend: https://bbexch.net"
print_status "   API: https://api.bbexch.net"
print_status ""
print_status "📊 To monitor your applications:"
print_status "   pm2 status"
print_status "   pm2 logs"
print_status "   pm2 monit"
print_status ""
print_warning "⚠️  Make sure to:"
print_warning "   1. Update your DNS records to point to this server"
print_warning "   2. Update your .env file with production values"
print_warning "   3. Test all functionality after deployment"