export type AppMode = 'simulation' | 'hardware';

export type VitalStatus = 'STABLE' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';

export type DeviceConnectionState = 'ONLINE' | 'OFFLINE' | 'CONNECTING' | 'WAITING FOR DATA';

export type LogLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SENSOR' | 'NETWORK' | 'HTTP';

export interface DeviceLog {
  id?: string;
  deviceId: string;
  patientId?: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  source?: 'ESP32 REAL HARDWARE' | 'SIMULATION';
}

export interface VitalPayload {
  patientId: string;
  heartRate: number;
  spo2: number;
  temperature: number;
}

export interface Patient {
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  roomNumber: string;
  heartRate: number | null;
  spo2: number | null;
  temperature: number | null;
  status: VitalStatus;
  emergency: boolean;
  deviceStatus: DeviceConnectionState;
  timestamp: string;
  lastSeen: string | null;
}

export interface VitalHistoryEntry {
  id: string;
  patientId: string;
  heartRate: number;
  spo2: number;
  temperature: number;
  status: VitalStatus;
  timestamp: string;
  isoTimestamp: string;
  source: 'ESP32 REAL SENSOR' | 'SIMULATION';
}

export interface AlertItem {
  id: string;
  patientId: string;
  patientName: string;
  vitalType: 'Heart Rate' | 'SpO2' | 'Temperature';
  severity: 'WARNING' | 'CRITICAL';
  value: string;
  message: string;
  timestamp: string;
  acknowledged?: boolean;
}

export interface ThresholdsConfig {
  hrLowWarn: number;    // default 50
  hrNormalMin: number;  // default 60
  hrNormalMax: number;  // default 100
  hrWarnMax: number;    // default 120 (above 120 is critical)
  
  spo2NormalMin: number; // default 95
  spo2WarnMin: number;   // default 90 (below 90 is critical)
  
  tempLowWarn: number;   // default 35.0
  tempNormalMin: number; // default 36.0
  tempNormalMax: number; // default 37.5
  tempWarnMax: number;   // default 38.0 (above 38.0 is critical)

  deviceTimeoutSec: number; // default 15
}

export type ActiveTab = 
  | 'dashboard'
  | 'monitoring'
  | 'patients'
  | 'priority'
  | 'alerts'
  | 'history'
  | 'reports'
  | 'devices'
  | 'ai'
  | 'settings';
