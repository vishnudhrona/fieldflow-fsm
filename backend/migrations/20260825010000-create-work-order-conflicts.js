'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('work_order_conflicts', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
      },
      mutation_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
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
      actor_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      action_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      local_payload: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      base_version: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      server_version: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      server_snapshot: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      resolved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      resolution: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      resolved_at: {
        type: Sequelize.DATE,
        allowNull: true,
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

    await queryInterface.addIndex('work_order_conflicts', ['mutation_id'], {
      unique: true,
      name: 'work_order_conflicts_mutation_unique',
    });
    await queryInterface.addIndex('work_order_conflicts', ['work_order_id']);
    await queryInterface.addIndex('work_order_conflicts', ['status']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('work_order_conflicts');
  },
};
