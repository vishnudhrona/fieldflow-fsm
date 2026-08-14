'use strict';
const crypto = require('crypto');
const { ROLES } = require('../config/constants');

module.exports = {
  async up(queryInterface, Sequelize) {
    const adminPassword = crypto.createHash('sha256').update('admin123').digest('hex');
    const techPassword = crypto.createHash('sha256').update('tech123').digest('hex');
    
    const admins = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE id = 'usr-admin-001' LIMIT 1;`
    );

    if (admins[0].length > 0) {
      await queryInterface.bulkUpdate('users', {
        name: 'Admin User',
        email: 'admin@example.com',
        password_hash: adminPassword,
        role: ROLES.ADMIN_DISPATCHER,
        phone: '123-456-7890',
        updated_at: new Date()
      }, { id: 'usr-admin-001' });
    } else {
      await queryInterface.bulkInsert('users', [{
        id: 'usr-admin-001',
        name: 'Admin User',
        email: 'admin@example.com',
        password_hash: adminPassword,
        role: ROLES.ADMIN_DISPATCHER,
        phone: '123-456-7890',
        created_at: new Date(),
        updated_at: new Date()
      }], {});
    }

    const techs = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE id = 'usr-tech-001' LIMIT 1;`
    );

    if (techs[0].length > 0) {
      await queryInterface.bulkUpdate('users', {
        name: 'Tech User',
        email: 'tech@example.com',
        password_hash: techPassword,
        role: ROLES.TECHNICIAN,
        phone: '987-654-3210',
        updated_at: new Date()
      }, { id: 'usr-tech-001' });
    } else {
      await queryInterface.bulkInsert('users', [{
        id: 'usr-tech-001',
        name: 'Tech User',
        email: 'tech@example.com',
        password_hash: techPassword,
        role: ROLES.TECHNICIAN,
        phone: '987-654-3210',
        created_at: new Date(),
        updated_at: new Date()
      }], {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', { 
      email: ['admin@example.com', 'tech@example.com'] 
    }, {});
  }
};
