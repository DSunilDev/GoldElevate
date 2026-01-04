-- Add balance to test users for withdrawal testing

-- Update income_ledger for test users to have sufficient balance
-- Test user (memberid 1000)
INSERT INTO income_ledger (memberid, weekid, amount, balance, status, remark, created)
VALUES (1000, 0, 10000, 10000, 'Other', 'Test balance for withdrawal testing', NOW())
ON DUPLICATE KEY UPDATE balance = 10000;

-- Update existing ledger if exists
UPDATE income_ledger 
SET balance = 10000, amount = 10000 
WHERE memberid = 1000 
ORDER BY ledgerid DESC LIMIT 1;

-- Member 1001
INSERT INTO income_ledger (memberid, weekid, amount, balance, status, remark, created)
VALUES (1001, 0, 5000, 5000, 'Other', 'Test balance', NOW())
ON DUPLICATE KEY UPDATE balance = 5000;

UPDATE income_ledger 
SET balance = 5000, amount = 5000 
WHERE memberid = 1001 
ORDER BY ledgerid DESC LIMIT 1;

-- Member 1002
INSERT INTO income_ledger (memberid, weekid, amount, balance, status, remark, created)
VALUES (1002, 0, 3000, 3000, 'Other', 'Test balance', NOW())
ON DUPLICATE KEY UPDATE balance = 3000;

UPDATE income_ledger 
SET balance = 3000, amount = 3000 
WHERE memberid = 1002 
ORDER BY ledgerid DESC LIMIT 1;

-- Member 1004
INSERT INTO income_ledger (memberid, weekid, amount, balance, status, remark, created)
VALUES (1004, 0, 8000, 8000, 'Other', 'Test balance', NOW())
ON DUPLICATE KEY UPDATE balance = 8000;

UPDATE income_ledger 
SET balance = 8000, amount = 8000 
WHERE memberid = 1004 
ORDER BY ledgerid DESC LIMIT 1;

-- Member 1005
INSERT INTO income_ledger (memberid, weekid, amount, balance, status, remark, created)
VALUES (1005, 0, 2000, 2000, 'Other', 'Test balance', NOW())
ON DUPLICATE KEY UPDATE balance = 2000;

UPDATE income_ledger 
SET balance = 2000, amount = 2000 
WHERE memberid = 1005 
ORDER BY ledgerid DESC LIMIT 1;

-- Verify balances
SELECT memberid, balance FROM income_ledger 
WHERE memberid IN (1000, 1001, 1002, 1004, 1005)
ORDER BY ledgerid DESC;

