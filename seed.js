// seed.js
// Populates the database with simulated data (minimum 10 records per table)
// Run with: node seed.js

require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('./db');

async function seed() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting database seeding...');

    // 1. Clear existing data (reset IDs back to 1)
    // We use CASCADE to clear dependent tables
    await client.query('TRUNCATE users, vehicles, loads, eld_logs, alerts RESTART IDENTITY CASCADE;');
    console.log('🧹 Cleared existing tables.');

    // Common password for all seeded users (so you can log in easily)
    const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

    // ─────────────────────────────────────────────
    // 2. Insert Users (10 Drivers, 2 Dispatchers)
    // ─────────────────────────────────────────────
    console.log('👥 Seeding users...');
    for (let i = 1; i <= 12; i++) {
      const isDispatcher = i > 10;
      const role = isDispatcher ? 'DISPATCHER' : 'DRIVER';
      const name = isDispatcher ? `Dispatcher ${i - 10}` : `Driver ${i}`;
      const email = isDispatcher ? `dispatch${i - 10}@pbsa.co.za` : `driver${i}@pbsa.co.za`;

      await client.query(
        `INSERT INTO users (full_name, email, password_hash, role, phone, license_number)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [name, email, defaultPasswordHash, role, `08200000${i.toString().padStart(2, '0')}`, isDispatcher ? null : `DL-2024-${i.toString().padStart(3, '0')}`]
      );
    }

    // ─────────────────────────────────────────────
    // 3. Insert Vehicles (10 Trucks)
    // ─────────────────────────────────────────────
    console.log('🚛 Seeding vehicles...');
    const makes = ['Volvo', 'Scania', 'Mercedes-Benz', 'MAN', 'Isuzu'];
    for (let i = 1; i <= 10; i++) {
      await client.query(
        `INSERT INTO vehicles (registration, make, model, year, capacity_kg, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [`PBSA-${i.toString().padStart(3, '0')}`, makes[i % 5], `Model-${i}`, 2020 + (i % 5), 25000 + (i * 500), 'AVAILABLE']
      );
    }

    // ─────────────────────────────────────────────
    // 4. Insert Loads (12 Loads assigned to Drivers 1-10)
    // ─────────────────────────────────────────────
    console.log('📦 Seeding loads...');
    const cities = ['Johannesburg', 'Durban', 'Cape Town', 'Pretoria', 'Polokwane'];
    const statuses = ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED'];

    for (let i = 1; i <= 12; i++) {
      const driverId = i <= 10 ? i : 1; // Assign to drivers 1-10
      const vehicleId = i <= 10 ? i : 1;
      const status = statuses[i % 4];
      
      await client.query(
        `INSERT INTO loads (reference, driver_id, vehicle_id, origin, destination, cargo_description, weight_kg, status, eta)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          `LD-SA-2024-${i.toString().padStart(5, '0')}`,
          driverId,
          vehicleId,
          cities[i % 5],
          cities[(i + 2) % 5],
          `Cargo Shipment ${i} - Export Grade`,
          15000 + (i * 1000),
          status,
          new Date(Date.now() + i * 86400000) // ETA i days from now
        ]
      );
    }

    // ─────────────────────────────────────────────
    // 5. Insert ELD Logs (15 completed logs)
    // ─────────────────────────────────────────────
    console.log('⏱️  Seeding ELD logs...');
    const dutyStatuses = ['DRIVING', 'ON_DUTY', 'SLEEPER', 'OFF'];
    for (let i = 1; i <= 15; i++) {
      const driverId = (i % 10) + 1; // Drivers 1-10
      const loadId = (i % 12) + 1;   // Loads 1-12
      
      // Create logs in the past
      const startTime = new Date(Date.now() - (i * 86400000)); // i days ago
      const endTime = new Date(startTime.getTime() + (4 * 3600000)); // +4 hours

      await client.query(
        `INSERT INTO eld_logs (driver_id, load_id, duty_status, start_time, end_time, location, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [driverId, loadId, dutyStatuses[i % 4], startTime, endTime, cities[i % 5] + ' Depot', 'Routine shift completed']
      );
    }

    // ─────────────────────────────────────────────
    // 6. Insert Alerts (12 Alerts)
    // ─────────────────────────────────────────────
    console.log('🔔 Seeding alerts...');
    const severities = ['INFO', 'WARNING', 'CRITICAL'];
    for (let i = 1; i <= 12; i++) {
      const userId = (i % 10) + 1; // Send to drivers 1-10
      await client.query(
        `INSERT INTO alerts (user_id, title, message, severity, is_read)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          `System Alert ${i}`,
          `This is a simulated ${severities[i % 3]} notification for your upcoming delivery.`,
          severities[i % 3],
          i % 2 === 0 // Every second alert is read
        ]
      );
    }

    console.log('✅ Seeding completed successfully!');
    console.log('🔑 All seeded users have the password: Password123!');
    console.log('📧 Driver emails: driver1@pbsa.co.za ... driver10@pbsa.co.za');
    console.log('📧 Dispatcher emails: dispatch1@pbsa.co.za, dispatch2@pbsa.co.za');

  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();