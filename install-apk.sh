#!/bin/bash

# BBExch Chat App - APK Installation Script

echo "📱 BBExch Chat App - APK Installation"
echo "====================================="

# Check if ADB is available
if ! command -v adb &> /dev/null; then
    echo "❌ ADB not found. Please install Android SDK Platform Tools."
    echo "   Download from: https://developer.android.com/studio/releases/platform-tools"
    exit 1
fi

# Check for connected devices
echo "🔍 Checking for connected Android devices..."
DEVICES=$(adb devices | grep -v "List of devices" | grep "device$" | wc -l)

if [ "$DEVICES" -eq 0 ]; then
    echo "❌ No Android devices found."
    echo "   Please connect your Android device and enable USB Debugging."
    echo "   Settings > Developer Options > USB Debugging"
    exit 1
fi

echo "✅ Found $DEVICES Android device(s)"

# Show available APK files
echo ""
echo "📦 Available APK files:"
echo "1. Debug APK (for testing): android/app/build/outputs/apk/debug/app-debug.apk"
echo "2. Release APK (production): android/app/build/outputs/apk/release/app-release.apk"

# Ask user which APK to install
echo ""
read -p "Which APK would you like to install? (1 for debug, 2 for release): " choice

case $choice in
    1)
        APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
        APK_TYPE="Debug"
        ;;
    2)
        APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
        APK_TYPE="Release"
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

# Check if APK file exists
if [ ! -f "$APK_PATH" ]; then
    echo "❌ APK file not found: $APK_PATH"
    echo "   Please build the APK first by running:"
    echo "   cd android && ./gradlew assembleDebug assembleRelease"
    exit 1
fi

# Install APK
echo ""
echo "📲 Installing $APK_TYPE APK..."
echo "   File: $APK_PATH"

# Uninstall previous version if exists
echo "🗑️  Uninstalling previous version (if exists)..."
adb uninstall com.Businesschat.app 2>/dev/null || true

# Install new APK
echo "📥 Installing new APK..."
if adb install "$APK_PATH"; then
    echo ""
    echo "✅ Installation successful!"
    echo "🎉 BBExch Chat app has been installed on your device."
    echo ""
    echo "📱 You can now:"
    echo "   • Find the app in your app drawer"
    echo "   • Launch it from the home screen"
    echo "   • Test all the chat features"
    echo ""
    echo "🔧 App Details:"
    echo "   • Package: com.Businesschat.app"
    echo "   • Name: Businesss Chat"
    echo "   • Version: 1.0"
    echo "   • Type: $APK_TYPE"
else
    echo ""
    echo "❌ Installation failed!"
    echo "   Common solutions:"
    echo "   • Enable 'Install from Unknown Sources' in Android settings"
    echo "   • Make sure USB Debugging is enabled"
    echo "   • Try installing manually by copying APK to device"
    echo ""
    echo "📁 Manual installation:"
    echo "   1. Copy $APK_PATH to your device"
    echo "   2. Open file manager on device"
    echo "   3. Tap the APK file to install"
    exit 1
fi