# 🔐 GoldElevate - OTP-Based Login Credentials

## ✅ OTP-Based Login System

The app uses **OTP (One-Time Password)** for login, not passwords!

---

## 📱 Test Phone Numbers

### Admin Account
- **Phone Number**: `9999999999`
- **Login Process**: 
  1. Enter phone: `9999999999`
  2. Click "Send OTP"
  3. Enter OTP received
  4. Login successful

### Agent Account
- **Phone Number**: `8888888888`
- **Login Process**: 
  1. Enter phone: `8888888888`
  2. Click "Send OTP"
  3. Enter OTP received
  4. Login successful

### User Accounts
| Phone Number | Name | Login Process |
|--------------|------|---------------|
| `7777777777` | John | Enter phone → Send OTP → Enter OTP |
| `6666666666` | Jane | Enter phone → Send OTP → Enter OTP |
| `5555555555` | Alice | Enter phone → Send OTP → Enter OTP |
| `4444444444` | Charlie | Enter phone → Send OTP → Enter OTP |

---

## 🔐 How OTP Login Works

1. **Enter Phone Number**: Type your 10-digit phone number
2. **Send OTP**: Click "Send OTP" button
3. **Receive OTP**: OTP will be sent to your phone (via SMS/Email)
4. **Enter OTP**: Type the OTP code received
5. **Verify**: Click "Verify OTP" to login

---

## 📝 Important Notes

### For Testing:
- **OTP will be sent** to the phone numbers configured in the backend
- **Check backend logs** to see OTP codes if SMS service is not configured
- **Manual OTP entry** is available for testing

### Phone Numbers Updated:
- ✅ Admin: `9999999999`
- ✅ Agent: `8888888888`
- ✅ Users: `7777777777`, `6666666666`, `5555555555`, `4444444444`

---

## 🧪 Testing OTP Login

### Step 1: Login Screen
1. Open the app
2. Enter phone number (e.g., `7777777777`)
3. Click "Send OTP"

### Step 2: Receive OTP
- OTP will be sent via SMS (if configured)
- **OR** check backend logs for OTP code
- **OR** use manual OTP entry for testing

### Step 3: Verify OTP
1. Enter the OTP code
2. Click "Verify OTP"
3. Login successful!

---

## 📱 Install on OnePlus Phone

```bash
cd mobile-app
npx expo start --android
```

The app will install automatically on your connected device.

---

## ✅ Test Data Available

- ✅ **7 Packages** (₹1,000 to ₹25,000+)
- ✅ **Payment Gateway** configured
- ✅ **Phone Numbers** updated for testing
- ✅ **Backend** running on port 8081
- ✅ **OTP System** ready

---

## 🔍 Finding OTP Codes

If SMS is not configured, check:

1. **Backend Logs**: 
   ```bash
   tail -f backend/logs/combined.log
   ```

2. **Console Output**: OTP codes are logged during development

3. **Manual Entry**: Some screens allow manual OTP entry for testing

---

## 🚀 Ready to Test!

1. **Install app** on your OnePlus phone
2. **Enter phone number** from the list above
3. **Send OTP** and verify
4. **Login** and test all features!

---

**All phone numbers are configured and ready for OTP-based login!** ✅

