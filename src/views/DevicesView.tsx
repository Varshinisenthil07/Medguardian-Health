import React from 'react';
import { useVitals } from '../context/VitalsContext';
import { DeviceStatusBadge } from '../components/DeviceStatusBadge';
import { Cpu, Wifi, Server, ShieldCheck, Activity, Radio, RefreshCw, CheckCircle2, Database } from 'lucide-react';

export const DevicesView: React.FC = () => {
  const { selectedPatient, serverConnected, sseConnected, lastHardwarePayloadReceived, mode } = useVitals();

  const isHardware = mode === 'hardware';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-5 border border-[#1f2e56] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wide">
              HARDWARE & IOT EDGE GATEWAY DEVICES
            </h2>
            <p className="text-xs text-slate-400">Telemetry hardware device node status and sensor pin assignments</p>
          </div>
        </div>
      </div>

      {/* Main ESP32 Device Specs Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Node Spec Card (2 Columns) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-[#1f2e56] space-y-6">
          <div className="flex items-center justify-between border-b border-[#1f2e56] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#131e3a] border border-[#1f2e56] flex items-center justify-center text-emerald-400 font-bold">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">ESP32 Dev Module (Core Gateway Node)</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Device ID: <span className="text-cyan-400 font-bold">ESP32-{selectedPatient?.patientId || 'P001'}</span>
                </p>
              </div>
            </div>

            <DeviceStatusBadge status={selectedPatient?.deviceStatus || 'WAITING FOR DATA'} />
          </div>

          {/* Specifications Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-[#131e3a] p-3.5 rounded-xl border border-[#1f2e56]">
              <span className="text-[10px] text-slate-400 font-sans font-bold uppercase block mb-1">Microcontroller</span>
              <span className="font-bold text-slate-200">ESP-32 WROOM-32</span>
            </div>

            <div className="bg-[#131e3a] p-3.5 rounded-xl border border-[#1f2e56]">
              <span className="text-[10px] text-slate-400 font-sans font-bold uppercase block mb-1">Connectivity</span>
              <span className="font-bold text-cyan-400 flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5" /> 802.11 b/g/n Wi-Fi
              </span>
            </div>

            <div className="bg-[#131e3a] p-3.5 rounded-xl border border-[#1f2e56]">
              <span className="text-[10px] text-slate-400 font-sans font-bold uppercase block mb-1">HTTP Endpoint</span>
              <span className="font-bold text-emerald-400">/api/vitals (POST)</span>
            </div>

            <div className="bg-[#131e3a] p-3.5 rounded-xl border border-[#1f2e56]">
              <span className="text-[10px] text-slate-400 font-sans font-bold uppercase block mb-1">Server Host</span>
              <span className="font-bold text-slate-200">0.0.0.0 : 3006</span>
            </div>

            <div className="bg-[#131e3a] p-3.5 rounded-xl border border-[#1f2e56]">
              <span className="text-[10px] text-slate-400 font-sans font-bold uppercase block mb-1">Last Data Packet</span>
              <span className="font-bold text-amber-400">
                {lastHardwarePayloadReceived ? lastHardwarePayloadReceived.toLocaleTimeString() : (selectedPatient?.timestamp || 'None')}
              </span>
            </div>

            <div className="bg-[#131e3a] p-3.5 rounded-xl border border-[#1f2e56]">
              <span className="text-[10px] text-slate-400 font-sans font-bold uppercase block mb-1">Assigned Patient</span>
              <span className="font-bold text-cyan-300">
                {selectedPatient?.patientName || 'P001'}
              </span>
            </div>
          </div>

          {/* SENSOR PIN DIAGRAMS */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
              Connected Sensor Hardware Modules
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sensor 1: MAX30102 */}
              <div className="bg-[#131e3a] p-4 rounded-2xl border border-[#1f2e56] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-rose-400" />
                    <span className="font-bold text-white text-xs">MAX30102 Pulse Oximeter</span>
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
                <p className="text-[11px] text-slate-400">Reads Heart Rate (BPM) and Blood Oxygen SpO2 (%)</p>
                <div className="text-[10px] font-mono text-cyan-300 bg-[#0b1329] p-2 rounded-lg border border-[#1f2e56]">
                  SDA: GPIO 21 | SCL: GPIO 22 (I2C Bus @ 400kHz)
                </div>
              </div>

              {/* Sensor 2: DS18B20 */}
              <div className="bg-[#131e3a] p-4 rounded-2xl border border-[#1f2e56] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white text-xs">DS18B20 Temp Probe</span>
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
                <p className="text-[11px] text-slate-400">Reads Waterproof Core Body Temperature (°C)</p>
                <div className="text-[10px] font-mono text-cyan-300 bg-[#0b1329] p-2 rounded-lg border border-[#1f2e56]">
                  DATA: GPIO 4 (OneWire with 4.7k Pull-up Resistor)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Express Server & SSE & Database Status */}
        <div className="glass-panel rounded-2xl p-6 border border-[#1f2e56] space-y-5">
          <div className="flex items-center gap-2 border-b border-[#1f2e56] pb-3">
            <Server className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">
              Gateway Server Status
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="bg-[#131e3a] p-4 rounded-xl border border-[#1f2e56] space-y-2">
              <div className="flex items-center justify-between font-bold text-white">
                <span>Express REST API</span>
                <span className="text-emerald-400 font-mono">Port 3006</span>
              </div>
              <p className="text-[11px] text-slate-400">Bound to 0.0.0.0 for LAN ESP32 ingress</p>
              <div className="flex items-center gap-2 pt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 font-semibold">Gateway Operational</span>
              </div>
            </div>

            <div className="bg-[#131e3a] p-4 rounded-xl border border-[#1f2e56] space-y-2">
              <div className="flex items-center justify-between font-bold text-white">
                <span>Neon PostgreSQL DB</span>
                <span className="text-cyan-400 font-mono">AWS US-East Pooler</span>
              </div>
              <p className="text-[11px] text-slate-400">Persistent storage for Patients, Vitals, & Logs</p>
              <div className="flex items-center gap-2 pt-1">
                <Database className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-cyan-300 font-semibold">Connected (Persistent)</span>
              </div>
            </div>

            <div className="bg-[#131e3a] p-4 rounded-xl border border-[#1f2e56] space-y-2">
              <div className="flex items-center justify-between font-bold text-white">
                <span>SSE Event Dispatcher</span>
                <span className="text-cyan-400 font-mono">/api/events</span>
              </div>
              <p className="text-[11px] text-slate-400">Real-time HTTP push stream to React frontend</p>
              <div className="flex items-center gap-2 pt-1">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-300 font-semibold">Active Clients Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
