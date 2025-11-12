#!/bin/bash

# Setup script for creating Android APK from the betting chat system

set -e  # Exit on error

echo "🚀 Setting up Android APK build for Betting Chat System..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Step 1: Install Capacitor dependencies
echo "📦 Step 1: Installing Capacitor dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Step 2: Build the web application
echo "🔨 Step 2: Building web application..."
npm run build
echo "✅ Web app built successfully"
echo ""

# Step 3: Check if android folder exists
if [ -d "android" ]; then
    echo "⚠️  Android folder already exists. Syncing instead of adding..."
    npx cap sync android
else
    # Step 4: Add Android platform
    echo "📱 Step 3: Adding Android platform..."
    npx cap add android
    echo "✅ Android platform added"
    echo ""

    # Step 5: Sync web assets to Android
    echo "🔄 Step 4: Syncing web assets to Android..."
    npx cap sync android
fi

echo "✅ Sync complete"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next steps to build APK:"
echo ""
echo "Option 1 - Build with Gradle (Command Line):"
echo "  cd android"
echo "  ./gradlew assembleDebug"
echo "  # APK location: android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "Option 2 - Build with Android Studio (GUI):"
echo "  npx cap open android"
echo "  # Then: Build → Build Bundle(s) / APK(s) → Build APK(s)"
echo ""
echo "Option 3 - Run on device/emulator:"
echo "  npx cap run android"
echo ""
echo "📖 For detailed instructions, see: ANDROID_APK_GUIDE.md"
echo ""

