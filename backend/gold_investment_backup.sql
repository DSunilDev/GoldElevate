-- MySQL dump 10.13  Distrib 9.5.0, for macos15.7 (arm64)
--
-- Host: localhost    Database: gold_investment
-- ------------------------------------------------------
-- Server version	9.5.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '85758f8c-e28c-11f0-8de2-1de6291b0ceb:1-177';

--
-- Current Database: `gold_investment`
--

/*!40000 DROP DATABASE IF EXISTS `gold_investment`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `gold_investment` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `gold_investment`;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `adminid` set('ROOT','ACCOUNTING','SUPPORT','MARKETING') DEFAULT 'SUPPORT',
  `login` varchar(10) NOT NULL DEFAULT '',
  `passwd` varchar(40) NOT NULL DEFAULT '',
  `status` enum('Yes','No') DEFAULT 'Yes',
  `created` datetime DEFAULT NULL,
  PRIMARY KEY (`login`),
  UNIQUE KEY `login` (`login`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES ('ROOT','testadmin','3f78d6c553d6cc05e29a13c52a6db4f8b43989c8','Yes','2026-01-05 14:53:47');
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cron_1week`
--

DROP TABLE IF EXISTS `cron_1week`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cron_1week` (
  `c1_id` int unsigned NOT NULL,
  `daily` date NOT NULL,
  `weekly` tinyint DEFAULT NULL,
  `statusBinary` enum('Yes','No') DEFAULT 'No',
  `statusUp` enum('Yes','No') DEFAULT 'No',
  `statusAffiliate` enum('Yes','No') DEFAULT 'No',
  PRIMARY KEY (`c1_id`),
  KEY `daily` (`daily`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cron_1week`
--

LOCK TABLES `cron_1week` WRITE;
/*!40000 ALTER TABLE `cron_1week` DISABLE KEYS */;
/*!40000 ALTER TABLE `cron_1week` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cron_4week`
--

DROP TABLE IF EXISTS `cron_4week`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cron_4week` (
  `c4_id` int unsigned NOT NULL,
  `daily` date NOT NULL,
  `status` enum('Yes','No') DEFAULT 'No',
  PRIMARY KEY (`c4_id`),
  KEY `daily` (`daily`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cron_4week`
--

LOCK TABLES `cron_4week` WRITE;
/*!40000 ALTER TABLE `cron_4week` DISABLE KEYS */;
/*!40000 ALTER TABLE `cron_4week` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `def_direct`
--

DROP TABLE IF EXISTS `def_direct`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `def_direct` (
  `directid` tinyint unsigned NOT NULL,
  `typeid` tinyint unsigned NOT NULL,
  `whoid` tinyint unsigned NOT NULL,
  `bonus` double DEFAULT NULL,
  PRIMARY KEY (`directid`),
  KEY `typeid` (`typeid`),
  KEY `whoid` (`whoid`),
  CONSTRAINT `def_direct_ibfk_1` FOREIGN KEY (`typeid`) REFERENCES `def_type` (`typeid`) ON DELETE CASCADE,
  CONSTRAINT `def_direct_ibfk_2` FOREIGN KEY (`whoid`) REFERENCES `def_type` (`typeid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `def_direct`
--

LOCK TABLES `def_direct` WRITE;
/*!40000 ALTER TABLE `def_direct` DISABLE KEYS */;
/*!40000 ALTER TABLE `def_direct` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `def_match`
--

DROP TABLE IF EXISTS `def_match`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `def_match` (
  `matchid` tinyint unsigned NOT NULL,
  `typeid` tinyint unsigned NOT NULL,
  `lev` tinyint unsigned NOT NULL,
  `rate` double NOT NULL DEFAULT '0',
  PRIMARY KEY (`matchid`),
  KEY `typeid` (`typeid`),
  CONSTRAINT `def_match_ibfk_1` FOREIGN KEY (`typeid`) REFERENCES `def_type` (`typeid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `def_match`
--

LOCK TABLES `def_match` WRITE;
/*!40000 ALTER TABLE `def_match` DISABLE KEYS */;
/*!40000 ALTER TABLE `def_match` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `def_type`
--

DROP TABLE IF EXISTS `def_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `def_type` (
  `typeid` tinyint unsigned NOT NULL,
  `short` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `bv` int unsigned DEFAULT NULL,
  `price` int unsigned DEFAULT NULL,
  `yes21` enum('Yes','No') DEFAULT 'No',
  `c_upper` int unsigned DEFAULT NULL,
  `daily_return` double DEFAULT NULL,
  PRIMARY KEY (`typeid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `def_type`
--

LOCK TABLES `def_type` WRITE;
/*!40000 ALTER TABLE `def_type` DISABLE KEYS */;
INSERT INTO `def_type` VALUES (1,'premium','Premium',800,80000,'No',NULL,2600),(2,'brahmastra','Brahmastra',500,50000,'No',NULL,2000),(3,'master','Master',400,40000,'No',NULL,1600),(4,'expert','Expert',200,20000,'No',NULL,800),(5,'intermediate','Intermediate',100,10000,'No',NULL,400),(6,'starter','Starter',50,5000,'No',NULL,200);
/*!40000 ALTER TABLE `def_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `family`
--

DROP TABLE IF EXISTS `family`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `family` (
  `parent` int unsigned NOT NULL,
  `child` int unsigned NOT NULL,
  `leg` enum('L','R') DEFAULT NULL,
  `level` smallint unsigned DEFAULT '1',
  `created` datetime DEFAULT NULL,
  PRIMARY KEY (`parent`,`child`),
  KEY `leg` (`parent`,`leg`),
  KEY `child` (`child`),
  CONSTRAINT `family_ibfk_1` FOREIGN KEY (`parent`) REFERENCES `member` (`memberid`) ON DELETE CASCADE,
  CONSTRAINT `family_ibfk_2` FOREIGN KEY (`child`) REFERENCES `member` (`memberid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `family`
--

LOCK TABLES `family` WRITE;
/*!40000 ALTER TABLE `family` DISABLE KEYS */;
/*!40000 ALTER TABLE `family` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `family_leftright`
--

DROP TABLE IF EXISTS `family_leftright`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `family_leftright` (
  `leftrightid` int NOT NULL AUTO_INCREMENT,
  `memberid` int unsigned NOT NULL,
  `level` int NOT NULL,
  `paid` enum('Yes','No') DEFAULT 'No',
  `numleft` int DEFAULT '0',
  `numright` int DEFAULT '0',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`leftrightid`),
  UNIQUE KEY `ml` (`memberid`,`level`),
  CONSTRAINT `leftright_ibfk_1` FOREIGN KEY (`memberid`) REFERENCES `member` (`memberid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `family_leftright`
--

LOCK TABLES `family_leftright` WRITE;
/*!40000 ALTER TABLE `family_leftright` DISABLE KEYS */;
/*!40000 ALTER TABLE `family_leftright` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `income`
--

DROP TABLE IF EXISTS `income`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `income` (
  `incomeid` int unsigned NOT NULL AUTO_INCREMENT,
  `memberid` int unsigned NOT NULL,
  `classify` enum('direct','binary','matchup','affiliate') DEFAULT NULL,
  `weekid` int unsigned DEFAULT '0',
  `refid` int unsigned DEFAULT '0',
  `paystatus` enum('paid','new','other') DEFAULT 'new',
  `amount` int DEFAULT '0',
  `lev` tinyint unsigned DEFAULT '0',
  `created` datetime DEFAULT NULL,
  PRIMARY KEY (`incomeid`),
  KEY `weekid` (`weekid`),
  KEY `memberid` (`memberid`),
  CONSTRAINT `income_ibfk_1` FOREIGN KEY (`memberid`) REFERENCES `member` (`memberid`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `income`
--

LOCK TABLES `income` WRITE;
/*!40000 ALTER TABLE `income` DISABLE KEYS */;
INSERT INTO `income` VALUES (1,1,'direct',0,0,'new',1000,0,'2026-01-05 14:53:47');
/*!40000 ALTER TABLE `income` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `income_amount`
--

DROP TABLE IF EXISTS `income_amount`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `income_amount` (
  `amount_id` int NOT NULL AUTO_INCREMENT,
  `memberid` int unsigned NOT NULL DEFAULT '0',
  `weekid` int unsigned NOT NULL DEFAULT '0',
  `amount` float DEFAULT '0',
  `bonusType` enum('Direct','Binary','Up','Down','Affiliate') DEFAULT NULL,
  `created` date DEFAULT NULL,
  `status` enum('Done','New') DEFAULT 'New',
  PRIMARY KEY (`amount_id`),
  KEY `weekid` (`weekid`),
  KEY `memberid` (`memberid`),
  CONSTRAINT `income_amount_ibfk_1` FOREIGN KEY (`memberid`) REFERENCES `member` (`memberid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `income_amount`
--

LOCK TABLES `income_amount` WRITE;
/*!40000 ALTER TABLE `income_amount` DISABLE KEYS */;
/*!40000 ALTER TABLE `income_amount` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `income_ledger`
--

DROP TABLE IF EXISTS `income_ledger`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `income_ledger` (
  `ledgerid` int NOT NULL AUTO_INCREMENT,
  `memberid` int unsigned NOT NULL DEFAULT '0',
  `weekid` int unsigned NOT NULL DEFAULT '0',
  `amount` float DEFAULT '0',
  `balance` float DEFAULT '0',
  `shop_balance` float DEFAULT '0',
  `old_ledgerid` int DEFAULT NULL,
  `status` enum('Weekly','Monthly','Withdraw','In','Shopping','Other') DEFAULT 'Other',
  `remark` varchar(255) DEFAULT NULL,
  `manager` varchar(255) DEFAULT NULL,
  `created` date DEFAULT NULL,
  `modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ledgerid`),
  KEY `weekid` (`weekid`),
  KEY `memberid` (`memberid`),
  CONSTRAINT `ledger_ibfk_1` FOREIGN KEY (`memberid`) REFERENCES `member` (`memberid`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `income_ledger`
--

LOCK TABLES `income_ledger` WRITE;
/*!40000 ALTER TABLE `income_ledger` DISABLE KEYS */;
INSERT INTO `income_ledger` VALUES (1,1,0,200,200,0,NULL,'Weekly','Daily return',NULL,'2026-01-05','2026-01-05 09:23:47');
/*!40000 ALTER TABLE `income_ledger` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `member`
--

DROP TABLE IF EXISTS `member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member` (
  `memberid` int unsigned NOT NULL DEFAULT '0',
  `login` varchar(16) NOT NULL DEFAULT '',
  `passwd` varchar(255) NOT NULL DEFAULT '',
  `active` enum('Yes','No','Wait','First') NOT NULL DEFAULT 'First',
  `typeid` tinyint unsigned NOT NULL,
  `email` varchar(255) NOT NULL DEFAULT '',
  `phone` varchar(10) DEFAULT NULL,
  `sid` int unsigned NOT NULL DEFAULT '1',
  `pid` int unsigned NOT NULL DEFAULT '1',
  `top` int unsigned NOT NULL DEFAULT '1',
  `leg` enum('R','L') NOT NULL DEFAULT 'L',
  `milel` int DEFAULT '0',
  `miler` int DEFAULT '0',
  `comm` enum('Credit','Check','Wire','Debit','Cache','Advanced','Other') DEFAULT 'Other',
  `firstname` varchar(255) DEFAULT NULL,
  `lastname` varchar(255) DEFAULT NULL,
  `street` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `zip` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `defpid` int DEFAULT NULL,
  `defleg` enum('R','L') DEFAULT NULL,
  `countl` mediumint DEFAULT '0',
  `countr` mediumint DEFAULT '0',
  `signuptime` datetime DEFAULT NULL,
  `affiliate` int unsigned DEFAULT NULL,
  `reward_points` int unsigned DEFAULT '0',
  `created` datetime DEFAULT NULL,
  `ip` varchar(15) DEFAULT NULL,
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
  CONSTRAINT `member_ibfk_1` FOREIGN KEY (`typeid`) REFERENCES `def_type` (`typeid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `member`
--

LOCK TABLES `member` WRITE;
/*!40000 ALTER TABLE `member` DISABLE KEYS */;
INSERT INTO `member` VALUES (1,'testuser','fc341876444a1e8c10b8fb2b08cb2b95802a2bfe','Yes',6,'test@example.com',NULL,1,1,1,'L',0,0,'Other','Test','User',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,150,'2026-01-05 14:53:47',NULL,'2026-01-05 09:23:47');
/*!40000 ALTER TABLE `member` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trig_member` AFTER UPDATE ON `member` FOR EACH ROW BEGIN
  IF (((NEW.milel <=> OLD.milel) = 0) || ((NEW.countl <=> OLD.countl) = 0)) THEN
    INSERT INTO member_trigger (memberid, leg, new_mile, new_count, old_mile, old_count, created) VALUES (NEW.memberid, 'L', NEW.milel, NEW.countl, OLD.milel, OLD.countl, NOW());
  END IF;
  IF (((NEW.miler <=> OLD.miler) = 0) || ((NEW.countr <=> OLD.countr) = 0)) THEN
    INSERT INTO member_trigger (memberid, leg, new_mile, new_count, old_mile, old_count, created) VALUES (NEW.memberid, 'R', NEW.miler, NEW.countr, OLD.miler, OLD.countr, NOW());
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `member_affiliate`
--

DROP TABLE IF EXISTS `member_affiliate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member_affiliate` (
  `memberid` int unsigned NOT NULL,
  `created` datetime DEFAULT NULL,
  PRIMARY KEY (`memberid`),
  CONSTRAINT `member_affiliate_ibfk_1` FOREIGN KEY (`memberid`) REFERENCES `member` (`memberid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `member_affiliate`
--

LOCK TABLES `member_affiliate` WRITE;
/*!40000 ALTER TABLE `member_affiliate` DISABLE KEYS */;
/*!40000 ALTER TABLE `member_affiliate` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `member_ip`
--

DROP TABLE IF EXISTS `member_ip`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member_ip` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `ip` int unsigned NOT NULL,
  `login` varchar(255) NOT NULL,
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ret` enum('fail','success') NOT NULL DEFAULT 'fail',
  PRIMARY KEY (`id`),
  KEY `updated` (`updated`),
  KEY `ip` (`ip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `member_ip`
--

LOCK TABLES `member_ip` WRITE;
/*!40000 ALTER TABLE `member_ip` DISABLE KEYS */;
/*!40000 ALTER TABLE `member_ip` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `member_signup`
--

DROP TABLE IF EXISTS `member_signup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member_signup` (
  `signupid` int unsigned NOT NULL AUTO_INCREMENT,
  `sidlogin` varchar(16) NOT NULL DEFAULT '',
  `memberid` int unsigned NOT NULL DEFAULT '0',
  `login` varchar(16) NOT NULL DEFAULT '',
  `passwd` varchar(255) NOT NULL DEFAULT '',
  `email` varchar(255) NOT NULL DEFAULT '',
  `firstname` varchar(255) DEFAULT NULL,
  `lastname` varchar(255) DEFAULT NULL,
  `street` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `zip` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `ip` varchar(15) DEFAULT NULL,
  `signuptime` datetime DEFAULT NULL,
  `pid` int unsigned DEFAULT NULL,
  `leg` enum('R','L') DEFAULT NULL,
  `packageid` tinyint unsigned NOT NULL,
  `signupstatus` enum('Yes','Bulk','No') DEFAULT 'Yes',
  PRIMARY KEY (`signupid`),
  KEY `sidlogin` (`sidlogin`,`signupstatus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `member_signup`
--

LOCK TABLES `member_signup` WRITE;
/*!40000 ALTER TABLE `member_signup` DISABLE KEYS */;
/*!40000 ALTER TABLE `member_signup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `member_trigger`
--

DROP TABLE IF EXISTS `member_trigger`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member_trigger` (
  `mtid` int unsigned NOT NULL AUTO_INCREMENT,
  `memberid` int unsigned NOT NULL,
  `leg` enum('L','R') NOT NULL,
  `new_mile` int DEFAULT NULL,
  `new_count` int DEFAULT NULL,
  `old_mile` int DEFAULT NULL,
  `old_count` int DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  PRIMARY KEY (`mtid`),
  KEY `memberid` (`memberid`),
  CONSTRAINT `member_trigger_ibfk_1` FOREIGN KEY (`memberid`) REFERENCES `member` (`memberid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `member_trigger`
--

LOCK TABLES `member_trigger` WRITE;
/*!40000 ALTER TABLE `member_trigger` DISABLE KEYS */;
/*!40000 ALTER TABLE `member_trigger` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `member_withdraw`
--

DROP TABLE IF EXISTS `member_withdraw`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member_withdraw` (
  `id` int NOT NULL AUTO_INCREMENT,
  `memberid` int unsigned NOT NULL DEFAULT '0',
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payment_method` enum('Bank','UPI') DEFAULT 'Bank',
  `account_number` varchar(50) DEFAULT NULL,
  `ifsc_code` varchar(20) DEFAULT NULL,
  `upi_id` varchar(100) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `account_holder_name` varchar(255) DEFAULT NULL,
  `transax_id` varchar(255) NOT NULL,
  `admin_transaction_id` varchar(255) DEFAULT NULL,
  `memo` varchar(255) NOT NULL,
  `status` enum('apply','processing','finished','pending','reject') NOT NULL DEFAULT 'apply',
  `created` datetime DEFAULT NULL,
  `updated_on` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `member_withdraw_ibfk_1` (`memberid`),
  CONSTRAINT `member_withdraw_ibfk_1` FOREIGN KEY (`memberid`) REFERENCES `member` (`memberid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `member_withdraw`
--

LOCK TABLES `member_withdraw` WRITE;
/*!40000 ALTER TABLE `member_withdraw` DISABLE KEYS */;
/*!40000 ALTER TABLE `member_withdraw` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_gateway_settings`
--

DROP TABLE IF EXISTS `payment_gateway_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_gateway_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `upi_id` varchar(255) DEFAULT NULL,
  `qr_code_url` varchar(500) DEFAULT NULL,
  `qr_code_base64` text,
  `bank_account_number` varchar(50) DEFAULT NULL,
  `bank_ifsc_code` varchar(20) DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `account_holder_name` varchar(255) DEFAULT NULL,
  `gpay_merchant_id` varchar(255) DEFAULT NULL,
  `phonepe_merchant_id` varchar(255) DEFAULT NULL,
  `gpay_enabled` enum('Yes','No') DEFAULT 'Yes',
  `phonepe_enabled` enum('Yes','No') DEFAULT 'Yes',
  `updated_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_gateway_settings`
--

LOCK TABLES `payment_gateway_settings` WRITE;
/*!40000 ALTER TABLE `payment_gateway_settings` DISABLE KEYS */;
INSERT INTO `payment_gateway_settings` VALUES (1,'yourbusiness@upi','/images/upi-qr.jpg',NULL,'1234567890','BANK0001234','Bank Name','Account Holder Name',NULL,NULL,'Yes','Yes',NULL,'2026-01-04 16:56:10','2026-01-04 16:56:10');
/*!40000 ALTER TABLE `payment_gateway_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_category`
--

DROP TABLE IF EXISTS `product_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_category` (
  `categoryid` int unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  `created` datetime DEFAULT NULL,
  PRIMARY KEY (`categoryid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_category`
--

LOCK TABLES `product_category` WRITE;
/*!40000 ALTER TABLE `product_category` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_detail`
--

DROP TABLE IF EXISTS `product_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_detail` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `packageid` int unsigned NOT NULL,
  `galleryid` int unsigned NOT NULL,
  `num` smallint unsigned DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `packageid` (`packageid`),
  KEY `galleryid` (`galleryid`),
  CONSTRAINT `detail_ibfk_1` FOREIGN KEY (`packageid`) REFERENCES `product_package` (`packageid`) ON DELETE CASCADE,
  CONSTRAINT `detail_ibfk_2` FOREIGN KEY (`galleryid`) REFERENCES `product_gallery` (`galleryid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_detail`
--

LOCK TABLES `product_detail` WRITE;
/*!40000 ALTER TABLE `product_detail` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_gallery`
--

DROP TABLE IF EXISTS `product_gallery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_gallery` (
  `galleryid` int unsigned NOT NULL AUTO_INCREMENT,
  `categoryid` int unsigned DEFAULT NULL,
  `status` enum('Yes','No','Pending') NOT NULL DEFAULT 'Yes',
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  `price` double DEFAULT '0',
  `bv` double DEFAULT '0',
  `sh` double DEFAULT '0',
  `full` varchar(255) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  `moment` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`galleryid`),
  KEY `categoryid` (`categoryid`),
  CONSTRAINT `gallery_ibfk_1` FOREIGN KEY (`categoryid`) REFERENCES `product_category` (`categoryid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_gallery`
--

LOCK TABLES `product_gallery` WRITE;
/*!40000 ALTER TABLE `product_gallery` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_gallery` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_package`
--

DROP TABLE IF EXISTS `product_package`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_package` (
  `packageid` int unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  `price` double DEFAULT NULL,
  `sh` double DEFAULT NULL,
  `bv` double DEFAULT NULL,
  `status` enum('Yes','No','Pending') DEFAULT 'Yes',
  `sumnum` smallint unsigned DEFAULT '0',
  `logo` varchar(255) DEFAULT NULL,
  `typeid` tinyint unsigned DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  PRIMARY KEY (`packageid`),
  KEY `typeid` (`typeid`),
  CONSTRAINT `package_ibfk_1` FOREIGN KEY (`typeid`) REFERENCES `def_type` (`typeid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_package`
--

LOCK TABLES `product_package` WRITE;
/*!40000 ALTER TABLE `product_package` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_package` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale`
--

DROP TABLE IF EXISTS `sale`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale` (
  `saleid` int NOT NULL AUTO_INCREMENT,
  `memberid` int unsigned DEFAULT NULL,
  `billingid` varchar(255) DEFAULT NULL,
  `amount` double DEFAULT '0',
  `credit` int DEFAULT '0',
  `paytype` enum('CC','Advanced','Manual','Autoship','Check','Refund','Chargeback','Fraud','UPI','Other') NOT NULL DEFAULT 'Other',
  `remark` varchar(255) DEFAULT NULL,
  `paystatus` enum('Pending','Processing','Delivered','Cancel','Other') DEFAULT 'Other',
  `signuptype` enum('Yes','No') DEFAULT 'No',
  `typeid` tinyint unsigned NOT NULL,
  `trackingid` varchar(255) DEFAULT NULL,
  `shipping` double DEFAULT '0',
  `active` enum('Yes','No','Wait','First') NOT NULL DEFAULT 'Wait',
  `manager` varchar(255) DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  `moment` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`saleid`),
  KEY `memberid` (`memberid`),
  KEY `typeid` (`typeid`),
  CONSTRAINT `sale_ibfk_1` FOREIGN KEY (`memberid`) REFERENCES `member` (`memberid`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale`
--

LOCK TABLES `sale` WRITE;
/*!40000 ALTER TABLE `sale` DISABLE KEYS */;
INSERT INTO `sale` VALUES (1,1,NULL,5000,0,'Other',NULL,'Delivered','No',6,NULL,0,'Wait',NULL,'2026-01-05 14:53:47','2026-01-05 09:23:47');
/*!40000 ALTER TABLE `sale` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_basket`
--

DROP TABLE IF EXISTS `sale_basket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_basket` (
  `basketid` int NOT NULL AUTO_INCREMENT,
  `memberid` int unsigned NOT NULL DEFAULT '0',
  `classify` enum('package','gallery') NOT NULL DEFAULT 'package',
  `id` int NOT NULL DEFAULT '0',
  `qty` tinyint unsigned NOT NULL DEFAULT '1',
  `inbasket` enum('Yes','No') DEFAULT 'Yes',
  `created` datetime DEFAULT NULL,
  PRIMARY KEY (`basketid`),
  KEY `memberid` (`memberid`),
  KEY `idc` (`id`,`classify`),
  CONSTRAINT `basket_ibfk_1` FOREIGN KEY (`memberid`) REFERENCES `member` (`memberid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_basket`
--

LOCK TABLES `sale_basket` WRITE;
/*!40000 ALTER TABLE `sale_basket` DISABLE KEYS */;
/*!40000 ALTER TABLE `sale_basket` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_lineitem`
--

DROP TABLE IF EXISTS `sale_lineitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_lineitem` (
  `lineitemid` int unsigned NOT NULL AUTO_INCREMENT,
  `saleid` int NOT NULL DEFAULT '0',
  `basketid` int NOT NULL DEFAULT '0',
  `amount` double DEFAULT '0',
  `credit` double DEFAULT '0',
  PRIMARY KEY (`lineitemid`),
  KEY `saleid` (`saleid`),
  KEY `basketid` (`basketid`),
  CONSTRAINT `lineitem_ibfk_1` FOREIGN KEY (`saleid`) REFERENCES `sale` (`saleid`) ON UPDATE CASCADE,
  CONSTRAINT `lineitem_ibfk_2` FOREIGN KEY (`basketid`) REFERENCES `sale_basket` (`basketid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_lineitem`
--

LOCK TABLES `sale_lineitem` WRITE;
/*!40000 ALTER TABLE `sale_lineitem` DISABLE KEYS */;
/*!40000 ALTER TABLE `sale_lineitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tt`
--

DROP TABLE IF EXISTS `tt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tt` (
  `subjectid` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `category` enum('Reward','Payment','Account','Other') DEFAULT 'Other',
  `status` enum('Open','Close') DEFAULT 'Open',
  `name` varchar(255) NOT NULL,
  `comm` varchar(255) DEFAULT '',
  `memberid` int unsigned NOT NULL,
  `created` datetime NOT NULL,
  PRIMARY KEY (`subjectid`),
  KEY `created` (`created`),
  KEY `memberid` (`memberid`),
  CONSTRAINT `tt_ibfk_1` FOREIGN KEY (`memberid`) REFERENCES `member` (`memberid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tt`
--

LOCK TABLES `tt` WRITE;
/*!40000 ALTER TABLE `tt` DISABLE KEYS */;
/*!40000 ALTER TABLE `tt` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tt_post`
--

DROP TABLE IF EXISTS `tt_post`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tt_post` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subjectid` int NOT NULL DEFAULT '0',
  `party` enum('a','m') NOT NULL,
  `description` text,
  `ip` varchar(15) NOT NULL DEFAULT '',
  `created` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `subjectid` (`subjectid`),
  CONSTRAINT `ttpost_ibfk_1` FOREIGN KEY (`subjectid`) REFERENCES `tt` (`subjectid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tt_post`
--

LOCK TABLES `tt_post` WRITE;
/*!40000 ALTER TABLE `tt_post` DISABLE KEYS */;
/*!40000 ALTER TABLE `tt_post` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `upi_payment`
--

DROP TABLE IF EXISTS `upi_payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `upi_payment` (
  `upipaymentid` int NOT NULL AUTO_INCREMENT,
  `saleid` int DEFAULT NULL,
  `memberid` int unsigned DEFAULT NULL,
  `amount` double DEFAULT '0',
  `upi_id` varchar(255) DEFAULT NULL,
  `upi_reference` varchar(255) DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `status` enum('Pending','Verified','Failed','Cancelled') DEFAULT 'Pending',
  `verified_by` varchar(255) DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `qr_code_data` text,
  `created` datetime DEFAULT NULL,
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`upipaymentid`),
  KEY `saleid` (`saleid`),
  KEY `memberid` (`memberid`),
  KEY `status` (`status`),
  KEY `upi_reference` (`upi_reference`),
  CONSTRAINT `upi_payment_ibfk_1` FOREIGN KEY (`saleid`) REFERENCES `sale` (`saleid`) ON UPDATE CASCADE,
  CONSTRAINT `upi_payment_ibfk_2` FOREIGN KEY (`memberid`) REFERENCES `member` (`memberid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `upi_payment`
--

LOCK TABLES `upi_payment` WRITE;
/*!40000 ALTER TABLE `upi_payment` DISABLE KEYS */;
/*!40000 ALTER TABLE `upi_payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `view_balance`
--

DROP TABLE IF EXISTS `view_balance`;
/*!50001 DROP VIEW IF EXISTS `view_balance`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `view_balance` AS SELECT 
 1 AS `memberid`,
 1 AS `ledgerid`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `view_sdownlines`
--

DROP TABLE IF EXISTS `view_sdownlines`;
/*!50001 DROP VIEW IF EXISTS `view_sdownlines`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `view_sdownlines` AS SELECT 
 1 AS `memberid`,
 1 AS `typeid`,
 1 AS `active`,
 1 AS `c`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping events for database 'gold_investment'
--

--
-- Dumping routines for database 'gold_investment'
--

-- insufficient privileges to SHOW CREATE PROCEDURE `proc_join`
-- does gold_user have permissions on mysql.proc?

