# 📱 MSG91 OTP Setup - GoldElevate

## ✅ MSG91 Integration Complete!

The app now uses **MSG91 API** to send OTP SMS directly, just like the original version!

---

## 🔧 Configuration

### Step 1: Get MSG91 Credentials

1. Sign up at [MSG91.com](https://msg91.com)
2. Get your **Auth Key** from dashboard
3. Get your **Sender ID** (or request one)
4. (Optional) Create a **Template ID** for OTP

### Step 2: Update Backend .env

Add these to `backend/.env`:

```env
# MSG91 Configuration
MSG91_AUTH_KEY=your_actual_auth_key_here
MSG91_SENDER_ID=GOLDEV
MSG91_TEMPLATE_ID=your_template_id_here
MSG91_ROUTE=4
```

**Note**: 
- `MSG91_ROUTE=4` means Transactional SMS
- `MSG91_ROUTE=1` means Promotional SMS
- Use Route 4 for OTP messages

---

## 📱 How It Works Now

### Login Flow:
1. User enters phone number
2. Backend generates OTP
3. **MSG91 sends OTP via SMS** to user's phone
4. User enters OTP
5. Backend verifies OTP (via MSG91 API or fallback)
6. User logged in

### Signup Flow:
1. User enters phone number
2. Backend generates OTP
3. **MSG91 sends OTP via SMS** to user's phone
4. User enters OTP
5. Backend verifies OTP
6. User can complete signup

---

## ✅ Features

- ✅ **Direct MSG91 API integration** (not widget-based)
- ✅ **Automatic SMS sending** when OTP is generated
- ✅ **MSG91 verification** for OTP validation
- ✅ **Fallback to stored OTP** if MSG91 fails
- ✅ **Console logging** for development/testing
- ✅ **Works for Login, Signup, Admin Login**

---

## 🧪 Testing

### Without MSG91 (Development):
- OTP is generated and logged to console
- OTP is shown in API response (for testing)
- Manual OTP entry works

### With MSG91 (Production):
- OTP is sent via SMS automatically
- User receives SMS with OTP
- OTP verification via MSG91 API
- No OTP shown in API response

---

## 📝 Test Phone Numbers

Use these phone numbers for testing:
- Admin: `9999999999`
- Agent: `8888888888`
- Users: `7777777777`, `6666666666`, `5555555555`, `4444444444`

**Note**: Make sure these numbers are added to your MSG91 account for testing.

---

## 🔍 Troubleshooting

### OTP Not Received:
1. Check MSG91 dashboard for SMS logs
2. Verify Auth Key is correct
3. Check Sender ID is approved
4. Verify phone number format (10 digits, starts with 6-9)
5. Check backend logs: `backend/logs/combined.log`

### MSG91 Errors:
- Check API response in logs
- Verify account balance in MSG91
- Check if sender ID is active
- Verify template ID (if using)

### Fallback Mode:
- If MSG91 fails, OTP is still generated
- Check console logs for OTP code
- Use manual OTP entry in app

---

## 🚀 Ready!

Once you add your MSG91 credentials to `.env`, OTP SMS will be sent automatically!

**The original MSG91 integration is restored!** ✅

