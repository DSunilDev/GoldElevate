# 🧪 Testing Instructions - Complete Guide

## ✅ Services Status

**Backend:** http://localhost:8081/api  
**Frontend:** http://localhost:19006

---

## 🚀 Quick Start Testing

### 1. **Open the App in Browser**

1. Open your browser and go to: **http://localhost:19006**
2. **Hard Refresh** (Important!):
   - Mac: `Cmd + Shift + R`
   - Windows/Linux: `Ctrl + Shift + R`
3. Wait for the app to load (30-60 seconds on first load)

---

## 📱 Testing User Login

### **Step 1: Check Browser Console**

1. Open Developer Tools (F12 or Cmd+Option+I)
2. Go to **Console** tab
3. You should see: `API Base URL: http://localhost:8081/api`
   - ✅ If you see this, the API is correctly configured
   - ❌ If you see an IP address, hard refresh again

### **Step 2: User Login Flow**

1. **On Login Screen:**
   - Enter a **10-digit phone number** (must start with 6-9)
   - Click **"Send OTP"** button

2. **Check for OTP:**
   - **Option A:** If MSG91 is configured, OTP will be sent via SMS
   - **Option B:** If MSG91 is NOT configured, check:
     - Browser console for OTP log: `[OTP] Login OTP for <phone>: <otp>`
     - Backend logs: `tail -f /tmp/backend.log`
     - The OTP might also be in the API response (for testing)

3. **Enter OTP:**
   - Enter the 6-digit OTP code
   - Click **"Verify OTP"**

4. **Expected Result:**
   - ✅ Success toast: "Login successful!"
   - ✅ Redirected to **Dashboard** (MemberTabs)
   - ✅ You can see your profile, packages, income, etc.

### **If Phone Number Not Registered:**

- You'll see: "Phone number not registered. Please sign up first."
- **Solution:** Use the **Sign Up** flow first to register

---

## 👤 Testing Sign Up (User)

### **Step 1: Navigate to Sign Up**

1. Click **"Sign Up"** or **"Create Account"** link
2. Fill in the form:
   - Phone number (10 digits, starting with 6-9)
   - Email
   - First name, Last name
   - Choose a package
   - Sponsor ID (optional)
   - Choose leg (Left/Right)

### **Step 2: Send OTP**

1. Click **"Send OTP"** button
2. Check backend logs or console for OTP
3. Enter the OTP code
4. Click **"Verify OTP"**

### **Step 3: Complete Sign Up**

1. Fill remaining details
2. Click **"Sign Up"** button
3. **Expected Result:**
   - ✅ Success message
   - ✅ Redirected to Dashboard
   - ✅ Account needs admin approval (if enabled)

---

## 🔐 Testing Admin Login

### **Step 1: Access Admin Login**

1. Navigate to admin login (usually a separate route or button)
2. Enter admin phone number
3. Click **"Send OTP"**

### **Step 2: Verify OTP**

1. Check backend logs for admin OTP: `tail -f /tmp/backend.log`
2. Enter OTP code
3. Click **"Verify OTP"**

### **Step 3: Expected Result**

- ✅ Success toast: "Welcome back, Admin!"
- ✅ Redirected to **Admin Dashboard** (AdminTabs)
- ✅ Can see: Members, Payments, Withdrawals, Packages, etc.

---

## 👨‍💼 Testing Agent Login

### **Step 1: Agent Login**

1. Navigate to agent login
2. Enter agent phone number
3. Send and verify OTP (same as user login)

### **Step 2: Expected Result**

- ✅ Redirected to Agent Dashboard
- ✅ Should see **Referral Earnings** only (no daily earnings)
- ✅ Can refer users and track referrals

---

## ✅ Testing Checklist

### **Login & Authentication**
- [ ] User login with OTP works
- [ ] Admin login with OTP works
- [ ] Agent login with OTP works
- [ ] Login redirects to correct dashboard
- [ ] Error messages show for invalid OTP
- [ ] Error messages show for expired OTP

### **User Features**
- [ ] Dashboard loads correctly
- [ ] Packages screen shows available packages
- [ ] Income screen shows daily earnings & referral earnings
- [ ] Referrals screen shows referral list
- [ ] Wallet shows balance correctly
- [ ] Transactions history loads
- [ ] Withdraw request works
- [ ] Payment submission works

### **Admin Features**
- [ ] Admin dashboard loads
- [ ] Can view all members
- [ ] Can approve pending signups
- [ ] Can edit packages
- [ ] Can approve withdrawals
- [ ] Can view payments
- [ ] Can update payment gateway settings

### **Navigation**
- [ ] All tabs work correctly
- [ ] Back navigation works
- [ ] Screen transitions are smooth
- [ ] No "something went wrong" errors

### **Error Handling**
- [ ] Toast messages show for errors
- [ ] Toast messages show for success
- [ ] Network errors are handled gracefully
- [ ] Invalid input shows appropriate errors

---

## 🔍 Debugging Tips

### **Check Backend Logs**
```bash
tail -f /tmp/backend.log
```

Look for:
- OTP generation: `[OTP] Login OTP for <phone>: <otp>`
- Database errors
- API request logs

### **Check Frontend Logs**
```bash
tail -f /tmp/expo.log
```

### **Check Browser Console**

1. Open Developer Tools (F12)
2. Go to **Console** tab
3. Look for:
   - API Base URL (should be localhost)
   - Network errors
   - JavaScript errors
   - OTP logs

### **Check Network Tab**

1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Filter by **XHR** or **Fetch**
4. Check API requests:
   - Request URL (should be localhost:8081)
   - Request status (200 = success, 400/500 = error)
   - Response data

---

## 🐛 Common Issues & Solutions

### **Issue 1: "Network Error" on Login**
**Solution:**
- Check if backend is running: `curl http://localhost:8081/api/health`
- Check browser console for CORS errors
- Verify API Base URL shows localhost (not IP address)
- Hard refresh browser (Cmd+Shift+R)

### **Issue 2: "Phone number not registered"**
**Solution:**
- Use Sign Up flow first to register
- Or use an existing phone number from database

### **Issue 3: OTP Not Received**
**Solution:**
- Check backend logs: `tail -f /tmp/backend.log`
- Look for: `[OTP] Login OTP for <phone>: <otp>`
- OTP is logged in console/backend (MSG91 might not be configured)

### **Issue 4: "Table doesn't exist" Error**
**Solution:**
- Database tables should be created (already done)
- Restart backend: `cd backend && npm start`

### **Issue 5: Blank Screen**
**Solution:**
- Hard refresh browser (Cmd+Shift+R)
- Check browser console for errors
- Check if frontend is compiling: `tail -f /tmp/expo.log`
- Wait 30-60 seconds for first compilation

### **Issue 6: CORS Error**
**Solution:**
- Backend CORS is already configured
- Make sure API URL uses localhost (not IP)
- Hard refresh browser

---

## 📊 Test Credentials (If Available)

If you have test users in the database, you can use:
- **Phone numbers** that are registered
- **Admin credentials** (if created)

**Note:** Check the database or ask for test credentials.

---

## 🎯 Quick Test Script

Run these commands to verify everything is working:

```bash
# Check backend
curl http://localhost:8081/api/health

# Check if tables exist
mysql -u root -p'Root@123' mlm_manager -e "SHOW TABLES;"

# Check backend logs
tail -20 /tmp/backend.log

# Check frontend logs
tail -20 /tmp/expo.log
```

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ Browser console shows: `API Base URL: http://localhost:8081/api`
2. ✅ Login screen loads without errors
3. ✅ OTP is generated and logged in backend
4. ✅ Login redirects to correct dashboard
5. ✅ No "something went wrong" errors
6. ✅ Toast messages appear for actions
7. ✅ All screens load correctly
8. ✅ Navigation works smoothly

---

## 📞 Need Help?

Check these files for more info:
- `BROWSER_TESTING_GUIDE.md` - Detailed browser testing
- `CREDENTIALS_FOR_TESTING.md` - Test credentials
- Backend logs: `/tmp/backend.log`
- Frontend logs: `/tmp/expo.log`

Happy Testing! 🚀
