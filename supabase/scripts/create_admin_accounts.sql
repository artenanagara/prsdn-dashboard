-- Create Admin Accounts for PRSDN Dashboard
-- These are admin-only accounts without associated member profiles

-- Insert admin user accounts
INSERT INTO user_accounts (username, password, role, status, member_id)
VALUES
  ('ardelia03', 'atha2511', 'admin', 'active', NULL),
  ('taufik01', 'taufik123', 'admin', 'active', NULL),
  ('priambodo02', 'jati0407', 'admin', 'active', NULL),
  ('yoga05', 'ilham789', 'admin', 'active', NULL),
  ('alidya06', 'putri000', 'admin', 'active', NULL),
  ('artena03', 'nagara', 'admin', 'active', NULL);

-- Verify the accounts were created
SELECT username, role, status, created_at 
FROM user_accounts 
WHERE role = 'admin' 
ORDER BY created_at DESC;
