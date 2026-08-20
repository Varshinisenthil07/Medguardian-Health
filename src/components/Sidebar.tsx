import React from 'react';
import { useVitals } from '../context/VitalsContext';
import { ActiveTab } from '../types';
import {
  LayoutDashboard,
  Activity,
  Users,
  AlertOctagon,
  Bell,
  History,
  FileText,
  Cpu,
  BrainCircuit,
  Settings,
  ShieldAlert
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, alerts, patients } = useVitals();

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged).length;
  const criticalPatients = patients.filter(p => p.status === 'CRITICAL').length;

  const menuItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'monitoring', label: 'Live Monitoring', icon: <Activity className="w-4 h-4 text-cyan-400" /> },
    { id: 'patients', label: 'Patients', icon: <Users className="w-4 h-4" /> },
    {
      id: 'priority',
      label: 'Priority Monitor',
      icon: <AlertOctagon className="w-4 h-4 text-rose-400" />,
      badge: criticalPatients > 0 ? criticalPatients : undefined,
      badgeColor: 'bg-rose-600 text-white'
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <Bell className="w-4 h-4 text-amber-400" />,
      badge: unacknowledgedAlerts > 0 ? unacknowledgedAlerts : undefined,
      badgeColor: 'bg-amber-600 text-white'
    },
    { id: 'history', label: 'History Log', icon: <History className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'devices', label: 'IoT Devices', icon: <Cpu className="w-4 h-4 text-emerald-400" /> },
    { id: 'ai', label: 'AI Analysis', icon: <BrainCircuit className="w-4 h-4 text-indigo-400" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-full md:w-64 bg-[#0b1329] border-r border-[#1f2e56] flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
          System Navigation
        </div>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-900/30'
                  : 'text-slate-300 hover:bg-[#131e3a] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-cyan-600 text-white'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="mt-6 pt-4 border-t border-[#1f2e56] text-[11px] text-slate-400 space-y-2">
        <div className="bg-[#131e3a] p-3 rounded-xl border border-[#1f2e56] space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Safety Disclaimer</span>
          </div>
          <p className="text-[10px] leading-tight text-slate-400">
            Demonstration IoT software only. Not certified for clinical diagnosis or life support.
          </p>
        </div>

        <div className="text-[10px] text-center text-slate-500 font-mono">
          MedGuardian Gateway v1.0.0
        </div>
      </div>
    </aside>
  );
};
