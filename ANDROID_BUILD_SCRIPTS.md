# 📱 Android Build Scripts - Quick Reference

I've added convenient npm scripts to `package.json` for building Android APKs!

---

## 🚀 Quick Start - Build APK Now!

```bash
npm run apk:debug
```

This single command will:
1. ✅ Build your web app
2. ✅ Sync files to Android project
3. ✅ Build the debug APK
4. ✅ APK ready at: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📋 All Available Scripts

### 🔧 Setup & Initialization

#### `npm run android:init`
- **What it does:** Creates the Android project folder
- **When to use:** First time setup only
- **Command:** `npx cap add android`

```bash
npm run android:init
```

---

### 🔄 Sync & Update

#### `npm run android:sync`
- **What it does:** Builds web app and syncs to Android
- **When to use:** After making changes to your web code
- **Command:** `npm run build && npx cap sync android`

```bash
npm run android:sync
```

---

### 📱 Build APK

#### `npm run android:build` (Debug APK)
- **What it does:** Complete build process for debug APK
- **When to use:** Testing on your phone
- **Output:** `android/app/build/outputs/apk/debug/app-debug.apk`
- **Time:** 2-5 minutes first time, 30-60 seconds after

```bash
npm run android:build
```

#### `npm run android:build:release` (Release APK)
- **What it does:** Builds production-ready APK
- **When to use:** For Play Store or final distribution
- **Output:** `android/app/build/outputs/apk/release/app-release-unsigned.apk`
- **Note:** Needs signing for Play Store

```bash
npm run android:build:release
```

---

### 🎯 Quick Shortcuts

#### `npm run apk:debug`
- **Alias for:** `npm run android:build`
- **Quick way to build debug APK**

```bash
npm run apk:debug
```

#### `npm run apk:release`
- **Alias for:** `npm run android:build:release`
- **Quick way to build release APK**

```bash
npm run apk:release
```

---

### 🔍 Find APK

#### `npm run apk:find`
- **What it does:** Finds all APK files in the project
- **When to use:** To locate your built APK files

```bash
npm run apk:find
```

Output example:
```
android/app/build/outputs/apk/debug/app-debug.apk
android/app/build/outputs/apk/release/app-release-unsigned.apk
```

---

### 🧹 Clean Build

#### `npm run android:clean`
- **What it does:** Cleans Android build cache
- **When to use:** If build fails or you want fresh build

```bash
npm run android:clean
```

Then rebuild:
```bash
npm run apk:debug
```

---

### 📲 Install on Device

#### `npm run android:install`
- **What it does:** Installs debug APK on connected Android device
- **When to use:** Phone connected via USB with ADB enabled
- **Requires:** USB debugging enabled on phone

```bash
npm run android:install
```

---

### 🛠️ Open in Android Studio

#### `npm run android:open`
- **What it does:** Opens Android project in Android Studio
- **When to use:** Advanced customization or debugging
- **Requires:** Android Studio installed

```bash
npm run android:open
```

---

## 📊 Complete Workflow Examples

### First Time Setup
```bash
# 1. Initialize Android project (only once)
npm run android:init

# 2. Build debug APK
npm run apk:debug

# 3. Find the APK
npm run apk:find
```

---

### After Making Code Changes
```bash
# Quick rebuild
npm run apk:debug
```

This automatically:
- Rebuilds web app
- Syncs to Android
- Builds new APK

---

### Production Release
```bash
# Build release APK
npm run apk:release

# Find it
npm run apk:find
```

---

### Install on Phone via USB
```bash
# Build and install in one go
npm run apk:debug && npm run android:install
```

---

### Clean Build (if issues)
```bash
# Clean and rebuild
npm run android:clean
npm run apk:debug
```

---

## 🎯 Most Common Commands

| Task | Command |
|------|---------|
| **Build APK for testing** | `npm run apk:debug` |
| **Find APK location** | `npm run apk:find` |
| **Rebuild after changes** | `npm run apk:debug` |
| **Clean build** | `npm run android:clean` |
| **Install on phone** | `npm run android:install` |

---

## 📍 APK Locations

### Debug APK (for testing)
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK (for production)
```
android/app/build/outputs/apk/release/app-release-unsigned.apk
```

---

## 🔄 Quick Copy to Desktop

After building, copy APK to Desktop:

```bash
# Debug APK
cp android/app/build/outputs/apk/debug/app-debug.apk ~/Desktop/BusinessChat-Debug.apk

# Release APK
cp android/app/build/outputs/apk/release/app-release-unsigned.apk ~/Desktop/BusinessChat-Release.apk
```

---

## ⚡ Pro Tips

### 1. **Fastest Rebuild**
```bash
npm run apk:debug
```
Everything in one command!

### 2. **Check Build Status**
```bash
npm run apk:find
```
If APK exists, build succeeded!

### 3. **Fresh Start**
```bash
npm run android:clean && npm run apk:debug
```

### 4. **Auto-install on Phone**
```bash
npm run apk:debug && npm run android:install
```

---

## 🐛 Troubleshooting

### "gradlew: Permission denied"
```bash
chmod +x android/gradlew
npm run apk:debug
```

### "JAVA_HOME not set"
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
npm run apk:debug
```

### Build fails
```bash
npm run android:clean
npm run apk:debug
```

### Can't find APK
```bash
npm run apk:find
```

---

## 📦 What Each Script Does Internally

```json
{
  "android:init": "npx cap add android",
  "android:sync": "npm run build && npx cap sync android",
  "android:open": "npx cap open android",
  "android:build": "npm run build && npx cap sync android && cd android && ./gradlew assembleDebug && cd ..",
  "android:build:release": "npm run build && npx cap sync android && cd android && ./gradlew assembleRelease && cd ..",
  "android:clean": "cd android && ./gradlew clean && cd ..",
  "android:install": "cd android && ./gradlew installDebug && cd ..",
  "apk:debug": "npm run android:build",
  "apk:release": "npm run android:build:release",
  "apk:find": "find android -name '*.apk' -type f"
}
```

---

## 🎉 Summary

**To build your Android APK, just run:**

```bash
npm run apk:debug
```

**Your APK will be at:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

**That's it!** 🚀

---

## 📚 More Resources

- **Quick Start:** See `START_HERE_APK.md`
- **Find APK:** See `FIND_YOUR_APK.md`
- **Full Guide:** See `ANDROID_APK_GUIDE.md`
- **Status:** See `APK_READY.txt`

---

**All scripts are now in `package.json` - just use `npm run` commands!** ✨

