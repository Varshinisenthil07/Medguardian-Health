import React from 'react';
import { useVitals } from '../context/VitalsContext';
import { FileText, Download, Printer, Activity, Heart, Thermometer, ShieldCheck } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { history, selectedPatient, alerts, mode } = useVitals();

  const patientId = selectedPatient?.patientId || 'P001';
  const pHistory = history.filter(h => h.patientId === patientId);

  // Statistical calculations
  const totalReadings = pHistory.length;
  let avgHR = 0, minHR = 0, maxHR = 0;
  let avgSpO2 = 0, minSpO2 = 0, maxSpO2 = 0;
  let avgTemp = 0, minTemp = 0, maxTemp = 0;

  if (totalReadings > 0) {
    const hrVals = pHistory.map(h => h.heartRate);
    const spo2Vals = pHistory.map(h => h.spo2);
    const tempVals = pHistory.map(h => h.temperature);

    avgHR = Math.round(hrVals.reduce((a, b) => a + b, 0) / totalReadings);
    minHR = Math.min(...hrVals);
    maxHR = Math.max(...hrVals);

    avgSpO2 = Math.round(spo2Vals.reduce((a, b) => a + b, 0) / totalReadings);
    minSpO2 = Math.min(...spo2Vals);
    maxSpO2 = Math.max(...spo2Vals);

    avgTemp = Number((tempVals.reduce((a, b) => a + b, 0) / totalReadings).toFixed(2));
    minTemp = Math.min(...tempVals);
    maxTemp = Math.max(...tempVals);
  }

  const pAlertsCount = alerts.filter(a => a.patientId === patientId).length;

  const handleExportCSV = () => {
    if (pHistory.length === 0) {
      alert('No history data available to export.');
      return;
    }

    const headers = ['Timestamp', 'PatientId', 'HeartRate_BPM', 'SpO2_Percent', 'Temperature_C', 'Status', 'DataSource'];
    const rows = pHistory.map(h => [
      `"${h.timestamp}"`,
      `"${h.patientId}"`,
      h.heartRate,
      h.spo2,
      h.temperature,
      `"${h.status}"`,
      `"${h.source}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MedGuardian_Report_${patientId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-5 border border-[#1f2e56] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-950/80 border border-cyan-800 rounded-xl text-cyan-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wide">
              PHYSIOLOGICAL TELEMETRY REPORT
            </h2>
            <p className="text-xs text-slate-400">Analytical summary of telemetry data streams and alert exceptions</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-[#1f2e56] transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print Report
          </button>
        </div>
      </div>

      {/* Report Summary Details Card */}
      <div className="glass-panel rounded-2xl p-6 border border-[#1f2e56] space-y-6">
        <div className="flex items-center justify-between border-b border-[#1f2e56] pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white">
              Patient Clinical Summary: {selectedPatient?.patientName} ({patientId})
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Data Mode: <strong className="text-cyan-400 uppercase">{mode === 'hardware' ? 'REAL HARDWARE (ESP32)' : 'SIMULATION'}</strong> | Total Samples: <strong className="text-slate-200">{totalReadings}</strong>
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-300 bg-[#131e3a] px-3 py-1 rounded-lg border border-[#1f2e56]">
            Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
          </span>
        </div>

        {/* 3 Metric Averages Grids */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Heart Rate Summary */}
          <div className="bg-[#131e3a] p-5 rounded-2xl border border-[#1f2e56] space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-extrabold text-xs uppercase tracking-wider">
              <Heart className="w-4 h-4" /> Heart Rate Analysis
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="bg-[#0b1329] p-2 rounded-xl border border-[#1f2e56]">
                <span className="text-[10px] text-slate-400 block font-sans font-bold">AVG</span>
                <span className="text-lg font-black text-rose-400">{avgHR}</span>
              </div>
              <div className="bg-[#0b1329] p-2 rounded-xl border border-[#1f2e56]">
                <span className="text-[10px] text-slate-400 block font-sans font-bold">MIN</span>
                <span className="text-lg font-bold text-slate-300">{minHR}</span>
              </div>
              <div className="bg-[#0b1329] p-2 rounded-xl border border-[#1f2e56]">
                <span className="text-[10px] text-slate-400 block font-sans font-bold">MAX</span>
                <span className="text-lg font-bold text-slate-300">{maxHR}</span>
              </div>
            </div>
          </div>

          {/* SpO2 Summary */}
          <div className="bg-[#131e3a] p-5 rounded-2xl border border-[#1f2e56] space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-xs uppercase tracking-wider">
              <Activity className="w-4 h-4" /> SpO2 Oxygenation Analysis
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="bg-[#0b1329] p-2 rounded-xl border border-[#1f2e56]">
                <span className="text-[10px] text-slate-400 block font-sans font-bold">AVG</span>
                <span className="text-lg font-black text-cyan-400">{avgSpO2}%</span>
              </div>
              <div className="bg-[#0b1329] p-2 rounded-xl border border-[#1f2e56]">
                <span className="text-[10px] text-slate-400 block font-sans font-bold">MIN</span>
                <span className="text-lg font-bold text-slate-300">{minSpO2}%</span>
              </div>
              <div className="bg-[#0b1329] p-2 rounded-xl border border-[#1f2e56]">
                <span className="text-[10px] text-slate-400 block font-sans font-bold">MAX</span>
                <span className="text-lg font-bold text-slate-300">{maxSpO2}%</span>
              </div>
            </div>
          </div>

          {/* Temperature Summary */}
          <div className="bg-[#131e3a] p-5 rounded-2xl border border-[#1f2e56] space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
              <Thermometer className="w-4 h-4" /> Temperature Analysis
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="bg-[#0b1329] p-2 rounded-xl border border-[#1f2e56]">
                <span className="text-[10px] text-slate-400 block font-sans font-bold">AVG</span>
                <span className="text-lg font-black text-amber-400">{avgTemp}°C</span>
              </div>
              <div className="bg-[#0b1329] p-2 rounded-xl border border-[#1f2e56]">
                <span className="text-[10px] text-slate-400 block font-sans font-bold">MIN</span>
                <span className="text-lg font-bold text-slate-300">{minTemp}°C</span>
              </div>
              <div className="bg-[#0b1329] p-2 rounded-xl border border-[#1f2e56]">
                <span className="text-[10px] text-slate-400 block font-sans font-bold">MAX</span>
                <span className="text-lg font-bold text-slate-300">{maxTemp}°C</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Exception Summary Box */}
        <div className="bg-[#131e3a] p-4 rounded-xl border border-[#1f2e56] flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="font-bold text-slate-200">Alert Exceptions Recorded</div>
              <div className="text-slate-400">Total physiological alerts triggered during session window</div>
            </div>
          </div>
          <span className="text-2xl font-black font-mono text-amber-400">
            {pAlertsCount}
          </span>
        </div>
      </div>
    </div>
  );
};
