'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('work_order_readings', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
      },
      work_order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'work_orders',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      metric: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      value: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      unit: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      recorded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('work_order_readings', ['work_order_id']);
    await queryInterface.addIndex('work_order_readings', ['user_id']);
    await queryInterface.addIndex('work_order_readings', ['recorded_at']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('work_order_readings');
  },
};
