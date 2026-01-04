# 📱 Quick Start - Install on OnePlus Phone

## ✅ Test Data Added!

All test credentials and data have been added to the database.

## 🔐 Login Credentials

### Admin
- **Login/Phone**: `admin` or `9999999999`
- **Password**: `admin123`

### Agent
- **Login/Phone**: `agent` or `8888888888`
- **Password**: `agent123`

### Users
- **7777777777** / `user123` (John)
- **6666666666** / `user123` (Jane)
- **5555555555** / `user123` (Bob)

## 📱 Install App on Your OnePlus Phone

### Step 1: Start Backend (if not running)
```bash
cd backend
DB_PASSWORD=Root@123 DB_NAME=gold_investment node server.js
```

### Step 2: Connect Phone via USB
1. Connect your OnePlus phone via USB
2. Enable USB Debugging on phone
3. Allow USB debugging when prompted

### Step 3: Install App
```bash
cd mobile-app
npx expo start --android
```

The app will:
- Build automatically
- Install on your connected device
- Launch the app

**OR** use Expo Go:
1. Install "Expo Go" from Play Store
2. Run: `npx expo start`
3. Scan QR code with Expo Go

## ✅ What to Test

1. **Login** with any credentials above
2. **Admin**: Update payment gateway, approve payments/withdrawals
3. **User**: Make payments, request withdrawals
4. **GPay/PhonePe**: Test auto-approval
5. **Dashboard**: See real-time data

## 📦 Test Data Available

- ✅ 4 Packages (₹1,000 to ₹25,000)
- ✅ 3 Users with test data
- ✅ Pending payments (for admin approval)
- ✅ Pending withdrawals (for admin approval)
- ✅ Payment gateway configured

---

**Ready! Install and test on your phone! 🚀**

