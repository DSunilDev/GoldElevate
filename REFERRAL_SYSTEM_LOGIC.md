# 📋 GoldElevate Referral System - Complete Logic Documentation

## 🎯 Overview
The referral system allows users to earn bonuses when they refer new members who sign up and purchase packages.

---

## 🔗 **1. REFERRAL LINK GENERATION**

### **How Referral Links Are Created:**
- **Endpoint**: `GET /api/members/referral-link`
- **Access**: Authenticated members only

### **Link Format:**
```
{baseUrl}/signup?ref={referralCode}&sponsorid={memberId}
```

### **Referral Code Logic:**
1. **If login is a 10-digit phone number:**
   - Format: `ref{last4digits}{memberId}`
   - Example: Phone `9876543210`, MemberID `5` → `ref32105`

2. **If login is a username:**
   - Format: `ref-{cleanedUsername}`
   - Example: Login `john_doe` → `ref-johndoe`

3. **Fallback:**
   - Format: `ref{memberId}`
   - Example: MemberID `5` → `ref5`

### **Example Referral Links:**
- Full: `http://localhost:19006/signup?ref=ref32105&sponsorid=5`
- Short: `http://localhost:19006/signup?ref=ref32105`

---

## 👥 **2. REFERRAL TRACKING (Database Structure)**

### **Key Database Fields:**
- **`member.sid`** = Sponsor ID (the referrer's memberid)
- **`member.memberid`** = The new member's ID
- **`income.classify`** = 'direct' (for referral bonuses)
- **`income_ledger.status`** = 'In' (for referral bonus entries)

### **How Referrals Are Stored:**
When a new user signs up:
```sql
INSERT INTO member (memberid, login, passwd, phone, sid, typeid, ...)
VALUES (?, ?, ?, ?, ?, ?, ...)
```
- `sid` = The sponsor's `memberid` (from `sponsorid` parameter)

---

## 💰 **3. REFERRAL BONUS CALCULATION**

### **Bonus Amount:**
- **20% of the package price** the new member purchases
- Formula: `referralBonus = Math.round(packagePrice * 0.2)`

### **Example:**
- New member buys package worth **₹10,000**
- Referrer gets: **₹2,000** (20% of ₹10,000)

---

## 🎁 **4. REFERRAL BONUS CREDITING PROCESS**

### **When Bonus Is Credited:**
1. ✅ New member signs up with a referral link
2. ✅ New member purchases a package (package price > 0)
3. ✅ Sponsor is valid (not member ID 1, not self-referral)

### **Bonus Crediting Steps:**

#### **Step 1: Calculate Bonus**
```javascript
const referralBonus = Math.round(packageData.price * 0.2);
```

#### **Step 2: Get Referrer's Current Balance**
```sql
SELECT balance, weekid FROM income_ledger 
WHERE memberid = ? 
ORDER BY ledgerid DESC LIMIT 1
```

#### **Step 3: Calculate New Balance**
```javascript
const newRefBalance = currentRefBalance + referralBonus;
```

#### **Step 4: Create Income Record**
```sql
INSERT INTO income (memberid, classify, amount, paystatus, created)
VALUES (?, 'direct', ?, 'new', NOW())
```

#### **Step 5: Create Ledger Entry**
```sql
INSERT INTO income_ledger 
(memberid, weekid, amount, balance, status, remark, created)
VALUES (?, ?, ?, ?, 'In', ?, NOW())
```
- `amount` = referralBonus (positive)
- `balance` = newRefBalance
- `status` = 'In'
- `remark` = `Referral bonus for member {newMemberId}`

---

## 📊 **5. REFERRAL STATISTICS**

### **Frontend Display (ReferralsScreen):**
- **Total Referrals**: Count of all users where `sid = currentUser.memberid`
- **Active Referrals**: Count where `active = 'Yes'`
- **Total Earnings**: Sum of all `bonus` amounts from referrals

### **Backend API Endpoints:**

#### **Get Referral List:**
- **Endpoint**: `GET /api/referrals/list`
- **Returns**: All members where `sid = currentUser.memberid`
- **Includes**: Member details, package name, downline count

#### **Get Referral Stats:**
- **Endpoint**: `GET /api/referrals/stats`
- **Returns**:
  - `total_referrals`: Total count
  - `active_referrals`: Active count
  - `left_leg`: Count with `leg = 'L'`
  - `right_leg`: Count with `leg = 'R'`
  - `total_bonuses`: Sum from `income` table where `classify = 'direct'`

#### **Get Referral Tree:**
- **Endpoint**: `GET /api/referrals/tree?depth=3`
- **Returns**: Hierarchical tree structure of referrals
- **Depth**: Configurable (default: 3 levels)

---

## 🔄 **6. SIGNUP WITH REFERRAL**

### **Signup Process:**

#### **Step 1: User Clicks Referral Link**
- URL: `/signup?ref={code}&sponsorid={id}`
- Frontend extracts `sponsorid` from URL

#### **Step 2: User Completes Signup**
- **Endpoint**: `POST /api/auth/signup`
- **Parameters**:
  ```json
  {
    "phone": "9876543210",
    "packageid": 1,
    "sponsorid": 5,  // From referral link
    "firstname": "John",
    "lastname": "Doe",
    "password": "userpassword"
  }
  ```

#### **Step 3: Sponsor Validation**
```javascript
// Get sponsor (default to existing member or 1)
const [topMembers] = await query('SELECT memberid FROM member ORDER BY memberid LIMIT 1');
const defaultSponsor = topMembers && topMembers.length > 0 ? topMembers[0].memberid : 1;

const sponsor = sponsorid || defaultSponsor;

// Validate sponsor exists, use 1 if not found
const sponsorCheck = await query('SELECT memberid FROM member WHERE memberid = ?', [sponsor]);
const finalSponsor = sponsorCheck.length > 0 ? sponsor : 1;
```

#### **Step 4: Create New Member**
```sql
INSERT INTO member (memberid, login, passwd, phone, firstname, lastname, sid, typeid, active, signuptime, created)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Yes', NOW(), NOW())
```
- `sid` = `finalSponsor` (the referrer's memberid)

#### **Step 5: Create Sale Record**
```sql
INSERT INTO sale (memberid, typeid, amount, signuptype, paystatus, active, created)
VALUES (?, ?, ?, 'Yes', 'Pending', 'No', NOW())
```

#### **Step 6: Credit Referral Bonus** (if applicable)
- Only if:
  - ✅ `finalSponsor` exists
  - ✅ `finalSponsor !== 1` (not default)
  - ✅ `finalSponsor !== memberId` (not self-referral)
  - ✅ Package price > 0

---

## 🚫 **7. REFERRAL BONUS RESTRICTIONS**

### **Bonus NOT Credited If:**
1. ❌ Sponsor ID is `1` (default/system sponsor)
2. ❌ Self-referral (sponsorid === new member's id)
3. ❌ Package price is `0` or `null`
4. ❌ Sponsor doesn't exist in database
5. ❌ Error occurs during bonus crediting (logged but doesn't fail signup)

---

## 📱 **8. FRONTEND REFERRAL SCREEN**

### **Features:**
1. **Referral Link Display**
   - Shows user's unique referral link
   - Copy button
   - Share button

2. **Statistics Cards**
   - Total Referrals
   - Active Referrals
   - Total Earnings (₹)

3. **Referral List**
   - Shows all referred members
   - Displays:
     - Name & Username
     - Join date
     - Package name
     - Bonus earned (if any)
     - Active/Pending status

---

## 🔍 **9. DATABASE QUERIES**

### **Get All Referrals:**
```sql
SELECT m.*, dt.name as package_name, dt.price,
       (SELECT COUNT(*) FROM member WHERE sid = m.memberid) as downline_count
FROM member m
LEFT JOIN def_type dt ON m.typeid = dt.typeid
WHERE m.sid = ?
ORDER BY m.created DESC
```

### **Get Referral Bonus Total:**
```sql
SELECT COALESCE(SUM(amount), 0) as total_bonuses 
FROM income 
WHERE memberid = ? AND classify = 'direct'
```

### **Get Referral Stats:**
```sql
SELECT 
  COUNT(*) as total_referrals,
  COUNT(CASE WHEN active = 'Yes' THEN 1 END) as active_referrals,
  COUNT(CASE WHEN leg = 'L' THEN 1 END) as left_leg,
  COUNT(CASE WHEN leg = 'R' THEN 1 END) as right_leg
FROM member WHERE sid = ?
```

---

## ✅ **10. SUMMARY**

### **For Users (Referrers):**
1. Get your unique referral link from Referrals screen
2. Share the link with friends/family
3. When someone signs up using your link and buys a package:
   - You automatically get **20% of their package price** as bonus
   - Bonus is credited immediately to your balance
   - You can see all your referrals in the Referrals screen

### **For New Users (Referred):**
1. Click on a referral link
2. Complete signup process
3. Purchase a package
4. The person who referred you gets a bonus automatically

### **Key Points:**
- ✅ **20% bonus** on package purchases
- ✅ **Automatic crediting** - no manual approval needed
- ✅ **Real-time balance update** in income_ledger
- ✅ **Trackable** - see all referrals and earnings
- ✅ **No self-referrals** - cannot refer yourself
- ✅ **No default sponsor bonuses** - sponsor ID 1 doesn't get bonuses

---

## 🔧 **Technical Notes:**

1. **Referral bonus is credited during signup**, not when payment is verified
2. **Bonus is added to `income_ledger`** with status 'In'
3. **Bonus is recorded in `income` table** with classify 'direct'
4. **Balance calculation** uses the latest `income_ledger` entry
5. **Error handling**: If bonus crediting fails, signup still succeeds (error is logged)

---

**Last Updated**: January 2026
**Version**: 1.0

