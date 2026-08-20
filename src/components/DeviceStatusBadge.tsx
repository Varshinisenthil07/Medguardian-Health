import React from 'react';
import { DeviceConnectionState } from '../types';
import { Wifi, WifiOff, RefreshCw, Cpu } from 'lucide-react';

interface DeviceStatusBadgeProps {
  status: DeviceConnectionState;
  showIcon?: boolean;
}

export const DeviceStatusBadge: React.FC<DeviceStatusBadgeProps> = ({ status, showIcon = true }) => {
  let badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700';
  let icon = <WifiOff className="w-3.5 h-3.5 text-slate-400" />;

  if (status === 'ONLINE') {
    badgeStyle = 'bg-emerald-950/80 text-emerald-400 border-emerald-800 shadow-emerald-900/20';
    icon = <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />;
  } else if (status === 'OFFLINE') {
    badgeStyle = 'bg-rose-950/80 text-rose-400 border-rose-800';
    icon = <WifiOff className="w-3.5 h-3.5 text-rose-400" />;
  } else if (status === 'CONNECTING' || status === 'WAITING FOR DATA') {
    badgeStyle = 'bg-amber-950/80 text-amber-300 border-amber-800';
    icon = <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />;
  }

  return (
    <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1.5 uppercase tracking-wider ${badgeStyle}`}>
      {showIcon && icon}
      <span>{status}</span>
    </span>
  );
};
