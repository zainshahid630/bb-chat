# 🚀 Build Android APK - Quick Start Guide

## ✅ What's Already Done

I've already set up everything you need:

1. ✅ Added Capacitor dependencies to `package.json`
2. ✅ Created `capacitor.config.json` configuration
3. ✅ Built your web app (files in `dist` folder)
4. ✅ Created setup script (`setup-android.sh`)
5. ✅ Created comprehensive guide (`ANDROID_APK_GUIDE.md`)

## 🎯 Quick Build (3 Simple Steps)

### Step 1: Install Dependencies

Open your terminal in this project folder and run:

```bash
npm install
```

This will install Capacitor packages (@capacitor/core, @capacitor/cli, @capacitor/android).

### Step 2: Add Android Platform

```bash
npx cap add android
```

This creates an `android` folder with the native Android project.

### Step 3: Sync Your Web App

```bash
npx cap sync android
```

This copies your built web app into the Android project.

## 📱 Build the APK

### Option A: Using Gradle (Recommended - No Android Studio needed)

```bash
cd android
./gradlew assembleDebug
```

Your APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option B: Using Android Studio

```bash
npx cap open android
```

Then in Android Studio:
- Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
- Wait for build to complete
- Click **locate** to find your APK

## 📲 Install the APK on Your Phone

### Method 1: Direct Transfer
1. Copy `app-debug.apk` to your Android phone
2. Tap the file to install
3. Enable "Install from Unknown Sources" if prompted

### Method 2: Using ADB (if phone is connected via USB)
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## 🔄 Update the App After Making Changes

Whenever you modify your web code:

```bash
# 1. Rebuild web app
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Rebuild APK
cd android && ./gradlew assembleDebug
```

## ⚠️ Prerequisites

Before building, make sure you have:

### Required:
- ✅ Node.js 20+ (run `node --version` to check)
- ✅ Java JDK 17+ (for Gradle builds)

### Optional (for Android Studio builds):
- Android Studio

### Install Java JDK (if needed):

**On macOS:**
```bash
brew install openjdk@17
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

**On Linux:**
```bash
sudo apt install openjdk-17-jdk
```

**On Windows:**
Download from: https://adoptium.net/

## 🎨 Customize Your App

### Change App Name
Edit `capacitor.config.json`:
```json
{
  "appName": "Your App Name Here"
}
```

### Change Package ID
Edit `capacitor.config.json`:
```json
{
  "appId": "com.yourcompany.yourapp"
}
```

### Add App Icon
Replace icons in: `android/app/src/main/res/mipmap-*/`

### Add Permissions
Edit `android/app/src/main/AndroidManifest.xml` and add:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

## 🐛 Troubleshooting

### "JAVA_HOME is not set"
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

### "Android SDK not found"
Install Android Studio or set:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
```

### "Gradle build failed"
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### App shows blank screen
```bash
npm run build
npx cap sync android
```

## 📦 What You Get

Your Android APK will:
- ✅ Work exactly like the web version
- ✅ Use your existing mobile-responsive design
- ✅ Install like a native app
- ✅ Work offline (if configured)
- ✅ Access device features (camera, storage, etc.)

## 🎯 Production Build (For Play Store)

For a production-ready, signed APK:

1. Generate signing key:
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. Build release APK:
```bash
cd android
./gradlew assembleRelease
```

## 📚 More Information

- **Detailed Guide**: See `ANDROID_APK_GUIDE.md`
- **Capacitor Docs**: https://capacitorjs.com
- **Troubleshooting**: Check the guide above or Android Studio logs

---

## 🚀 TL;DR - Copy & Paste This

```bash
# Install dependencies
npm install

# Add Android platform
npx cap add android

# Sync web app
npx cap sync android

# Build APK
cd android && ./gradlew assembleDebug

# APK location:
# android/app/build/outputs/apk/debug/app-debug.apk
```

**That's it! Your APK is ready to install on any Android device! 🎉**

