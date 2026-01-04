# Test Credentials for GoldElevate App

## Admin Login (OTP-based)
- **Phone Number**: Check your database for admin phone
- **Login Method**: OTP via MSG91 SMS
- **Access**: Full admin panel access

## User Login (OTP-based)
- **Phone Number**: Check your database for member phone
- **Login Method**: OTP via MSG91 SMS
- **Access**: Member dashboard, packages, payments, transactions

## Quick Test Steps

### 1. Admin Panel Access
1. Open app → Login
2. Enter admin phone number
3. Enter OTP received via SMS
4. Navigate to Admin Dashboard
5. Check "Payments" tab to see all payment submissions

### 2. User Transactions
1. Login as user
2. Go to "Transactions" tab
3. You should see:
   - Payment submissions (debits)
   - Income/earnings (credits)
   - All sorted by date (newest first)

### 3. Payment Submission Flow
1. User submits payment reference
2. Payment appears in:
   - User's Transactions screen (as debit)
   - Admin Payments screen (pending verification)

## Database Query to Get Credentials

Run this to get phone numbers:
```sql
-- Get Admin
SELECT login as phone, 'Admin' as role FROM member WHERE typeid = 1 LIMIT 1;

-- Get Users
SELECT login as phone, 'User' as role FROM member WHERE typeid != 1 AND typeid != 7 LIMIT 5;
```

## Notes
- All logins are OTP-based (no passwords)
- OTP is sent via MSG91 SMS
- Check console logs for OTP if SMS not received (development mode)
