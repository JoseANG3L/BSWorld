-- Migration: Add parent_id field to content table for versioning system
-- This allows creating revision versions while keeping the original public version

-- Add parent_id column to content table
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES content(id) ON DELETE CASCADE;

-- Add index for faster queries on parent_id
CREATE INDEX IF NOT EXISTS idx_content_parent_id ON content(parent_id);

-- Add index for filtering published content (no parent_id)
CREATE INDEX IF NOT EXISTS idx_content_published ON content(estado, visibilidad) 
WHERE parent_id IS NULL;

-- Add comment to document the purpose
COMMENT ON COLUMN content.parent_id IS 'If not null, this is a revision version of the content with this parent_id. The parent remains published while revision is reviewed.';
