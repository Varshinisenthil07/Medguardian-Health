import React from 'react';
import { useVitals } from '../context/VitalsContext';
import { AlertOctagon, ShieldAlert, AlertCircle, CheckCircle2, Heart, Activity, Thermometer, User } from 'lucide-react';

export const PriorityMonitorView: React.FC = () => {
  const { patients, setSelectedPatientId, setActiveTab } = useVitals();

  // Priority Sort Order: CRITICAL -> WARNING -> STABLE -> UNKNOWN
  const sortedPatients = [...patients].sort((a, b) => {
    const score = (status: string) => {
      if (status === 'CRITICAL') return 1;
      if (status === 'WARNING') return 2;
      if (status === 'STABLE') return 3;
      return 4;
    };
    return score(a.status) - score(b.status);
  });

  const criticalCount = patients.filter(p => p.status === 'CRITICAL').length;
  const warningCount = patients.filter(p => p.status === 'WARNING').length;
  const stableCount = patients.filter(p => p.status === 'STABLE').length;

  return (
    <div className="space-y-6">
      {/* Header & Quick Summary Cards */}
      <div className="glass-panel rounded-2xl p-5 border border-[#1f2e56] space-y-4">
        <div className="flex items-center gap-3 border-b border-[#1f2e56] pb-4">
          <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-400">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wide">
              TRIAGE PRIORITY MONITOR
            </h2>
            <p className="text-xs text-slate-400">Automatic patient risk stratification sorted by physiological acuity</p>
          </div>
        </div>

        {/* Priority Counts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-rose-950/40 border border-rose-800/80 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-rose-400 animate-bounce" />
              <div>
                <span className="text-xs text-rose-300 font-bold uppercase block">CRITICAL PRIORITY</span>
                <span className="text-2xl font-black text-white">{criticalCount} Patients</span>
              </div>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-1 bg-rose-600 text-white rounded">P1</span>
          </div>

          <div className="bg-amber-950/40 border border-amber-800/80 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-amber-400" />
              <div>
                <span className="text-xs text-amber-300 font-bold uppercase block">WARNING PRIORITY</span>
                <span className="text-2xl font-black text-white">{warningCount} Patients</span>
              </div>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-1 bg-amber-600 text-white rounded">P2</span>
          </div>

          <div className="bg-emerald-950/40 border border-emerald-800/80 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <div>
                <span className="text-xs text-emerald-300 font-bold uppercase block">STABLE BASAL</span>
                <span className="text-2xl font-black text-white">{stableCount} Patients</span>
              </div>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-1 bg-emerald-600 text-white rounded">P3</span>
          </div>
        </div>
      </div>

      {/* Sorted Patients List */}
      <div className="space-y-4">
        {sortedPatients.map((p) => {
          let cardBorder = 'border-[#1f2e56] bg-[#131e3a]';
          let statusBadge = 'bg-emerald-950 text-emerald-400 border-emerald-800';

          if (p.status === 'CRITICAL') {
            cardBorder = 'border-rose-500/80 bg-rose-950/30 pulse-glow-rose';
            statusBadge = 'bg-rose-600 text-white border-rose-500 animate-pulse';
          } else if (p.status === 'WARNING') {
            cardBorder = 'border-amber-500/60 bg-amber-950/20';
            statusBadge = 'bg-amber-600 text-white border-amber-500';
          }

          return (
            <div
              key={p.patientId}
              className={`glass-panel rounded-2xl p-5 border transition-all ${cardBorder} flex flex-col md:flex-row md:items-center justify-between gap-4`}
            >
              {/* Patient Basic Info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#0b1329] border border-[#1f2e56] flex items-center justify-center font-bold text-white text-lg">
                  <User className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-cyan-400 bg-[#0b1329] px-2 py-0.5 rounded border border-[#1f2e56]">
                      {p.patientId}
                    </span>
                    <h3 className="text-base font-extrabold text-white">{p.patientName}</h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Room: <span className="text-cyan-300 font-bold">{p.roomNumber}</span> | Age:{' '}
                    <span className="text-slate-200">{p.age}</span> | Gender: <span className="text-slate-200">{p.gender}</span>
                  </p>
                </div>
              </div>

              {/* Patient Vitals Grid */}
              <div className="flex items-center gap-6 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans font-bold uppercase">Heart Rate</span>
                  <span className="text-sm font-black text-rose-400 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" />
                    {p.heartRate !== null ? `${p.heartRate} BPM` : 'Waiting'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-sans font-bold uppercase">SpO2</span>
                  <span className="text-sm font-black text-cyan-400 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" />
                    {p.spo2 !== null ? `${p.spo2}%` : 'Waiting'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-sans font-bold uppercase">Temperature</span>
                  <span className="text-sm font-black text-amber-400 flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5" />
                    {p.temperature !== null ? `${p.temperature} °C` : 'Waiting'}
                  </span>
                </div>
              </div>

              {/* Status Badge & Monitoring Action */}
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold uppercase tracking-wider ${statusBadge}`}>
                  {p.status}
                </span>

                <button
                  onClick={() => {
                    setSelectedPatientId(p.patientId);
                    setActiveTab('monitoring');
                  }}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                >
                  Monitor Live
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
