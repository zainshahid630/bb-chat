#!/bin/bash

# Simple APK Build Script
# Run this to build your APK

echo "🚀 Building Android APK..."
echo ""

# Navigate to android folder and build
cd android
./gradlew assembleDebug

echo ""
echo "✅ Build complete!"
echo ""
echo "📍 Your APK is at:"
echo "   android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "📲 To find it:"
echo "   ls -lh android/app/build/outputs/apk/debug/app-debug.apk"
echo ""

