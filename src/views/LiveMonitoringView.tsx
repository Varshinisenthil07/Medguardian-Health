import React, { useState } from 'react';
import { useVitals } from '../context/VitalsContext';
import { ESP32SerialMonitor } from '../components/ESP32SerialMonitor';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Activity, Wifi, Server, Cpu, Heart, Thermometer, Radio } from 'lucide-react';

export const LiveMonitoringView: React.FC = () => {
  const { history, selectedPatient, mode } = useVitals();
  const [maxReadings, setMaxReadings] = useState<number>(60);

  const pHistory = history.filter(h => h.patientId === (selectedPatient?.patientId || 'P001'));
  const rollingData = pHistory.slice(-maxReadings);

  const isHardware = mode === 'hardware';

  return (
    <div className="space-y-6">
      {/* Top Telemetry Flow Pipeline Header */}
      <div className="glass-panel rounded-2xl p-5 border border-[#1f2e56] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1f2e56] pb-4">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
              LIVE TELEMETRY SENSOR STREAM
            </h2>
            <p className="text-xs text-slate-400">High-frequency real-time stream monitor from hardware edge gateway</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-semibold">History Window:</span>
            {[30, 60, 100].map(count => (
              <button
                key={count}
                onClick={() => setMaxReadings(count)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  maxReadings === count
                    ? 'bg-cyan-600 text-white'
                    : 'bg-[#131e3a] text-slate-400 hover:bg-slate-800'
                }`}
              >
                Last {count}
              </button>
            ))}
          </div>
        </div>

        {/* CONNECTION FLOW DIAGRAM */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-3 rounded-xl bg-[#131e3a] border border-[#1f2e56] flex flex-col items-center justify-center space-y-1">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-slate-200">1. ESP32 Sensors</span>
            <span className="text-[10px] text-slate-400">MAX30102 + DS18B20</span>
          </div>

          <div className="p-3 rounded-xl bg-[#131e3a] border border-[#1f2e56] flex flex-col items-center justify-center space-y-1">
            <Wifi className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="font-bold text-slate-200">2. Wi-Fi Network</span>
            <span className="text-[10px] text-slate-400">HTTP POST /api/vitals</span>
          </div>

          <div className="p-3 rounded-xl bg-[#131e3a] border border-[#1f2e56] flex flex-col items-center justify-center space-y-1">
            <Server className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-slate-200">3. Express Node API</span>
            <span className="text-[10px] text-slate-400">SSE Event Broadcaster</span>
          </div>

          <div className="p-3 rounded-xl bg-[#131e3a] border border-[#1f2e56] flex flex-col items-center justify-center space-y-1">
            <Radio className="w-5 h-5 text-rose-400 animate-pulse" />
            <span className="font-bold text-slate-200">4. React Dashboard</span>
            <span className="text-[10px] text-slate-400">Zero-Refresh Live View</span>
          </div>
        </div>
      </div>

      {/* THREE LARGE INDIVIDUAL VITAL CHARTS */}

      {/* CHART 1: HEART RATE */}
      <div className="glass-panel rounded-2xl p-5 border border-[#1f2e56] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Heart Rate Stream (BPM)
            </h3>
          </div>
          <div className="text-right font-mono">
            <span className="text-2xl font-black text-rose-400">
              {selectedPatient?.heartRate ?? '--'}
            </span>
            <span className="text-xs text-slate-400 ml-1">BPM</span>
          </div>
        </div>

        <div className="h-60 w-full">
          {rollingData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rollingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2e56" />
                <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" domain={[40, 160]} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1f2e56', borderRadius: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="heartRate"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: '#ef4444' }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
              Waiting for live Heart Rate telemetry stream...
            </div>
          )}
        </div>
      </div>

      {/* CHART 2: SPO2 */}
      <div className="glass-panel rounded-2xl p-5 border border-[#1f2e56] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Oxygen Saturation Stream (SpO2 %)
            </h3>
          </div>
          <div className="text-right font-mono">
            <span className="text-2xl font-black text-cyan-400">
              {selectedPatient?.spo2 ?? '--'}
            </span>
            <span className="text-xs text-slate-400 ml-1">%</span>
          </div>
        </div>

        <div className="h-60 w-full">
          {rollingData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rollingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2e56" />
                <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" domain={[70, 100]} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1f2e56', borderRadius: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="spo2"
                  stroke="#00f2fe"
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: '#00f2fe' }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
              Waiting for live SpO2 telemetry stream...
            </div>
          )}
        </div>
      </div>

      {/* CHART 3: TEMPERATURE */}
      <div className="glass-panel rounded-2xl p-5 border border-[#1f2e56] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Body Temperature Stream (°C)
            </h3>
          </div>
          <div className="text-right font-mono">
            <span className="text-2xl font-black text-amber-400">
              {selectedPatient?.temperature ?? '--'}
            </span>
            <span className="text-xs text-slate-400 ml-1">°C</span>
          </div>
        </div>

        <div className="h-60 w-full">
          {rollingData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rollingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2e56" />
                <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" domain={[30, 42]} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1f2e56', borderRadius: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: '#f59e0b' }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
              Waiting for live Temperature telemetry stream...
            </div>
          )}
        </div>
      </div>

      {/* ESP32 SERIAL MONITOR CONSOLE PANEL */}
      <ESP32SerialMonitor />
    </div>
  );
};
