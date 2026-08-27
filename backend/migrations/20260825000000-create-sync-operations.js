'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sync_operations', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
      },
      actor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      mutation_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      work_order_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      operation_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      request_hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      state: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'PROCESSING',
      },
      response_payload: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('sync_operations', ['actor_id', 'mutation_id'], {
      unique: true,
      name: 'sync_operations_actor_mutation_unique',
    });
    await queryInterface.addIndex('sync_operations', ['work_order_id', 'created_at']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('sync_operations');
  },
};
