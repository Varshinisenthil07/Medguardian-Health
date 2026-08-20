import React, { useState, useEffect } from 'react';
import { useVitals } from '../context/VitalsContext';
import { Activity, Shield, Wifi, WifiOff, Cpu, Radio, AlertTriangle } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    mode,
    setMode,
    serverConnected,
    sseConnected,
    selectedPatient,
    simScenario,
    setSimScenario
  } = useVitals();

  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const esp32Status = selectedPatient?.deviceStatus || 'WAITING FOR DATA';

  return (
    <header className="bg-[#0b1329] border-b border-[#1f2e56] px-4 lg:px-6 py-3 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-0 z-30">
      {/* Title & Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Activity className="w-6 h-6 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-black text-xl tracking-tight text-white flex items-center gap-1.5">
              MED<span className="text-cyan-400">GUARDIAN</span>
            </h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold tracking-wider uppercase">
              IoT Gateway v1.0
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">Real-Time Healthcare Monitoring System</p>
        </div>
      </div>

      {/* Prominent Data Source Badge & Mode Selector */}
      <div className="flex flex-wrap items-center gap-3">
        {/* DATA SOURCE BADGE */}
        <div className="flex items-center">
          {mode === 'hardware' ? (
            <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 px-3 py-1.5 rounded-lg shadow-inner">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-extrabold tracking-wide uppercase">
                DATA SOURCE: <span className="underline decoration-emerald-400">REAL ESP32 SENSOR</span>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-lg">
              <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-xs font-extrabold tracking-wide uppercase">
                DATA SOURCE: <span className="underline decoration-amber-400">SIMULATION</span>
              </span>
            </div>
          )}
        </div>

        {/* Mode Selector Switch */}
        <div className="bg-[#131e3a] p-1 rounded-lg border border-[#1f2e56] flex items-center gap-1">
          <button
            onClick={() => setMode('hardware')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
              mode === 'hardware'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            ESP32 Real Hardware
          </button>

          <button
            onClick={() => setMode('simulation')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
              mode === 'simulation'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Simulation
          </button>
        </div>

        {/* Simulation Controls if in Sim Mode */}
        {mode === 'simulation' && (
          <div className="flex items-center gap-1 bg-[#131e3a] px-2 py-1 rounded-lg border border-[#1f2e56]">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Sim Data:</span>
            <button
              onClick={() => setSimScenario('NORMAL')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                simScenario === 'NORMAL' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setSimScenario('WARNING')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                simScenario === 'WARNING' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Warning
            </button>
            <button
              onClick={() => setSimScenario('EMERGENCY')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                simScenario === 'EMERGENCY' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Emergency
            </button>
          </div>
        )}
      </div>

      {/* System Diagnostics & Clock */}
      <div className="flex items-center gap-4 text-xs">
        <div className="hidden lg:flex items-center gap-3 border-l border-[#1f2e56] pl-4">
          {/* Express Server Indicator */}
          <div className="flex items-center gap-1.5" title="Express Backend Gateway status">
            {serverConnected ? (
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Wifi className="w-3.5 h-3.5" /> Server: ONLINE
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-400 font-semibold animate-pulse">
                <WifiOff className="w-3.5 h-3.5" /> Server: OFFLINE
              </span>
            )}
          </div>

          {/* ESP32 Device Status */}
          <div className="flex items-center gap-1.5" title="ESP32 WiFi Telemetry status">
            <span className="text-slate-400">ESP32:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                esp32Status === 'ONLINE'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : esp32Status === 'OFFLINE'
                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}
            >
              {esp32Status}
            </span>
          </div>
        </div>

        {/* Live Clock */}
        <div className="bg-[#131e3a] border border-[#1f2e56] px-3 py-1.5 rounded-lg text-cyan-300 font-mono text-xs font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          {currentTime || '00:00:00 AM'}
        </div>
      </div>
    </header>
  );
};
