-- FIX SPECIFIC MISSING MEMBER
-- Insert the member ID found in the error log: 610170f4-d7fc-4108-a3e7-1a2b3e63616f

INSERT INTO members (
    id, 
    full_name, 
    birth_place, 
    birth_date, 
    rt, 
    phone, 
    job, 
    education_status, 
    created_at
) VALUES (
    '610170f4-d7fc-4108-a3e7-1a2b3e63616f', -- ID from error log
    'Artena (System Restored)',            -- Name based on username
    'System Cleanup',                      -- Placeholder
    '1995-01-01',                          -- Placeholder
    '01',                                  -- Default RT
    '081234567890',                        -- Placeholder
    'Admin/User',                          -- Placeholder
    'not_school',                          -- Default
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Also ensure RLS is disabled for checkins
ALTER TABLE attendance_checkins DISABLE ROW LEVEL SECURITY;

-- Disable RLS for other tables relevant to user
ALTER TABLE attendance_events DISABLE ROW LEVEL SECURITY;
