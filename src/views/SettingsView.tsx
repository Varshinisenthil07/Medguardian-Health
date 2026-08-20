import React, { useState } from 'react';
import { useVitals } from '../context/VitalsContext';
import { Settings, Save, RotateCcw, Cpu, Server, ShieldCheck, AlertCircle } from 'lucide-react';
import { DEFAULT_THRESHOLDS } from '../utils/healthStatus';

export const SettingsView: React.FC = () => {
  const {
    thresholds,
    updateThresholds,
    mode,
    setMode,
    selectedPatient,
    updatePatientProfile,
    serverConnected
  } = useVitals();

  // Local form state
  const [hrLow, setHrLow] = useState<number>(thresholds.hrLowWarn);
  const [hrNormMin, setHrNormMin] = useState<number>(thresholds.hrNormalMin);
  const [hrNormMax, setHrNormMax] = useState<number>(thresholds.hrNormalMax);
  const [hrWarnMax, setHrWarnMax] = useState<number>(thresholds.hrWarnMax);

  const [spo2Norm, setSpo2Norm] = useState<number>(thresholds.spo2NormalMin);
  const [spo2Warn, setSpo2Warn] = useState<number>(thresholds.spo2WarnMin);

  const [tempLow, setTempLow] = useState<number>(thresholds.tempLowWarn);
  const [tempNormMin, setTempNormMin] = useState<number>(thresholds.tempNormalMin);
  const [tempNormMax, setTempNormMax] = useState<number>(thresholds.tempNormalMax);
  const [tempWarnMax, setTempWarnMax] = useState<number>(thresholds.tempWarnMax);

  const [timeoutSec, setTimeoutSec] = useState<number>(thresholds.deviceTimeoutSec);

  const [savedMsg, setSavedMsg] = useState<boolean>(false);

  const handleSaveThresholds = () => {
    updateThresholds({
      hrLowWarn: Number(hrLow),
      hrNormalMin: Number(hrNormMin),
      hrNormalMax: Number(hrNormMax),
      hrWarnMax: Number(hrWarnMax),
      spo2NormalMin: Number(spo2Norm),
      spo2WarnMin: Number(spo2Warn),
      tempLowWarn: Number(tempLow),
      tempNormalMin: Number(tempNormMin),
      tempNormalMax: Number(tempNormMax),
      tempWarnMax: Number(tempWarnMax),
      deviceTimeoutSec: Number(timeoutSec)
    });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleResetDefaults = () => {
    setHrLow(DEFAULT_THRESHOLDS.hrLowWarn);
    setHrNormMin(DEFAULT_THRESHOLDS.hrNormalMin);
    setHrNormMax(DEFAULT_THRESHOLDS.hrNormalMax);
    setHrWarnMax(DEFAULT_THRESHOLDS.hrWarnMax);

    setSpo2Norm(DEFAULT_THRESHOLDS.spo2NormalMin);
    setSpo2Warn(DEFAULT_THRESHOLDS.spo2WarnMin);

    setTempLow(DEFAULT_THRESHOLDS.tempLowWarn);
    setTempNormMin(DEFAULT_THRESHOLDS.tempNormalMin);
    setTempNormMax(DEFAULT_THRESHOLDS.tempNormalMax);
    setTempWarnMax(DEFAULT_THRESHOLDS.tempWarnMax);

    setTimeoutSec(DEFAULT_THRESHOLDS.deviceTimeoutSec);
    updateThresholds(DEFAULT_THRESHOLDS);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-5 border border-[#1f2e56] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-950/80 border border-cyan-800 rounded-xl text-cyan-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wide">
              SYSTEM CONFIGURATION & THRESHOLDS
            </h2>
            <p className="text-xs text-slate-400">Configure safety thresholds, gateway endpoints, and mode parameters</p>
          </div>
        </div>

        {savedMsg && (
          <span className="px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold animate-bounce">
            Settings Saved!
          </span>
        )}
      </div>

      {/* Mode Toggle & API Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mode Selector */}
        <div className="glass-panel rounded-2xl p-5 border border-[#1f2e56] space-y-4">
          <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
            Active Data Mode
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('hardware')}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 text-center transition-all ${
                mode === 'hardware'
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-950/50'
                  : 'bg-[#131e3a] border-[#1f2e56] text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-6 h-6 text-cyan-400" />
              <span className="text-xs font-bold uppercase">ESP32 Real Hardware</span>
              <span className="text-[10px] text-slate-400">Listens on POST /api/vitals</span>
            </button>

            <button
              onClick={() => setMode('simulation')}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 text-center transition-all ${
                mode === 'simulation'
                  ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-lg shadow-amber-950/50'
                  : 'bg-[#131e3a] border-[#1f2e56] text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-6 h-6 text-amber-400" />
              <span className="text-xs font-bold uppercase">Simulation Engine</span>
              <span className="text-[10px] text-slate-400">Generates test demo data</span>
            </button>
          </div>
        </div>

        {/* Express Server Endpoint Card */}
        <div className="glass-panel rounded-2xl p-5 border border-[#1f2e56] space-y-3">
          <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
            ESP32 Ingress URL Endpoint
          </h3>

          <div className="bg-[#131e3a] p-3.5 rounded-xl border border-[#1f2e56] space-y-2 font-mono text-xs">
            <div className="text-slate-400 font-sans font-bold">Configure ESP32 firmware SERVER_URL:</div>
            <div className="bg-[#0b1329] p-2.5 rounded-lg border border-[#1f2e56] text-cyan-300 font-bold selection:bg-cyan-600">
              http://&lt;LAPTOP_LAN_IP&gt;:3006/api/vitals
            </div>
            <p className="text-[11px] font-sans text-slate-400">
              Find laptop LAN IP via <code className="text-cyan-400">ipconfig</code> (e.g., 172.16.109.94)
            </p>
          </div>
        </div>
      </div>

      {/* CONFIGURABLE VITAL THRESHOLDS */}
      <div className="glass-panel rounded-2xl p-6 border border-[#1f2e56] space-y-6">
        <div className="flex items-center justify-between border-b border-[#1f2e56] pb-4">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
            Physiological Safety Threshold Parameters
          </h3>

          <button
            onClick={handleResetDefaults}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Heart Rate Thresholds */}
          <div className="bg-[#131e3a] p-4 rounded-2xl border border-[#1f2e56] space-y-3">
            <h4 className="text-xs font-extrabold text-rose-400 uppercase tracking-wider">
              Heart Rate Thresholds (BPM)
            </h4>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Low Warning (&lt; BPM)</label>
                <input
                  type="number"
                  value={hrLow}
                  onChange={(e) => setHrLow(Number(e.target.value))}
                  className="w-full bg-[#0b1329] border border-[#1f2e56] rounded-xl px-3 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Normal Range (Min – Max)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={hrNormMin}
                    onChange={(e) => setHrNormMin(Number(e.target.value))}
                    className="w-1/2 bg-[#0b1329] border border-[#1f2e56] rounded-xl px-3 py-1.5 text-white font-mono"
                  />
                  <span className="text-slate-500">-</span>
                  <input
                    type="number"
                    value={hrNormMax}
                    onChange={(e) => setHrNormMax(Number(e.target.value))}
                    className="w-1/2 bg-[#0b1329] border border-[#1f2e56] rounded-xl px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Critical High (&gt; BPM)</label>
                <input
                  type="number"
                  value={hrWarnMax}
                  onChange={(e) => setHrWarnMax(Number(e.target.value))}
                  className="w-full bg-[#0b1329] border border-[#1f2e56] rounded-xl px-3 py-1.5 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* SpO2 Thresholds */}
          <div className="bg-[#131e3a] p-4 rounded-2xl border border-[#1f2e56] space-y-3">
            <h4 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider">
              SpO2 Oxygenation Thresholds (%)
            </h4>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Normal Minimum (&ge; %)</label>
                <input
                  type="number"
                  value={spo2Norm}
                  onChange={(e) => setSpo2Norm(Number(e.target.value))}
                  className="w-full bg-[#0b1329] border border-[#1f2e56] rounded-xl px-3 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Critical Below (&lt; %)</label>
                <input
                  type="number"
                  value={spo2Warn}
                  onChange={(e) => setSpo2Warn(Number(e.target.value))}
                  className="w-full bg-[#0b1329] border border-[#1f2e56] rounded-xl px-3 py-1.5 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Temperature Thresholds */}
          <div className="bg-[#131e3a] p-4 rounded-2xl border border-[#1f2e56] space-y-3">
            <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
              Body Temp Thresholds (°C)
            </h4>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Hypothermia Risk (&lt; °C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={tempLow}
                  onChange={(e) => setTempLow(Number(e.target.value))}
                  className="w-full bg-[#0b1329] border border-[#1f2e56] rounded-xl px-3 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Normal Range (Min – Max °C)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={tempNormMin}
                    onChange={(e) => setTempNormMin(Number(e.target.value))}
                    className="w-1/2 bg-[#0b1329] border border-[#1f2e56] rounded-xl px-3 py-1.5 text-white font-mono"
                  />
                  <span className="text-slate-500">-</span>
                  <input
                    type="number"
                    step="0.1"
                    value={tempNormMax}
                    onChange={(e) => setTempNormMax(Number(e.target.value))}
                    className="w-1/2 bg-[#0b1329] border border-[#1f2e56] rounded-xl px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">High Fever (&gt; °C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={tempWarnMax}
                  onChange={(e) => setTempWarnMax(Number(e.target.value))}
                  className="w-full bg-[#0b1329] border border-[#1f2e56] rounded-xl px-3 py-1.5 text-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Device Timeout Setting */}
        <div className="bg-[#131e3a] p-4 rounded-xl border border-[#1f2e56] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="font-bold text-white text-xs">Device Heartbeat Timeout</div>
            <p className="text-[11px] text-slate-400">Time without incoming ESP32 packets before marking OFFLINE</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={timeoutSec}
              onChange={(e) => setTimeoutSec(Number(e.target.value))}
              className="w-24 bg-[#0b1329] border border-[#1f2e56] rounded-xl px-3 py-1.5 text-white font-mono text-xs"
            />
            <span className="text-xs text-slate-400 font-bold">Seconds</span>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveThresholds}
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-900/40 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Configuration Parameters
          </button>
        </div>
      </div>
    </div>
  );
};
