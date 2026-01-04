# Mobile App Deployment Guide

## Quick Start

1. **Install Dependencies**
```bash
cd mobile-app
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Update API_BASE_URL to your backend URL
```

3. **Start Development Server**
```bash
npm start
```

4. **Run on Device/Emulator**
```bash
# Android
npm run android

# iOS
npm run ios
```

## Production Build

### Android APK
```bash
cd android
./gradlew assembleRelease
# APK will be in android/app/build/outputs/apk/release/
```

### iOS IPA
```bash
cd ios
xcodebuild -workspace GoldInvestment.xcworkspace -scheme GoldInvestment archive
```

## Database Setup

The mobile app connects to the backend API. Ensure:

1. **Backend is Running**
```bash
cd ../backend
npm install
npm start
```

2. **Database is Configured**
- MySQL database is running
- Database credentials in `backend/config/database.js`
- Tables are created (run SQL scripts in `conf/`)

3. **API is Accessible**
- Backend URL is correct in mobile app `.env`
- CORS is configured for mobile app domain
- Authentication endpoints are working

## Testing

1. **Test Login Flow**
- Create test user in database
- Login via mobile app
- Verify token storage

2. **Test Package Selection**
- View all packages
- Select a package
- Complete payment flow

3. **Test Dashboard**
- View statistics
- Check income data
- View referrals

## Troubleshooting

### API Connection Issues
- Check backend is running
- Verify API URL in `.env`
- Check network connectivity
- Review backend logs

### Database Issues
- Verify database connection in backend
- Check database credentials
- Ensure tables exist
- Review backend error logs

### Build Issues
- Clear cache: `npm start -- --reset-cache`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check React Native version compatibility

## Deployment Platforms

### Expo (Recommended for Quick Deployment)
```bash
npm install -g expo-cli
expo build:android
expo build:ios
```

### React Native CLI
Follow platform-specific guides for:
- Google Play Store (Android)
- Apple App Store (iOS)

## Support

For deployment assistance, contact the development team.

