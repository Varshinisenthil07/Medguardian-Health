import { StreamVitalMessage } from './vitalsStream';
import { DeviceLog } from '../types';

export type SimulationScenario = 'NORMAL' | 'WARNING' | 'EMERGENCY';

export class VitalSimulator {
  private timer: any = null;
  private scenario: SimulationScenario = 'NORMAL';
  private callback: ((data: StreamVitalMessage) => void) | null = null;
  private logCallback: ((log: DeviceLog) => void) | null = null;
  private patientId: string = 'P001';

  public start(
    onData: (data: StreamVitalMessage) => void,
    onLog?: (log: DeviceLog) => void,
    intervalMs = 2500
  ) {
    this.stop();
    this.callback = onData;
    this.logCallback = onLog || null;

    this.timer = setInterval(() => {
      if (this.callback) {
        const payload = this.generateVitalReading();
        this.callback(payload);

        if (this.logCallback) {
          const logPayload = this.generateSimulatedLog(payload);
          this.logCallback(logPayload);
        }
      }
    }, intervalMs);
  }

  public setScenario(scenario: SimulationScenario) {
    this.scenario = scenario;
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public setPatientId(id: string) {
    this.patientId = id;
  }

  private generateVitalReading(): StreamVitalMessage {
    let heartRate = 75;
    let spo2 = 98;
    let temperature = 36.6;

    if (this.scenario === 'NORMAL') {
      heartRate = Math.floor(70 + Math.random() * 15);
      spo2 = Math.floor(96 + Math.random() * 4);
      temperature = Number((36.4 + Math.random() * 0.8).toFixed(2));
    } else if (this.scenario === 'WARNING') {
      heartRate = Math.floor(102 + Math.random() * 10);
      spo2 = Math.floor(91 + Math.random() * 4);
      temperature = Number((37.6 + Math.random() * 0.4).toFixed(2));
    } else if (this.scenario === 'EMERGENCY') {
      const rand = Math.random();
      if (rand > 0.5) {
        heartRate = Math.floor(125 + Math.random() * 20);
        spo2 = Math.floor(84 + Math.random() * 5);
        temperature = Number((38.3 + Math.random() * 0.6).toFixed(2));
      } else {
        heartRate = Math.floor(42 + Math.random() * 6);
        spo2 = Math.floor(86 + Math.random() * 4);
        temperature = Number((35.2 + Math.random() * 0.6).toFixed(2));
      }
    }

    return {
      patientId: this.patientId,
      heartRate,
      spo2,
      temperature,
      timestamp: new Date().toLocaleTimeString(),
      lastSeen: new Date().toISOString(),
      source: 'SIMULATION'
    };
  }

  private generateSimulatedLog(vital: StreamVitalMessage): DeviceLog {
    const levels: ('SENSOR' | 'SUCCESS' | 'HTTP' | 'INFO')[] = ['SENSOR', 'SUCCESS', 'HTTP', 'INFO'];
    const selectedLevel = levels[Math.floor(Math.random() * levels.length)];

    let msg = `Temperature : ${vital.temperature} °C | Heart Rate : ${vital.heartRate} BPM | SpO2 : ${vital.spo2} %`;
    if (selectedLevel === 'SUCCESS') msg = 'DATA SENT SUCCESSFULLY (SIMULATED)';
    if (selectedLevel === 'HTTP') msg = 'POST /api/vitals -> HTTP 200 OK';
    if (selectedLevel === 'INFO') msg = `Ingested payload for patient ${vital.patientId}`;

    return {
      id: `sim-log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      deviceId: `ESP32-SIM-${vital.patientId}`,
      patientId: vital.patientId,
      level: selectedLevel,
      message: msg,
      timestamp: new Date().toISOString(),
      source: 'SIMULATION'
    };
  }
}

export const vitalSimulator = new VitalSimulator();
