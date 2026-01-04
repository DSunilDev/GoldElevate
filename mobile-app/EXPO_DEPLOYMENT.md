# 🚀 Expo Deployment Guide - Step by Step

## ✅ Pre-Deployment Checklist

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
```
Enter your Expo account credentials.

### 3. Configure Project
```bash
cd mobile-app
eas build:configure
```
This will create/update `eas.json` and `app.json`.

### 4. Update API URL
Edit `app.config.js` and update the `apiUrl` in `extra` section:
```javascript
extra: {
  apiUrl: "https://your-production-api.com/api", // Your backend URL
}
```

### 5. Create Project ID
```bash
eas init
```
This will create a project ID and update `app.json`.

---

## 📱 Build for Android

### Step 1: Build APK (for testing)
```bash
eas build --platform android --profile preview
```

### Step 2: Build App Bundle (for Play Store)
```bash
eas build --platform android --profile production
```

### Step 3: Download Build
- EAS will provide a download link
- Or check: https://expo.dev/accounts/[your-account]/projects/gold-investment/builds

---

## 🍎 Build for iOS

### Step 1: Build for TestFlight
```bash
eas build --platform ios --profile production
```

### Step 2: Submit to TestFlight
```bash
eas submit --platform ios
```

**Note:** You need:
- Apple Developer account ($99/year)
- App Store Connect app created

---

## 🔧 Configuration Files

### `eas.json` - Already Created ✅
Contains build profiles for development, preview, and production.

### `app.config.js` - Already Created ✅
Contains app configuration including API URL.

### `.gitignore` - Already Created ✅
Excludes sensitive files and build artifacts.

---

## 📋 Before Building

### 1. Update API URL
Edit `app.config.js`:
```javascript
extra: {
  apiUrl: "https://your-backend-url.com/api",
}
```

### 2. Update Project ID
After running `eas init`, update `app.config.js`:
```javascript
extra: {
  eas: {
    projectId: "your-actual-project-id"
  }
}
```

### 3. Create App Icons (Optional but Recommended)
Create these files in `assets/`:
- `icon.png` (1024x1024)
- `splash.png` (1242x2436)
- `adaptive-icon.png` (1024x1024 for Android)

---

## 🎯 Quick Start Commands

```bash
# 1. Login
eas login

# 2. Initialize project
eas init

# 3. Build for Android (APK)
eas build --platform android --profile preview

# 4. Build for Android (Play Store)
eas build --platform android --profile production

# 5. Build for iOS
eas build --platform ios --profile production
```

---

## 📦 Build Types

### Preview Build (APK)
- For testing on Android devices
- Can be installed directly
- Command: `eas build --platform android --profile preview`

### Production Build (App Bundle)
- For Google Play Store
- Optimized and signed
- Command: `eas build --platform android --profile production`

### Development Build
- For development with Expo Go
- Includes development tools
- Command: `eas build --platform android --profile development`

---

## 🔐 Signing

EAS handles signing automatically:
- **Android**: Automatically generates and manages keystore
- **iOS**: Uses your Apple Developer certificates

---

## 📱 Testing Builds

### Android APK:
1. Download APK from EAS dashboard
2. Transfer to Android device
3. Enable "Install from unknown sources"
4. Install and test

### iOS:
1. Build will be uploaded to App Store Connect
2. Add to TestFlight
3. Invite testers
4. Test via TestFlight app

---

## 🚀 Submit to Stores

### Google Play Store:
```bash
eas submit --platform android
```

**Requirements:**
- Google Play Developer account ($25 one-time)
- App bundle built
- Store listing prepared

### Apple App Store:
```bash
eas submit --platform ios
```

**Requirements:**
- Apple Developer account ($99/year)
- App Store Connect app
- App Store listing prepared

---

## ⚙️ Environment Variables

For different environments, you can use:
```bash
# Development
eas build --platform android --profile development

# Preview/Staging
eas build --platform android --profile preview --env API_URL=https://staging-api.com/api

# Production
eas build --platform android --profile production --env API_URL=https://api.com/api
```

---

## 🐛 Troubleshooting

### Build Fails
1. Check build logs: `eas build:list`
2. Verify all dependencies in `package.json`
3. Check `app.config.js` for errors
4. Ensure API URL is correct

### Can't Login
```bash
eas logout
eas login
```

### Project ID Missing
```bash
eas init
```

### API Not Connecting
- Verify API URL in `app.config.js`
- Check backend is accessible
- Test API with curl or Postman

---

## ✅ Post-Deployment

1. **Test the build** thoroughly
2. **Update version** in `app.config.js` for next release
3. **Monitor** app performance
4. **Collect feedback** from users
5. **Plan updates** based on feedback

---

## 📞 Support

- EAS Docs: https://docs.expo.dev/build/introduction/
- Expo Forums: https://forums.expo.dev/
- EAS Status: https://status.expo.dev/

---

## 🎉 Ready to Deploy!

Follow these steps and your app will be ready for distribution!

**Next Steps:**
1. `eas login`
2. `eas init`
3. Update API URL in `app.config.js`
4. `eas build --platform android --profile preview`
5. Test the APK
6. Build production version
7. Submit to stores

Good luck! 🚀

