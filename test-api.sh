#!/bin/bash

echo "🔍 Testing API Connection..."
echo ""

# Test 1: Check if backend is running locally
echo "1️⃣ Testing local backend (localhost:3003)..."
curl -s http://localhost:3003/api/health | jq . || echo "❌ Backend not responding on localhost:3003"
echo ""

# Test 2: Check if nginx is running
echo "2️⃣ Checking nginx status..."
sudo systemctl status nginx --no-pager | grep "Active:" || echo "❌ Cannot check nginx status"
echo ""

# Test 3: Test API endpoint through nginx
echo "3️⃣ Testing API through nginx (api.bbexch.net)..."
curl -s https://api.bbexch.net/api/health | jq . || echo "❌ API not responding through nginx"
echo ""

# Test 4: Test banks endpoint
echo "4️⃣ Testing banks endpoint..."
curl -s "https://api.bbexch.net/api/banks" | jq . || echo "❌ Banks endpoint not responding"
echo ""

# Test 5: Check CORS headers
echo "5️⃣ Checking CORS headers..."
curl -I -X OPTIONS https://api.bbexch.net/api/banks \
  -H "Origin: https://bbexch.net" \
  -H "Access-Control-Request-Method: GET" || echo "❌ CORS preflight failed"
echo ""

echo "✅ Diagnostic complete!"
