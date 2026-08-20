'use strict';
const crypto = require('crypto');

module.exports = {
  async up(queryInterface, Sequelize) {
    const adminPassword = crypto.createHash('sha256').update('admin123').digest('hex');
    const techPassword = crypto.createHash('sha256').update('tech123').digest('hex');

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Clear existing data cleanly to prevent foreign key & unique key conflicts
    await queryInterface.sequelize.query('DELETE FROM "work_order_histories";');
    await queryInterface.sequelize.query('DELETE FROM "work_order_attachments";');
    await queryInterface.sequelize.query('DELETE FROM "work_order_notes";');
    await queryInterface.sequelize.query('DELETE FROM "work_order_readings";');
    await queryInterface.sequelize.query('DELETE FROM "work_order_checklists";');
    await queryInterface.sequelize.query('DELETE FROM "work_orders";');
    await queryInterface.sequelize.query('DELETE FROM "assets";');
    await queryInterface.sequelize.query('DELETE FROM "customers";');

    // ==========================================
    // 1. USERS (3 Technicians + 1 Admin)
    // ==========================================
    const users = [
      {
        id: '00000000-0000-4000-8000-000000000002',
        name: 'Admin User',
        email: 'admin@example.com',
        password_hash: adminPassword,
        role: 'ADMIN_DISPATCHER',
        phone: '123-456-7890',
        created_at: now,
        updated_at: now,
      },
      {
        id: '00000000-0000-4000-8000-000000000001',
        name: 'Tech User',
        email: 'tech@example.com',
        password_hash: techPassword,
        role: 'TECHNICIAN',
        phone: '987-654-3210',
        created_at: now,
        updated_at: now,
      },
      {
        id: '00000000-0000-4000-8000-000000000003',
        name: 'Sarah Jenkins',
        email: 'tech2@example.com',
        password_hash: techPassword,
        role: 'TECHNICIAN',
        phone: '555-019-2834',
        created_at: now,
        updated_at: now,
      },
      {
        id: '00000000-0000-4000-8000-000000000004',
        name: 'Alex Rivera',
        email: 'tech3@example.com',
        password_hash: techPassword,
        role: 'TECHNICIAN',
        phone: '555-084-9123',
        created_at: now,
        updated_at: now,
      },
    ];

    for (const user of users) {
      const existing = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE id = '${user.id}' LIMIT 1;`
      );
      if (existing[0].length > 0) {
        await queryInterface.bulkUpdate('users', user, { id: user.id });
      } else {
        await queryInterface.bulkInsert('users', [user], {});
      }
    }

    // ==========================================
    // 2. CUSTOMERS (3 Customers)
    // ==========================================
    const customers = [
      {
        id: '10000000-0000-4000-8000-000000000001',
        name: 'Acme Industrial Systems',
        contact_person: 'Robert Sterling',
        email: 'contact@acmeindustrial.com',
        phone: '312-555-0143',
        address: '100 Industrial Pkwy, Suite 400, Chicago, IL 60601',
        notes: 'Primary industrial manufacturing facility. Access via Gate 4.',
        status: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: '10000000-0000-4000-8000-000000000002',
        name: 'Nexus Healthcare Center',
        contact_person: 'Dr. Elena Rostova',
        email: 'facility@nexushealth.org',
        phone: '617-555-0198',
        address: '450 Medical Campus Dr, Building B, Boston, MA 02115',
        notes: 'High-security medical environment. Cleanroom badge required.',
        status: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: '10000000-0000-4000-8000-000000000003',
        name: 'Apex Global Logistics',
        contact_person: 'Marcus Vance',
        email: 'ops@apexlogistics.com',
        phone: '214-555-0812',
        address: '800 Freight Terminal Way, Dock 12, Dallas, TX 75201',
        notes: '24/7 Distribution Hub. Escort needed for conveyor gantries.',
        status: true,
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert('customers', customers, {});

    // ==========================================
    // 3. ASSETS (3 Equipment Assets with Image URLs)
    // ==========================================
    const assets = [
      {
        id: '20000000-0000-4000-8000-000000000001',
        customer_id: '10000000-0000-4000-8000-000000000001',
        machine_name: 'Industrial Chiller Unit A',
        machine_type: 'HVAC Cooling System',
        model_name: 'Trane Centravac CVHE-800',
        serial_number: 'SN-CH-99412-X',
        installation_date: '2022-03-15',
        notes: 'Cooling capacity 800 Tons. Uses R-1233zd refrigerant.',
        status: true,
        image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        secondary_image_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
        created_at: now,
        updated_at: now,
      },
      {
        id: '20000000-0000-4000-8000-000000000002',
        customer_id: '10000000-0000-4000-8000-000000000002',
        machine_name: 'Emergency MRI Generator Array',
        machine_type: 'Medical Backup Power',
        model_name: 'CAT 3516B Diesel Genset',
        serial_number: 'SN-GEN-33109-M',
        installation_date: '2023-01-20',
        notes: '2000 kW power output. Automatic transfer switch configuration.',
        status: true,
        image_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
        secondary_image_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
        created_at: now,
        updated_at: now,
      },
      {
        id: '20000000-0000-4000-8000-000000000003',
        customer_id: '10000000-0000-4000-8000-000000000003',
        machine_name: 'Automated High-Speed Conveyor',
        machine_type: 'Sortation Equipment',
        model_name: 'Dematic Crossbelt Sortation V3',
        serial_number: 'SN-SRT-88102-L',
        installation_date: '2021-11-10',
        notes: 'Sorts 15,000 parcels per hour. Dual VFD motor drive.',
        status: true,
        image_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
        secondary_image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert('assets', assets, {});

    // ==========================================
    // 4. WORK ORDERS (3 Jobs - All with Status NEW)
    // ==========================================
    const workOrders = [
      {
        id: '30000000-0000-4000-8000-000000000001',
        order_number: 'WO-1001',
        title: 'Quarterly HVAC Chiller Maintenance',
        description: 'Perform routine quarterly inspection, test compressor oil pressure, clean condenser coils, and record refrigerant operating temperatures.',
        customer_id: '10000000-0000-4000-8000-000000000001',
        asset_id: '20000000-0000-4000-8000-000000000001',
        technician_id: '00000000-0000-4000-8000-000000000001',
        status: 'NEW',
        priority: 'HIGH',
        scheduled_date: todayStr,
        scheduled_time: '09:00 AM',
        completed_at: null,
        version: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: '30000000-0000-4000-8000-000000000002',
        order_number: 'WO-1002',
        title: 'Emergency Hospital Generator Inspection',
        description: 'Investigate unexpected low battery voltage alarm on CAT 3516B generator. Test fuel pump line pressure and verify transfer switch latency.',
        customer_id: '10000000-0000-4000-8000-000000000002',
        asset_id: '20000000-0000-4000-8000-000000000002',
        technician_id: '00000000-0000-4000-8000-000000000003',
        status: 'NEW',
        priority: 'EMERGENCY',
        scheduled_date: todayStr,
        scheduled_time: '11:30 AM',
        completed_at: null,
        version: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: '30000000-0000-4000-8000-000000000003',
        order_number: 'WO-1003',
        title: 'Conveyor Belt Sensor & Motor Calibration',
        description: 'Annual motor bearing lubrication, optical sensor alignment check, and belt tension recalibration for main sorting line.',
        customer_id: '10000000-0000-4000-8000-000000000003',
        asset_id: '20000000-0000-4000-8000-000000000003',
        technician_id: '00000000-0000-4000-8000-000000000001',
        status: 'NEW',
        priority: 'MEDIUM',
        scheduled_date: todayStr,
        scheduled_time: '08:00 AM',
        completed_at: null,
        version: 1,
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert('work_orders', workOrders, {});

    // ==========================================
    // 5. WORK ORDER CHECKLISTS (9 Checklist Items)
    // ==========================================
    const checklists = [
      // WO 1 Checklists
      {
        id: '40000000-0000-4000-8000-000000000001',
        work_order_id: '30000000-0000-4000-8000-000000000001',
        task_description: 'Inspect compressor oil pressure & refrigerant suction levels',
        is_completed: true,
        order_index: 1,
        completed_at: now,
        created_at: now,
        updated_at: now,
      },
      {
        id: '40000000-0000-4000-8000-000000000002',
        work_order_id: '30000000-0000-4000-8000-000000000001',
        task_description: 'Calibrate digital thermostat temperature sensors',
        is_completed: true,
        order_index: 2,
        completed_at: now,
        created_at: now,
        updated_at: now,
      },
      {
        id: '40000000-0000-4000-8000-000000000003',
        work_order_id: '30000000-0000-4000-8000-000000000001',
        task_description: 'Clean condenser coils and clear primary drainage lines',
        is_completed: false,
        order_index: 3,
        completed_at: null,
        created_at: now,
        updated_at: now,
      },

      // WO 2 Checklists
      {
        id: '40000000-0000-4000-8000-000000000004',
        work_order_id: '30000000-0000-4000-8000-000000000002',
        task_description: 'Test emergency backup battery array DC voltage output',
        is_completed: false,
        order_index: 1,
        completed_at: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: '40000000-0000-4000-8000-000000000005',
        work_order_id: '30000000-0000-4000-8000-000000000002',
        task_description: 'Check diesel fuel pump feed pressure & filter cleanliness',
        is_completed: false,
        order_index: 2,
        completed_at: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: '40000000-0000-4000-8000-000000000006',
        work_order_id: '30000000-0000-4000-8000-000000000002',
        task_description: 'Verify automatic transfer switch response latency (<100ms)',
        is_completed: false,
        order_index: 3,
        completed_at: null,
        created_at: now,
        updated_at: now,
      },

      // WO 3 Checklists
      {
        id: '40000000-0000-4000-8000-000000000007',
        work_order_id: '30000000-0000-4000-8000-000000000003',
        task_description: 'Inspect primary belt tension alignment & pulley wear',
        is_completed: true,
        order_index: 1,
        completed_at: now,
        created_at: now,
        updated_at: now,
      },
      {
        id: '40000000-0000-4000-8000-000000000008',
        work_order_id: '30000000-0000-4000-8000-000000000003',
        task_description: 'Lubricate dual VFD motor bearings with synthetic grease',
        is_completed: true,
        order_index: 2,
        completed_at: now,
        created_at: now,
        updated_at: now,
      },
      {
        id: '40000000-0000-4000-8000-000000000009',
        work_order_id: '30000000-0000-4000-8000-000000000003',
        task_description: 'Verify optical sorting sensor laser sensitivity',
        is_completed: true,
        order_index: 3,
        completed_at: now,
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert('work_order_checklists', checklists, {});

    // ==========================================
    // 6. WORK ORDER READINGS (9 Readings)
    // ==========================================
    const readings = [
      // WO 1 Readings
      {
        id: '50000000-0000-4000-8000-000000000001',
        work_order_id: '30000000-0000-4000-8000-000000000001',
        user_id: '00000000-0000-4000-8000-000000000001',
        metric: 'Refrigerant Pressure',
        value: '145.2',
        unit: 'PSI',
        recorded_at: now,
        created_at: now,
        updated_at: now,
      },
      {
        id: '50000000-0000-4000-8000-000000000002',
        work_order_id: '30000000-0000-4000-8000-000000000001',
        user_id: '00000000-0000-4000-8000-000000000001',
        metric: 'Chiller Water Temp',
        value: '42.5',
        unit: '°F',
        recorded_at: now,
        created_at: now,
        updated_at: now,
      },
      {
        id: '50000000-0000-4000-8000-000000000003',
        work_order_id: '30000000-0000-4000-8000-000000000001',
        user_id: '00000000-0000-4000-8000-000000000001',
        metric: 'Compressor Amperage',
        value: '18.4',
        unit: 'A',
        recorded_at: now,
        created_at: now,
        updated_at: now,
      },

      // WO 2 Readings
      {
        id: '50000000-0000-4000-8000-000000000004',
        work_order_id: '30000000-0000-4000-8000-000000000002',
        user_id: '00000000-0000-4000-8000-000000000003',
        metric: 'Battery Array Voltage',
        value: '24.8',
        unit: 'V',
        recorded_at: now,
        created_at: now,
        updated_at: now,
      },
      {
        id: '50000000-0000-4000-8000-000000000005',
        work_order_id: '30000000-0000-4000-8000-000000000002',
        user_id: '00000000-0000-4000-8000-000000000003',
        metric: 'Diesel Tank Reserve',
        value: '85',
        unit: '%',
        recorded_at: now,
        created_at: now,
        updated_at: now,
      },
      {
        id: '50000000-0000-4000-8000-000000000006',
        work_order_id: '30000000-0000-4000-8000-000000000002',
        user_id: '00000000-0000-4000-8000-000000000003',
        metric: 'Oil Temperature',
        value: '180.0',
        unit: '°F',
        recorded_at: now,
        created_at: now,
        updated_at: now,
      },

      // WO 3 Readings
      {
        id: '50000000-0000-4000-8000-000000000007',
        work_order_id: '30000000-0000-4000-8000-000000000003',
        user_id: '00000000-0000-4000-8000-000000000001',
        metric: 'Belt Velocity',
        value: '2.4',
        unit: 'm/s',
        recorded_at: now,
        created_at: now,
        updated_at: now,
      },
      {
        id: '50000000-0000-4000-8000-000000000008',
        work_order_id: '30000000-0000-4000-8000-000000000003',
        user_id: '00000000-0000-4000-8000-000000000001',
        metric: 'Motor Draw',
        value: '12.1',
        unit: 'A',
        recorded_at: now,
        created_at: now,
        updated_at: now,
      },
      {
        id: '50000000-0000-4000-8000-000000000009',
        work_order_id: '30000000-0000-4000-8000-000000000003',
        user_id: '00000000-0000-4000-8000-000000000001',
        metric: 'Laser Alignment Offset',
        value: '0.02',
        unit: 'mm',
        recorded_at: now,
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert('work_order_readings', readings, {});

    // ==========================================
    // 7. WORK ORDER NOTES (9 Field Notes)
    // ==========================================
    const notes = [
      // WO 1 Notes
      {
        id: '60000000-0000-4000-8000-000000000001',
        work_order_id: '30000000-0000-4000-8000-000000000001',
        user_id: '00000000-0000-4000-8000-000000000001',
        content: 'Initial quarterly inspection started. Compressor oil pressure is steady at 145 PSI.',
        type: 'NOTE',
        created_at: now,
        updated_at: now,
      },
      {
        id: '60000000-0000-4000-8000-000000000002',
        work_order_id: '30000000-0000-4000-8000-000000000001',
        user_id: '00000000-0000-4000-8000-000000000001',
        content: 'Digital thermostat calibrated within +/- 0.1°F tolerance.',
        type: 'NOTE',
        created_at: now,
        updated_at: now,
      },
      {
        id: '60000000-0000-4000-8000-000000000003',
        work_order_id: '30000000-0000-4000-8000-000000000001',
        user_id: '00000000-0000-4000-8000-000000000002',
        content: 'System notification: Priority set to HIGH due to peak summer cooling load.',
        type: 'SYSTEM',
        created_at: now,
        updated_at: now,
      },

      // WO 2 Notes
      {
        id: '60000000-0000-4000-8000-000000000004',
        work_order_id: '30000000-0000-4000-8000-000000000002',
        user_id: '00000000-0000-4000-8000-000000000002',
        content: 'Urgent ticket created after SCADA telemetry reported 24.8V battery drop.',
        type: 'SYSTEM',
        created_at: now,
        updated_at: now,
      },
      {
        id: '60000000-0000-4000-8000-000000000005',
        work_order_id: '30000000-0000-4000-8000-000000000002',
        user_id: '00000000-0000-4000-8000-000000000003',
        content: 'En route to hospital medical campus. Preparing replacement battery charger kit.',
        type: 'NOTE',
        created_at: now,
        updated_at: now,
      },
      {
        id: '60000000-0000-4000-8000-000000000006',
        work_order_id: '30000000-0000-4000-8000-000000000002',
        user_id: '00000000-0000-4000-8000-000000000003',
        content: 'Spoke with facility manager Dr. Rostova. Cleanroom access clearance verified.',
        type: 'NOTE',
        created_at: now,
        updated_at: now,
      },

      // WO 3 Notes
      {
        id: '60000000-0000-4000-8000-000000000007',
        work_order_id: '30000000-0000-4000-8000-000000000003',
        user_id: '00000000-0000-4000-8000-000000000001',
        content: 'Conveyor line powered down safely for scheduled motor bearing greasing.',
        type: 'NOTE',
        created_at: now,
        updated_at: now,
      },
      {
        id: '60000000-0000-4000-8000-000000000008',
        work_order_id: '30000000-0000-4000-8000-000000000003',
        user_id: '00000000-0000-4000-8000-000000000001',
        content: 'Laser alignment error measured at 0.02mm, well within the 0.05mm threshold.',
        type: 'NOTE',
        created_at: now,
        updated_at: now,
      },
      {
        id: '60000000-0000-4000-8000-000000000009',
        work_order_id: '30000000-0000-4000-8000-000000000003',
        user_id: '00000000-0000-4000-8000-000000000001',
        content: 'Routine maintenance finished ahead of schedule. All systems tested operational.',
        type: 'NOTE',
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert('work_order_notes', notes, {});

    // ==========================================
    // 8. WORK ORDER ATTACHMENTS (9 Photo Attachments with Working Image URLs)
    // ==========================================
    const attachments = [
      // WO 1 Attachments
      {
        id: '70000000-0000-4000-8000-000000000001',
        work_order_id: '30000000-0000-4000-8000-000000000001',
        technician_id: '00000000-0000-4000-8000-000000000001',
        file_name: 'chiller_inspection_main.jpg',
        file_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        file_size: 2450000,
        mime_type: 'image/jpeg',
        client_local_id: 'att_local_1001_a',
        created_at: now,
        updated_at: now,
      },
      {
        id: '70000000-0000-4000-8000-000000000002',
        work_order_id: '30000000-0000-4000-8000-000000000001',
        technician_id: '00000000-0000-4000-8000-000000000001',
        file_name: 'pressure_gauge_psi.jpg',
        file_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
        file_size: 1890000,
        mime_type: 'image/jpeg',
        client_local_id: 'att_local_1001_b',
        created_at: now,
        updated_at: now,
      },
      {
        id: '70000000-0000-4000-8000-000000000003',
        work_order_id: '30000000-0000-4000-8000-000000000001',
        technician_id: '00000000-0000-4000-8000-000000000001',
        file_name: 'condenser_coils_cleaned.jpg',
        file_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
        file_size: 3120000,
        mime_type: 'image/jpeg',
        client_local_id: 'att_local_1001_c',
        created_at: now,
        updated_at: now,
      },

      // WO 2 Attachments
      {
        id: '70000000-0000-4000-8000-000000000004',
        work_order_id: '30000000-0000-4000-8000-000000000002',
        technician_id: '00000000-0000-4000-8000-000000000003',
        file_name: 'mri_generator_control_panel.jpg',
        file_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
        file_size: 2100000,
        mime_type: 'image/jpeg',
        client_local_id: 'att_local_1002_a',
        created_at: now,
        updated_at: now,
      },
      {
        id: '70000000-0000-4000-8000-000000000005',
        work_order_id: '30000000-0000-4000-8000-000000000002',
        technician_id: '00000000-0000-4000-8000-000000000003',
        file_name: 'battery_bank_voltage_meter.jpg',
        file_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        file_size: 1950000,
        mime_type: 'image/jpeg',
        client_local_id: 'att_local_1002_b',
        created_at: now,
        updated_at: now,
      },
      {
        id: '70000000-0000-4000-8000-000000000006',
        work_order_id: '30000000-0000-4000-8000-000000000002',
        technician_id: '00000000-0000-4000-8000-000000000003',
        file_name: 'fuel_filter_inspection.jpg',
        file_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
        file_size: 2780000,
        mime_type: 'image/jpeg',
        client_local_id: 'att_local_1002_c',
        created_at: now,
        updated_at: now,
      },

      // WO 3 Attachments
      {
        id: '70000000-0000-4000-8000-000000000007',
        work_order_id: '30000000-0000-4000-8000-000000000003',
        technician_id: '00000000-0000-4000-8000-000000000001',
        file_name: 'conveyor_motor_assembly.jpg',
        file_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
        file_size: 2900000,
        mime_type: 'image/jpeg',
        client_local_id: 'att_local_1003_a',
        created_at: now,
        updated_at: now,
      },
      {
        id: '70000000-0000-4000-8000-000000000008',
        work_order_id: '30000000-0000-4000-8000-000000000003',
        technician_id: '00000000-0000-4000-8000-000000000001',
        file_name: 'laser_sensor_calibration.jpg',
        file_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        file_size: 1650000,
        mime_type: 'image/jpeg',
        client_local_id: 'att_local_1003_b',
        created_at: now,
        updated_at: now,
      },
      {
        id: '70000000-0000-4000-8000-000000000009',
        work_order_id: '30000000-0000-4000-8000-000000000003',
        technician_id: '00000000-0000-4000-8000-000000000001',
        file_name: 'completed_signoff_tag.jpg',
        file_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
        file_size: 2200000,
        mime_type: 'image/jpeg',
        client_local_id: 'att_local_1003_c',
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert('work_order_attachments', attachments, {});

    // ==========================================
    // 9. WORK ORDER HISTORIES (9 Audit Entries)
    // ==========================================
    const histories = [
      // WO 1 Histories
      {
        id: '80000000-0000-4000-8000-000000000001',
        work_order_id: '30000000-0000-4000-8000-000000000001',
        user_id: '00000000-0000-4000-8000-000000000002',
        action: 'WORK_ORDER_CREATED',
        description: 'Work order WO-1001 created by Admin User.',
        metadata: JSON.stringify({ title: 'Quarterly HVAC Chiller Maintenance', priority: 'HIGH' }),
        created_at: now,
        updated_at: now,
      },
      {
        id: '80000000-0000-4000-8000-000000000002',
        work_order_id: '30000000-0000-4000-8000-000000000001',
        user_id: '00000000-0000-4000-8000-000000000002',
        action: 'TECHNICIAN_ASSIGNED',
        description: 'Assigned to Tech User (tech@example.com).',
        metadata: JSON.stringify({ technicianId: '00000000-0000-4000-8000-000000000001', name: 'Tech User' }),
        created_at: now,
        updated_at: now,
      },
      {
        id: '80000000-0000-4000-8000-000000000003',
        work_order_id: '30000000-0000-4000-8000-000000000001',
        user_id: '00000000-0000-4000-8000-000000000001',
        action: 'STATUS_CHANGED',
        description: 'Status updated from NEW to IN_PROGRESS by Tech User.',
        metadata: JSON.stringify({ from: 'NEW', to: 'IN_PROGRESS' }),
        created_at: now,
        updated_at: now,
      },

      // WO 2 Histories
      {
        id: '80000000-0000-4000-8000-000000000004',
        work_order_id: '30000000-0000-4000-8000-000000000002',
        user_id: '00000000-0000-4000-8000-000000000002',
        action: 'WORK_ORDER_CREATED',
        description: 'Work order WO-1002 created by Admin User.',
        metadata: JSON.stringify({ title: 'Emergency Hospital Generator Inspection', priority: 'EMERGENCY' }),
        created_at: now,
        updated_at: now,
      },
      {
        id: '80000000-0000-4000-8000-000000000005',
        work_order_id: '30000000-0000-4000-8000-000000000002',
        user_id: '00000000-0000-4000-8000-000000000002',
        action: 'TECHNICIAN_ASSIGNED',
        description: 'Assigned to Sarah Jenkins (tech2@example.com).',
        metadata: JSON.stringify({ technicianId: '00000000-0000-4000-8000-000000000003', name: 'Sarah Jenkins' }),
        created_at: now,
        updated_at: now,
      },
      {
        id: '80000000-0000-4000-8000-000000000006',
        work_order_id: '30000000-0000-4000-8000-000000000002',
        user_id: '00000000-0000-4000-8000-000000000002',
        action: 'PRIORITY_ESCALATED',
        description: 'Priority escalated to EMERGENCY due to medical telemetry alarm.',
        metadata: JSON.stringify({ priority: 'EMERGENCY' }),
        created_at: now,
        updated_at: now,
      },

      // WO 3 Histories
      {
        id: '80000000-0000-4000-8000-000000000007',
        work_order_id: '30000000-0000-4000-8000-000000000003',
        user_id: '00000000-0000-4000-8000-000000000002',
        action: 'WORK_ORDER_CREATED',
        description: 'Work order WO-1003 created by Admin User.',
        metadata: JSON.stringify({ title: 'Conveyor Belt Sensor & Motor Calibration', priority: 'MEDIUM' }),
        created_at: now,
        updated_at: now,
      },
      {
        id: '80000000-0000-4000-8000-000000000008',
        work_order_id: '30000000-0000-4000-8000-000000000003',
        user_id: '00000000-0000-4000-8000-000000000001',
        action: 'STATUS_CHANGED',
        description: 'Status updated from NEW to IN_PROGRESS by Tech User.',
        metadata: JSON.stringify({ from: 'NEW', to: 'IN_PROGRESS' }),
        created_at: now,
        updated_at: now,
      },
      {
        id: '80000000-0000-4000-8000-000000000009',
        work_order_id: '30000000-0000-4000-8000-000000000003',
        user_id: '00000000-0000-4000-8000-000000000001',
        action: 'STATUS_CHANGED',
        description: 'Job marked COMPLETED by Tech User.',
        metadata: JSON.stringify({ from: 'IN_PROGRESS', to: 'COMPLETED' }),
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert('work_order_histories', histories, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('work_order_histories', null, {});
    await queryInterface.bulkDelete('work_order_attachments', null, {});
    await queryInterface.bulkDelete('work_order_notes', null, {});
    await queryInterface.bulkDelete('work_order_readings', null, {});
    await queryInterface.bulkDelete('work_order_checklists', null, {});
    await queryInterface.bulkDelete('work_orders', null, {});
    await queryInterface.bulkDelete('assets', null, {});
    await queryInterface.bulkDelete('customers', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
