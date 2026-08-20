'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "work_orders" 
      ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "work_orders" 
      DROP COLUMN IF EXISTS "version";
    `);
  },
};
