import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  AppMode,
  Patient,
  VitalHistoryEntry,
  AlertItem,
  ThresholdsConfig,
  DeviceConnectionState,
  ActiveTab,
  DeviceLog
} from '../types';
import { DEFAULT_THRESHOLDS, evaluatePatientStatus } from '../utils/healthStatus';
import { INITIAL_PATIENTS, INITIAL_MOCK_HISTORY } from '../data/mockData';
import { vitalsStreamService, StreamVitalMessage } from '../services/vitalsStream';
import { vitalSimulator, SimulationScenario } from '../services/simulator';
import { fetchVitals, fetchDeviceLogs, fetchHealthStatus } from '../services/api';

interface VitalsContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  
  serverConnected: boolean;
  sseConnected: boolean;
  
  patients: Patient[];
  selectedPatientId: string;
  setSelectedPatientId: (id: string) => void;
  selectedPatient: Patient | undefined;
  
  history: VitalHistoryEntry[];
  alerts: AlertItem[];
  acknowledgeAlert: (id: string) => void;
  clearAlerts: () => void;
  
  // Device Console Logs
  deviceLogs: DeviceLog[];
  clearDeviceLogs: () => void;
  
  thresholds: ThresholdsConfig;
  updateThresholds: (newThresholds: Partial<ThresholdsConfig>) => void;
  
  // Simulation Controls
  simScenario: SimulationScenario;
  setSimScenario: (scenario: SimulationScenario) => void;
  
  // Emergency Modal
  activeEmergencyAlert: AlertItem | null;
  dismissEmergencyModal: () => void;
  
  // Hardware status info
  lastHardwarePayloadReceived: Date | null;
  updatePatientProfile: (patientId: string, profile: Partial<Patient>) => void;
}

const VitalsContext = createContext<VitalsContextType | undefined>(undefined);

export const VitalsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<AppMode>('hardware'); // Default to hardware mode
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [serverConnected, setServerConnected] = useState<boolean>(true);
  const [sseConnected, setSseConnected] = useState<boolean>(false);
  const [thresholds, setThresholds] = useState<ThresholdsConfig>(DEFAULT_THRESHOLDS);
  
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('P001');
  const [history, setHistory] = useState<VitalHistoryEntry[]>(INITIAL_MOCK_HISTORY);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [deviceLogs, setDeviceLogs] = useState<DeviceLog[]>([]);
  
  const [simScenario, setSimScenarioState] = useState<SimulationScenario>('NORMAL');
  const [activeEmergencyAlert, setActiveEmergencyAlert] = useState<AlertItem | null>(null);
  const [lastHardwarePayloadReceived, setLastHardwarePayloadReceived] = useState<Date | null>(null);

  const selectedPatient = patients.find(p => p.patientId === selectedPatientId) || patients[0];

  const patientsRef = React.useRef(patients);
  patientsRef.current = patients;

  const thresholdsRef = React.useRef(thresholds);
  thresholdsRef.current = thresholds;

  // Deduplication & Silence Cooldown Tracker for Alerts
  const lastAlertTimestampRef = React.useRef<Map<string, number>>(new Map());

  // Ingestion handler for incoming vitals (from SSE, REST polling, or Simulator)
  const processIncomingVital = useCallback((data: StreamVitalMessage, autoSelect: boolean = true) => {
    const pId = data.patientId || 'P001';
    const hr = data.heartRate;
    const spo2 = data.spo2;
    const temp = data.temperature;
    const isSim = data.source === 'SIMULATION';
    const nowStr = data.timestamp || new Date().toLocaleTimeString();
    const isoStr = data.lastSeen || new Date().toISOString();

    // Evaluate health status using configured thresholds
    const evaluation = evaluatePatientStatus(hr, spo2, temp, thresholdsRef.current);

    // Update Patients State
    setPatients(prev => {
      const idx = prev.findIndex(p => p.patientId === pId);
      const updatedPatient: Patient = {
        patientId: pId,
        patientName: idx >= 0 ? prev[idx].patientName : `Patient ${pId}`,
        age: idx >= 0 ? prev[idx].age : 40,
        gender: idx >= 0 ? prev[idx].gender : 'Unspecified',
        roomNumber: idx >= 0 ? prev[idx].roomNumber : 'Room 101',
        heartRate: hr,
        spo2,
        temperature: temp,
        status: evaluation.status,
        emergency: evaluation.emergency,
        deviceStatus: 'ONLINE',
        timestamp: nowStr,
        lastSeen: isoStr
      };

      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedPatient;
        return copy;
      } else {
        return [...prev, updatedPatient];
      }
    });

    if (!isSim && hr !== null) {
      setLastHardwarePayloadReceived(new Date(isoStr));
      if (autoSelect) {
        setSelectedPatientId(pId);
      }
    }

    // Append to History if values exist
    if (hr !== null && spo2 !== null && temp !== null) {
      const historyEntry: VitalHistoryEntry = {
        id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        patientId: pId,
        heartRate: hr,
        spo2,
        temperature: temp,
        status: evaluation.status,
        timestamp: nowStr,
        isoTimestamp: isoStr,
        source: isSim ? 'SIMULATION' : 'ESP32 REAL SENSOR'
      };

      setHistory(prev => [...prev.slice(-499), historyEntry]);
    }

    // Handle Alerts with strict deduplication to prevent alarm fatigue
    if (evaluation.alerts.length > 0) {
      const patientName = patientsRef.current.find(p => p.patientId === pId)?.patientName || `Patient ${pId}`;
      const nowMs = Date.now();

      setAlerts(prev => {
        const toAdd: AlertItem[] = [];

        for (const a of evaluation.alerts) {
          const alertKey = `${pId}:${a.vitalType}:${a.severity}`;
          const lastTime = lastAlertTimestampRef.current.get(alertKey) || 0;
          const existingUnack = prev.find(item => item.patientId === pId && item.vitalType === a.vitalType && !item.acknowledged);

          // Add alert only if no active unacknowledged alert exists AND > 45s since last identical alert
          if (!existingUnack && (nowMs - lastTime > 45000)) {
            lastAlertTimestampRef.current.set(alertKey, nowMs);
            toAdd.push({
              id: `alert-${nowMs}-${Math.random().toString(36).substr(2, 4)}`,
              patientId: pId,
              patientName,
              vitalType: a.vitalType,
              severity: a.severity,
              value: a.value,
              message: a.message,
              timestamp: nowStr
            });
          }
        }

        if (toAdd.length === 0) return prev;
        return [...toAdd, ...prev].slice(0, 100);
      });

      // Handle Emergency Modal Popup (60s cooldown on dismissal)
      const criticalEval = evaluation.alerts.find(a => a.severity === 'CRITICAL');
      if (criticalEval) {
        const modalKey = `modal:${pId}:${criticalEval.vitalType}`;
        const lastModalTime = lastAlertTimestampRef.current.get(modalKey) || 0;

        if (nowMs - lastModalTime > 60000) {
          lastAlertTimestampRef.current.set(modalKey, nowMs);
          setActiveEmergencyAlert({
            id: `alert-${nowMs}-${Math.random().toString(36).substr(2, 4)}`,
            patientId: pId,
            patientName,
            vitalType: criticalEval.vitalType,
            severity: criticalEval.severity,
            value: criticalEval.value,
            message: criticalEval.message,
            timestamp: nowStr
          });
        }
      }
    }
  }, []);

  // Ingestion handler for incoming Device Console Logs
  const processIncomingDeviceLog = useCallback((log: DeviceLog) => {
    const entry: DeviceLog = {
      ...log,
      id: log.id || `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
    };
    setDeviceLogs(prev => [...prev.slice(-199), entry]);
  }, []);

  // Mode Switch Logic
  const setMode = useCallback((newMode: AppMode) => {
    setModeState(newMode);
    if (newMode === 'hardware') {
      vitalSimulator.stop();
      fetchDeviceLogs()
        .then(initialLogs => {
          if (initialLogs && initialLogs.length > 0) {
            setDeviceLogs(initialLogs.map(l => ({ ...l, source: 'ESP32 REAL HARDWARE' })));
          }
        })
        .catch(err => console.warn('[VitalsContext] Could not fetch initial device logs:', err));
    } else {
      vitalSimulator.start(
        (simData) => processIncomingVital(simData),
        (simLog) => processIncomingDeviceLog(simLog)
      );
    }
  }, [processIncomingVital, processIncomingDeviceLog]);

  const setSimScenario = useCallback((scenario: SimulationScenario) => {
    setSimScenarioState(scenario);
    vitalSimulator.setScenario(scenario);
  }, []);

  const clearDeviceLogs = useCallback(() => {
    setDeviceLogs([]);
  }, []);

  const updateThresholds = useCallback((newT: Partial<ThresholdsConfig>) => {
    setThresholds(prev => ({ ...prev, ...newT }));
  }, []);

  const updatePatientProfile = useCallback((patientId: string, profile: Partial<Patient>) => {
    setPatients(prev => prev.map(p => p.patientId === patientId ? { ...p, ...profile } : p));
  }, []);

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const dismissEmergencyModal = useCallback(() => {
    setActiveEmergencyAlert(prev => {
      if (prev) {
        const modalKey = `modal:${prev.patientId}:${prev.vitalType}`;
        lastAlertTimestampRef.current.set(modalKey, Date.now());
      }
      return null;
    });
  }, []);

  // Hardware device timeout check (every 3s)
  useEffect(() => {
    const timer = setInterval(() => {
      if (mode === 'hardware') {
        const timeoutMs = thresholds.deviceTimeoutSec * 1000;
        setPatients(prev => prev.map(p => {
          if (p.lastSeen) {
            const timeDiff = Date.now() - new Date(p.lastSeen).getTime();
            if (timeDiff > timeoutMs && p.deviceStatus !== 'OFFLINE') {
              return {
                ...p,
                deviceStatus: 'OFFLINE',
                status: 'UNKNOWN'
              };
            }
          }
          return p;
        }));
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [mode, thresholds.deviceTimeoutSec]);

  // Connect to SSE stream & REST fallback synchronization
  useEffect(() => {
    if (mode === 'hardware') {
      const syncVitals = () => {
        fetchVitals()
          .then(initialPatients => {
            if (initialPatients && initialPatients.length > 0) {
              setServerConnected(true);

              let activePatientId: string | null = null;
              let latestTime = 0;

              initialPatients.forEach(p => {
                if (p.heartRate !== null) {
                  const pTime = p.lastSeen ? new Date(p.lastSeen).getTime() : 0;
                  if (pTime > latestTime) {
                    latestTime = pTime;
                    activePatientId = p.patientId;
                  }

                  processIncomingVital({
                    patientId: p.patientId,
                    heartRate: p.heartRate,
                    spo2: p.spo2 || 98,
                    temperature: p.temperature || 36.6,
                    status: p.status,
                    deviceStatus: p.deviceStatus,
                    timestamp: p.timestamp,
                    lastSeen: p.lastSeen || new Date().toISOString(),
                    source: 'ESP32 REAL SENSOR'
                  }, false);
                }
              });

              if (activePatientId && latestTime > 0) {
                setSelectedPatientId(activePatientId);
              }
            }
          })
          .catch(err => {
            console.warn('[VitalsContext] Could not sync vitals REST:', err);
            setServerConnected(false);
          });

        fetchDeviceLogs()
          .then(logs => {
            if (logs && logs.length > 0) {
              setDeviceLogs(logs.map(l => ({ ...l, source: 'ESP32 REAL HARDWARE' })));
            }
          })
          .catch(err => console.warn('[VitalsContext] Could not sync logs REST:', err));

        fetchHealthStatus()
          .then(() => setServerConnected(true))
          .catch(() => setServerConnected(false));
      };

      // Initial Sync
      syncVitals();

      // Periodic 2.5s Sync (Vercel Serverless & Distributed Instances Fallback)
      const pollTimer = setInterval(syncVitals, 2500);

      // Connect to SSE Stream
      vitalsStreamService.connect(
        (realPayload) => {
          setServerConnected(true);
          processIncomingVital(realPayload);
        },
        (realDeviceLog) => {
          processIncomingDeviceLog({ ...realDeviceLog, source: 'ESP32 REAL HARDWARE' });
        },
        (connected) => {
          setSseConnected(connected);
        }
      );

      return () => {
        clearInterval(pollTimer);
        vitalsStreamService.disconnect();
      };
    }
  }, [mode, processIncomingVital, processIncomingDeviceLog]);

  // Initialize simulation history if in sim mode
  useEffect(() => {
    if (mode === 'simulation' && history.length === 0) {
      setHistory(INITIAL_MOCK_HISTORY);
    }
  }, [mode, history.length]);

  return (
    <VitalsContext.Provider
      value={{
        mode,
        setMode,
        activeTab,
        setActiveTab,
        serverConnected,
        sseConnected,
        patients,
        selectedPatientId,
        setSelectedPatientId,
        selectedPatient,
        history,
        alerts,
        acknowledgeAlert,
        clearAlerts,
        deviceLogs,
        clearDeviceLogs,
        thresholds,
        updateThresholds,
        simScenario,
        setSimScenario,
        activeEmergencyAlert,
        dismissEmergencyModal,
        lastHardwarePayloadReceived,
        updatePatientProfile
      }}
    >
      {children}
    </VitalsContext.Provider>
  );
};

export const useVitals = () => {
  const context = useContext(VitalsContext);
  if (!context) {
    throw new Error('useVitals must be used within a VitalsProvider');
  }
  return context;
};
