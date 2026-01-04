-- Add test payments (some pending, some for rejection)
INSERT INTO upi_payment (saleid, memberid, amount, upi_id, upi_reference, transaction_id, status, created)
VALUES
  (NULL, 1000, 5000, 'test@upi', 'REF001', 'TXN001', 'Pending', NOW() - INTERVAL 2 DAY),
  (NULL, 1001, 10000, 'test@upi', 'REF002', 'TXN002', 'Pending', NOW() - INTERVAL 1 DAY),
  (NULL, 1002, 15000, 'test@upi', 'REF003', 'TXN003', 'Pending', NOW()),
  (NULL, 1003, 20000, 'test@upi', 'REF004', 'TXN004', 'Pending', NOW() - INTERVAL 3 DAY)
ON DUPLICATE KEY UPDATE created = created;

-- Add test withdrawals (some pending, some for rejection)
INSERT INTO member_withdraw (memberid, amount, payment_method, account_number, ifsc_code, upi_id, bank_name, account_holder_name, transax_id, memo, status, created)
VALUES
  (1000, 500, 'Bank', '1234567890', 'IFSC001', NULL, 'Test Bank', 'Test User 1', CONCAT('WD', UNIX_TIMESTAMP(), '001'), 'Test withdrawal 1', 'apply', NOW() - INTERVAL 2 DAY),
  (1001, 1000, 'UPI', NULL, NULL, 'testuser1@upi', NULL, 'Test User 2', CONCAT('WD', UNIX_TIMESTAMP(), '002'), 'Test withdrawal 2', 'apply', NOW() - INTERVAL 1 DAY),
  (1002, 1500, 'Bank', '9876543210', 'IFSC002', NULL, 'Test Bank 2', 'Test User 3', CONCAT('WD', UNIX_TIMESTAMP(), '003'), 'Test withdrawal 3', 'apply', NOW()),
  (1003, 2000, 'UPI', NULL, NULL, 'testuser3@upi', NULL, 'Test User 4', CONCAT('WD', UNIX_TIMESTAMP(), '004'), 'Test withdrawal 4', 'apply', NOW() - INTERVAL 3 DAY)
ON DUPLICATE KEY UPDATE created = created;

SELECT 'Test payments and withdrawals added successfully!' as message;
