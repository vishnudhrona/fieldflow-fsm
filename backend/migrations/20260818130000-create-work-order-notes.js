'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "work_order_notes" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "work_order_id" UUID NOT NULL REFERENCES "work_orders" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
        "user_id" UUID REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
        "content" TEXT NOT NULL,
        "type" VARCHAR(20) DEFAULT 'NOTE',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_work_order_notes_wo_id" ON "work_order_notes" ("work_order_id");
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "work_order_notes" CASCADE;');
  },
};
