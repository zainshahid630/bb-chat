# ✅ Android Build Scripts Added to package.json

I've added **10 convenient npm scripts** to your `package.json` for building Android APKs!

---

## 🎯 The Easiest Way to Build APK

Just run this single command:

```bash
npm run apk:debug
```

**That's it!** Your APK will be ready at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📋 All New Scripts

### Quick Build Commands

| Command | What It Does |
|---------|-------------|
| `npm run apk:debug` | **Build debug APK** (for testing) |
| `npm run apk:release` | **Build release APK** (for production) |
| `npm run apk:find` | **Find all APK files** in project |

### Advanced Commands

| Command | What It Does |
|---------|-------------|
| `npm run android:init` | Create Android project (first time) |
| `npm run android:sync` | Sync web app to Android |
| `npm run android:build` | Build debug APK (same as apk:debug) |
| `npm run android:build:release` | Build release APK (same as apk:release) |
| `npm run android:clean` | Clean build cache |
| `npm run android:install` | Install APK on connected phone |
| `npm run android:open` | Open in Android Studio |

---

## 🚀 Quick Start Guide

### First Time Setup
```bash
# Already done! Android folder exists
# Just build the APK:
npm run apk:debug
```

### After Making Code Changes
```bash
npm run apk:debug
```

### Find Your APK
```bash
npm run apk:find
```

### Install on Phone (USB connected)
```bash
npm run android:install
```

---

## 📱 Complete Workflow Examples

### Example 1: Build and Find APK
```bash
npm run apk:debug
npm run apk:find
```

### Example 2: Build and Install on Phone
```bash
npm run apk:debug
npm run android:install
```

### Example 3: Clean Build
```bash
npm run android:clean
npm run apk:debug
```

### Example 4: Production Release
```bash
npm run apk:release
npm run apk:find
```

---

## 📍 Where Are My APK Files?

### Debug APK (for testing)
```
android/app/build/outputs/apk/debug/app-debug.apk
```
- Use for testing on your phone
- Can be shared with testers
- No signing required

### Release APK (for production)
```
android/app/build/outputs/apk/release/app-release-unsigned.apk
```
- Use for Play Store
- Needs to be signed
- Optimized and minified

---

## 🎨 What Each Script Does

### `npm run apk:debug`
```bash
# Runs these steps automatically:
1. npm run build              # Build web app
2. npx cap sync android       # Sync to Android
3. cd android                 # Go to android folder
4. ./gradlew assembleDebug    # Build APK
```

### `npm run apk:release`
```bash
# Runs these steps automatically:
1. npm run build              # Build web app
2. npx cap sync android       # Sync to Android
3. cd android                 # Go to android folder
4. ./gradlew assembleRelease  # Build release APK
```

### `npm run apk:find`
```bash
# Finds all APK files:
find android -name '*.apk' -type f
```

### `npm run android:sync`
```bash
# Syncs web app to Android:
1. npm run build              # Build web app
2. npx cap sync android       # Copy to Android
```

### `npm run android:clean`
```bash
# Cleans build cache:
cd android && ./gradlew clean
```

### `npm run android:install`
```bash
# Installs on connected phone:
cd android && ./gradlew installDebug
```

---

## ⚡ Pro Tips

### 1. **Fastest Way to Build**
```bash
npm run apk:debug
```
One command does everything!

### 2. **Check If Build Succeeded**
```bash
npm run apk:find
```
If you see APK path, it worked!

### 3. **Rebuild After Changes**
```bash
npm run apk:debug
```
Automatically rebuilds web app and APK.

### 4. **Copy APK to Desktop**
```bash
npm run apk:debug
cp android/app/build/outputs/apk/debug/app-debug.apk ~/Desktop/BettingChat.apk
```

### 5. **Build and Auto-Install**
```bash
npm run apk:debug && npm run android:install
```
Builds and installs on phone in one go!

---

## 🐛 Troubleshooting

### Permission Denied Error
```bash
chmod +x android/gradlew
npm run apk:debug
```

### Java Not Found
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
npm run apk:debug
```

### Build Fails
```bash
npm run android:clean
npm run apk:debug
```

### Can't Find APK
```bash
npm run apk:find
```

---

## 📊 Build Times

| Build Type | First Time | Subsequent |
|------------|-----------|------------|
| Debug APK | 2-5 minutes | 30-60 seconds |
| Release APK | 3-6 minutes | 1-2 minutes |
| Clean Build | 2-5 minutes | 2-5 minutes |

---

## 🎯 Most Common Commands

```bash
# Build APK
npm run apk:debug

# Find APK
npm run apk:find

# Install on phone
npm run android:install

# Clean build
npm run android:clean
```

---

## 📦 What's in package.json

<augment_code_snippet path="package.json" mode="EXCERPT">
````json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint .",
  "preview": "vite preview",
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
````
</augment_code_snippet>

---

## 🎉 Summary

**✅ 10 new scripts added to package.json**

**🚀 To build your APK:**
```bash
npm run apk:debug
```

**📍 APK location:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

**📲 To install on phone:**
```bash
npm run android:install
```

---

## 📚 More Documentation

- **Quick Reference:** `NPM_SCRIPTS_QUICK_REFERENCE.txt`
- **Detailed Guide:** `ANDROID_BUILD_SCRIPTS.md`
- **APK Location:** `FIND_YOUR_APK.md`
- **Getting Started:** `START_HERE_APK.md`

---

**All scripts are ready to use! Just run `npm run apk:debug` to build your APK!** 🚀

