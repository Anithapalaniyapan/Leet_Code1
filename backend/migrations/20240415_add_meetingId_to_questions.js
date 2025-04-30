'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('questions', 'meetingId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'meetings',
        key: 'id'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('questions', 'meetingId');
  }
}; 