# 🌐 Run App in Browser - Quick Start Guide

## Prerequisites
1. Backend server must be running on port 8081
2. Node.js and npm installed
3. All dependencies installed

## Step 1: Start Backend Server (Terminal 1)

```bash
cd backend
npm start
```

Or if you have nodemon:
```bash
cd backend
npm run dev
```

The backend should start on: http://localhost:8081

---

## Step 2: Start Mobile App in Web Mode (Terminal 2)

```bash
cd mobile-app
npm start
```

Then press `w` to open in web browser, or visit the URL shown in terminal.

---

## Quick Start (All in One)

If you want to start both at once, open two terminals:

**Terminal 1 - Backend:**
```bash
cd /Users/sunilkumar/Downloads/mobile-app-package/backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd /Users/sunilkumar/Downloads/mobile-app-package/mobile-app
npm start
# Then press 'w' for web, or copy the web URL from terminal
```

---

## Access URLs

- **Frontend Web**: http://localhost:19006 (or URL shown in Expo output)
- **Backend API**: http://172.28.37.188:8081/api (or http://localhost:8081/api)

---

## Testing Checklist

1. ✅ Home Screen loads
2. ✅ Signup flow works
3. ✅ Login flow works
4. ✅ Admin Login works
5. ✅ Dashboard loads
6. ✅ All tabs work
7. ✅ Navigation works
8. ✅ API calls work

---

## Troubleshooting

If backend is not running:
- Check if port 8081 is available
- Verify database connection
- Check backend logs for errors

If web doesn't open:
- Make sure Expo is installed: `npm install -g expo-cli`
- Try: `npx expo start --web`
- Check if port 19006 is available

