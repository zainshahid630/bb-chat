# 📱 Android APK Build Guide for Business Chat System

This guide will help you create an Android APK from your betting chat web application.

## Prerequisites

Before starting, make sure you have:
- ✅ Node.js 20+ installed (run `node --version` to check)
- ✅ Java Development Kit (JDK) 17 or higher
- ✅ Android Studio (optional, but recommended for easier builds)

## Quick Start - Automated Setup

### Option 1: Using the Setup Script (Recommended)

```bash
# Make the script executable
chmod +x setup-android.sh

# Run the setup script
./setup-android.sh
```

### Option 2: Manual Step-by-Step Setup

#### Step 1: Install Capacitor Dependencies

```bash
npm install
```

The `package.json` has already been updated with Capacitor dependencies:
- `@capacitor/core`
- `@capacitor/cli`
- `@capacitor/android`

#### Step 2: Build Your Web Application

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

#### Step 3: Add Android Platform

```bash
npx cap add android
```

This creates an `android` folder with the native Android project.

#### Step 4: Sync Web Assets to Android

```bash
npx cap sync android
```

This copies your built web app into the Android project.

#### Step 5: Configure Android App (Optional)

Edit `android/app/src/main/res/values/strings.xml` to customize:
- App name
- App description

Edit `android/app/src/main/AndroidManifest.xml` to add permissions if needed:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

## Building the APK

### Method 1: Using Gradle (Command Line)

```bash
cd android
./gradlew assembleDebug
```

The APK will be created at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

For a release build (production):
```bash
./gradlew assembleRelease
```

### Method 2: Using Android Studio (GUI)

```bash
npx cap open android
```

This opens the project in Android Studio. Then:
1. Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Wait for the build to complete
3. Click **locate** in the notification to find your APK

## Installing the APK

### On a Physical Device

1. Enable **Developer Options** on your Android device:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   
2. Enable **USB Debugging**:
   - Go to Settings → Developer Options
   - Enable "USB Debugging"

3. Connect your device via USB

4. Install the APK:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

Or simply copy the APK to your device and tap to install.

### On an Emulator

```bash
npx cap run android
```

This will launch an emulator and install the app automatically.

## Updating the App

Whenever you make changes to your web code:

```bash
# 1. Rebuild the web app
npm run build

# 2. Sync changes to Android
npx cap sync android

# 3. Rebuild the APK
cd android && ./gradlew assembleDebug
```

## Troubleshooting

### Issue: "JAVA_HOME is not set"

Install JDK 17 and set JAVA_HOME:
```bash
# On macOS with Homebrew
brew install openjdk@17
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

### Issue: "Android SDK not found"

Install Android Studio or set ANDROID_HOME:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### Issue: "Gradle build failed"

Try cleaning the build:
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### Issue: App shows blank screen

Make sure you've built the web app first:
```bash
npm run build
npx cap sync android
```

## App Configuration

The app is configured in `capacitor.config.json`:

```json
{
  "appId": "com.bettingchat.app",
  "appName": "Betting Chat",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https"
  }
}
```

You can customize:
- `appId`: Unique package identifier (e.g., com.yourcompany.appname)
- `appName`: Display name of the app
- `webDir`: Where your built web files are located

## Features Included

Your Android app will have:
- ✅ Full web app functionality
- ✅ Mobile-responsive design (already implemented)
- ✅ Native Android wrapper
- ✅ Offline capability (if configured)
- ✅ Can be installed like a native app
- ✅ Access to device features (camera, storage, etc.)

## Next Steps

1. **Test the app** thoroughly on different devices
2. **Add app icon**: Replace icons in `android/app/src/main/res/mipmap-*` folders
3. **Add splash screen**: Configure in `capacitor.config.json`
4. **Sign the APK** for production release
5. **Publish to Google Play Store** (optional)

## Production Release

For a production-ready APK:

1. Generate a signing key:
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. Configure signing in `android/app/build.gradle`

3. Build release APK:
```bash
cd android
./gradlew assembleRelease
```

## Support

If you encounter any issues:
1. Check the Capacitor documentation: https://capacitorjs.com
2. Verify all prerequisites are installed
3. Make sure your web app builds successfully first
4. Check Android Studio logs for detailed error messages

---

**Happy Building! 🚀**

