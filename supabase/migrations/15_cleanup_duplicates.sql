-- Refined cleanup script to remove ALL duplicates and keep only the latest one based on created_at

-- 1. Remove duplicate phone numbers in MEMBERS table
DELETE FROM members
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at DESC) as row_num
    FROM members
  ) t
  WHERE t.row_num > 1
);

-- 2. Remove duplicate phone numbers in ACCOUNT_APPLICATIONS table
DELETE FROM account_applications
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY phone ORDER BY submitted_at DESC) as row_num
    FROM account_applications
  ) t
  WHERE t.row_num > 1
);

-- 3. Remove duplicate usernames in ACCOUNT_APPLICATIONS table
DELETE FROM account_applications
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY username ORDER BY submitted_at DESC) as row_num
    FROM account_applications
  ) t
  WHERE t.row_num > 1
);
