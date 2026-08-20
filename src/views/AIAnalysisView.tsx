import React, { useMemo } from 'react';
import { useVitals } from '../context/VitalsContext';
import { analyzePatientVitals } from '../utils/aiEngine';
import { BrainCircuit, ShieldAlert, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

export const AIAnalysisView: React.FC = () => {
  const { selectedPatient, history, thresholds } = useVitals();

  const analysis = useMemo(() => {
    if (!selectedPatient) return null;
    return analyzePatientVitals(selectedPatient, history, thresholds);
  }, [selectedPatient, history, thresholds]);

  if (!selectedPatient || !analysis) return null;

  let riskColor = 'bg-emerald-950 text-emerald-400 border-emerald-800';
  if (analysis.riskLevel === 'CRITICAL') {
    riskColor = 'bg-rose-600 text-white border-rose-500 animate-pulse';
  } else if (analysis.riskLevel === 'HIGH') {
    riskColor = 'bg-rose-950 text-rose-300 border-rose-800';
  } else if (analysis.riskLevel === 'MODERATE') {
    riskColor = 'bg-amber-950 text-amber-300 border-amber-800';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-5 border border-[#1f2e56] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-950/80 border border-indigo-800 rounded-xl text-indigo-400">
            <BrainCircuit className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wide">
              RULE-BASED AI TELEMETRY ANALYSIS
            </h2>
            <p className="text-xs text-slate-400">Automated trend analysis & risk stratification engine</p>
          </div>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-700/60 text-amber-300 text-[11px] font-extrabold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{analysis.disclaimer}</span>
        </div>
      </div>

      {/* Main Analysis Card */}
      <div className="glass-panel rounded-2xl p-6 border border-[#1f2e56] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1f2e56] pb-4">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase block">Target Patient</span>
            <h3 className="text-lg font-extrabold text-white">
              {selectedPatient.patientName} ({selectedPatient.patientId})
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-semibold">Calculated Risk Index:</span>
            <span className={`px-4 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider ${riskColor}`}>
              {analysis.riskLevel} RISK
            </span>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-[#131e3a] p-4 rounded-2xl border border-[#1f2e56] space-y-2">
          <h4 className="text-xs font-extrabold uppercase text-cyan-400 tracking-wider">
            Analysis Summary
          </h4>
          <p className="text-sm font-semibold text-slate-100 leading-relaxed">
            {analysis.summary}
          </p>
        </div>

        {/* Key Observations & Insights */}
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
            Detected Physiological Insights
          </h4>

          <div className="space-y-2">
            {analysis.insights.map((insight, index) => (
              <div
                key={index}
                className="bg-[#131e3a] p-3.5 rounded-xl border border-[#1f2e56] flex items-start gap-3 text-xs text-slate-200"
              >
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Clinical Recommendation */}
        <div className="bg-gradient-to-r from-cyan-950/60 to-blue-950/60 p-5 rounded-2xl border border-cyan-800/60 space-y-2">
          <h4 className="text-xs font-extrabold uppercase text-cyan-300 tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            Recommended Monitoring Action
          </h4>
          <p className="text-sm text-cyan-100 font-semibold leading-relaxed">
            {analysis.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
};
