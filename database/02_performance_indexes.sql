-- Performance Optimization: Database Indexes
-- Run this file to add indexes for frequently queried columns
-- This will significantly improve query performance

-- Member table indexes
CREATE INDEX IF NOT EXISTS idx_member_active ON member(active);
CREATE INDEX IF NOT EXISTS idx_member_typeid ON member(typeid);
CREATE INDEX IF NOT EXISTS idx_member_sid ON member(sid);
CREATE INDEX IF NOT EXISTS idx_member_pid ON member(pid);
CREATE INDEX IF NOT EXISTS idx_member_login ON member(login);
CREATE INDEX IF NOT EXISTS idx_member_created ON member(created);
CREATE INDEX IF NOT EXISTS idx_member_active_typeid ON member(active, typeid);

-- Sale table indexes
CREATE INDEX IF NOT EXISTS idx_sale_memberid ON sale(memberid);
CREATE INDEX IF NOT EXISTS idx_sale_signuptype ON sale(signuptype);
CREATE INDEX IF NOT EXISTS idx_sale_paystatus ON sale(paystatus);
CREATE INDEX IF NOT EXISTS idx_sale_created ON sale(created);
CREATE INDEX IF NOT EXISTS idx_sale_typeid ON sale(typeid);
CREATE INDEX IF NOT EXISTS idx_sale_memberid_signuptype ON sale(memberid, signuptype);
CREATE INDEX IF NOT EXISTS idx_sale_paystatus_signuptype ON sale(paystatus, signuptype);

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

-- Def_type table indexes (if not already primary key)
CREATE INDEX IF NOT EXISTS idx_def_type_price ON def_type(price);
CREATE INDEX IF NOT EXISTS idx_def_type_daily_return ON def_type(daily_return);

-- Def_direct table indexes
CREATE INDEX IF NOT EXISTS idx_def_direct_typeid ON def_direct(typeid);
CREATE INDEX IF NOT EXISTS idx_def_direct_whoid ON def_direct(whoid);
CREATE INDEX IF NOT EXISTS idx_def_direct_typeid_whoid ON def_direct(typeid, whoid);

-- Product_package table indexes
CREATE INDEX IF NOT EXISTS idx_product_package_typeid ON product_package(typeid);
CREATE INDEX IF NOT EXISTS idx_product_package_packageid ON product_package(packageid);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_sale_memberid_paystatus_signuptype ON sale(memberid, paystatus, signuptype);
CREATE INDEX IF NOT EXISTS idx_income_amount_memberid_bonusType_status ON income_amount(memberid, bonusType, status);
CREATE INDEX IF NOT EXISTS idx_member_active_typeid_sid ON member(active, typeid, sid);

-- Date-based indexes for time-series queries
CREATE INDEX IF NOT EXISTS idx_sale_created_date ON sale((DATE(created)));
CREATE INDEX IF NOT EXISTS idx_member_created_date ON member((DATE(created)));
CREATE INDEX IF NOT EXISTS idx_income_amount_created_date ON income_amount((DATE(created)));

