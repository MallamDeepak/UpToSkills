-- Migration: Add is_active column to students table
-- This allows deactivating students without deleting them

-- Add is_active column with default value of true
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Add updated_at column if it doesn't exist
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for faster queries on active students
CREATE INDEX IF NOT EXISTS idx_students_is_active ON students(is_active);

-- Update existing students to be active
UPDATE students SET is_active = true WHERE is_active IS NULL;

-- Add comment to the column
COMMENT ON COLUMN students.is_active IS 'Indicates whether the student account is active or deactivated';
