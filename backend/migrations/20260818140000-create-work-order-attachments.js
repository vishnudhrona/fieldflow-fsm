'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "work_order_attachments" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "work_order_id" UUID NOT NULL REFERENCES "work_orders" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
        "technician_id" UUID REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE SET NULL,
        "file_url" TEXT NOT NULL,
        "file_name" VARCHAR(255) DEFAULT 'capture.jpg',
        "file_size" BIGINT,
        "mime_type" VARCHAR(100) DEFAULT 'image/jpeg',
        "client_local_id" VARCHAR(255),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_work_order_attachments_wo_id" ON "work_order_attachments" ("work_order_id");
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "work_order_attachments" CASCADE;');
  },
};
