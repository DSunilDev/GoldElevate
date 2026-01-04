# 🚀 Quick Deployment Steps

## Step 1: Install Dependencies
```bash
cd mobile-app
npm install
```

## Step 2: Install EAS CLI
```bash
npm install -g eas-cli
```

## Step 3: Login to Expo
```bash
eas login
```
Enter your Expo account email and password.

## Step 4: Initialize Project
```bash
eas init
```
This will:
- Create a project ID
- Update `app.json` with project ID
- Configure EAS build

## Step 5: Update API URL
Edit `app.config.js`:
```javascript
extra: {
  apiUrl: "https://your-backend-url.com/api", // Your production API URL
}
```

## Step 6: Build for Android (APK - for testing)
```bash
eas build --platform android --profile preview
```

Wait for build to complete (10-20 minutes).

## Step 7: Download and Test
- EAS will provide a download link
- Download APK to your Android device
- Install and test

## Step 8: Build Production Version
```bash
eas build --platform android --profile production
```

## Step 9: Submit to Google Play Store
```bash
eas submit --platform android
```

---

## 🍎 For iOS

### Build for iOS:
```bash
eas build --platform ios --profile production
```

### Submit to App Store:
```bash
eas submit --platform ios
```

**Note:** Requires Apple Developer account ($99/year)

---

## ⚠️ Important Notes

1. **Update API URL** in `app.config.js` before building
2. **Test preview build** before production
3. **Update version** in `app.config.js` for each release
4. **Keep project ID** safe (already in `app.json`)

---

## ✅ Checklist Before Building

- [ ] API URL updated in `app.config.js`
- [ ] All dependencies installed (`npm install`)
- [ ] EAS CLI installed (`npm install -g eas-cli`)
- [ ] Logged in to Expo (`eas login`)
- [ ] Project initialized (`eas init`)
- [ ] Backend is running and accessible
- [ ] Tested app locally with `expo start`

---

## 🎯 That's It!

Follow these steps and your app will be deployed!

**Questions?** Check `EXPO_DEPLOYMENT.md` for detailed guide.

