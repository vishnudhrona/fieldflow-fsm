'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add 'NEW' to the PostgreSQL enum_work_orders_status
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_work_orders_status" ADD VALUE IF NOT EXISTS 'NEW';
    `);

    // Update the default value to 'NEW'
    await queryInterface.sequelize.query(`
      ALTER TABLE "work_orders" ALTER COLUMN "status" SET DEFAULT 'NEW';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Note: PostgreSQL does not support removing values from an ENUM directly without recreating the type
  },
};
