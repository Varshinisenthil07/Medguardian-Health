const defaultPatients = [
  {
    patientId: 'P001',
    patientName: 'Patient 001',
    age: 45,
    gender: 'Male',
    roomNumber: 'ICU-102',
    heartRate: 75,
    spo2: 98,
    temperature: 36.8,
    status: 'STABLE',
    emergency: false,
    deviceStatus: 'ONLINE',
    timestamp: new Date().toLocaleTimeString('en-US'),
    lastSeen: new Date().toISOString(),
    deviceId: 'esp32-vital-01'
  }
];

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(defaultPatients);
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const device_id = body.device_id || body.deviceId || 'esp32-vital-01';
    const patientId = body.patientId || body.patient_id || 'P001';
    const heart_rate = body.heart_rate !== undefined ? body.heart_rate : body.heartRate;
    const spo2 = body.spo2;
    const temperature = body.temperature;

    if (
      typeof heart_rate !== 'number' || isNaN(heart_rate) || heart_rate < 30 || heart_rate > 220 ||
      typeof spo2 !== 'number' || isNaN(spo2) || spo2 < 50 || spo2 > 100 ||
      typeof temperature !== 'number' || isNaN(temperature) || temperature < 20 || temperature > 45
    ) {
      return res.status(400).json({ success: false, error: 'invalid_vitals' });
    }

    let status = 'STABLE';
    let emergency = false;
    if (spo2 < 90 || heart_rate > 120 || heart_rate < 50 || temperature > 38.0 || temperature < 35.0) {
      status = 'CRITICAL';
      emergency = true;
    } else if (spo2 < 95 || heart_rate > 100 || temperature > 37.5) {
      status = 'WARNING';
    }

    const isoStr = body.timestamp || new Date().toISOString();

    return res.status(200).json({
      success: true,
      message: 'Vitals received',
      patientId,
      vitals: {
        device_id,
        heart_rate,
        spo2,
        temperature,
        status,
        emergency,
        timestamp: isoStr
      }
    });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
