import React, { useState, useEffect, useRef } from 'react';
import { useVitals } from '../context/VitalsContext';
import { LogLevel, DeviceLog } from '../types';
import { postTestVital } from '../services/api';
import {
  Terminal,
  Play,
  Pause,
  Trash2,
  Download,
  ArrowDown,
  Cpu,
  Wifi,
  Radio,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Server,
  Activity,
  Usb
} from 'lucide-react';

interface ESP32SerialMonitorProps {
  compact?: boolean;
}

export const ESP32SerialMonitor: React.FC<ESP32SerialMonitorProps> = ({ compact = false }) => {
  const { deviceLogs, clearDeviceLogs, mode, sseConnected } = useVitals();

  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [pausedLogs, setPausedLogs] = useState<DeviceLog[]>([]);
  
  // Direct USB Serial Connection State (Web Serial API)
  const [usbConnected, setUsbConnected] = useState<boolean>(false);
  const [usbLogs, setUsbLogs] = useState<DeviceLog[]>([]);
  const portRef = useRef<any>(null);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Merge SSE / Wi-Fi logs and USB Direct Cable Serial logs
  const combinedLogs = [...deviceLogs, ...usbLogs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // If paused, keep frozen snapshot of logs; otherwise display latest logs
  useEffect(() => {
    if (!isPaused) {
      setPausedLogs(combinedLogs);
    }
  }, [deviceLogs, usbLogs, isPaused]);

  // Handle Web Serial API (Direct USB Cable Serial Connection at 115200 Baud)
  const handleToggleUsbSerial = async () => {
    if (!('serial' in navigator)) {
      alert('Web Serial API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Opera to connect your ESP32 via USB cable.');
      return;
    }

    if (usbConnected && portRef.current) {
      try {
        await portRef.current.close();
      } catch (e) {
        // Ignore close errors
      }
      portRef.current = null;
      setUsbConnected(false);
      return;
    }

    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      portRef.current = port;
      setUsbConnected(true);

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const inputStream = textDecoder.readable;
      const reader = inputStream.getReader();

      let lineBuffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          reader.releaseLock();
          break;
        }
        if (value) {
          lineBuffer += value;
          const lines = lineBuffer.split('\n');
          lineBuffer = lines.pop() || '';

          for (const line of lines) {
            const rawStr = line.trim();
            if (rawStr.length > 0) {
              let level: LogLevel = 'INFO';
              if (rawStr.includes('[SENSOR]')) level = 'SENSOR';
              else if (rawStr.includes('[NETWORK]')) level = 'NETWORK';
              else if (rawStr.includes('[HTTP]')) level = 'HTTP';
              else if (rawStr.includes('[SUCCESS]')) level = 'SUCCESS';
              else if (rawStr.includes('[WARNING]')) level = 'WARNING';
              else if (rawStr.includes('[ERROR]')) level = 'ERROR';

              const logItem: DeviceLog = {
                id: `usb-log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                deviceId: 'ESP32-USB-COM',
                patientId: 'P001',
                level,
                message: rawStr,
                timestamp: new Date().toISOString(),
                source: 'ESP32 REAL HARDWARE'
              };

              setUsbLogs(prev => [...prev.slice(-199), logItem]);

              // Automatically parse temperature / heart rate / spo2 from serial output if present
              // Example line: [SENSOR] Temp: 36.60 °C | HR: 74 BPM | SpO2: 98 %
              const hrMatch = rawStr.match(/HR:\s*(\d+)/i);
              const spo2Match = rawStr.match(/SpO2:\s*(\d+)/i);
              const tempMatch = rawStr.match(/Temp:\s*([\d.]+)/i);

              if (hrMatch || spo2Match || tempMatch) {
                const hrVal = hrMatch ? parseInt(hrMatch[1], 10) : 74;
                const spo2Val = spo2Match ? parseInt(spo2Match[1], 10) : 98;
                const tempVal = tempMatch ? parseFloat(tempMatch[1]) : 36.6;

                if (hrVal > 0 && spo2Val > 0 && tempVal > 0) {
                  postTestVital({
                    device_id: 'esp32-vital-01',
                    patientId: 'P001',
                    heart_rate: hrVal,
                    spo2: spo2Val,
                    temperature: tempVal
                  }).catch(() => {});
                }
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.warn('[Web Serial] Port selection cancelled or connection error:', err);
      setUsbConnected(false);
    }
  };

  // Auto-scroll logic
  useEffect(() => {
    if (autoScroll && !isPaused && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [pausedLogs, autoScroll, isPaused]);

  const handleExportLogs = () => {
    if (pausedLogs.length === 0) {
      alert('No device log messages to export.');
      return;
    }
    const logText = pausedLogs
      .map(
        l =>
          `[${l.timestamp}] [${l.level}] [Device: ${l.deviceId}] ${l.message}`
      )
      .join('\n');

    const blob = new Blob([logText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ESP32_Serial_Log_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper badge & text styles for log levels
  const getLevelStyle = (level: LogLevel) => {
    switch (level) {
      case 'SUCCESS':
        return {
          badge: 'bg-emerald-950 text-emerald-400 border-emerald-800',
          text: 'text-emerald-300 font-semibold',
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" />
        };
      case 'WARNING':
        return {
          badge: 'bg-amber-950 text-amber-300 border-amber-800',
          text: 'text-amber-300 font-semibold',
          icon: <AlertTriangle className="w-3 h-3 text-amber-400 inline" />
        };
      case 'ERROR':
        return {
          badge: 'bg-rose-950 text-rose-300 border-rose-800',
          text: 'text-rose-400 font-bold',
          icon: <ShieldAlert className="w-3 h-3 text-rose-400 inline" />
        };
      case 'SENSOR':
        return {
          badge: 'bg-indigo-950 text-indigo-300 border-indigo-800',
          text: 'text-indigo-200',
          icon: <Activity className="w-3 h-3 text-indigo-400 inline" />
        };
      case 'NETWORK':
        return {
          badge: 'bg-cyan-950 text-cyan-300 border-cyan-800',
          text: 'text-cyan-300',
          icon: <Wifi className="w-3 h-3 text-cyan-400 inline" />
        };
      case 'HTTP':
        return {
          badge: 'bg-blue-950 text-blue-300 border-blue-800',
          text: 'text-blue-300',
          icon: <Server className="w-3 h-3 text-blue-400 inline" />
        };
      case 'INFO':
      default:
        return {
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          text: 'text-slate-200',
          icon: <Cpu className="w-3 h-3 text-slate-400 inline" />
        };
    }
  };

  const isHardware = mode === 'hardware';

  return (
    <div className="glass-panel rounded-2xl border border-[#1f2e56] overflow-hidden flex flex-col shadow-2xl">
      {/* Terminal Header Bar */}
      <div className="bg-[#0b1329] border-b border-[#1f2e56] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Title & Brand */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-cyan-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                ESP32 SERIAL MONITOR
              </h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#131e3a] border border-[#1f2e56] font-mono text-cyan-300 font-bold">
                115200 BAUD
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Real-Time Microcontroller Diagnostics Console</p>
          </div>
        </div>

        {/* Status Indicator & Counter */}
        <div className="flex items-center gap-3 text-xs">
          {usbConnected && (
            <div className="flex items-center gap-1.5 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-500/60 text-emerald-300">
              <Usb className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-[11px] font-extrabold uppercase">USB CABLE LIVE (115200)</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-[#131e3a] px-2.5 py-1 rounded-lg border border-[#1f2e56]">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                sseConnected || !isHardware ? 'bg-emerald-400' : 'bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                sseConnected || !isHardware ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></span>
            </span>
            <span className="text-[11px] font-bold text-slate-200">
              {isHardware ? (sseConnected ? 'WI-FI ONLINE' : 'WI-FI RECONNECTING') : 'SIMULATION STREAM'}
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-400 bg-[#131e3a] px-2 py-1 rounded-lg border border-[#1f2e56]">
            Messages: <strong className="text-cyan-400">{pausedLogs.length}</strong>
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5">
          {/* USB Serial Connection Button */}
          <button
            onClick={handleToggleUsbSerial}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border transition-all flex items-center gap-1.5 ${
              usbConnected
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950'
                : 'bg-cyan-950 text-cyan-300 border-cyan-700 hover:bg-cyan-900 hover:text-white'
            }`}
            title="Connect directly to ESP32 USB Cable COM Port using Web Serial API"
          >
            <Usb className="w-3.5 h-3.5" />
            {usbConnected ? 'Disconnect USB' : 'Connect USB Serial'}
          </button>

          {/* Auto Scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 ${
              autoScroll
                ? 'bg-cyan-950 text-cyan-400 border-cyan-800'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Auto-scroll console to bottom when new logs arrive"
          >
            <ArrowDown className="w-3 h-3" />
            Auto-scroll {autoScroll ? 'ON' : 'OFF'}
          </button>

          {/* Pause/Resume Toggle */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 ${
              isPaused
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>

          {/* Clear Button */}
          <button
            onClick={clearDeviceLogs}
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-rose-900/60 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1"
            title="Clear display logs"
          >
            <Trash2 className="w-3 h-3" /> Clear
          </button>

          {/* Export Button */}
          <button
            onClick={handleExportLogs}
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-cyan-900/60 text-cyan-300 border border-slate-700 transition-colors flex items-center gap-1"
            title="Export logs to file"
          >
            <Download className="w-3 h-3" /> Export
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div
        className={`bg-[#050b14] p-4 font-mono text-xs overflow-y-auto leading-relaxed space-y-1 select-text ${
          compact ? 'h-64' : 'h-80'
        }`}
      >
        {/* Terminal Header ASCII Banner */}
        <div className="text-[10px] text-cyan-500 font-bold border-b border-cyan-950 pb-2 mb-3 leading-tight opacity-80">
          <div>=====================================================================</div>
          <div>MEDGUARDIAN ESP32 REAL-TIME DEVICE CONSOLE MONITORING SYSTEM</div>
          <div>=====================================================================</div>
        </div>

        {pausedLogs.length > 0 ? (
          pausedLogs.map((log, index) => {
            const levelStyle = getLevelStyle(log.level);
            const timeFormatted = log.timestamp ? log.timestamp.split('T')[1]?.split('.')[0] || log.timestamp : '00:00:00';

            return (
              <div
                key={log.id || index}
                className="flex items-start gap-2 py-0.5 hover:bg-slate-900/50 rounded px-1 transition-colors"
              >
                {/* Timestamp */}
                <span className="text-slate-500 text-[10px] shrink-0 font-mono">
                  [{timeFormatted}]
                </span>

                {/* Level Badge */}
                <span
                  className={`px-1.5 py-0.2 rounded border text-[9px] font-extrabold uppercase shrink-0 flex items-center gap-1 ${levelStyle.badge}`}
                >
                  {levelStyle.icon}
                  <span>{log.level}</span>
                </span>

                {/* Log Message */}
                <span className={`break-all ${levelStyle.text}`}>
                  {log.message}
                </span>
              </div>
            );
          })
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-2 font-sans">
            <Terminal className="w-8 h-8 text-slate-700 animate-pulse" />
            <p className="text-xs font-bold text-slate-400">
              {isHardware
                ? 'WAITING FOR REAL ESP32 DEVICE MESSAGES...'
                : 'Initializing simulated log stream...'}
            </p>
            <p className="text-[11px] text-slate-600 font-mono">
              {isHardware
                ? 'Power ESP32 micro-controller & transmit POST requests to /api/device/log'
                : 'Select simulation mode parameters to observe console stream'}
            </p>
          </div>
        )}

        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};
