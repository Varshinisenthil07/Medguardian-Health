import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  initDb,
  getDbConnectionStatus,
  upsertDbPatient,
  getDbPatients,
  insertDbVitalHistory,
  insertDbDeviceLog,
  getDbDeviceLogs
} from './db';

let __filename = '';
let __dirname = process.cwd();
try {
  if (typeof import.meta !== 'undefined' && typeof import.meta.url === 'string' && import.meta.url.startsWith('file:')) {
    __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
  }
} catch (e) {
  // Ignore in serverless environments
}

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3006;
const HOST = '0.0.0.0';

export const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Log incoming request path in serverless
app.use((req, res, next) => {
  console.log(`[API Request] ${req.method} ${req.url} (originalUrl: ${req.originalUrl})`);
  next();
});

// Initialize DB attempt on serverless start if on Vercel
if (process.env.VERCEL) {
  initDb().catch(err => console.warn('[DB VERCEL WARNING]:', err));
}

// In-Memory Patient State Cache
interface ServerPatient {
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
  deviceId?: string;
}

const patientStore: Map<string, ServerPatient> = new Map([
  [
    'P001',
    {
      patientId: 'P001',
      patientName: 'Patient 001',
      age: 45,
      gender: 'Male',
      roomNumber: 'ICU-102',
      heartRate: 74,
      spo2: 98,
      temperature: 36.6,
      status: 'STABLE',
      emergency: false,
      deviceStatus: 'ONLINE',
      timestamp: new Date().toLocaleTimeString('en-US'),
      lastSeen: new Date().toISOString(),
      deviceId: 'esp32-vital-01'
    }
  ]
]);

// In-Memory History Store pre-seeded with initial baseline trends
const historyStore: Array<{
  id: string;
  patientId: string;
  heartRate: number;
  spo2: number;
  temperature: number;
  status: string;
  timestamp: string;
  isoTimestamp: string;
  source: string;
  deviceId?: string;
}> = Array.from({ length: 20 }).map((_, i) => {
  const date = new Date(Date.now() - (20 - i) * 3000);
  return {
    id: `srv-hist-${i}`,
    patientId: 'P001',
    heartRate: 74 + Math.floor(Math.sin(i) * 4),
    spo2: 97 + (i % 2),
    temperature: Number((36.5 + (i % 3) * 0.1).toFixed(2)),
    status: 'STABLE',
    timestamp: date.toLocaleTimeString('en-US'),
    isoTimestamp: date.toISOString(),
    source: 'ESP32 REAL SENSOR',
    deviceId: 'esp32-vital-01'
  };
});

// In-Memory Device Log Store
interface ServerDeviceLog {
  id: string;
  deviceId: string;
  patientId?: string;
  level: string;
  message: string;
  timestamp: string;
}

const deviceLogStore: ServerDeviceLog[] = [];

// SSE Clients Registry
const sseClients: Set<Response> = new Set();

// Health threshold evaluation utility for prototype ESP32 sensors
function calculateStatus(hr: number, spo2: number, temp: number) {
  let isEmergency = false;
  let status = 'STABLE';

  // Prototype thresholds accounting for ambient/skin surface temp & optical finger placement
  if (spo2 < 80 || hr > 130 || hr < 40 || temp > 39.0 || temp < 20.0) {
    status = 'CRITICAL';
    isEmergency = true;
  } else if (spo2 < 88 || hr > 100 || hr < 50 || temp > 38.0) {
    status = 'WARNING';
  }

  return { status, emergency: isEmergency };
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// GET /api/health
app.get(['/api/health', '/health'], (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  return res.json({
    success: true,
    service: 'vitals-api',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: getDbConnectionStatus() ? 'CONNECTED (Neon PostgreSQL)' : 'OFFLINE (In-Memory Fallback)'
  });
});

// GET /api/vitals
app.get(['/api/vitals', '/vitals'], async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  
  const dbPatients = await getDbPatients();
  if (dbPatients && dbPatients.length > 0) {
    return res.json(dbPatients);
  }

  const patientList = Array.from(patientStore.values());
  return res.json(patientList);
});

// POST /api/vitals
app.post(['/api/vitals', '/vitals'], async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const body = req.body || {};

  // Support both snake_case (standard API contract) and camelCase
  const device_id = body.device_id || body.deviceId || 'esp32-vital-01';
  const patientId = body.patientId || body.patient_id || 'P001';
  const heart_rate = body.heart_rate !== undefined ? body.heart_rate : body.heartRate;
  const spo2 = body.spo2;
  const temperature = body.temperature;

  // Strict Validation: check types & physiological sanity limits
  if (
    typeof heart_rate !== 'number' || isNaN(heart_rate) || heart_rate < 30 || heart_rate > 220 ||
    typeof spo2 !== 'number' || isNaN(spo2) || spo2 < 50 || spo2 > 100 ||
    typeof temperature !== 'number' || isNaN(temperature) || temperature < 20 || temperature > 45
  ) {
    return res.status(400).json({
      success: false,
      error: 'invalid_vitals'
    });
  }

  const timeStr = new Date().toLocaleTimeString('en-US');
  const isoStr = body.timestamp || new Date().toISOString();

  const { status, emergency } = calculateStatus(heart_rate, spo2, temperature);

  // Update or create patient record
  let existing = patientStore.get(patientId);
  if (!existing) {
    existing = {
      patientId,
      patientName: `Patient ${patientId}`,
      age: 40,
      gender: 'Unspecified',
      roomNumber: 'Room-101',
      heartRate: heart_rate,
      spo2,
      temperature,
      status,
      emergency,
      deviceStatus: 'ONLINE',
      timestamp: timeStr,
      lastSeen: isoStr,
      deviceId: device_id
    };
  } else {
    existing.heartRate = heart_rate;
    existing.spo2 = spo2;
    existing.temperature = temperature;
    existing.status = status;
    existing.emergency = emergency;
    existing.deviceStatus = 'ONLINE';
    existing.timestamp = timeStr;
    existing.lastSeen = isoStr;
    existing.deviceId = device_id;
  }

  patientStore.set(patientId, existing);

  // Record History Entry
  const historyEntry = {
    id: `srv-hist-${Date.now()}`,
    patientId,
    heartRate: heart_rate,
    spo2,
    temperature,
    status,
    timestamp: timeStr,
    isoTimestamp: isoStr,
    source: 'ESP32 REAL SENSOR',
    deviceId: device_id
  };
  historyStore.push(historyEntry);

  if (historyStore.length > 1000) {
    historyStore.shift();
  }

  // Asynchronously persist to Neon PostgreSQL Database
  upsertDbPatient(existing);
  insertDbVitalHistory(historyEntry);

  // Broadcast to SSE clients if connected
  const broadcastData = {
    device_id,
    patientId,
    patientName: existing.patientName,
    heartRate: heart_rate,
    spo2,
    temperature,
    status,
    emergency,
    deviceStatus: 'ONLINE',
    timestamp: timeStr,
    lastSeen: isoStr,
    source: 'ESP32 REAL SENSOR'
  };

  const sseMessage = `event: vitals\ndata: ${JSON.stringify(broadcastData)}\n\n`;

  sseClients.forEach((client) => {
    try {
      client.write(sseMessage);
    } catch (e) {
      sseClients.delete(client);
    }
  });

  console.log(`[ESP32 Vital Ingestion] Device: ${device_id} | Patient: ${patientId} | HR: ${heart_rate} BPM | SpO2: ${spo2}% | Temp: ${temperature}°C`);

  return res.status(200).json({
    success: true,
    message: 'Vitals received',
    patientId,
    vitals: {
      device_id,
      heart_rate,
      spo2,
      temperature,
      timestamp: isoStr
    }
  });
});

// GET /api/device/logs
app.get(['/api/device/logs', '/device/logs'], async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');

  const dbLogs = await getDbDeviceLogs(100);
  if (dbLogs && dbLogs.length > 0) {
    return res.json(dbLogs);
  }

  return res.json(deviceLogStore);
});

// POST /api/device/log
app.post(['/api/device/log', '/device/log'], async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const body = req.body || {};
  const deviceId = body.deviceId || body.device_id;
  const { patientId, level, message, timestamp } = body;

  if (!deviceId || typeof deviceId !== 'string' || !level || !message) {
    return res.status(400).json({
      success: false,
      error: 'invalid_log_payload'
    });
  }

  const validLevel = (['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'SENSOR', 'NETWORK', 'HTTP'].includes(level))
    ? level
    : 'INFO';

  const logEntry: ServerDeviceLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    deviceId,
    patientId: patientId || 'P001',
    level: validLevel,
    message,
    timestamp: timestamp || new Date().toISOString()
  };

  deviceLogStore.push(logEntry);
  if (deviceLogStore.length > 100) {
    deviceLogStore.shift();
  }

  // Persist device log to Neon PostgreSQL Database
  insertDbDeviceLog(logEntry);

  // Broadcast device log event via SSE
  const sseLogMessage = `event: device-log\ndata: ${JSON.stringify(logEntry)}\n\n`;

  sseClients.forEach((client) => {
    try {
      client.write(sseLogMessage);
    } catch (e) {
      sseClients.delete(client);
    }
  });

  return res.status(200).json({
    success: true,
    message: 'Device log received'
  });
});

// GET /api/events (SSE Stream)
app.get(['/api/events', '/events'], (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  res.write(': connected\n\n');

  sseClients.add(res);

  const keepAliveInterval = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch (e) {
      clearInterval(keepAliveInterval);
      sseClients.delete(res);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
    sseClients.delete(res);
  });
});

// ----------------------------------------------------
// VITE INTEGRATION / LOCAL DEV SERVER
// ----------------------------------------------------
async function startServer() {
  initDb().catch(err => console.warn('[DB WARNING] Async DB init warning:', err));

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });

    app.use(vite.middlewares);
  } else if (isProd && !process.env.VERCEL) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, HOST, () => {
      console.log(`
=====================================================
  MEDGUARDIAN IoT GATEWAY SERVER STARTED
=====================================================
  Local URL:   http://localhost:${PORT}
  Network URL: http://${HOST}:${PORT}
  Database:    ${getDbConnectionStatus() ? 'CONNECTED (Neon PostgreSQL)' : 'OFFLINE (In-Memory Fallback)'}
  
  API Endpoints:
    GET  /api/health
    GET  /api/vitals
    POST /api/vitals
    GET  /api/device/logs
    POST /api/device/log
    GET  /api/events (SSE)
=====================================================
      `);
    });
  }
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start MedGuardian server:', err);
  });
}

export default app;
