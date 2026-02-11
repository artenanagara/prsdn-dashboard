-- Add allow_edit_vote column to polls table
ALTER TABLE polls 
ADD COLUMN allow_edit_vote BOOLEAN DEFAULT FALSE;
