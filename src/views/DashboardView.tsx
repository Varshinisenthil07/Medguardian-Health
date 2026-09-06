import React from 'react';
import { useVitals } from '../context/VitalsContext';
import { VitalCard } from '../components/VitalCard';
import { CurrentSessionWidget } from '../components/CurrentSessionWidget';
import { ESP32SerialMonitor } from '../components/ESP32SerialMonitor';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Cpu, Server, Radio, ShieldCheck, Activity, Bell, AlertTriangle, ChevronRight } from 'lucide-react';

import { postTestVital } from '../services/api';

export const DashboardView: React.FC = () => {
  const {
    selectedPatient,
    history,
    alerts,
    mode,
    setMode,
    serverConnected,
    sseConnected,
    setActiveTab
  } = useVitals();

  const handleSendTestVital = async () => {
    const pId = selectedPatient?.patientId || 'P001';
    const testHr = Math.floor(70 + Math.random() * 15);
    const testSpo2 = Math.floor(96 + Math.random() * 4);
    const testTemp = Number((36.4 + Math.random() * 0.8).toFixed(2));

    try {
      await postTestVital({
        device_id: `esp32-vital-01`,
        patientId: pId,
        heart_rate: testHr,
        spo2: testSpo2,
        temperature: testTemp
      });
    } catch (err) {
      console.warn('[Dashboard] Could not post test vital payload:', err);
    }
  };

  const isHardware = mode === 'hardware';
  const pHistory = history.filter(h => h.patientId === (selectedPatient?.patientId || 'P001'));
  const recentTrend = pHistory.slice(-20);

  // Sparkline data helpers
  const hrTrend = recentTrend.map(r => ({ time: r.timestamp, value: r.heartRate }));
  const spo2Trend = recentTrend.map(r => ({ time: r.timestamp, value: r.spo2 }));
  const tempTrend = recentTrend.map(r => ({ time: r.timestamp, value: r.temperature }));

  return (
    <div className="space-y-6">
      {/* Top Banner / Current Patient Widget */}
      <CurrentSessionWidget />

      {/* THREE VITAL CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <VitalCard
          title="Heart Rate"
          type="hr"
          value={selectedPatient?.heartRate ?? null}
          unit="BPM"
          status={selectedPatient?.status || 'UNKNOWN'}
          trendData={hrTrend}
          normalRangeText="60–100 BPM"
          isHardwareMode={isHardware}
        />

        <VitalCard
          title="Oxygen Saturation (SpO2)"
          type="spo2"
          value={selectedPatient?.spo2 ?? null}
          unit="%"
          status={selectedPatient?.status || 'UNKNOWN'}
          trendData={spo2Trend}
          normalRangeText=">= 95%"
          isHardwareMode={isHardware}
        />

        <VitalCard
          title="Body Temperature"
          type="temp"
          value={selectedPatient?.temperature ?? null}
          unit="°C"
          status={selectedPatient?.status || 'UNKNOWN'}
          trendData={tempTrend}
          normalRangeText="36.0–37.5 °C"
          isHardwareMode={isHardware}
        />
      </div>

      {/* LIVE VITAL TREND & SYSTEM TELEMETRY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Multi-Vital Real-Time Chart (2 Columns) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-[#1f2e56] space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">
                Real-Time Vital Multi-Trend Stream
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSendTestVital}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 hover:bg-cyan-900 transition-colors flex items-center gap-1"
                title="Send simulated ESP32 packet to /api/vitals"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                Simulate Reading
              </button>
              <button
                onClick={() => setActiveTab('monitoring')}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 ml-2"
              >
                Full Screen Monitor <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            {recentTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={recentTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2e56" />
                  <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1f2e56', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="heartRate"
                    name="Heart Rate (BPM)"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="spo2"
                    name="SpO2 (%)"
                    stroke="#00f2fe"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    name="Temperature (°C)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <Activity className="w-8 h-8 text-slate-600 animate-pulse" />
                <p className="text-xs font-mono">
                  {isHardware ? 'WAITING FOR REAL ESP32 DATA INPUT...' : 'Initializing simulation stream...'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* System Diagnostics Panel (1 Column) */}
        <div className="glass-panel rounded-2xl p-5 border border-[#1f2e56] space-y-5">
          <div className="flex items-center gap-2 border-b border-[#1f2e56] pb-3">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">
              System Hardware Diagnostics
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            {/* ESP32 Module */}
            <div className="bg-[#131e3a] p-3 rounded-xl border border-[#1f2e56] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="font-bold text-slate-200">ESP32 Dev Module</div>
                  <div className="text-[10px] text-slate-400 font-mono">IP: LAN / 0.0.0.0:3006</div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                selectedPatient?.deviceStatus === 'ONLINE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}>
                {selectedPatient?.deviceStatus || 'WAITING'}
              </span>
            </div>

            {/* MAX30102 Sensor */}
            <div className="bg-[#131e3a] p-3 rounded-xl border border-[#1f2e56] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                <div>
                  <div className="font-bold text-slate-200">MAX30102 Oximeter</div>
                  <div className="text-[10px] text-slate-400 font-mono">I2C (SDA=21, SCL=22)</div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isHardware
                  ? (selectedPatient?.deviceStatus === 'ONLINE'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : selectedPatient?.deviceStatus === 'OFFLINE'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800')
                  : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
              }`}>
                {isHardware ? (selectedPatient?.deviceStatus === 'ONLINE' ? 'CONNECTED' : (selectedPatient?.deviceStatus || 'NO SIGNAL')) : 'SIMULATED'}
              </span>
            </div>

            {/* DS18B20 Temp Sensor */}
            <div className="bg-[#131e3a] p-3 rounded-xl border border-[#1f2e56] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-bold text-slate-200">DS18B20 Temp Probe</div>
                  <div className="text-[10px] text-slate-400 font-mono">OneWire (GPIO 4)</div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isHardware
                  ? (selectedPatient?.deviceStatus === 'ONLINE'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : selectedPatient?.deviceStatus === 'OFFLINE'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800')
                  : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
              }`}>
                {isHardware ? (selectedPatient?.deviceStatus === 'ONLINE' ? 'CONNECTED' : (selectedPatient?.deviceStatus || 'NO SIGNAL')) : 'SIMULATED'}
              </span>
            </div>

            {/* Express Server API */}
            <div className="bg-[#131e3a] p-3 rounded-xl border border-[#1f2e56] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="font-bold text-slate-200">Express Node Backend</div>
                  <div className="text-[10px] text-slate-400 font-mono">POST /api/vitals</div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                serverConnected ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}>
                {serverConnected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            {/* SSE Gateway Stream */}
            <div className="bg-[#131e3a] p-3 rounded-xl border border-[#1f2e56] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Radio className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="font-bold text-slate-200">SSE Event Stream</div>
                  <div className="text-[10px] text-slate-400 font-mono">GET /api/events</div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                sseConnected || !isHardware ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}>
                {sseConnected || !isHardware ? 'STREAMING' : 'CONNECTING'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ESP32 SERIAL MONITOR CONSOLE */}
      <ESP32SerialMonitor compact />

      {/* RECENT ALERTS QUICK FEED */}
      <div className="glass-panel rounded-2xl p-5 border border-[#1f2e56] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">
              Recent Physiological Alerts Log
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('alerts')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            View All Alerts ({alerts.length}) <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {alerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                    : 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${alert.severity === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'}`} />
                    <span className="font-bold">{alert.patientName} ({alert.patientId})</span>
                  </div>
                  <p className="text-[11px] text-slate-300">{alert.message}</p>
                  <span className="text-[10px] font-mono text-slate-400 block">{alert.timestamp}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                  alert.severity === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                }`}>
                  {alert.severity}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-[#131e3a] rounded-xl border border-[#1f2e56] text-center text-xs text-slate-400 font-mono">
            No physiological alert exceptions recorded. Patient vitals are within safe thresholds.
          </div>
        )}
      </div>
    </div>
  );
};
