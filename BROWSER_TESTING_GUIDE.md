# 🌐 Browser Testing Guide - Quick Instructions

## 🚀 Quick Start (Easiest Method)

### Option 1: Use the Script (Recommended)

```bash
./START_WEB.sh
```

This script will:
- Check if backend is running
- Start backend if needed
- Start the app in web browser mode

---

### Option 2: Manual Start (Two Terminals)

#### Terminal 1 - Backend Server
```bash
cd backend
npm start
```

Wait for: `Server running on port 8081` or similar message

#### Terminal 2 - Frontend Web
```bash
cd mobile-app
npm start
```

Then:
- Press `w` to open in web browser
- OR copy the web URL shown (usually http://localhost:19006)

---

## 📋 Step-by-Step Instructions

### Step 1: Start Backend

1. Open Terminal
2. Navigate to backend folder:
   ```bash
   cd /Users/sunilkumar/Downloads/mobile-app-package/backend
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Wait for message: "Server running on port 8081"
5. **Keep this terminal open**

### Step 2: Start Frontend in Web Mode

1. Open a **NEW Terminal** window
2. Navigate to mobile-app folder:
   ```bash
   cd /Users/sunilkumar/Downloads/mobile-app-package/mobile-app
   ```
3. Start Expo:
   ```bash
   npm start
   ```
   
   OR directly for web:
   ```bash
   npx expo start --web
   ```

4. The browser will open automatically, or:
   - Press `w` in the terminal
   - OR visit: http://localhost:19006

---

## ✅ Testing Checklist

Once the app opens in browser, test these:

### 1. Home Screen
- [ ] Home screen loads
- [ ] "Start Investing" button works
- [ ] "User Login" button works
- [ ] "Admin Login" button works

### 2. Signup Flow
- [ ] Click "Start Investing"
- [ ] Enter phone number
- [ ] OTP is sent/received
- [ ] Enter OTP
- [ ] Account created successfully
- [ ] Redirects to Dashboard

### 3. Login Flow
- [ ] Click "User Login"
- [ ] Enter phone number
- [ ] OTP verification works
- [ ] Login successful
- [ ] Redirects to Dashboard

### 4. Admin Login
- [ ] Click "Admin Login"
- [ ] Enter admin phone
- [ ] OTP verification works
- [ ] Login successful
- [ ] Redirects to Admin Dashboard

### 5. Dashboard
- [ ] Dashboard loads with stats
- [ ] All action buttons work
- [ ] Navigation tabs work

### 6. Packages
- [ ] Packages list loads
- [ ] Can click on package
- [ ] Package details show
- [ ] "Invest Now" button works

### 7. Payment
- [ ] Payment screen loads
- [ ] QR code displays
- [ ] Can enter transaction ID
- [ ] Submit payment works

### 8. Referrals
- [ ] Referrals list loads
- [ ] Referral link is shown
- [ ] Copy link works
- [ ] Share link works

### 9. Income
- [ ] Income screen loads
- [ ] Daily earnings shown
- [ ] Referral earnings shown
- [ ] History loads

### 10. Admin Features
- [ ] Admin dashboard loads
- [ ] Can view members
- [ ] Can approve applications
- [ ] Can verify payments
- [ ] Can approve withdrawals
- [ ] Can edit packages

---

## 🔧 Troubleshooting

### Backend Not Starting
```bash
# Check if port 8081 is in use
lsof -i :8081

# Kill process if needed
kill -9 <PID>

# Try again
cd backend
npm start
```

### Frontend Not Starting
```bash
# Clear cache
cd mobile-app
rm -rf node_modules
npm install

# Start again
npm start
```

### Web Browser Not Opening
```bash
# Use explicit web flag
cd mobile-app
npx expo start --web

# Or open manually
# Visit: http://localhost:19006
```

### API Connection Issues
- Check backend is running on port 8081
- Check API URL in `mobile-app/src/config/api.js`
- Should be: `http://172.28.37.188:8081/api` or `http://localhost:8081/api`
- Check browser console for errors

---

## 🌐 URLs

- **Frontend Web**: http://localhost:19006
- **Backend API**: http://localhost:8081/api
- **Expo Dev Tools**: http://localhost:19000

---

## 📝 Notes

- Keep both terminals open while testing
- Backend must be running before frontend
- Use browser DevTools (F12) to check console for errors
- Network tab shows API calls
- Refresh browser if app doesn't load

---

## 🎯 Quick Commands Summary

```bash
# Start Backend (Terminal 1)
cd backend && npm start

# Start Frontend Web (Terminal 2)
cd mobile-app && npx expo start --web

# OR use the script
./START_WEB.sh
```

Happy Testing! 🎉

