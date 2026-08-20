import React from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Heart, Activity, Thermometer, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { VitalStatus } from '../types';

interface VitalCardProps {
  title: string;
  type: 'hr' | 'spo2' | 'temp';
  value: number | null;
  unit: string;
  status: VitalStatus;
  trendData: { time: string; value: number }[];
  normalRangeText: string;
  isHardwareMode: boolean;
}

export const VitalCard: React.FC<VitalCardProps> = ({
  title,
  type,
  value,
  unit,
  status,
  trendData,
  normalRangeText,
  isHardwareMode
}) => {
  // Styling configuration based on vital type & status
  let icon = <Heart className="w-5 h-5 text-rose-400" />;
  let colorTheme = {
    stroke: '#ef4444',
    fill: 'rgba(239, 68, 68, 0.2)',
    badgeBg: 'bg-rose-950/80 text-rose-400 border-rose-800'
  };

  if (type === 'spo2') {
    icon = <Activity className="w-5 h-5 text-cyan-400" />;
    colorTheme = {
      stroke: '#00f2fe',
      fill: 'rgba(0, 242, 254, 0.2)',
      badgeBg: 'bg-cyan-950/80 text-cyan-400 border-cyan-800'
    };
  } else if (type === 'temp') {
    icon = <Thermometer className="w-5 h-5 text-amber-400" />;
    colorTheme = {
      stroke: '#f59e0b',
      fill: 'rgba(245, 158, 11, 0.2)',
      badgeBg: 'bg-amber-950/80 text-amber-400 border-amber-800'
    };
  }

  // Adjust theme dynamically if critical or warning
  if (status === 'CRITICAL') {
    colorTheme.badgeBg = 'bg-rose-600 text-white border-rose-500 animate-pulse';
  } else if (status === 'WARNING') {
    colorTheme.badgeBg = 'bg-amber-600 text-white border-amber-500';
  } else if (status === 'STABLE') {
    colorTheme.badgeBg = 'bg-emerald-950 text-emerald-400 border-emerald-800';
  } else {
    colorTheme.badgeBg = 'bg-slate-800 text-slate-400 border-slate-700';
  }

  const isWaiting = value === null;

  return (
    <div
      className={`glass-panel rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
        status === 'CRITICAL'
          ? 'border-rose-500/80 shadow-lg shadow-rose-950/50'
          : status === 'WARNING'
          ? 'border-amber-500/60 shadow-md shadow-amber-950/30'
          : 'border-[#1f2e56] hover:border-cyan-500/40'
      }`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#131e3a] border border-[#1f2e56]">
            {icon}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</h3>
            <p className="text-[10px] text-slate-500 font-medium">Normal: {normalRangeText}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-extrabold flex items-center gap-1 uppercase tracking-wider ${colorTheme.badgeBg}`}>
          {status === 'STABLE' && <CheckCircle2 className="w-3 h-3" />}
          {status === 'WARNING' && <AlertCircle className="w-3 h-3" />}
          {status === 'CRITICAL' && <ShieldAlert className="w-3 h-3" />}
          <span>{isWaiting ? (isHardwareMode ? 'WAITING' : 'NO DATA') : status}</span>
        </div>
      </div>

      {/* Main Reading Display */}
      <div className="my-4 flex items-baseline justify-between">
        {isWaiting ? (
          <div className="py-3 space-y-1">
            <p className="text-sm font-semibold text-amber-400 animate-pulse flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              Waiting for ESP32 Data...
            </p>
            <p className="text-[11px] text-slate-400">Power device & POST to /api/vitals</p>
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-4xl lg:text-5xl font-black text-white tracking-tight font-mono">
              {value}
            </span>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              {unit}
            </span>
          </div>
        )}

        {/* Live Pulse Dot */}
        {!isWaiting && (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
        )}
      </div>

      {/* Mini Trend Sparkline Chart */}
      <div className="h-16 w-full pt-1">
        {trendData && trendData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colorTheme.stroke} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={colorTheme.stroke} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={colorTheme.stroke}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#gradient-${type})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-[10px] text-slate-600 font-mono">
            Waiting for trend data stream...
          </div>
        )}
      </div>
    </div>
  );
};
