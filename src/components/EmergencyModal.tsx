import React from 'react';
import { useVitals } from '../context/VitalsContext';
import { AlertTriangle, ShieldAlert, X, Bell } from 'lucide-react';

export const EmergencyModal: React.FC = () => {
  const { activeEmergencyAlert, dismissEmergencyModal, acknowledgeAlert } = useVitals();

  if (!activeEmergencyAlert) return null;

  const handleAcknowledge = () => {
    acknowledgeAlert(activeEmergencyAlert.id);
    dismissEmergencyModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0f172a] border-2 border-rose-500 rounded-2xl max-w-lg w-full p-6 shadow-2xl shadow-rose-950/80 space-y-6 relative overflow-hidden pulse-glow-rose">
        {/* Top Danger Ribbon */}
        <div className="bg-gradient-to-r from-rose-600 to-red-700 -mx-6 -mt-6 p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-7 h-7 animate-bounce" />
            <div>
              <h2 className="text-lg font-black tracking-wider uppercase">CRITICAL EMERGENCY ALERT</h2>
              <p className="text-xs text-rose-100 font-medium">Physiological Threshold Exception Exceeded</p>
            </div>
          </div>
          <button
            onClick={dismissEmergencyModal}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Alert Details */}
        <div className="space-y-4">
          <div className="bg-rose-950/40 border border-rose-800/60 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase">Patient ID</span>
              <span className="text-sm font-mono font-black text-rose-300">{activeEmergencyAlert.patientId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase">Patient Name</span>
              <span className="text-sm font-bold text-white">{activeEmergencyAlert.patientName}</span>
            </div>
            <div className="flex items-center justify-between border-t border-rose-800/40 pt-2">
              <span className="text-xs text-slate-400 font-bold uppercase">Telemetry Trigger</span>
              <span className="text-sm font-bold text-rose-400">{activeEmergencyAlert.vitalType}: {activeEmergencyAlert.value}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase">Time Received</span>
              <span className="text-xs font-mono text-slate-300">{activeEmergencyAlert.timestamp}</span>
            </div>
          </div>

          <div className="p-3 bg-[#131e3a] border border-[#1f2e56] rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-200 leading-relaxed">
              {activeEmergencyAlert.message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={dismissEmergencyModal}
            className="px-4 py-2 text-xs font-bold rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Silence Alarm
          </button>
          <button
            onClick={handleAcknowledge}
            className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950 transition-colors flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            Acknowledge Emergency
          </button>
        </div>
      </div>
    </div>
  );
};
