'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Composite Index for technician dashboard / tab queries
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_work_orders_tech_status_date 
      ON work_orders (technician_id, status, scheduled_date DESC);
    `);

    // 2. Composite Index for ordered checklist items
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_work_order_checklists_wo_order 
      ON work_order_checklists (work_order_id, order_index ASC);
    `);

    // 3. Composite Index for timeline notes
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_work_order_notes_wo_created 
      ON work_order_notes (work_order_id, created_at DESC);
    `);

    // 4. Composite Index for timestamped service readings
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_work_order_readings_wo_recorded 
      ON work_order_readings (work_order_id, recorded_at DESC);
    `);

    // 5. Composite Index for attachments
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_work_order_attachments_wo_created 
      ON work_order_attachments (work_order_id, created_at DESC);
    `);

    // 6. Composite Index for audit history
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_work_order_histories_wo_created 
      ON work_order_histories (work_order_id, created_at DESC);
    `);

    // 7. Assets by customer index
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_assets_customer_id 
      ON assets (customer_id);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_work_orders_tech_status_date;');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_work_order_checklists_wo_order;');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_work_order_notes_wo_created;');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_work_order_readings_wo_recorded;');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_work_order_attachments_wo_created;');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_work_order_histories_wo_created;');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_assets_customer_id;');
  },
};
