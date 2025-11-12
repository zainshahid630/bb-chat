#!/bin/bash

# Complete APK Build Script for Betting Chat System
# This script will build a complete Android APK from your web app

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   🚀 Betting Chat System - Android APK Builder${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check Node.js
echo -e "${YELLOW}Checking prerequisites...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 20+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"
echo ""

# Step 1: Install dependencies
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📦 Step 1/5: Installing dependencies...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 2: Build web application
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🔨 Step 2/5: Building web application...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
npm run build
echo -e "${GREEN}✅ Web app built successfully${NC}"
echo ""

# Step 3: Add or sync Android platform
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📱 Step 3/5: Setting up Android platform...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -d "android" ]; then
    echo "Android folder exists, syncing..."
    npx cap sync android
    echo -e "${GREEN}✅ Android platform synced${NC}"
else
    echo "Adding Android platform..."
    npx cap add android
    echo -e "${GREEN}✅ Android platform added${NC}"
fi
echo ""

# Step 4: Sync web assets
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🔄 Step 4/5: Syncing web assets to Android...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
npx cap sync android
echo -e "${GREEN}✅ Assets synced${NC}"
echo ""

# Step 5: Build APK
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🏗️  Step 5/5: Building Android APK...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check if gradlew exists
if [ ! -f "android/gradlew" ]; then
    echo -e "${RED}❌ Gradle wrapper not found${NC}"
    echo "Please ensure Android platform was added correctly"
    exit 1
fi

# Make gradlew executable
chmod +x android/gradlew

# Build the APK
cd android
./gradlew assembleDebug
cd ..

echo -e "${GREEN}✅ APK built successfully!${NC}"
echo ""

# Success message
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   ✅ BUILD COMPLETE!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📱 Your APK is ready!${NC}"
echo ""
echo -e "${YELLOW}📍 APK Location:${NC}"
echo "   android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo -e "${YELLOW}📲 To install on your Android device:${NC}"
echo "   1. Copy the APK file to your phone"
echo "   2. Tap the file to install"
echo "   3. Enable 'Install from Unknown Sources' if prompted"
echo ""
echo -e "${YELLOW}🔌 Or install via USB:${NC}"
echo "   adb install android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo -e "${YELLOW}🔄 To rebuild after changes:${NC}"
echo "   npm run build && npx cap sync android && cd android && ./gradlew assembleDebug"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

