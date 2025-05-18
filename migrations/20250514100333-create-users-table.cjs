'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {

    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING,
        defaultValue: ''
      },
      phone_number: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      profile_photo: {
        type: Sequelize.STRING,
        allowNull: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      isEmailVerified: {
        type: Sequelize.TINYINT,
        defaultValue: 0,
        comment: '1 = Verified, 0 = Not Verified',
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING,
      },
      token: {
        type: Sequelize.TEXT
      },
      resetCode: {
        type: Sequelize.STRING,
      },
      resetExpiries: {
        type: Sequelize.DATE,
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'delete'),
        defaultValue: 'active',
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        allowNull: false,
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
