-- Add meetingId column to hod_responses table
ALTER TABLE hod_responses
ADD COLUMN meetingId INT NULL,
ADD COLUMN responded BOOLEAN DEFAULT TRUE,
ADD COLUMN respondedAt DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Add foreign key constraint
ALTER TABLE hod_responses
ADD CONSTRAINT fk_hodresponses_meeting
FOREIGN KEY (meetingId) REFERENCES meetings(id) ON DELETE SET NULL;

-- Update indexes
CREATE INDEX idx_hodresponses_meetingid ON hod_responses(meetingId);

-- Print success message
SELECT 'Migration completed successfully' as Message; 