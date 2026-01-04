# Demo Setup Guide - GoldElevate

## Step 1: Run Database Migration

Run the SQL migration file to add new tables and columns:

```bash
# Option 1: Using MySQL command line
mysql -u root -p mlm_manager < database/04_payment_gateway.sql

# Option 2: Using the migration script (if you have .env configured)
cd backend
node scripts/run-migration.js
```

The migration will:
- Add payment method fields to `member_withdraw` table
- Create `payment_gateway_settings` table
- Insert default payment gateway settings

## Step 2: Start Backend Server

```bash
cd backend
npm install  # If not already done
npm start
```

The server should start on port 8081 (or PORT from .env)

## Step 3: Start Mobile App

```bash
cd mobile-app
npm install  # If not already done
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## Step 4: Verify All Features

### Admin Features:
1. **Login as Admin** → Should see dashboard with real stats
2. **Payment Gateway Management**:
   - Navigate to Admin Dashboard → Payment Gateway
   - Update UPI ID, QR code URL, Bank details
   - Save settings
3. **Package Management**:
   - Navigate to Admin Dashboard → Edit Packages
   - Edit any package (name, price, daily return, etc.)
   - Verify changes save
4. **Payment Approval**:
   - Navigate to Admin Payments
   - View pending payments
   - Approve a payment → Member should be activated
5. **Withdrawal Approval**:
   - Navigate to Admin Withdrawals
   - View withdrawal requests with payment details
   - Approve withdrawal → Enter transaction ID
   - Verify transaction ID is saved

### User Features:
1. **Signup with Referral**:
   - Use referral link: `/signup?sponsorid={memberId}`
   - Complete signup
   - Verify referrer gets bonus (check referrer's wallet)
2. **Payment Flow**:
   - Select a package
   - Go to payment screen
   - See GPay/PhonePe buttons (if enabled)
   - See QR code and bank details
   - **GPay/PhonePe**: Pay → Submit → Auto-approved → Instant activation
   - **Other methods**: Submit reference → Wait for admin approval
3. **Withdrawal Request**:
   - Navigate to Withdraw screen
   - Select Bank or UPI
   - Enter account details
   - Submit withdrawal request
   - View withdrawal history
4. **Dashboard**:
   - View real-time balance
   - See daily returns
   - See referral count
   - All data should be dynamic

## Step 5: Test Data Flow

### Payment Gateway → Payment Screen:
1. Admin updates payment gateway settings
2. User goes to payment screen
3. Should see updated UPI ID, QR code, bank details
4. GPay/PhonePe buttons should appear if enabled

### Withdrawal Flow:
1. User requests withdrawal with Bank/UPI details
2. Admin sees withdrawal with all payment details
3. Admin approves with transaction ID
4. User sees transaction ID in withdrawal history

### GPay/PhonePe Auto-Approval:
1. User clicks GPay/PhonePe button
2. App opens (or UPI ID copied)
3. User completes payment
4. User submits payment (reference optional)
5. Payment auto-approved
6. Member activated immediately
7. Dashboard updates instantly

## Troubleshooting

### Database Issues:
- Check database connection in `backend/.env`
- Verify table exists: `SHOW TABLES LIKE 'payment_gateway_settings';`
- Check columns: `DESCRIBE member_withdraw;`

### API Issues:
- Check backend logs in `backend/logs/`
- Verify all routes are registered in `backend/server.js`
- Test API endpoints: `curl http://localhost:8081/api/health`

### Mobile App Issues:
- Check API URL in `mobile-app/app.config.js`
- Verify network connection
- Check console for errors
- Clear cache: `npm start -- --clear`

## Quick Test Checklist

- [ ] Database migration completed
- [ ] Backend server running
- [ ] Mobile app connected
- [ ] Admin can login
- [ ] Admin can update payment gateway
- [ ] Admin can edit packages
- [ ] Admin can approve payments
- [ ] Admin can approve withdrawals with transaction ID
- [ ] User can signup with referral
- [ ] User can see payment options (GPay/PhonePe)
- [ ] User can request withdrawal with Bank/UPI
- [ ] User dashboard shows real data
- [ ] GPay/PhonePe payments auto-approve
- [ ] All screens navigate correctly
- [ ] Data passes between screens correctly

## Notes

- GPay/PhonePe auto-approval only works when payment_method is 'GPay' or 'PhonePe'
- Other payment methods require admin approval
- Daily earnings are credited at midnight (cron job)
- Referral bonuses are credited immediately on signup
- All data is now dynamic (no static/mock data)

