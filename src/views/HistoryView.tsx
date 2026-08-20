import React, { useState } from 'react';
import { useVitals } from '../context/VitalsContext';
import { History, Filter, Download, Search } from 'lucide-react';

export const HistoryView: React.FC = () => {
  const { history, patients } = useVitals();

  const [selectedPatientFilter, setSelectedPatientFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredHistory = history.filter(item => {
    if (selectedPatientFilter !== 'ALL' && item.patientId !== selectedPatientFilter) return false;
    if (selectedStatusFilter !== 'ALL' && item.status !== selectedStatusFilter) return false;
    if (searchTerm && !item.timestamp.includes(searchTerm) && !item.patientId.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-5 border border-[#1f2e56] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-950/80 border border-cyan-800 rounded-xl text-cyan-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wide">
              HISTORICAL TELEMETRY LOGS
            </h2>
            <p className="text-xs text-slate-400">Comprehensive server-side memory store of all ingested sensor readings</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Patient Filter */}
          <select
            value={selectedPatientFilter}
            onChange={(e) => setSelectedPatientFilter(e.target.value)}
            className="bg-[#131e3a] border border-[#1f2e56] text-xs font-bold text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Patients</option>
            {patients.map(p => (
              <option key={p.patientId} value={p.patientId}>
                {p.patientId} ({p.patientName})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-[#131e3a] border border-[#1f2e56] text-xs font-bold text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="STABLE">STABLE</option>
            <option value="WARNING">WARNING</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search time or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#131e3a] border border-[#1f2e56] text-xs text-slate-200 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* History Log Table */}
      <div className="glass-panel rounded-2xl border border-[#1f2e56] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#131e3a] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-[#1f2e56]">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Patient ID</th>
                <th className="py-3.5 px-4">Heart Rate (BPM)</th>
                <th className="py-3.5 px-4">SpO2 (%)</th>
                <th className="py-3.5 px-4">Temperature (°C)</th>
                <th className="py-3.5 px-4">Data Source</th>
                <th className="py-3.5 px-4">Health Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2e56] text-slate-200 font-mono font-medium">
              {filteredHistory.length > 0 ? (
                filteredHistory.slice().reverse().map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#131e3a]/60 transition-colors">
                    <td className="py-3 px-4 text-slate-300">
                      {entry.timestamp}
                    </td>

                    <td className="py-3 px-4">
                      <span className="bg-[#131e3a] px-2 py-0.5 rounded border border-[#1f2e56] text-cyan-300 font-bold">
                        {entry.patientId}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-bold text-rose-400">
                      {entry.heartRate} BPM
                    </td>

                    <td className="py-3 px-4 font-bold text-cyan-400">
                      {entry.spo2}%
                    </td>

                    <td className="py-3 px-4 font-bold text-amber-400">
                      {entry.temperature} °C
                    </td>

                    <td className="py-3 px-4 font-sans text-[10px]">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        entry.source === 'ESP32 REAL SENSOR'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {entry.source}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        entry.status === 'STABLE'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : entry.status === 'WARNING'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-rose-600 text-white border border-rose-500'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                    No historical telemetry records match the search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
