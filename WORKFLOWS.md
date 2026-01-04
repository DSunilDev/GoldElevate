# 🔄 Complete Workflow Documentation

## All Application Workflows

### 1. User Registration & Payment Flow

```
Home Screen
  ↓
Click "Sign Up"
  ↓
SignupScreen (Select Package)
  ↓
Fill Personal Information
  ↓
Submit → Account Created (Status: Wait)
  ↓
Redirect to PaymentScreen
  ↓
View QR Code
  ↓
Enter UPI Reference
  ↓
Submit Payment (Status: Pending)
  ↓
Admin Reviews Payment
  ↓
Admin Verifies Payment
  ↓
Account Activated (Status: Yes)
  ↓
User Can Login
```

### 2. Agent Registration Flow

```
Login Screen
  ↓
Click "Agent Signup"
  ↓
AgentSignupScreen
  ↓
Fill Agent Information
  ↓
Submit → Account Created
  ↓
Auto-Activated (No Payment Required)
  ↓
Can Login Immediately
```

### 3. Admin Registration Flow ✅ NEW

```
Login Screen
  ↓
Click "Admin Signup"
  ↓
AdminSignupScreen
  ↓
Fill Admin Information
  ↓
Enter Admin Key
  ↓
Submit → Admin Account Created
  ↓
Auto-Logged In
  ↓
Redirected to AdminTabs
```

### 4. User Login Flow

```
LoginScreen
  ↓
Enter Credentials
  ↓
API: /api/auth/login
  ↓
Token Received
  ↓
Token Stored (AsyncStorage)
  ↓
User Data Stored
  ↓
Redirected to MemberTabs
  ↓
Dashboard Loads
```

### 5. Admin Login Flow

```
LoginScreen
  ↓
Enter Admin Credentials
  ↓
API: /api/auth/login (role: admin)
  ↓
Token Received
  ↓
Token Stored
  ↓
Redirected to AdminTabs
  ↓
Admin Dashboard Loads
```

### 6. Payment Verification Flow (Admin)

```
AdminPaymentsScreen
  ↓
View Pending Payments
  ↓
Review Payment Details
  ↓
Check Transaction ID
  ↓
Click "Verify Payment"
  ↓
API: /api/admin/verify-payment/:id
  ↓
Payment Status: Verified
  ↓
Sale Status: paid
  ↓
Member Status: Yes (Active)
```

### 7. Application Approval Flow (Admin)

```
AdminApplicationsScreen
  ↓
View Pending Signups
  ↓
Review Application Details
  ↓
Check Transaction ID
  ↓
Click "Approve"
  ↓
API: /api/admin/approve-signup/:id
  ↓
Signup Status: Yes
  ↓
Member Status: Yes (Active)
```

### 8. Package Selection & Payment

```
PackagesScreen
  ↓
Select Package
  ↓
View Package Details
  ↓
Click "Invest Now"
  ↓
If Not Logged In → SignupScreen
  ↓
If Logged In → PaymentScreen
  ↓
Complete Payment
```

### 9. Referral Flow

```
ReferralsScreen
  ↓
View Referral Link
  ↓
Copy Link
  ↓
Share Link
  ↓
New User Signs Up with Link
  ↓
Referral Recorded
  ↓
Commission Calculated
```

### 10. Income Calculation Flow

```
Member Activated
  ↓
Referrals Join
  ↓
Cron Job Runs (Backend)
  ↓
Income Calculated:
  - Direct Commissions
  - Binary Bonuses
  - Team Matching
  - Affiliate Bonuses
  - Affiliate Override (10%)
  ↓
Income Stored in Database
  ↓
Available in IncomeScreen
```

---

## 🔐 Security Workflows

### Authentication Flow
```
User Action
  ↓
API Request
  ↓
Token Check (Interceptor)
  ↓
If Valid → Request Proceeds
  ↓
If Invalid → 401 Error
  ↓
Token Removed
  ↓
Redirect to Login
```

### Authorization Flow
```
User Accesses Screen
  ↓
Check User Role
  ↓
If Member → Member Routes
  ↓
If Admin → Admin Routes
  ↓
If Unauthorized → Redirect
```

---

## ✅ All Workflows Verified

- ✅ User Registration & Payment
- ✅ Agent Registration
- ✅ Admin Registration ✅ NEW
- ✅ User Login
- ✅ Admin Login
- ✅ Payment Verification
- ✅ Application Approval
- ✅ Package Selection
- ✅ Referral System
- ✅ Income Calculation

**All workflows are working correctly!**
