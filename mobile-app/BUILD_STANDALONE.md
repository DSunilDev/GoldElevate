# 📱 Build Standalone App (Without Expo Go)

You have **3 options** to build a standalone APK/IPA for testing on your phone:

---

## 🚀 Option 1: EAS Build (Easiest - Recommended)

**Best for:** Quick builds without local setup

### Steps:

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```
   (Create account at https://expo.dev if needed - it's free)

3. **Initialize project (if not done):**
   ```bash
   cd mobile-app
   eas init
   ```
   This will create/update your project ID in `app.config.js`

4. **Build APK for Android:**
   ```bash
   eas build --platform android --profile preview
   ```

5. **Wait for build** (10-20 minutes)
   - You'll get a download link
   - Or check: https://expo.dev/accounts/[your-account]/projects/gold-elevate/builds

6. **Install on phone:**
   - Download APK to your Android phone
   - Enable "Install from unknown sources" in Settings
   - Install and test!

**Pros:**
- ✅ No Android Studio needed
- ✅ Cloud build (works on any computer)
- ✅ Automatic signing
- ✅ Free tier: 30 builds/month

**Cons:**
- ❌ Requires Expo account
- ❌ Build takes 10-20 minutes

---

## 🔧 Option 2: Local Build with Expo (Requires Android Studio)

**Best for:** Faster builds, full control

### Prerequisites:
1. Install **Android Studio**: https://developer.android.com/studio
2. Install Android SDK (via Android Studio)
3. Set up environment variables:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

### Steps:

1. **Navigate to mobile-app:**
   ```bash
   cd mobile-app
   ```

2. **Build APK:**
   ```bash
   npx expo run:android --variant release
   ```

   Or build directly with Gradle:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

3. **Find APK:**
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

4. **Install on phone:**
   - Transfer APK to phone (USB, email, cloud)
   - Enable "Install from unknown sources"
   - Install and test!

**Pros:**
- ✅ Fast builds (2-5 minutes)
- ✅ No internet needed after setup
- ✅ Full control over build process

**Cons:**
- ❌ Requires Android Studio (~1GB download)
- ❌ More setup required

---

## ⚡ Option 3: Direct Gradle Build (Fastest Local Build)

**Best for:** Quick local builds if Android Studio is already set up

### Steps:

1. **Navigate to Android folder:**
   ```bash
   cd mobile-app/android
   ```

2. **Build release APK:**
   ```bash
   ./gradlew assembleRelease
   ```

3. **Find APK:**
   ```
   app/build/outputs/apk/release/app-release.apk
   ```

4. **Install on phone:**
   - Transfer APK to phone
   - Enable "Install from unknown sources"
   - Install!

**Note:** This builds the APK but doesn't bundle the JavaScript. For a complete build, use Option 2.

---

## 📋 Before Building - Important!

### 1. Update API URL (if needed)
Make sure `app.config.js` has the correct API URL:
```javascript
extra: {
  apiUrl: "http://192.168.0.109:8081/api", // Your backend URL
}
```

**For production builds**, use your production backend URL:
```javascript
extra: {
  apiUrl: "https://your-production-api.com/api",
}
```

### 2. Update Project ID (for EAS Build)
After running `eas init`, update `app.config.js`:
```javascript
extra: {
  eas: {
    projectId: "your-actual-project-id-from-eas-init"
  }
}
```

### 3. Test Backend Connection
Make sure your backend is running and accessible:
```bash
curl http://192.168.0.109:8081/api/health
```

---

## 🎯 Quick Start (Recommended)

**For fastest setup, use EAS Build:**

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Initialize (if first time)
cd mobile-app
eas init

# 4. Build APK
eas build --platform android --profile preview

# 5. Download and install on phone!
```

---

## 📱 Installing APK on Android Phone

1. **Transfer APK to phone:**
   - Email it to yourself
   - Use Google Drive/Dropbox
   - Use USB cable
   - Use `adb install app-release.apk` (if USB debugging enabled)

2. **Enable Unknown Sources:**
   - Settings → Security → Unknown Sources (enable)
   - Or Settings → Apps → Special Access → Install Unknown Apps

3. **Install:**
   - Open APK file on phone
   - Tap "Install"
   - Done! 🎉

---

## 🍎 For iOS (if you have a Mac)

```bash
# Build for iOS
eas build --platform ios --profile preview

# Or locally (requires Xcode):
npx expo run:ios --configuration Release
```

**Note:** iOS requires:
- Mac computer
- Apple Developer account ($99/year) for device testing
- Xcode installed

---

## ❓ Troubleshooting

### "Command not found: eas"
```bash
npm install -g eas-cli
```

### "No Android SDK found"
Install Android Studio and set up SDK:
- Android Studio → SDK Manager → Install Android SDK
- Set `ANDROID_HOME` environment variable

### "Build failed"
- Check `app.config.js` for errors
- Make sure all dependencies are installed: `npm install`
- Check EAS build logs: https://expo.dev

### "App crashes on phone"
- Check backend is running and accessible
- Verify API URL in `app.config.js`
- Check phone logs: `adb logcat` (if USB debugging enabled)

---

## ✅ Recommended Workflow

1. **Development:** Use Expo Go for quick testing
2. **Testing:** Use EAS Build preview APK for real device testing
3. **Production:** Use EAS Build production for store submission

---

## 🎉 That's It!

Choose the option that works best for you. **EAS Build (Option 1)** is recommended for easiest setup!

