import React, { useState } from 'react';
import { useVitals } from '../context/VitalsContext';
import { DeviceStatusBadge } from '../components/DeviceStatusBadge';
import { Users, UserPlus, Heart, Activity, Thermometer, CheckCircle2, AlertCircle, ShieldAlert, Cpu } from 'lucide-react';

export const PatientsView: React.FC = () => {
  const { patients, selectedPatientId, setSelectedPatientId, updatePatientProfile } = useVitals();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editRoom, setEditRoom] = useState<string>('');
  const [editAge, setEditAge] = useState<number>(45);
  const [editGender, setEditGender] = useState<string>('Male');

  const selectedPatient = patients.find(p => p.patientId === selectedPatientId) || patients[0];

  const handleStartEdit = (p: typeof selectedPatient) => {
    setEditName(p.patientName);
    setEditRoom(p.roomNumber);
    setEditAge(p.age);
    setEditGender(p.gender);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    updatePatientProfile(selectedPatient.patientId, {
      patientName: editName,
      roomNumber: editRoom,
      age: Number(editAge),
      gender: editGender
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-5 border border-[#1f2e56] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-950/80 border border-cyan-800 rounded-xl text-cyan-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">PATIENT DIRECTORY & TELEMETRY</h2>
            <p className="text-xs text-slate-400">Manage patient records and assigned IoT edge hardware devices</p>
          </div>
        </div>
      </div>

      {/* Patient Table */}
      <div className="glass-panel rounded-2xl border border-[#1f2e56] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#131e3a] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-[#1f2e56]">
              <tr>
                <th className="py-3.5 px-4">Patient ID / Name</th>
                <th className="py-3.5 px-4">Room</th>
                <th className="py-3.5 px-4">Device ID</th>
                <th className="py-3.5 px-4">Heart Rate</th>
                <th className="py-3.5 px-4">SpO2</th>
                <th className="py-3.5 px-4">Temperature</th>
                <th className="py-3.5 px-4">Device Status</th>
                <th className="py-3.5 px-4">Health Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2e56] text-slate-200 font-medium">
              {patients.map((p) => {
                const isSelected = p.patientId === selectedPatientId;
                return (
                  <tr
                    key={p.patientId}
                    className={`transition-colors cursor-pointer ${
                      isSelected ? 'bg-cyan-950/40' : 'hover:bg-[#131e3a]/60'
                    }`}
                    onClick={() => setSelectedPatientId(p.patientId)}
                  >
                    <td className="py-4 px-4">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span className="font-mono text-cyan-400 font-extrabold bg-[#131e3a] px-2 py-0.5 rounded border border-[#1f2e56]">
                          {p.patientId}
                        </span>
                        <span>{p.patientName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {p.age} yrs | {p.gender}
                      </div>
                    </td>

                    <td className="py-4 px-4 font-bold text-cyan-300">
                      {p.roomNumber}
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-300">
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                        ESP32-{p.patientId}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-rose-400">
                      {p.heartRate !== null ? `${p.heartRate} BPM` : '--'}
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-cyan-400">
                      {p.spo2 !== null ? `${p.spo2}%` : '--'}
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-amber-400">
                      {p.temperature !== null ? `${p.temperature} °C` : '--'}
                    </td>

                    <td className="py-4 px-4">
                      <DeviceStatusBadge status={p.deviceStatus} />
                    </td>

                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-extrabold uppercase ${
                        p.status === 'STABLE'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : p.status === 'WARNING'
                          ? 'bg-amber-950 text-amber-400 border-amber-800'
                          : p.status === 'CRITICAL'
                          ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPatientId(p.patientId);
                          handleStartEdit(p);
                        }}
                        className="px-3 py-1 bg-[#131e3a] hover:bg-cyan-900/60 border border-[#1f2e56] text-cyan-300 rounded-lg text-xs font-bold transition-colors"
                      >
                        Edit Profile
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile Edit Modal / Drawer */}
      {isEditing && (
        <div className="glass-panel rounded-2xl p-5 border border-[#1f2e56] space-y-4 max-w-xl">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
            Edit Profile for Patient {selectedPatient.patientId}
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Patient Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-[#131e3a] border border-[#1f2e56] rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Room Number</label>
              <input
                type="text"
                value={editRoom}
                onChange={(e) => setEditRoom(e.target.value)}
                className="w-full bg-[#131e3a] border border-[#1f2e56] rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Age</label>
              <input
                type="number"
                value={editAge}
                onChange={(e) => setEditAge(Number(e.target.value))}
                className="w-full bg-[#131e3a] border border-[#1f2e56] rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Gender</label>
              <select
                value={editGender}
                onChange={(e) => setEditGender(e.target.value)}
                className="w-full bg-[#131e3a] border border-[#1f2e56] rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow-md shadow-cyan-900/40"
            >
              Save Patient Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
