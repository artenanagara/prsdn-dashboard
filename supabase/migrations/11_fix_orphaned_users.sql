-- FIX SCRIPT: Restore Missing Members for Orphaned User Accounts
-- This script finds user_accounts whose member_id does NOT exist in the members table
-- and creates a "Restored" member record for them to satisfy Foreign Key constraints.

INSERT INTO members (id, full_name, birth_place, birth_date, rt, phone, job, education_status, created_at)
SELECT 
    ua.member_id, 
    ua.username || ' (Restored)', -- Use username as temporary name
    'System Restoration', 
    '2000-01-01', 
    '01', 
    '-', 
    'Restored Account', 
    'not_school', 
    NOW()
FROM user_accounts ua
LEFT JOIN members m ON ua.member_id = m.id
WHERE m.id IS NULL 
AND ua.member_id IS NOT NULL;

-- Verify the fix
SELECT m.id, m.full_name, ua.username 
FROM members m
JOIN user_accounts ua ON m.id = ua.member_id
WHERE m.full_name LIKE '%(Restored)%';
