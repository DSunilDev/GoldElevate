-- Add comprehensive test data for admin verification testing
-- This includes pending payments, verified payments, pending withdrawals, etc.

-- First, ensure we have some test members with different statuses
INSERT INTO member (memberid, login, passwd, active, typeid, email, firstname, lastname, phone, sid, pid, top, leg, signuptime, created)
VALUES 
  (1001, 'member1', SHA1(CONCAT('member1', 'pass123')), 'Yes', 1, 'member1@test.com', 'John', 'Doe', '9876543211', 1, 1, 1, 'L', NOW(), NOW()),
  (1002, 'member2', SHA1(CONCAT('member2', 'pass123')), 'Yes', 1, 'member2@test.com', 'Jane', 'Smith', '9876543212', 1, 1, 1, 'R', NOW(), NOW()),
  (1003, 'member3', SHA1(CONCAT('member3', 'pass123')), 'No', 1, 'member3@test.com', 'Bob', 'Johnson', '9876543213', 1, 1, 1, 'L', NOW(), NOW()),
  (1004, 'member4', SHA1(CONCAT('member4', 'pass123')), 'Yes', 1, 'member4@test.com', 'Alice', 'Williams', '9876543214', 1, 1, 1, 'R', NOW(), NOW()),
  (1005, 'member5', SHA1(CONCAT('member5', 'pass123')), 'Yes', 1, 'member5@test.com', 'Charlie', 'Brown', '9876543215', 1, 1, 1, 'L', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  active = VALUES(active),
  phone = VALUES(phone);

-- Create sale records for these members
INSERT INTO sale (saleid, memberid, typeid, amount, paystatus, created)
VALUES 
  (2001, 1001, 1, 5000, 'Pending', NOW()),
  (2002, 1002, 1, 5000, 'Pending', NOW()),
  (2003, 1003, 1, 5000, 'Pending', NOW()),
  (2004, 1004, 1, 10000, 'Pending', NOW()),
  (2005, 1005, 1, 5000, 'Pending', NOW()),
  (2006, 1001, 1, 5000, 'Delivered', DATE_SUB(NOW(), INTERVAL 5 DAY)),
  (2007, 1002, 1, 5000, 'Delivered', DATE_SUB(NOW(), INTERVAL 3 DAY))
ON DUPLICATE KEY UPDATE
  paystatus = VALUES(paystatus);

-- Add PENDING payments (for admin to verify)
INSERT INTO upi_payment (upipaymentid, saleid, memberid, amount, upi_id, upi_reference, transaction_id, status, created)
VALUES 
  (3001, 2001, 1001, 5000, 'yourbusiness@upi', 'REF001', 'TXN001', 'pending', DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (3002, 2002, 1002, 5000, 'yourbusiness@upi', 'REF002', 'TXN002', 'pending', DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (3003, 2003, 1003, 5000, 'yourbusiness@upi', 'REF003', 'TXN003', 'pending', NOW()),
  (3004, 2004, 1004, 10000, 'yourbusiness@upi', 'REF004', 'TXN004', 'pending', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
  (3005, 2005, 1005, 5000, 'yourbusiness@upi', 'REF005', 'TXN005', 'pending', DATE_SUB(NOW(), INTERVAL 1 HOUR))
ON DUPLICATE KEY UPDATE
  status = VALUES(status);

-- Add VERIFIED payments (already verified - for reference)
INSERT INTO upi_payment (upipaymentid, saleid, memberid, amount, upi_id, upi_reference, transaction_id, status, created)
VALUES 
  (3006, 2006, 1001, 5000, 'yourbusiness@upi', 'REF006', 'TXN006', 'verified', DATE_SUB(NOW(), INTERVAL 5 DAY)),
  (3007, 2007, 1002, 5000, 'yourbusiness@upi', 'REF007', 'TXN007', 'verified', DATE_SUB(NOW(), INTERVAL 3 DAY))
ON DUPLICATE KEY UPDATE
  status = VALUES(status);

-- Add income ledger entries for verified members
INSERT INTO income_ledger (memberid, weekid, amount, balance, status, remark, created)
VALUES 
  (1001, 0, 0, 0, 'Other', 'Initial wallet balance', DATE_SUB(NOW(), INTERVAL 5 DAY)),
  (1002, 0, 0, 0, 'Other', 'Initial wallet balance', DATE_SUB(NOW(), INTERVAL 3 DAY)),
  (1004, 0, 0, 0, 'Other', 'Initial wallet balance', NOW())
ON DUPLICATE KEY UPDATE
  balance = VALUES(balance);

-- Add PENDING withdrawal requests (for admin to verify)
-- Using member_withdraw table with correct structure
INSERT INTO member_withdraw (memberid, amount, payment_method, account_number, ifsc_code, account_holder_name, bank_name, transax_id, memo, status, created)
VALUES 
  (1001, 1000.00, 'Bank', '1234567890', 'HDFC0001234', 'John Doe', 'HDFC Bank', 'WD001', 'Withdrawal request 1', 'apply', DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (1002, 2000.00, 'Bank', '2345678901', 'ICIC0002345', 'Jane Smith', 'ICICI Bank', 'WD002', 'Withdrawal request 2', 'apply', DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (1004, 5000.00, 'Bank', '3456789012', 'SBIN0003456', 'Alice Williams', 'State Bank', 'WD003', 'Withdrawal request 3', 'apply', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
  (1001, 1500.00, 'UPI', NULL, NULL, 'John Doe', NULL, 'WD004', 'UPI withdrawal', 'pending', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
  (1005, 800.00, 'Bank', '4567890123', 'AXIS0004567', 'Charlie Brown', 'Axis Bank', 'WD005', 'Withdrawal request 5', 'processing', NOW())
ON DUPLICATE KEY UPDATE
  status = VALUES(status);

-- Add APPROVED/FINISHED withdrawal requests (already processed - for reference)
INSERT INTO member_withdraw (memberid, amount, payment_method, account_number, ifsc_code, account_holder_name, bank_name, transax_id, memo, status, created)
VALUES 
  (1001, 500.00, 'Bank', '1234567890', 'HDFC0001234', 'John Doe', 'HDFC Bank', 'WD006', 'Previous withdrawal', 'finished', DATE_SUB(NOW(), INTERVAL 7 DAY)),
  (1002, 1000.00, 'Bank', '2345678901', 'ICIC0002345', 'Jane Smith', 'ICICI Bank', 'WD007', 'Previous withdrawal', 'finished', DATE_SUB(NOW(), INTERVAL 4 DAY))
ON DUPLICATE KEY UPDATE
  status = VALUES(status);

-- Update income ledger balances for members with withdrawals
UPDATE income_ledger 
SET balance = balance - 500 
WHERE memberid = 1001 AND ledgerid = (SELECT MAX(ledgerid) FROM income_ledger WHERE memberid = 1001);

UPDATE income_ledger 
SET balance = balance - 1000 
WHERE memberid = 1002 AND ledgerid = (SELECT MAX(ledgerid) FROM income_ledger WHERE memberid = 1002);

-- Verify data was inserted
SELECT 'Pending Payments' as type, COUNT(*) as count FROM upi_payment WHERE status = 'pending'
UNION ALL
SELECT 'Verified Payments', COUNT(*) FROM upi_payment WHERE status = 'verified'
UNION ALL
SELECT 'Pending Withdrawals', COUNT(*) FROM member_withdraw WHERE status IN ('apply', 'pending', 'processing')
UNION ALL
SELECT 'Finished Withdrawals', COUNT(*) FROM member_withdraw WHERE status = 'finished';

