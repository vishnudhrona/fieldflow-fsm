'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('customers');

    // 1. Handle contact_person / contact_name
    if (!tableInfo.contact_person && tableInfo.contact_name) {
      await queryInterface.renameColumn('customers', 'contact_name', 'contact_person');
    }

    // 2. Handle email: add column, backfill existing records, then make NOT NULL and UNIQUE
    if (!tableInfo.email) {
      await queryInterface.addColumn('customers', 'email', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });

      // Backfill any existing rows
      await queryInterface.sequelize.query(`
        UPDATE customers 
        SET email = 'client_' || id || '@fieldflow.com' 
        WHERE email IS NULL
      `);

      // Alter to NOT NULL
      await queryInterface.changeColumn('customers', 'email', {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      });
    }

    // 3. Handle notes
    if (!tableInfo.notes) {
      await queryInterface.addColumn('customers', 'notes', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    // 4. Handle status
    if (!tableInfo.status) {
      await queryInterface.addColumn('customers', 'status', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }

    // 5. Handle updated_at
    if (!tableInfo.updated_at) {
      await queryInterface.addColumn('customers', 'updated_at', {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Reversal if needed
  }
};
