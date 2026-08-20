import React from 'react';
import { useVitals } from '../context/VitalsContext';
import { User, DoorClosed, Activity, Cpu, ShieldCheck } from 'lucide-react';

export const CurrentSessionWidget: React.FC = () => {
  const { selectedPatient, mode, lastHardwarePayloadReceived } = useVitals();

  if (!selectedPatient) return null;

  return (
    <div className="glass-panel rounded-2xl p-4 border border-[#1f2e56] flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400 font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white">{selectedPatient.patientName}</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#131e3a] border border-[#1f2e56] text-cyan-300 font-bold">
                {selectedPatient.patientId}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Age: <span className="text-slate-200 font-semibold">{selectedPatient.age}</span> | Gender:{' '}
              <span className="text-slate-200 font-semibold">{selectedPatient.gender}</span> | Room:{' '}
              <span className="text-cyan-400 font-bold">{selectedPatient.roomNumber}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Sensor & Telemetry Info */}
      <div className="flex items-center gap-4 text-xs border-t md:border-t-0 md:border-l border-[#1f2e56] pt-3 md:pt-0 md:pl-4">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Device ID</span>
          <span className="font-mono text-cyan-300 font-bold flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" /> ESP32-{selectedPatient.patientId}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Sensors Active</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> MAX30102 + DS18B20
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Last Telemetry</span>
          <span className="text-slate-200 font-mono">
            {selectedPatient.timestamp || 'No signal'}
          </span>
        </div>
      </div>
    </div>
  );
};
