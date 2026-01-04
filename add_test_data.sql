-- Add test data for test user (memberid = 1000)
-- This includes: sale, payment, income, transactions

-- 1. Create a sale record for test user
INSERT INTO sale (saleid, memberid, typeid, amount, signuptype, paystatus, active, created)
VALUES (1, 1000, 1, 5000, 'Yes', 'Pending', 'No', NOW())
ON DUPLICATE KEY UPDATE
  memberid = VALUES(memberid),
  amount = VALUES(amount);

-- 2. Create a payment record (pending approval)
INSERT INTO upi_payment (upipaymentid, saleid, memberid, amount, upi_id, upi_reference, transaction_id, status, created)
VALUES (1, 1, 1000, 5000, 'test@upi', 'TESTREF12345', 'UPI1234567890', 'Pending', NOW())
ON DUPLICATE KEY UPDATE
  status = 'Pending';

-- 3. Create income ledger entry (wallet)
INSERT INTO income_ledger (ledgerid, memberid, weekid, amount, balance, shop_balance, status, remark, created)
VALUES (1, 1000, 1, 0, 0, 0, 'In', 'Initial balance', NOW())
ON DUPLICATE KEY UPDATE
  balance = 0;

-- 4. Verify test data
SELECT 'Sale Created' as status, saleid, memberid, amount, paystatus FROM sale WHERE memberid = 1000;
SELECT 'Payment Created' as status, upipaymentid, memberid, amount, status FROM upi_payment WHERE memberid = 1000;
SELECT 'Income Ledger Created' as status, COUNT(*) as count FROM income_ledger WHERE memberid = 1000;
