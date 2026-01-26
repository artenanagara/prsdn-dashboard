-- =====================================================
-- PRSDN Dashboard - Database Functions and Triggers
-- =====================================================
-- This migration creates utility functions and triggers

-- =====================================================
-- Function: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Triggers: Auto-update updated_at on all tables
-- =====================================================

CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_applications_updated_at
    BEFORE UPDATE ON account_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_accounts_updated_at
    BEFORE UPDATE ON user_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at
    BEFORE UPDATE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finance_transactions_updated_at
    BEFORE UPDATE ON finance_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kas_payments_updated_at
    BEFORE UPDATE ON kas_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_events_updated_at
    BEFORE UPDATE ON attendance_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Function: Generate random alphanumeric token
-- =====================================================
CREATE OR REPLACE FUNCTION generate_token(length INTEGER)
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function: Get member statistics by RT
-- =====================================================
CREATE OR REPLACE FUNCTION get_member_stats_by_rt()
RETURNS TABLE(rt VARCHAR(2), member_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT m.rt, COUNT(*)::BIGINT as member_count
    FROM members m
    GROUP BY m.rt
    ORDER BY m.rt;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function: Get finance summary by month
-- =====================================================
CREATE OR REPLACE FUNCTION get_finance_summary_by_month(target_month DATE)
RETURNS TABLE(
    total_income DECIMAL(15, 2),
    total_expense DECIMAL(15, 2),
    balance DECIMAL(15, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as balance
    FROM finance_transactions
    WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', target_month);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function: Get kas payment summary by month
-- =====================================================
CREATE OR REPLACE FUNCTION get_kas_summary_by_month(target_month_key VARCHAR(7))
RETURNS TABLE(
    total_members BIGINT,
    paid_count BIGINT,
    unpaid_count BIGINT,
    total_collected DECIMAL(15, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_members,
        COUNT(CASE WHEN status = 'paid' THEN 1 END)::BIGINT as paid_count,
        COUNT(CASE WHEN status = 'unpaid' THEN 1 END)::BIGINT as unpaid_count,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_collected
    FROM kas_payments
    WHERE month_key = target_month_key;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function: Initialize kas payments for a month
-- =====================================================
CREATE OR REPLACE FUNCTION initialize_kas_payments_for_month(
    target_month_key VARCHAR(7),
    default_amount DECIMAL(15, 2) DEFAULT 5000
)
RETURNS INTEGER AS $$
DECLARE
    inserted_count INTEGER;
BEGIN
    -- Insert kas payments for all members who don't have one for this month
    INSERT INTO kas_payments (month_key, year, member_id, amount, status)
    SELECT
        target_month_key,
        CAST(SPLIT_PART(target_month_key, '-', 1) AS INTEGER),
        m.id,
        default_amount,
        'unpaid'
    FROM members m
    WHERE NOT EXISTS (
        SELECT 1 FROM kas_payments kp
        WHERE kp.month_key = target_month_key
        AND kp.member_id = m.id
    );
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;
