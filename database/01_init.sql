-- ============================================
-- GoldElevate Database Initialization Script
-- ============================================
-- This script creates all tables, indexes, procedures, triggers, and views
-- Includes all migrations applied up to date
-- Includes test users: testuser and testadmin
-- ============================================

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- DROP EXISTING OBJECTS
-- ============================================

DROP PROCEDURE IF EXISTS `proc_leave`;
DROP PROCEDURE IF EXISTS `proc_join`;
DROP PROCEDURE IF EXISTS `proc_member`;
DROP PROCEDURE IF EXISTS `proc_member_as`;
DROP TRIGGER IF EXISTS `trig_member`;
DROP VIEW IF EXISTS `view_balance`;
DROP VIEW IF EXISTS `view_sdownlines`;

DROP TABLE IF EXISTS `tt_post`;
DROP TABLE IF EXISTS `tt`;

DROP TABLE IF EXISTS `income_ledger`;
DROP TABLE IF EXISTS `income_amount`;
DROP TABLE IF EXISTS `income`;

DROP TABLE IF EXISTS `sale_lineitem`;
DROP TABLE IF EXISTS `sale_basket`;
DROP TABLE IF EXISTS `sale`;

DROP TABLE IF EXISTS `family_leftright`;
DROP TABLE IF EXISTS `family`;
DROP TABLE IF EXISTS `member_withdraw`;
DROP TABLE IF EXISTS `member_trigger`;
DROP TABLE IF EXISTS `member_affiliate`;
DROP TABLE IF EXISTS `member_ip`;
DROP TABLE IF EXISTS `member`;
DROP TABLE IF EXISTS `member_signup`;

DROP TABLE IF EXISTS `product_detail`;
DROP TABLE IF EXISTS `product_package`;
DROP TABLE IF EXISTS `product_gallery`;
DROP TABLE IF EXISTS `product_category`;

DROP TABLE IF EXISTS `cron_4week`;
DROP TABLE IF EXISTS `cron_1week`;
DROP TABLE IF EXISTS `def_match`;
DROP TABLE IF EXISTS `def_direct`;
DROP TABLE IF EXISTS `def_type`;
DROP TABLE IF EXISTS `admin`;

DROP TABLE IF EXISTS `payment_gateway_settings`;
DROP TABLE IF EXISTS `upi_payment`;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- CREATE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS `admin` (
  `adminid` set("ROOT","ACCOUNTING","SUPPORT","MARKETING") default "SUPPORT",
  `login` varchar(10) NOT NULL DEFAULT '',
  `passwd` varchar(40) NOT NULL DEFAULT '',
  `status` enum('Yes','No') DEFAULT 'Yes',
  `created` datetime DEFAULT NULL,
  PRIMARY KEY (`login`),
  UNIQUE KEY `login` (`login`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `def_type` (
  `typeid` tinyint(3) unsigned NOT NULL,
  `short` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) DEFAULT NULL,
  `bv` int(10) unsigned DEFAULT NULL,
  `price` int(10) unsigned DEFAULT NULL,
  `yes21` enum('Yes','No') default 'No',
  `c_upper` int(10) unsigned DEFAULT NULL,
  `daily_return` double DEFAULT NULL,
  PRIMARY KEY (`typeid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `def_direct` (
  `directid` tinyint(3) unsigned NOT NULL,
  `typeid` tinyint(3) unsigned NOT NULL,
  `whoid` tinyint(3) unsigned NOT NULL,
  bonus	double,
  PRIMARY KEY (`directid`),
  foreign key (typeid) references def_type (typeid) on delete cascade,
  foreign key (whoid) references def_type (typeid) on delete cascade
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `def_match` (
  matchid tinyint unsigned not null,
  typeid tinyint unsigned not null,
  lev tinyint unsigned not null,
  rate double not null default 0,
  primary key (matchid),
  foreign key (typeid) references def_type (typeid) on delete cascade
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `cron_1week` (
  `c1_id` int(10) unsigned NOT NULL,
  `daily` date NOT NULL,
  `weekly` tinyint(4) DEFAULT NULL,
  `statusBinary` enum('Yes','No') DEFAULT 'No',
  `statusUp` enum('Yes','No') DEFAULT 'No',
  `statusAffiliate` enum('Yes','No') DEFAULT 'No',
  PRIMARY KEY (`c1_id`),
  KEY `daily` (`daily`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `cron_4week` (
  `c4_id` int(10) unsigned NOT NULL,
  `daily` date NOT NULL,
  `status` enum('Yes','No') DEFAULT 'No',
  PRIMARY KEY (`c4_id`),
  KEY `daily` (`daily`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `product_category` (
  `categoryid` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) DEFAULT NULL,
  `description` text,
  `created` datetime DEFAULT NULL,
  PRIMARY KEY (`categoryid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `product_gallery` (
  `galleryid` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `categoryid` int(10) unsigned DEFAULT NULL,
  `status` enum('Yes','No','Pending') NOT NULL DEFAULT 'Yes',
  `title` VARCHAR(255) DEFAULT NULL,
  `description` text,
  `price` double DEFAULT '0',
  `bv` double DEFAULT '0',
  `sh` double DEFAULT '0',
  `full` VARCHAR(255) DEFAULT NULL,
  `logo` VARCHAR(255) DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  `moment` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`galleryid`),
  KEY `categoryid` (`categoryid`),
  CONSTRAINT `gallery_ibfk_1` FOREIGN KEY (`categoryid`)  REFERENCES `product_category` (`categoryid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `product_package` (
  `packageid` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) DEFAULT NULL,
  `description` text,
  `price` double DEFAULT NULL,
  `sh` double DEFAULT NULL,
  `bv` double DEFAULT NULL,
  `status` enum('Yes','No','Pending') DEFAULT 'Yes',
  `sumnum` smallint(5) unsigned DEFAULT '0',
  `logo` VARCHAR(255) DEFAULT NULL,
  `typeid` tinyint(3) unsigned DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  PRIMARY KEY (`packageid`),
  KEY `typeid` (`typeid`),
  CONSTRAINT `package_ibfk_1` FOREIGN KEY (`typeid`) REFERENCES `def_type` (`typeid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `product_detail` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `packageid` int(10) unsigned NOT NULL,
  `galleryid` int(10) unsigned NOT NULL,
  `num` smallint(5) unsigned DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `packageid` (`packageid`),
  KEY `galleryid` (`galleryid`),
  CONSTRAINT `detail_ibfk_1` FOREIGN KEY (`packageid`) REFERENCES `product_package` (`packageid`) ON DELETE CASCADE,
  CONSTRAINT `detail_ibfk_2` FOREIGN KEY (`galleryid`) REFERENCES `product_gallery` (`galleryid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `member_signup` (
  `signupid` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sidlogin` VARCHAR(16) NOT NULL DEFAULT '',
  `memberid` int(10) unsigned NOT NULL DEFAULT '0',
  `login` VARCHAR(16) NOT NULL DEFAULT '',
  `passwd` VARCHAR(255) NOT NULL DEFAULT '',
  `email` VARCHAR(255) NOT NULL DEFAULT '',
  `firstname` VARCHAR(255) DEFAULT NULL,
  `lastname` VARCHAR(255) DEFAULT NULL,
  `street` VARCHAR(255) DEFAULT NULL,
  `city` VARCHAR(255) DEFAULT NULL,
  `state` VARCHAR(255) DEFAULT NULL,
  `zip` VARCHAR(255) DEFAULT NULL,
  `country` VARCHAR(255) DEFAULT NULL,
  `ip` VARCHAR(15) DEFAULT NULL,
  `signuptime` datetime DEFAULT NULL,
  `pid` int(11) unsigned DEFAULT NULL,
  `leg` enum('R','L') DEFAULT NULL,
  `packageid` tinyint(3) unsigned NOT NULL,
  `signupstatus` enum('Yes','Bulk','No') DEFAULT 'Yes',
  PRIMARY KEY (`signupid`),
  KEY `sidlogin` (`sidlogin`,`signupstatus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Member table with all migrations applied:
-- - typeid is nullable (migration: make_typeid_nullable.sql)
-- - phone column added (migration: 03_add_phone_column.sql)
-- - signup_type column added (migration: 05_add_signup_type.sql)
CREATE TABLE IF NOT EXISTS `member` (
  `memberid` int(10) unsigned NOT NULL DEFAULT '0',
  `login` VARCHAR(16) NOT NULL DEFAULT '',
  `passwd` VARCHAR(255) NOT NULL DEFAULT '',
  `signup_type` enum('otp', 'password') DEFAULT 'password',
  `active` enum('Yes','No','Wait','First') NOT NULL DEFAULT 'First',
  `typeid` tinyint(3) unsigned NULL,
  `email` VARCHAR(255) NOT NULL DEFAULT '',
  `phone` VARCHAR(10) NULL,
  `sid` int(11) unsigned NOT NULL DEFAULT '1',
  `pid` int(11) unsigned NOT NULL DEFAULT '1',
  `top` int(11) unsigned NOT NULL DEFAULT '1',
  `leg` enum('R','L') NOT NULL DEFAULT 'L',
  `milel` int(11) DEFAULT '0',
  `miler` int(11) DEFAULT '0',
  `comm` enum('Credit','Check','Wire','Debit','Cache','Advanced','Other') DEFAULT 'Other',
  `firstname` VARCHAR(255) DEFAULT NULL,
  `lastname` VARCHAR(255) DEFAULT NULL,
  `street` VARCHAR(255) DEFAULT NULL,
  `city` VARCHAR(255) DEFAULT NULL,
  `state` VARCHAR(255) DEFAULT NULL,
  `zip` VARCHAR(255) DEFAULT NULL,
  `country` VARCHAR(255) DEFAULT NULL,
  `defpid` int(11) DEFAULT NULL,
  `defleg` enum('R','L') DEFAULT NULL,
  `countl` mediumint(9) DEFAULT '0',
  `countr` mediumint(9) DEFAULT '0',
  `signuptime` datetime DEFAULT NULL,
  `affiliate` int(10) unsigned DEFAULT NULL,
  `reward_points` int(10) unsigned DEFAULT '0',
  `created` datetime DEFAULT NULL,
  `ip` VARCHAR(15) DEFAULT NULL,
  `moment` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`memberid`),
  UNIQUE KEY `login` (`login`),
  UNIQUE KEY `phone` (`phone`),
  KEY `sid` (`sid`),
  KEY `pid` (`pid`),
  KEY `top` (`top`),
  KEY `created` (`created`,`active`),
  KEY `typeid` (`typeid`),
  KEY `affiliate` (`affiliate`),
  KEY `idx_signup_type` (`signup_type`),
  CONSTRAINT `member_ibfk_1` FOREIGN KEY (`typeid`) REFERENCES `def_type` (`typeid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `member_ip` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `ip` int(10) unsigned NOT NULL,
  `login` VARCHAR(255) NOT NULL,
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ret` enum('fail','success') NOT NULL DEFAULT 'fail',
  PRIMARY KEY (`id`),
  KEY `updated` (`updated`),
  KEY `ip` (`ip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `member_affiliate` (
  `memberid` int(10) unsigned NOT NULL,
  created datetime,
  PRIMARY KEY (`memberid`),
  FOREIGN KEY (`memberid`) REFERENCES `member` (`memberid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `member_trigger` (
  `mtid` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `memberid` int(10) unsigned NOT NULL,
  `leg` enum('L','R') NOT NULL,
  `new_mile` int(11) DEFAULT NULL,
  `new_count` int(11) DEFAULT NULL,
  `old_mile` int(11) DEFAULT NULL,
  `old_count` int(11) DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  PRIMARY KEY (`mtid`),
  KEY `memberid` (`memberid`),
  CONSTRAINT `member_trigger_ibfk_1` FOREIGN KEY (`memberid`) REFERENCES `member` (`memberid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Member_withdraw table with payment gateway fields (migration: 04_payment_gateway.sql)
CREATE TABLE IF NOT EXISTS `member_withdraw` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `memberid` INT(10) unsigned NOT NULL DEFAULT '0',
  `amount` DECIMAL(10,2) NOT NULL DEFAULT '0.00',
  `payment_method` ENUM('Bank','UPI') DEFAULT 'Bank',
  `account_number` VARCHAR(50) DEFAULT NULL,
  `ifsc_code` VARCHAR(20) DEFAULT NULL,
  `upi_id` VARCHAR(100) DEFAULT NULL,
  `bank_name` VARCHAR(100) DEFAULT NULL,
  `account_holder_name` VARCHAR(255) DEFAULT NULL,
  `transax_id` VARCHAR(255) NOT NULL,
  `admin_transaction_id` VARCHAR(255) DEFAULT NULL,
  `memo` VARCHAR(255) NOT NULL,
  `status` ENUM('apply','processing','finished','pending','reject') NOT NULL DEFAULT 'apply',
  `created` DATETIME DEFAULT NULL,
  `updated_on` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `member_withdraw_ibfk_1` FOREIGN KEY (`memberid`) REFERENCES `member` (`memberid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `family` (
  `parent` int(10) unsigned NOT NULL,
  `child` int(10) unsigned NOT NULL,
  `leg` enum('L','R') DEFAULT NULL,
  `level` smallint(5) unsigned DEFAULT '1',
  `created` datetime DEFAULT NULL,
  PRIMARY KEY (`parent`,`child`),
  KEY `leg` (`parent`,`leg`),
  KEY `child` (`child`),
  CONSTRAINT `family_ibfk_1` FOREIGN KEY (`parent`) REFERENCES `member` (`memberid`) ON DELETE CASCADE,
  CONSTRAINT `family_ibfk_2` FOREIGN KEY (`child`)  REFERENCES `member` (`memberid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `family_leftright` (
  `leftrightid` int(11) NOT NULL AUTO_INCREMENT,
  `memberid` int(11) unsigned NOT NULL,
  `level` int(11) NOT NULL,
  `paid` enum('Yes','No') DEFAULT 'No',
  `numleft` int(11) DEFAULT '0',
  `numright` int(11) DEFAULT '0',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`leftrightid`),
  UNIQUE KEY `ml` (`memberid`,`level`),
  CONSTRAINT `leftright_ibfk_1` FOREIGN KEY (`memberid`) REFERENCES `member` (`memberid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Sale table with activated_at column (migration: add_activated_at_to_sale.sql)
CREATE TABLE IF NOT EXISTS `sale` (
  `saleid` int(11) NOT NULL AUTO_INCREMENT,
  `memberid` int(10) unsigned DEFAULT NULL,
  `billingid` VARCHAR(255) DEFAULT NULL,
  `amount` double DEFAULT '0',
  `credit` int(11) DEFAULT '0',
  `paytype` enum('CC','Advanced','Manual','Autoship','Check','Refund','Chargeback','Fraud','UPI','Other') NOT NULL DEFAULT 'Other',
  `remark` VARCHAR(255) DEFAULT NULL,
  `paystatus` enum('Pending','Processing','Delivered','Cancel','Other') DEFAULT 'Other',
  `signuptype` enum('Yes','No') DEFAULT 'No',
  `typeid` tinyint(3) unsigned NOT NULL,
  `trackingid` VARCHAR(255) DEFAULT NULL,
  `shipping` double DEFAULT '0',
  `active` enum('Yes','No','Wait','First') NOT NULL DEFAULT 'Wait',
  `activated_at` DATETIME NULL,
  `manager` VARCHAR(255) DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  `moment` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`saleid`),
  KEY `memberid` (`memberid`),
  KEY `typeid` (`typeid`),
  CONSTRAINT `sale_ibfk_1` FOREIGN KEY (`memberid`) REFERENCES `member` (`memberid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `sale_basket` (
  `basketid` int(11) NOT NULL AUTO_INCREMENT,
  `memberid` int(11) unsigned NOT NULL DEFAULT '0',
  `classify` enum('package','gallery') NOT NULL DEFAULT 'package',
  `id` int(11) NOT NULL DEFAULT '0',
  `qty` tinyint(3) unsigned NOT NULL DEFAULT '1',
  `inbasket` enum('Yes','No') DEFAULT 'Yes',
  `created` datetime DEFAULT NULL,
  PRIMARY KEY (`basketid`),
  KEY `memberid` (`memberid`),
  KEY `idc` (`id`,`classify`),
  CONSTRAINT `basket_ibfk_1` FOREIGN KEY (`memberid`) REFERENCES `member` (`memberid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `sale_lineitem` (
  `lineitemid` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `saleid` int(11) NOT NULL DEFAULT '0',
  `basketid` int(11) NOT NULL DEFAULT '0',
  `amount` double DEFAULT '0',
  `credit` double DEFAULT '0',
  PRIMARY KEY (`lineitemid`),
  KEY `saleid` (`saleid`),
  KEY `basketid` (`basketid`),
  CONSTRAINT `lineitem_ibfk_1` FOREIGN KEY (`saleid`) REFERENCES `sale` (`saleid`) ON UPDATE CASCADE,
  CONSTRAINT `lineitem_ibfk_2` FOREIGN KEY (`basketid`) REFERENCES `sale_basket` (`basketid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `upi_payment` (
  `upipaymentid` int(11) NOT NULL AUTO_INCREMENT,
  `saleid` int(11) DEFAULT NULL,
  `memberid` int(10) unsigned DEFAULT NULL,
  `amount` double DEFAULT '0',
  `upi_id` VARCHAR(255) DEFAULT NULL,
  `upi_reference` VARCHAR(255) DEFAULT NULL,
  `transaction_id` VARCHAR(255) DEFAULT NULL,
  `status` enum('Pending','Verified','Failed','Cancelled') DEFAULT 'Pending',
  `verified_by` VARCHAR(255) DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `qr_code_data` TEXT DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`upipaymentid`),
  KEY `saleid` (`saleid`),
  KEY `memberid` (`memberid`),
  KEY `status` (`status`),
  KEY `upi_reference` (`upi_reference`),
  CONSTRAINT `upi_payment_ibfk_1` FOREIGN KEY (`saleid`) REFERENCES `sale` (`saleid`) ON UPDATE CASCADE,
  CONSTRAINT `upi_payment_ibfk_2` FOREIGN KEY (`memberid`) REFERENCES `member` (`memberid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Payment gateway settings table (migration: 04_payment_gateway.sql, 06_add_active_to_payment_gateway.sql)
CREATE TABLE IF NOT EXISTS `payment_gateway_settings` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `upi_id` VARCHAR(255) DEFAULT NULL,
  `qr_code_url` VARCHAR(500) DEFAULT NULL,
  `qr_code_base64` TEXT DEFAULT NULL,
  `bank_account_number` VARCHAR(50) DEFAULT NULL,
  `bank_ifsc_code` VARCHAR(20) DEFAULT NULL,
  `bank_name` VARCHAR(255) DEFAULT NULL,
  `account_holder_name` VARCHAR(255) DEFAULT NULL,
  `gpay_merchant_id` VARCHAR(255) DEFAULT NULL,
  `phonepe_merchant_id` VARCHAR(255) DEFAULT NULL,
  `gpay_enabled` ENUM('Yes','No') DEFAULT 'Yes',
  `phonepe_enabled` ENUM('Yes','No') DEFAULT 'Yes',
  `active` ENUM('Yes', 'No') DEFAULT 'No',
  `updated_by` VARCHAR(255) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `income` (
  `incomeid` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `memberid` int(10) unsigned NOT NULL,
  `classify` enum('direct','binary','matchup','affiliate') DEFAULT NULL,
  `weekid` int(11) unsigned DEFAULT '0',
  `refid` int(11) unsigned DEFAULT '0',
  `paystatus` enum('paid','new','other') DEFAULT 'new',
  `amount` int(11) DEFAULT '0',
  `lev` tinyint unsigned default 0,
  `created` datetime DEFAULT NULL,
  PRIMARY KEY (`incomeid`),
  KEY `weekid` (`weekid`),
  KEY `memberid` (`memberid`),
  CONSTRAINT `income_ibfk_1` FOREIGN KEY (`memberid`) REFERENCES `member` (`memberid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `income_amount` (
  `amount_id` int(11) NOT NULL AUTO_INCREMENT,
  `memberid` int(11) unsigned NOT NULL DEFAULT '0',
  `weekid` int(11) unsigned NOT NULL DEFAULT '0',
  `amount` float DEFAULT 0,
  `bonusType` enum('Direct','Binary','Up','Down','Affiliate') DEFAULT NULL,
  `created` date DEFAULT NULL,
  `status` enum('Done','New') DEFAULT 'New',
  PRIMARY KEY (`amount_id`),
  KEY `weekid` (`weekid`),
  KEY `memberid` (`memberid`),
  CONSTRAINT `income_amount_ibfk_1` FOREIGN KEY (`memberid`) REFERENCES `member` (`memberid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `income_ledger` (
  `ledgerid` int(11) NOT NULL AUTO_INCREMENT,
  `memberid` int(11) unsigned NOT NULL DEFAULT '0',
  `weekid` int(11) unsigned NOT NULL DEFAULT '0',
  `amount` float DEFAULT 0,
  `balance` float DEFAULT 0,
  `shop_balance` float DEFAULT 0,
  `old_ledgerid` int(11) DEFAULT NULL,
  `status` enum('Weekly','Monthly','Withdraw','In','Shopping','Other') DEFAULT 'Other',
  `remark` VARCHAR(255) DEFAULT NULL,
  `manager` VARCHAR(255) DEFAULT NULL,
  `created` date DEFAULT NULL,
  `modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ledgerid`),
  KEY `weekid` (`weekid`),
  KEY `memberid` (`memberid`),
  CONSTRAINT `ledger_ibfk_1` FOREIGN KEY (`memberid`) REFERENCES `member` (`memberid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `tt` (
  `subjectid` int(11) NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `category` enum('Reward','Payment','Account','Other') DEFAULT 'Other',
  `status` enum('Open','Close') DEFAULT 'Open',
  `name` VARCHAR(255) NOT NULL,
  `comm` VARCHAR(255) DEFAULT '',
  `memberid` int(11) unsigned NOT NULL,
  `created` datetime NOT NULL,
  PRIMARY KEY (`subjectid`),
  KEY `created` (`created`),
  KEY `memberid` (`memberid`),
  CONSTRAINT `tt_ibfk_1` FOREIGN KEY (`memberid`) REFERENCES `member` (`memberid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `tt_post` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subjectid` int(11) NOT NULL DEFAULT '0',
  `party` enum('a','m') NOT NULL,
  `description` text,
  `ip` VARCHAR(15) NOT NULL DEFAULT '',
  `created` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `subjectid` (`subjectid`),
  CONSTRAINT `ttpost_ibfk_1` FOREIGN KEY (`subjectid`) REFERENCES `tt` (`subjectid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================
-- CREATE INDEXES (from 02_performance_indexes.sql)
-- ============================================

-- Member table indexes
CREATE INDEX IF NOT EXISTS idx_member_active ON member(active);
CREATE INDEX IF NOT EXISTS idx_member_typeid ON member(typeid);
CREATE INDEX IF NOT EXISTS idx_member_sid ON member(sid);
CREATE INDEX IF NOT EXISTS idx_member_pid ON member(pid);
CREATE INDEX IF NOT EXISTS idx_member_login ON member(login);
CREATE INDEX IF NOT EXISTS idx_member_created ON member(created);
CREATE INDEX IF NOT EXISTS idx_member_active_typeid ON member(active, typeid);
CREATE INDEX IF NOT EXISTS idx_member_active_typeid_sid ON member(active, typeid, sid);

-- Sale table indexes
CREATE INDEX IF NOT EXISTS idx_sale_memberid ON sale(memberid);
CREATE INDEX IF NOT EXISTS idx_sale_signuptype ON sale(signuptype);
CREATE INDEX IF NOT EXISTS idx_sale_paystatus ON sale(paystatus);
CREATE INDEX IF NOT EXISTS idx_sale_created ON sale(created);
CREATE INDEX IF NOT EXISTS idx_sale_typeid ON sale(typeid);
CREATE INDEX IF NOT EXISTS idx_sale_memberid_signuptype ON sale(memberid, signuptype);
CREATE INDEX IF NOT EXISTS idx_sale_paystatus_signuptype ON sale(paystatus, signuptype);
CREATE INDEX IF NOT EXISTS idx_sale_memberid_paystatus_signuptype ON sale(memberid, paystatus, signuptype);

-- Income table indexes
CREATE INDEX IF NOT EXISTS idx_income_memberid ON income(memberid);
CREATE INDEX IF NOT EXISTS idx_income_classify ON income(classify);
CREATE INDEX IF NOT EXISTS idx_income_weekid ON income(weekid);
CREATE INDEX IF NOT EXISTS idx_income_paystatus ON income(paystatus);
CREATE INDEX IF NOT EXISTS idx_income_memberid_classify ON income(memberid, classify);
CREATE INDEX IF NOT EXISTS idx_income_weekid_classify ON income(weekid, classify);

-- Income_amount table indexes
CREATE INDEX IF NOT EXISTS idx_income_amount_memberid ON income_amount(memberid);
CREATE INDEX IF NOT EXISTS idx_income_amount_bonusType ON income_amount(bonusType);
CREATE INDEX IF NOT EXISTS idx_income_amount_status ON income_amount(status);
CREATE INDEX IF NOT EXISTS idx_income_amount_weekid ON income_amount(weekid);
CREATE INDEX IF NOT EXISTS idx_income_amount_created ON income_amount(created);
CREATE INDEX IF NOT EXISTS idx_income_amount_memberid_status ON income_amount(memberid, status);
CREATE INDEX IF NOT EXISTS idx_income_amount_bonusType_status ON income_amount(bonusType, status);
CREATE INDEX IF NOT EXISTS idx_income_amount_memberid_bonusType_status ON income_amount(memberid, bonusType, status);

-- Income_ledger table indexes
CREATE INDEX IF NOT EXISTS idx_income_ledger_memberid ON income_ledger(memberid);
CREATE INDEX IF NOT EXISTS idx_income_ledger_status ON income_ledger(status);
CREATE INDEX IF NOT EXISTS idx_income_ledger_weekid ON income_ledger(weekid);
CREATE INDEX IF NOT EXISTS idx_income_ledger_created ON income_ledger(created);
CREATE INDEX IF NOT EXISTS idx_income_ledger_memberid_status ON income_ledger(memberid, status);

-- UPI Payment table indexes
CREATE INDEX IF NOT EXISTS idx_upi_payment_memberid ON upi_payment(memberid);
CREATE INDEX IF NOT EXISTS idx_upi_payment_status ON upi_payment(status);
CREATE INDEX IF NOT EXISTS idx_upi_payment_saleid ON upi_payment(saleid);
CREATE INDEX IF NOT EXISTS idx_upi_payment_transaction_id ON upi_payment(transaction_id);
CREATE INDEX IF NOT EXISTS idx_upi_payment_upi_reference ON upi_payment(upi_reference);
CREATE INDEX IF NOT EXISTS idx_upi_payment_created ON upi_payment(created);
CREATE INDEX IF NOT EXISTS idx_upi_payment_memberid_status ON upi_payment(memberid, status);

-- Member_signup table indexes
CREATE INDEX IF NOT EXISTS idx_member_signup_memberid ON member_signup(memberid);
CREATE INDEX IF NOT EXISTS idx_member_signup_signupstatus ON member_signup(signupstatus);
CREATE INDEX IF NOT EXISTS idx_member_signup_sidlogin ON member_signup(sidlogin);
CREATE INDEX IF NOT EXISTS idx_member_signup_signuptime ON member_signup(signuptime);
CREATE INDEX IF NOT EXISTS idx_member_signup_packageid ON member_signup(packageid);

-- Def_type table indexes
CREATE INDEX IF NOT EXISTS idx_def_type_price ON def_type(price);
CREATE INDEX IF NOT EXISTS idx_def_type_daily_return ON def_type(daily_return);

-- Def_direct table indexes
CREATE INDEX IF NOT EXISTS idx_def_direct_typeid ON def_direct(typeid);
CREATE INDEX IF NOT EXISTS idx_def_direct_whoid ON def_direct(whoid);
CREATE INDEX IF NOT EXISTS idx_def_direct_typeid_whoid ON def_direct(typeid, whoid);

-- Product_package table indexes
CREATE INDEX IF NOT EXISTS idx_product_package_typeid ON product_package(typeid);
CREATE INDEX IF NOT EXISTS idx_product_package_packageid ON product_package(packageid);

-- ============================================
-- CREATE PROCEDURES
-- ============================================

DELIMITER //
CREATE PROCEDURE `proc_member`(
IN i_login VARCHAR(255),
IN i_passwd VARCHAR(255),
IN i_ip INT unsigned,
OUT memberid INT unsigned, OUT m_active   VARCHAR(255),
OUT m_type   VARCHAR(255), OUT m_email    VARCHAR(255),
OUT m_firstname   VARCHAR(255), OUT m_lastname VARCHAR(255),
OUT m_sid    INT unsigned, OUT m_pid      INT unsigned,
OUT m_top    INT unsigned, OUT m_leg      VARCHAR(255))
BEGIN
  DECLARE c1 INT;
  DECLARE c2 INT;
  SELECT COUNT(*) INTO c1 FROM member_ip WHERE ret='fail' AND ip=i_ip AND login=i_login AND (UNIX_TIMESTAMP(updated) >= (UNIX_TIMESTAMP(NOW())-3600));
  SELECT COUNT(*) INTO c2 FROM member_ip WHERE ret='fail' AND ip=i_ip AND (UNIX_TIMESTAMP(updated) >= (UNIX_TIMESTAMP(NOW())-24*3600));
  IF (c1<=5 AND c2<=20) THEN
    SELECT m.memberid, m.email, m.active, t.short, m.firstname, m.lastname, m.sid, m.pid, m.top, m.leg
    INTO memberid, m_email, m_active, m_type, m_firstname, m_lastname, m_sid, m_pid, m_top, m_leg
    FROM member m
    INNER JOIN def_type t USING (typeid)
    WHERE m.active IN ("Yes","Wait", "First")
    AND m.login=i_login
    AND m.passwd=SHA1(concat(i_login, i_passwd));

    IF ISNULL(memberid) THEN
      INSERT INTO member_ip (ip, login, ret) VALUES (i_ip, i_login, 'fail');
    ELSE
      DELETE FROM member_ip WHERE ret='fail' AND ip=i_ip AND (UNIX_TIMESTAMP(updated) >= (UNIX_TIMESTAMP(NOW())-24*3600));
      INSERT INTO member_ip (ip, login, ret) VALUES (i_ip, i_login, 'success');
    END IF;
  ELSE
    SELECT '1030' INTO memberid;
  END IF;
END//
DELIMITER ;

DELIMITER //
CREATE PROCEDURE `proc_member_as`(
IN i_login VARCHAR(255),
OUT memberid INT unsigned, OUT m_active   VARCHAR(255),
OUT m_type   VARCHAR(255), OUT m_email    VARCHAR(255),
OUT m_firstname   VARCHAR(255), OUT m_lastname VARCHAR(255),
OUT m_sid    INT unsigned, OUT m_pid      INT unsigned,
OUT m_top    INT unsigned, OUT m_leg      VARCHAR(255))
BEGIN
    SELECT m.memberid, m.email, m.active, t.short, m.firstname, m.lastname, m.sid, m.pid, m.top, m.leg
    INTO memberid, m_email, m_active, m_type, m_firstname, m_lastname, m_sid, m_pid, m_top, m_leg
    FROM member m
    INNER JOIN def_type t USING (typeid)
    WHERE m.active IN ("Yes","Wait", "First")
    AND m.login=i_login;
END//
DELIMITER ;

DELIMITER ~
CREATE PROCEDURE proc_leave(IN mid INT unsigned)
BEGIN
	DROP TEMPORARY TABLE IF EXISTS temp_leave;
	CREATE TEMPORARY TABLE temp_leave
	SELECT f.parent, f.leg, f.child, f.level, t.bv
	FROM family f
	INNER JOIN member m ON (f.child=m.memberid)
	INNER JOIN def_type t USING (typeid)
	WHERE (f.child=mid OR f.child IN (SELECT child FROM family WHERE parent=mid))
	AND (f.parent!=mid AND f.parent NOT IN (SELECT child FROM family WHERE parent=mid));

	DROP TEMPORARY TABLE IF EXISTS temp_leave_level;
	CREATE TEMPORARY TABLE temp_leave_level
	SELECT parent, level, SUM(IF(leg='L',1,0)) AS cleft, SUM(IF(leg='R',1,0)) AS cright, SUM(IF(leg='L',bv,0)) AS sleft, SUM(IF(leg='R',bv,0)) AS sright
	FROM temp_leave
	GROUP BY parent, level;

	DROP TEMPORARY TABLE IF EXISTS temp_leave_total;
	CREATE TEMPORARY TABLE temp_leave_total
	SELECT parent, sum(cleft) AS cleft, sum(sleft) AS sleft, sum(cright) AS cright, sum(sright) AS sright
	FROM temp_leave_level
	GROUP BY parent;
END~
DELIMITER ;

DELIMITER ~
CREATE PROCEDURE proc_join(IN mid INT unsigned, IN pid INT unsigned, IN mleg enum('L','R'))
BEGIN
	DROP TEMPORARY TABLE IF EXISTS temp_join;
	CREATE TEMPORARY TABLE temp_join
	SELECT CONCAT(pid) AS parent, CONCAT(mid) AS child, CONCAT(mleg) AS leg, 1 AS level
	UNION
	SELECT CONCAT(pid) AS parent, child, CONCAT(mleg) AS leg, (level+1) AS level
	FROM family WHERE parent=mid
	UNION
	SELECT f.parent, tmp.child, f.leg, (f.level + tmp.level) AS level
	FROM family f
	INNER JOIN (
		SELECT CONCAT(pid) AS parent, CONCAT(mid) AS child, CONCAT(mleg) AS leg, 1 AS level
		UNION
		SELECT CONCAT(pid) AS parent, child, CONCAT(mleg) AS leg, (level+1) AS level
		FROM family WHERE parent=mid
	) tmp ON (f.child=tmp.parent)
	WHERE f.child=pid;

	DROP TEMPORARY TABLE IF EXISTS temp_join_level;
	CREATE TEMPORARY TABLE temp_join_level
	SELECT parent, level, SUM(IF(leg='L',1,0)) AS cleft, SUM(IF(leg='R',1,0)) AS cright, SUM(IF(leg='L',bv,0)) AS sleft, SUM(IF(leg='R',bv,0)) AS sright
	FROM temp_join f
	INNER JOIN member m ON (f.child=m.memberid)
	INNER JOIN def_type t USING (typeid)
	GROUP BY parent, level;

	DROP TEMPORARY TABLE IF EXISTS temp_join_total;
	CREATE TEMPORARY TABLE temp_join_total
	SELECT parent, sum(cleft) AS cleft, sum(sleft) AS sleft, sum(cright) AS cright, sum(sright) AS sright
	FROm temp_join_level
	GROUP BY parent;
END~
DELIMITER ;

-- ============================================
-- CREATE TRIGGERS
-- ============================================

DELIMITER //
CREATE TRIGGER `trig_member` AFTER UPDATE ON `member` FOR EACH ROW BEGIN
  IF (((NEW.milel <=> OLD.milel) = 0) || ((NEW.countl <=> OLD.countl) = 0)) THEN
    INSERT INTO member_trigger (memberid, leg, new_mile, new_count, old_mile, old_count, created) VALUES (NEW.memberid, 'L', NEW.milel, NEW.countl, OLD.milel, OLD.countl, NOW());
  END IF;
  IF (((NEW.miler <=> OLD.miler) = 0) || ((NEW.countr <=> OLD.countr) = 0)) THEN
    INSERT INTO member_trigger (memberid, leg, new_mile, new_count, old_mile, old_count, created) VALUES (NEW.memberid, 'R', NEW.miler, NEW.countr, OLD.miler, OLD.countr, NOW());
  END IF;
END//
DELIMITER ;

-- ============================================
-- CREATE VIEWS
-- ============================================

CREATE VIEW `view_balance` AS select `income_ledger`.`memberid` AS `memberid`,max(`income_ledger`.`ledgerid`) AS `ledgerid` from `income_ledger` group by `income_ledger`.`memberid`;

CREATE VIEW `view_sdownlines` AS select `s`.`memberid` AS `memberid`,max(`s`.`typeid`) AS `typeid`,max(`s`.`active`) AS `active`,count(0) AS `c` from ((`member` `m` join `member` `s` on((`m`.`sid` = `s`.`memberid`))) join `def_type` `t` on((`s`.`typeid` = `t`.`typeid`))) where (`m`.`active` = 'Yes') group by `s`.`memberid`;

-- ============================================
-- INSERT TEST DATA
-- ============================================

-- Insert test admin: testadmin / admin123
-- Password: SHA1(CONCAT('testadmin', 'admin123'))
INSERT INTO `admin` (`adminid`, `login`, `passwd`, `status`, `created`)
VALUES ('ROOT', 'testadmin', SHA1(CONCAT('testadmin', 'admin123')), 'Yes', NOW())
ON DUPLICATE KEY UPDATE `passwd` = SHA1(CONCAT('testadmin', 'admin123'));

-- Insert test member: testuser / testpass123
-- Password: SHA1(CONCAT('testuser', 'testpass123'))
-- Note: Since typeid is nullable, we can insert without a def_type entry
-- If you have def_type data, you can set typeid to an existing typeid value
-- For now, we'll insert with typeid = NULL (user can purchase a package later)

-- Get the next available memberid
SET @next_memberid = (SELECT COALESCE(MAX(memberid), 0) + 1 FROM `member`);

-- Insert test user if it doesn't exist
INSERT INTO `member` (`memberid`, `login`, `passwd`, `signup_type`, `active`, `typeid`, `email`, `phone`, `firstname`, `lastname`, `sid`, `pid`, `top`, `leg`, `reward_points`, `created`)
SELECT 
  @next_memberid as memberid,
  'testuser' as login,
  SHA1(CONCAT('testuser', 'testpass123')) as passwd,
  'password' as signup_type,
  'Yes' as active,
  NULL as typeid,  -- NULL since user hasn't purchased a package yet
  'test@example.com' as email,
  '9999999999' as phone,
  'Test' as firstname,
  'User' as lastname,
  1 as sid,
  1 as pid,
  1 as top,
  'L' as leg,
  150 as reward_points,
  NOW() as created
WHERE NOT EXISTS (SELECT 1 FROM `member` WHERE `login` = 'testuser');

-- ============================================
-- END OF INIT SCRIPT
-- ============================================
