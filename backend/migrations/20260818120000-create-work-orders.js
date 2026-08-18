'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop any partial tables from previous failed attempt
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "work_order_checklists" CASCADE;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "work_orders" CASCADE;');

    // 1. Create work_orders table
    await queryInterface.createTable('work_orders', {
      id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false,
      },
      order_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      customer_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      asset_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'assets',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      technician_id: {
        type: Sequelize.STRING(36),
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
        defaultValue: 'PENDING',
        allowNull: false,
      },
      priority: {
        type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'),
        defaultValue: 'MEDIUM',
        allowNull: false,
      },
      scheduled_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      scheduled_time: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      completed_at: {
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

    // 2. Create work_order_checklists table (1NF / 3NF Normalized checklist items)
    await queryInterface.createTable('work_order_checklists', {
      id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false,
      },
      work_order_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'work_orders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      task_description: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      is_completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      order_index: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      completed_at: {
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

    // 3. Add Indexes for High Performance Querying
    await queryInterface.addIndex('work_orders', ['customer_id']);
    await queryInterface.addIndex('work_orders', ['asset_id']);
    await queryInterface.addIndex('work_orders', ['technician_id']);
    await queryInterface.addIndex('work_orders', ['status']);
    await queryInterface.addIndex('work_orders', ['scheduled_date']);
    await queryInterface.addIndex('work_orders', ['order_number']);
    await queryInterface.addIndex('work_order_checklists', ['work_order_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('work_order_checklists');
    await queryInterface.dropTable('work_orders');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_work_orders_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_work_orders_priority";');
  },
};
