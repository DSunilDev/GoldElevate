# 🚀 Quick Start - GoldElevate Demo

## Step 1: Run Database Migration

```bash
# Run the migration script
./RUN_MIGRATION.sh

# OR manually:
mysql -u root -p mlm_manager < database/04_payment_gateway.sql
```

This will:
- Add payment method columns to `member_withdraw` table
- Create `payment_gateway_settings` table
- Insert default settings

## Step 2: Start Backend

```bash
cd backend
npm start
```

✅ Backend running on: `http://localhost:8081`

## Step 3: Start Mobile App

```bash
cd mobile-app
npm start
```

Then:
- **On Phone**: Scan QR code with Expo Go app
- **On Emulator**: Press `i` (iOS) or `a` (Android)

## ✅ Verify Everything Works

### Test Admin:
1. Login as admin
2. Go to Payment Gateway → Update settings → Save
3. Go to Edit Packages → Edit a package → Save
4. Go to Payments → Approve a payment
5. Go to Withdrawals → Approve withdrawal (enter transaction ID)

### Test User:
1. Signup with referral link
2. Go to Packages → Select package → Payment
3. See GPay/PhonePe buttons
4. Test GPay payment → Auto-approved → Instant activation
5. Go to Withdraw → Select Bank/UPI → Enter details → Submit
6. Check Dashboard → See real-time data

## 🎯 Key Features to Show

1. **GPay/PhonePe Auto-Approval** - Instant activation
2. **Payment Gateway Management** - Update and see changes
3. **Withdrawal with Details** - Bank/UPI options
4. **Dynamic Data** - All screens show real data
5. **Package Editing** - Real-time updates

## 📱 All Screens Connected

✅ Login → Dashboard
✅ Dashboard → Packages → Payment
✅ Payment → GPay/PhonePe → Auto-approve
✅ Dashboard → Withdraw → Submit → Admin Approval
✅ Admin Dashboard → All Management Screens
✅ All data flows correctly between screens

---

**Ready for Demo! 🎉**

