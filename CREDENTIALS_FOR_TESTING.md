# 🔐 Test Credentials for GoldElevate App

## ⚠️ IMPORTANT: OTP-Based Login
All logins use **OTP (One-Time Password)** sent via SMS. No passwords needed!

---

## 👨‍💼 Admin Credentials

### Admin Phone Numbers (from database):
- **Phone**: `4444444444` (charliebrown)
- **Phone**: `5555555555` (alicewilliams)  
- **Phone**: `6666666666` (janesmith)

**Login Steps:**
1. Open app → Click "Login"
2. Enter admin phone number (e.g., `4444444444`)
3. Click "Send OTP"
4. Check SMS or console logs for OTP code
5. Enter OTP → Click "Verify OTP"
6. You'll be logged in as Admin

**Admin Features:**
- ✅ View all payments (Admin → Payments)
- ✅ Verify payments
- ✅ Approve withdrawals
- ✅ Edit packages
- ✅ Manage payment gateway settings
- ✅ View all members

---

## 👤 User Credentials

### User Phone Numbers:
- **Phone**: `6385363063` (user6385363063)
- **Phone**: Check database for other users with phone numbers

**Login Steps:**
1. Open app → Click "Login"
2. Enter user phone number
3. Click "Send OTP"
4. Enter OTP received
5. Click "Verify OTP"
6. You'll be logged in as User

**User Features:**
- ✅ View packages
- ✅ Submit payments
- ✅ View transactions (now includes payment submissions!)
- ✅ Request withdrawals
- ✅ View referrals
- ✅ View income/earnings

---

## 📱 How to Check Transactions

### As User:
1. Login as user
2. Go to **"Transactions"** tab (in bottom navigation)
3. You should see:
   - **Payment Submissions** (shown as debits with "Payment Submission - UPI" description)
   - **Income/Earnings** (shown as credits)
   - All sorted by date (newest first)
   - Payment reference numbers displayed
   - Payment status (Pending/Verified)

### As Admin:
1. Login as admin
2. Go to **"Payments"** tab in admin dashboard
3. You should see:
   - All payment submissions from all users
   - Filter by: All / Pending / Verified
   - Payment details: Amount, UPI Reference, Transaction ID, Member Name
   - "Verify Payment" button for pending payments

---

## 🧪 Testing Payment Flow

### Step 1: User Submits Payment
1. Login as user
2. Go to Packages → Select a package
3. Click "Invest Now"
4. Enter payment reference (optional for GPay/PhonePe)
5. Click "Submit Payment Reference"
6. ✅ Success message appears
7. ✅ Navigates to Dashboard

### Step 2: Check User Transactions
1. Go to "Transactions" tab
2. ✅ You should see your payment submission listed
3. ✅ Shows as debit (negative amount)
4. ✅ Shows status: "Pending" or "Verified"
5. ✅ Shows payment reference if provided

### Step 3: Check Admin Panel
1. Login as admin
2. Go to "Payments" tab
3. ✅ You should see the payment submission
4. ✅ Shows member name, amount, reference
5. ✅ Click "Verify Payment" to approve

### Step 4: After Admin Verification
1. Admin verifies payment
2. User's transaction status changes to "Verified"
3. User's account gets activated
4. Daily earnings start (if configured)

---

## 🔍 Database Query to Get All Credentials

Run this SQL to see all users with phone numbers:

```sql
SELECT 
  login as phone,
  CASE 
    WHEN typeid = 1 THEN 'Admin'
    WHEN typeid = 7 THEN 'Agent'
    ELSE 'User'
  END as role,
  memberid
FROM member 
WHERE phone IS NOT NULL AND phone != ''
ORDER BY typeid, memberid;
```

---

## 📝 Notes

- **OTP Display**: In development, OTP is also logged to console (check browser console or terminal)
- **SMS**: Requires MSG91 API configured in `.env` file
- **Payment Status**: 
  - `Pending` = Waiting for admin approval
  - `Verified` = Admin approved, account activated
- **Transaction Types**:
  - `Payment Submission` = Money paid (debit)
  - `Income` = Earnings/credits (credit)

---

## ✅ What's Fixed

1. ✅ **Transactions Screen** now shows payment submissions
2. ✅ **Combined** income + payment transactions
3. ✅ **Sorted** by date (newest first)
4. ✅ **Shows** payment reference numbers
5. ✅ **Shows** payment status (Pending/Verified)
6. ✅ **Admin Panel** correctly displays all payments
7. ✅ **Filter** payments by status in admin panel

---

## 🚀 Ready to Test!

Refresh your browser at **http://localhost:19006** and test the complete flow!

