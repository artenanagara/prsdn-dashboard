-- =====================================================
-- PRSDN Dashboard - Database Schema
-- =====================================================
-- This migration creates all tables for the PRSDN Dashboard
-- including members, accounts, finance, kas, attendance, and events

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: members
-- =====================================================
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    birth_place VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    rt VARCHAR(2) NOT NULL CHECK (rt IN ('01', '02', '03', '04')),
    phone VARCHAR(20) NOT NULL,
    instagram VARCHAR(100),
    job VARCHAR(255),
    education_status VARCHAR(20) NOT NULL CHECK (education_status IN ('school', 'not_school')),
    education_level VARCHAR(20) CHECK (education_level IN ('SD', 'SMP', 'SMA/SMK', 'College')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for RT filtering
CREATE INDEX idx_members_rt ON members(rt);
CREATE INDEX idx_members_created_at ON members(created_at);

-- =====================================================
-- Table: account_applications
-- =====================================================
CREATE TABLE account_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    birth_place VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    rt VARCHAR(2) NOT NULL CHECK (rt IN ('01', '02', '03', '04')),
    phone VARCHAR(20) NOT NULL,
    instagram VARCHAR(100),
    job VARCHAR(255),
    education_status VARCHAR(20) NOT NULL CHECK (education_status IN ('school', 'not_school')),
    education_level VARCHAR(20) CHECK (education_level IN ('SD', 'SMP', 'SMA/SMK', 'College')),
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by_admin_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for status filtering
CREATE INDEX idx_applications_status ON account_applications(status);
CREATE INDEX idx_applications_submitted_at ON account_applications(submitted_at);

-- =====================================================
-- Table: user_accounts
-- =====================================================
CREATE TABLE user_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for authentication
CREATE INDEX idx_user_accounts_username ON user_accounts(username);
CREATE INDEX idx_user_accounts_member_id ON user_accounts(member_id);

-- =====================================================
-- Table: attendance_records
-- =====================================================
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    month_key VARCHAR(7) NOT NULL, -- YYYY-MM format
    attendee_member_ids UUID[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for date queries
CREATE INDEX idx_attendance_records_date ON attendance_records(date);
CREATE INDEX idx_attendance_records_month_key ON attendance_records(month_key);

-- =====================================================
-- Table: finance_transactions
-- =====================================================
CREATE TABLE finance_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
    date DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for filtering and sorting
CREATE INDEX idx_finance_transactions_type ON finance_transactions(type);
CREATE INDEX idx_finance_transactions_category ON finance_transactions(category);
CREATE INDEX idx_finance_transactions_date ON finance_transactions(date);

-- =====================================================
-- Table: kas_payments
-- =====================================================
CREATE TABLE kas_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month_key VARCHAR(7) NOT NULL, -- YYYY-MM format
    year INTEGER NOT NULL,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
    paid_at DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for queries
CREATE INDEX idx_kas_payments_month_key ON kas_payments(month_key);
CREATE INDEX idx_kas_payments_member_id ON kas_payments(member_id);
CREATE INDEX idx_kas_payments_status ON kas_payments(status);

-- Unique constraint: one payment per member per month
CREATE UNIQUE INDEX idx_kas_payments_unique ON kas_payments(month_key, member_id);

-- =====================================================
-- Table: events
-- =====================================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('event', 'program', 'birthday')),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for date queries
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_type ON events(type);

-- =====================================================
-- Table: attendance_events
-- =====================================================
CREATE TABLE attendance_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_active BOOLEAN NOT NULL DEFAULT false,
    token VARCHAR(6) NOT NULL,
    token_expires_at BIGINT NOT NULL, -- Unix timestamp in milliseconds
    created_by_admin_id UUID NOT NULL REFERENCES user_accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for active events
CREATE INDEX idx_attendance_events_is_active ON attendance_events(is_active);
CREATE INDEX idx_attendance_events_date ON attendance_events(date);

-- =====================================================
-- Table: attendance_checkins
-- =====================================================
CREATE TABLE attendance_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES attendance_events(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    checked_in_at BIGINT NOT NULL, -- Unix timestamp in milliseconds
    token_used VARCHAR(6) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for queries
CREATE INDEX idx_attendance_checkins_event_id ON attendance_checkins(event_id);
CREATE INDEX idx_attendance_checkins_member_id ON attendance_checkins(member_id);

-- Unique constraint: one check-in per member per event
CREATE UNIQUE INDEX idx_attendance_checkins_unique ON attendance_checkins(event_id, member_id);

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE members IS 'Member profiles for the organization';
COMMENT ON TABLE account_applications IS 'New member registration applications';
COMMENT ON TABLE user_accounts IS 'User authentication and authorization';
COMMENT ON TABLE attendance_records IS 'Monthly attendance tracking';
COMMENT ON TABLE finance_transactions IS 'Income and expense ledger';
COMMENT ON TABLE kas_payments IS 'Monthly membership dues tracking';
COMMENT ON TABLE events IS 'Calendar events, programs, and birthdays';
COMMENT ON TABLE attendance_events IS 'Real-time check-in events with tokens';
COMMENT ON TABLE attendance_checkins IS 'Event check-in records';
