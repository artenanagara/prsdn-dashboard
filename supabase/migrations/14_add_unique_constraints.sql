-- Add unique constraints to prevent duplicates
ALTER TABLE members ADD CONSTRAINT members_phone_unique UNIQUE (phone);
ALTER TABLE account_applications ADD CONSTRAINT account_applications_phone_unique UNIQUE (phone);
ALTER TABLE account_applications ADD CONSTRAINT account_applications_username_unique UNIQUE (username);
