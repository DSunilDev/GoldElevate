# Income Ledger Reconciliation Script

This script reconciles the `income_ledger` table for all users based on their active packages and withdrawals.

## What it does:

1. **Gets all users with active packages** (where `paystatus = 'Delivered'` and `active = 'Yes'`)

2. **Calculates expected daily returns** for each package:
   - Counts days since activation
   - Includes today if the activation time has already passed
   - Multiplies days by `daily_return` from the package

3. **Gets actual withdrawals** from `member_withdraw` table (status = 'finished')

4. **Calculates expected balance**: `Total Expected Credits - Total Withdrawals`

5. **Compares with actual balance** from `income_ledger`

6. **Adds missing credits/adjustments** if there's a mismatch

## How to run:

```bash
# From the backend directory
npm run reconcile-ledger

# Or directly with node
node scripts/reconcile-income-ledger.js
```

## Example output:

```
🔄 Starting income ledger reconciliation...

📊 Found 5 members with active packages

👤 Processing Member 1000 (user1)...
  📦 Found 2 active package(s)
  💸 Total withdrawals: ₹500.00
    - Starter: ₹200/day × 5 days = ₹1,000
    - Intermediate: ₹400/day × 3 days = ₹1,200
  💰 Total expected credits: ₹2,200
  📊 Expected balance: ₹1,700.00
  📊 Actual balance: ₹1,500.00
  ⚠️  Balance mismatch: ₹200.00
  ✅ Added reconciliation entry: ₹200.00
  ✅ Member 1000 reconciled successfully

✅ Reconciliation completed!
   Processed: 5 members
   Updated: 3 members
   Errors: 0 members
```

## Important Notes:

- **Safe Operation**: The script only ADDS missing credits, it doesn't delete existing entries
- **Transactions**: All updates are done in database transactions for safety
- **Logging**: Detailed logs are provided for each member processed
- **Errors**: If one member fails, the script continues with others

## What gets added:

1. **Missing daily return credits**: If a package should have received daily returns but they're missing, the script adds them as a single entry

2. **Balance reconciliation entries**: If there's a balance mismatch, it adds an adjustment entry with status 'Other'

## Example income_ledger entries created:

```
Status: 'In'
Amount: ₹200 (missing daily return)
Remark: "Daily return reconciliation - Package: Starter (Sale ID: 123) - 5 days"

OR

Status: 'Other'
Amount: ₹500 (balance adjustment)
Remark: "Balance reconciliation - Expected: ₹2,200, Withdrawals: ₹500"
```

## Testing:

Before running on production, you can:
1. Check the console output to see what would be updated
2. Review the calculations for each member
3. Run in a test environment first
