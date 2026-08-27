'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('menus', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(50),
      },
      label: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      icon: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      path: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      badge: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      allowed_roles: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: ['ADMIN_DISPATCHER', 'TECHNICIAN'],
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    const now = new Date();
    await queryInterface.bulkInsert('menus', [
      {
        id: 'home',
        label: 'Home',
        icon: 'Home',
        path: '/',
        badge: null,
        sort_order: 1,
        allowed_roles: JSON.stringify(['ADMIN_DISPATCHER', 'TECHNICIAN']),
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'customers',
        label: 'Customers',
        icon: 'Users',
        path: '/customers',
        badge: null,
        sort_order: 2,
        allowed_roles: JSON.stringify(['ADMIN_DISPATCHER']),
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'work-orders',
        label: 'Work Orders',
        icon: 'ClipboardList',
        path: '/work-orders',
        badge: 4,
        sort_order: 3,
        allowed_roles: JSON.stringify(['ADMIN_DISPATCHER']),
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'profile',
        label: 'Profile',
        icon: 'User',
        path: '/profile',
        badge: null,
        sort_order: 4,
        allowed_roles: JSON.stringify(['ADMIN_DISPATCHER', 'TECHNICIAN']),
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('menus');
  },
};
