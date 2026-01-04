# 📱 Install GoldElevate on OnePlus Phone

## Quick Start

### Step 1: Ensure Backend is Running
```bash
cd backend
DB_PASSWORD=Root@123 DB_NAME=gold_investment node server.js
```

### Step 2: Connect Your OnePlus Phone
1. Connect phone via USB
2. Enable USB Debugging on phone
3. Verify connection: `adb devices`

### Step 3: Install App on Phone

#### Option A: Direct Install (Recommended)
```bash
cd mobile-app
npx expo run:android
```
This will:
- Build the app
- Install on your connected device
- Launch the app automatically

#### Option B: Using Expo Go
```bash
cd mobile-app
npx expo start
```
Then:
1. Install "Expo Go" app from Play Store
2. Scan QR code with Expo Go
3. App will load

---

## 🔐 Test Credentials

### Admin
- **Phone**: `9999999999`
- **Password**: `admin123`

### Agent
- **Phone**: `8888888888`
- **Password**: `agent123`

### Users
- **Phone**: `7777777777` | **Password**: `user123`
- **Phone**: `6666666666` | **Password**: `user123`
- **Phone**: `5555555555` | **Password**: `user123`

---

## ✅ Test Data Available

- ✅ 4 Test Packages (₹1,000 to ₹25,000)
- ✅ 3 Test Users
- ✅ 3 Pending Payments (for admin approval)
- ✅ 2 Pending Withdrawals (for admin approval)
- ✅ Payment Gateway Settings configured

---

## 🧪 What to Test

1. **Login** with any credentials above
2. **Admin**: Update payment gateway, approve payments/withdrawals
3. **User**: Make payments, request withdrawals, view dashboard
4. **GPay/PhonePe**: Test auto-approval feature
5. **Withdrawal**: Test Bank and UPI options

---

## 🚀 Ready!

The app is ready to install and test on your OnePlus phone!

Run: `cd mobile-app && npx expo run:android`

