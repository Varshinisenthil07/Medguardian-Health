import { Patient, VitalHistoryEntry } from '../types';

export const INITIAL_PATIENTS: Patient[] = [
  {
    patientId: 'P001',
    patientName: 'Patient 001',
    age: 45,
    gender: 'Male',
    roomNumber: 'ICU-102',
    heartRate: null,
    spo2: null,
    temperature: null,
    status: 'UNKNOWN',
    emergency: false,
    deviceStatus: 'WAITING FOR DATA',
    timestamp: 'Never',
    lastSeen: null
  },
  {
    patientId: 'P002',
    patientName: 'Patient 002 (Simulated)',
    age: 62,
    gender: 'Female',
    roomNumber: 'Ward-204',
    heartRate: 105,
    spo2: 94,
    temperature: 37.8,
    status: 'WARNING',
    emergency: false,
    deviceStatus: 'ONLINE',
    timestamp: new Date().toLocaleTimeString(),
    lastSeen: new Date().toISOString()
  },
  {
    patientId: 'P003',
    patientName: 'Patient 003 (Simulated)',
    age: 29,
    gender: 'Male',
    roomNumber: 'Room-305',
    heartRate: 72,
    spo2: 98,
    temperature: 36.6,
    status: 'STABLE',
    emergency: false,
    deviceStatus: 'ONLINE',
    timestamp: new Date().toLocaleTimeString(),
    lastSeen: new Date().toISOString()
  }
];

export const INITIAL_MOCK_HISTORY: VitalHistoryEntry[] = Array.from({ length: 20 }).map((_, i) => {
  const date = new Date(Date.now() - (20 - i) * 3000);
  const timeStr = date.toLocaleTimeString();
  return {
    id: `sim-hist-${i}`,
    patientId: 'P001',
    heartRate: 75 + Math.floor(Math.sin(i) * 5),
    spo2: 97 + (i % 2),
    temperature: 36.5 + Number((Math.cos(i) * 0.2).toFixed(2)),
    status: 'STABLE',
    timestamp: timeStr,
    isoTimestamp: date.toISOString(),
    source: 'SIMULATION'
  };
});
