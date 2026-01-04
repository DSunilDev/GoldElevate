-- First, ensure we have a valid typeid (use typeid 1 if it exists, otherwise create one)
INSERT INTO def_type (typeid, short, name, bv, price, yes21, c_upper, daily_return)
VALUES (1, 'Starter', 'Starter Package', 100, 5000, 'No', 0, 200)
ON DUPLICATE KEY UPDATE short = VALUES(short);

-- Create Test Member (using typeid 1)
INSERT INTO member (memberid, login, passwd, active, typeid, email, firstname, lastname, phone, sid, pid, top, leg, signuptime, created)
VALUES (1000, 'testuser', SHA1(CONCAT('testuser', 'test123')), 'Yes', 1, 'test@example.com', 'Test', 'User', '9876543210', 1, 1, 1, 'L', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  login = VALUES(login),
  phone = VALUES(phone),
  active = 'Yes';

-- Create Test Admin (admin login uses phone as login in this schema)
INSERT INTO admin (adminid, login, passwd, status, created)
VALUES ('SUPPORT', '9999999999', SHA1(CONCAT('9999999999', 'admin123')), 'Yes', NOW())
ON DUPLICATE KEY UPDATE
  login = VALUES(login),
  status = 'Yes';

-- Also create admin with login 'admin' for alternative login method
INSERT INTO admin (adminid, login, passwd, status, created)
VALUES ('SUPPORT', 'admin', SHA1(CONCAT('admin', 'admin123')), 'Yes', NOW())
ON DUPLICATE KEY UPDATE
  status = 'Yes';

-- Verify test users were created
SELECT 'Test Member Created' as status, memberid, login, phone, active FROM member WHERE memberid = 1000;
SELECT 'Test Admin Created' as status, adminid, login, status FROM admin WHERE login IN ('9999999999', 'admin');
