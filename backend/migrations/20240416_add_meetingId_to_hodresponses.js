'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
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
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      -- Remove indexes
      DROP INDEX idx_hodresponses_meetingid ON hod_responses;
      
      -- Remove foreign key constraint
      ALTER TABLE hod_responses
      DROP FOREIGN KEY fk_hodresponses_meeting;
      
      -- Remove columns
      ALTER TABLE hod_responses
      DROP COLUMN meetingId,
      DROP COLUMN responded,
      DROP COLUMN respondedAt;
    `);
  }
}; 