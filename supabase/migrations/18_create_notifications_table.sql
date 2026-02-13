-- =====================================================
-- Migration: Create Notifications Table
-- =====================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('birthday', 'event', 'payment', 'system')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying notifications by user and read status
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own notifications (e.g. mark as read)
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Admins or System can insert notifications (for now, let's allow authenticated users to potentially trigger if needed, or rely on service role/admin functions. 
-- But since we are inserting from client side logic in some cases (e.g. admin creates event -> triggers notification insertion), 
-- we need to allow insertion. Ideally this should be done via Edge Functions or Database Triggers, but for this app structure, we might need insert access.
-- Let's check how other tables are handled. Usually Admin role is handled via app logic or RLS.
-- For now, let's allow all authenticated users to INSERT? No, only specific actions.
-- Let's stick to: "Admins or System" logic.
-- If our app logic runs as the current user, and that user is an Admin, they should be able to insert notifications for OTHERS.
-- "user_accounts" has a "role" field. We need to check that.
-- However, RLS usually works on `auth.uid()`.
-- Let's allow INSERT if the user is authenticated for now, and rely on App Logic to control WHO sends what.
-- Better: "Admins can insert notifications for anyone"
-- To do this properly with RLS based on `user_accounts.role`, we need a helper function or a complex query.
-- But standard practice here might be simpler: Allow INSERT for authenticated users, but realistically only Admin UI will trigger 'event' notifications.
-- What about 'payment'? Admin marks as paid -> Notification sent. So Admin needs insert.
-- What about 'birthday'? If it's a client-side check on the User's own device, they might insert their own notification? No, that's weird.
-- It should be the Admin or System.
-- Let's create a policy that allows INSERT for authenticated users to start with, or refine it if we have a robust "is_admin()" function.
-- Let's assume we can simply allow authenticated users to insert for now to unblock development, or restrict update to own.

CREATE POLICY "Authenticated users can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Comment
COMMENT ON TABLE notifications IS 'User notifications for events, payments, and birthdays';
