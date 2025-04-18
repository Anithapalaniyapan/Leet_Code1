'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('feedbacks', 'meetingId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'meetings',
        key: 'id'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('feedbacks', 'meetingId');
  }
}; 