import { Patient, VitalPayload, DeviceLog } from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') + '/api';

export async function fetchHealthStatus(): Promise<{ success: boolean; status: string; service: string; timestamp: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Health endpoint returned status ${res.status}`);
  }
  return res.json();
}

export async function fetchVitals(): Promise<Patient[]> {
  const res = await fetch(`${API_BASE}/vitals`);
  if (!res.ok) {
    throw new Error(`Vitals endpoint returned status ${res.status}`);
  }
  return res.json();
}

export async function postTestVital(payload: VitalPayload): Promise<{ success: boolean; message: string; patientId: string }> {
  const res = await fetch(`${API_BASE}/vitals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({ error: 'Unknown server error' }));
    throw new Error(errJson.error || `HTTP error ${res.status}`);
  }
  return res.json();
}

export async function fetchDeviceLogs(): Promise<DeviceLog[]> {
  const res = await fetch(`${API_BASE}/device/logs`);
  if (!res.ok) {
    throw new Error(`Device logs endpoint returned status ${res.status}`);
  }
  return res.json();
}

export async function postDeviceLog(log: Omit<DeviceLog, 'id'>): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/device/log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(log)
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({ error: 'Unknown server error' }));
    throw new Error(errJson.error || `HTTP error ${res.status}`);
  }
  return res.json();
}
