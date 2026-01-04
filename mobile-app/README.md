# Gold Investment Mobile App

Complete React Native mobile application for the Gold Investment Platform.

## Features

✅ **Authentication**
- Login/Logout
- User Signup
- Agent Signup
- Session Management

✅ **Dashboard**
- Real-time statistics
- Quick actions
- Balance overview

✅ **Investment Packages**
- All 8 packages (including Elite ₹4L and Ultimate ₹8L)
- Package details
- Investment flow

✅ **Payments**
- UPI payment integration
- Payment history
- Transaction tracking

✅ **Referrals**
- Referral list
- Referral link sharing
- Commission tracking

✅ **Income & Returns**
- Income breakdown
- Transaction history
- Earnings tracking

## Installation

### Prerequisites
- Node.js 18+
- React Native CLI
- Android Studio (for Android)
- Xcode (for iOS)

### Setup

1. **Install Dependencies**
```bash
cd mobile-app
npm install
```

2. **Configure API**
```bash
cp .env.example .env
# Edit .env with your backend API URL
```

3. **Run on Android**
```bash
npm run android
```

4. **Run on iOS**
```bash
npm run ios
```

## Database Connection

The app connects to the backend API which handles all database operations. Ensure your backend is running and accessible.

## Deployment

### Android
```bash
npm run build:android
```

### iOS
```bash
npm run build:ios
```

## API Integration

The app uses the backend API at `/backend` directory. Make sure:
1. Backend server is running
2. API URL is configured in `.env`
3. Database is set up and connected

## Project Structure

```
mobile-app/
├── src/
│   ├── screens/          # All app screens
│   ├── config/           # API configuration
│   └── context/          # React Context (Auth)
├── App.js                # Main app component
└── package.json          # Dependencies
```

## Support

For issues or questions, contact the development team.

