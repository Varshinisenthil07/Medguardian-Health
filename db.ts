import pg from 'pg';
const PoolClass = pg.Pool || (pg as any).default?.Pool || pg;

const rawUrl = process.env.DATABASE_URL || '';
const cleanUrl = rawUrl ? rawUrl.split('?')[0] : '';

export const pool = new PoolClass({
  connectionString: cleanUrl || undefined,
  ssl: cleanUrl ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err: Error) => {
  console.warn('[DB POOL ERROR] Unexpected background pool error:', err?.message || err);
});

let isDbConnected = false;

export function getDbConnectionStatus() {
  return isDbConnected;
}

export async function initDb() {
  try {
    const client = await pool.connect();
    console.log('[DB] Connected to Neon PostgreSQL Database successfully!');
    isDbConnected = true;

    // Create Patients Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS patients (
        patient_id VARCHAR(50) PRIMARY KEY,
        patient_name VARCHAR(100) NOT NULL,
        age INT DEFAULT 40,
        gender VARCHAR(20) DEFAULT 'Unspecified',
        room_number VARCHAR(50) DEFAULT 'Room-101',
        heart_rate INT,
        spo2 INT,
        temperature NUMERIC(5, 2),
        status VARCHAR(20) DEFAULT 'UNKNOWN',
        emergency BOOLEAN DEFAULT FALSE,
        device_status VARCHAR(30) DEFAULT 'WAITING FOR DATA',
        timestamp VARCHAR(50),
        last_seen TIMESTAMPTZ
      );
    `);

    // Create Vital History Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vital_history (
        id VARCHAR(100) PRIMARY KEY,
        patient_id VARCHAR(50) REFERENCES patients(patient_id) ON DELETE CASCADE,
        heart_rate INT NOT NULL,
        spo2 INT NOT NULL,
        temperature NUMERIC(5, 2) NOT NULL,
        status VARCHAR(20) NOT NULL,
        timestamp VARCHAR(50) NOT NULL,
        iso_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        source VARCHAR(50) DEFAULT 'ESP32 REAL SENSOR'
      );
    `);

    // Create Device Logs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS device_logs (
        id VARCHAR(100) PRIMARY KEY,
        device_id VARCHAR(50) NOT NULL,
        patient_id VARCHAR(50),
        level VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure default patient P001 exists in database
    await client.query(`
      INSERT INTO patients (patient_id, patient_name, age, gender, room_number, status, device_status, timestamp)
      VALUES ('P001', 'Patient 001', 45, 'Male', 'ICU-102', 'UNKNOWN', 'WAITING FOR DATA', 'Never')
      ON CONFLICT (patient_id) DO NOTHING;
    `);

    client.release();
    console.log('[DB] Database schema tables initialized & verified (patients, vital_history, device_logs)');
  } catch (err) {
    console.warn('[DB WARNING] Could not connect to PostgreSQL database. Falling back to in-memory store:', err);
    isDbConnected = false;
  }
}

// Database CRUD Operations

export async function upsertDbPatient(patient: {
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  roomNumber: string;
  heartRate: number | null;
  spo2: number | null;
  temperature: number | null;
  status: string;
  emergency: boolean;
  deviceStatus: string;
  timestamp: string;
  lastSeen: string | null;
}) {
  if (!isDbConnected) return;
  try {
    const query = `
      INSERT INTO patients (patient_id, patient_name, age, gender, room_number, heart_rate, spo2, temperature, status, emergency, device_status, timestamp, last_seen)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (patient_id) DO UPDATE SET
        patient_name = EXCLUDED.patient_name,
        age = EXCLUDED.age,
        gender = EXCLUDED.gender,
        room_number = EXCLUDED.room_number,
        heart_rate = EXCLUDED.heart_rate,
        spo2 = EXCLUDED.spo2,
        temperature = EXCLUDED.temperature,
        status = EXCLUDED.status,
        emergency = EXCLUDED.emergency,
        device_status = EXCLUDED.device_status,
        timestamp = EXCLUDED.timestamp,
        last_seen = EXCLUDED.last_seen;
    `;
    await pool.query(query, [
      patient.patientId,
      patient.patientName,
      patient.age,
      patient.gender,
      patient.roomNumber,
      patient.heartRate,
      patient.spo2,
      patient.temperature,
      patient.status,
      patient.emergency,
      patient.deviceStatus,
      patient.timestamp,
      patient.lastSeen ? new Date(patient.lastSeen) : null
    ]);
  } catch (err) {
    console.error('[DB ERROR] Failed to upsert patient:', err);
  }
}

export async function getDbPatients() {
  if (!isDbConnected) return null;
  try {
    const res = await pool.query(`SELECT * FROM patients ORDER BY patient_id ASC;`);
    return res.rows.map(r => ({
      patientId: r.patient_id,
      patientName: r.patient_name,
      age: r.age,
      gender: r.gender,
      roomNumber: r.room_number,
      heartRate: r.heart_rate !== null ? Number(r.heart_rate) : null,
      spo2: r.spo2 !== null ? Number(r.spo2) : null,
      temperature: r.temperature !== null ? Number(r.temperature) : null,
      status: r.status,
      emergency: r.emergency,
      deviceStatus: r.device_status,
      timestamp: r.timestamp,
      lastSeen: r.last_seen ? r.last_seen.toISOString() : null
    }));
  } catch (err) {
    console.error('[DB ERROR] Failed to fetch patients:', err);
    return null;
  }
}

export async function insertDbVitalHistory(entry: {
  id: string;
  patientId: string;
  heartRate: number;
  spo2: number;
  temperature: number;
  status: string;
  timestamp: string;
  isoTimestamp: string;
  source: string;
}) {
  if (!isDbConnected) return;
  try {
    const query = `
      INSERT INTO vital_history (id, patient_id, heart_rate, spo2, temperature, status, timestamp, iso_timestamp, source)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
    `;
    await pool.query(query, [
      entry.id,
      entry.patientId,
      entry.heartRate,
      entry.spo2,
      entry.temperature,
      entry.status,
      entry.timestamp,
      new Date(entry.isoTimestamp),
      entry.source
    ]);
  } catch (err) {
    console.error('[DB ERROR] Failed to insert vital history:', err);
  }
}

export async function insertDbDeviceLog(log: {
  id: string;
  deviceId: string;
  patientId?: string;
  level: string;
  message: string;
  timestamp: string;
}) {
  if (!isDbConnected) return;
  try {
    const query = `
      INSERT INTO device_logs (id, device_id, patient_id, level, message, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6);
    `;
    await pool.query(query, [
      log.id,
      log.deviceId,
      log.patientId || 'P001',
      log.level,
      log.message,
      new Date(log.timestamp)
    ]);
  } catch (err) {
    console.error('[DB ERROR] Failed to insert device log:', err);
  }
}

export async function getDbDeviceLogs(limit = 100) {
  if (!isDbConnected) return null;
  try {
    const res = await pool.query(
      `SELECT * FROM device_logs ORDER BY timestamp ASC LIMIT $1;`,
      [limit]
    );
    return res.rows.map(r => ({
      id: r.id,
      deviceId: r.device_id,
      patientId: r.patient_id,
      level: r.level,
      message: r.message,
      timestamp: r.timestamp.toISOString()
    }));
  } catch (err) {
    console.error('[DB ERROR] Failed to fetch device logs:', err);
    return null;
  }
}
