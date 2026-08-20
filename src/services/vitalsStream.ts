import { DeviceLog } from '../types';

export interface StreamVitalMessage {
  patientId: string;
  patientName?: string;
  heartRate: number;
  spo2: number;
  temperature: number;
  status?: string;
  emergency?: boolean;
  deviceStatus?: string;
  timestamp?: string;
  lastSeen?: string;
  source?: 'ESP32 REAL SENSOR' | 'SIMULATION';
}

export type VitalsCallback = (data: StreamVitalMessage) => void;
export type DeviceLogCallback = (log: DeviceLog) => void;
export type StatusCallback = (connected: boolean) => void;

export class VitalsStreamService {
  private eventSource: EventSource | null = null;
  private onDataCallback: VitalsCallback | null = null;
  private onLogCallback: DeviceLogCallback | null = null;
  private onStatusCallback: StatusCallback | null = null;
  private reconnectTimer: any = null;
  private isIntentionalClose = false;

  public connect(
    onData: VitalsCallback,
    onLog?: DeviceLogCallback,
    onStatusChange?: StatusCallback
  ) {
    this.onDataCallback = onData;
    this.onLogCallback = onLog || null;
    this.onStatusCallback = onStatusChange || null;
    this.isIntentionalClose = false;

    this.initEventSource();
  }

  private initEventSource() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
      const sseUrl = `${apiBase}/api/events`;
      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        if (this.onStatusCallback) this.onStatusCallback(true);
      };

      // Listener for vitals event
      this.eventSource.addEventListener('vitals', (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data) as StreamVitalMessage;
          if (this.onDataCallback) {
            this.onDataCallback(parsed);
          }
        } catch (err) {
          console.error('[SSE Stream] Failed to parse JSON vitals data:', err);
        }
      });

      // Listener for device-log event
      this.eventSource.addEventListener('device-log', (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data) as DeviceLog;
          if (this.onLogCallback) {
            this.onLogCallback(parsed);
          }
        } catch (err) {
          console.error('[SSE Stream] Failed to parse JSON device-log data:', err);
        }
      });

      this.eventSource.onerror = (err) => {
        console.warn('[SSE Stream] EventSource connection error. Attempting reconnect...', err);
        if (this.onStatusCallback) this.onStatusCallback(false);

        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }

        if (!this.isIntentionalClose) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            console.log('[SSE Stream] Reconnecting to /api/events...');
            this.initEventSource();
          }, 3000);
        }
      };
    } catch (e) {
      console.error('[SSE Stream] Exception starting EventSource:', e);
      if (this.onStatusCallback) this.onStatusCallback(false);
    }
  }

  public disconnect() {
    this.isIntentionalClose = true;
    clearTimeout(this.reconnectTimer);
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.onStatusCallback) {
      this.onStatusCallback(false);
    }
  }
}

export const vitalsStreamService = new VitalsStreamService();
