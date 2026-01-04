# 🔍 Troubleshooting - App Error

## 🔍 What to Check:

### 1. **Network Connection**
- ✅ Phone and computer on same WiFi?
- ✅ Can phone access http://172.28.37.188:8081/api/health?

### 2. **Backend Status**
- ✅ Backend running on port 8081?
- ✅ Database connected?
- ✅ API accessible from network?

### 3. **Expo Connection**
- ✅ Expo server running on port 19000?
- ✅ QR code/URL working?
- ✅ App loads in Expo Go?

### 4. **Common Errors:**

**Error: Network request failed**
- Check WiFi connection
- Check backend is running
- Check API URL is correct

**Error: Cannot connect to server**
- Backend not accessible from phone
- Firewall blocking connection
- Wrong IP address

**Error: App crashed**
- Check console for JavaScript errors
- Check ErrorBoundary logs
- Check backend logs

---

## 🔧 Quick Fixes:

### Fix 1: Restart Everything
```bash
# Kill all processes
pkill -f "expo|node.*server"

# Restart backend
cd backend
DB_PASSWORD=Root@123 DB_NAME=gold_investment node server.js

# Restart Expo (in another terminal)
cd mobile-app
npx expo start --port 19000
```

### Fix 2: Check Firewall
- Mac System Settings → Network → Firewall
- Allow connections on port 8081

### Fix 3: Verify API URL
- Should be: `http://172.28.37.188:8081/api`
- Check in app.config.js

---

## 📱 What Error Do You See?

Please describe:
1. **Error message** (exact text)
2. **When it happens** (on load? on login? on API call?)
3. **Screen** (error screen? blank screen? crash?)

---

## ✅ Current Status:

- ✅ Backend: Running
- ✅ Database: Connected  
- ✅ Expo: Running
- ✅ API URL: Configured

**Need to know the exact error to fix it!**

