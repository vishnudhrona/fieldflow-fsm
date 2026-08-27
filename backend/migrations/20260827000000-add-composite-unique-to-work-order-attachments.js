'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_work_order_attachments_wo_client_local"
      ON "work_order_attachments" ("work_order_id", "client_local_id")
      WHERE "client_local_id" IS NOT NULL;
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "idx_work_order_attachments_wo_client_local";
    `);
  },
};
