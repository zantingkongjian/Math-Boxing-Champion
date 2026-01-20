
import React from 'react';

interface HealthBarProps {
  current: number;
  max: number;
  isPlayer: boolean;
  label: string;
}

const HealthBar: React.FC<HealthBarProps> = ({ current, max, isPlayer, label }) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  let colorClass = 'from-green-400 via-green-500 to-emerald-600 shadow-[0_0_10px_rgba(34,197,94,0.4)]';
  if (percentage < 50) colorClass = 'from-yellow-400 via-orange-500 to-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.4)]';
  if (percentage < 25) colorClass = 'from-red-500 via-red-600 to-rose-700 shadow-[0_0_10px_rgba(225,29,72,0.4)]';

  return (
    <div className={`flex-1 flex flex-col ${isPlayer ? 'items-start' : 'items-end'} min-w-0`}>
      <div className={`flex w-full justify-between items-baseline mb-1 px-0.5 ${isPlayer ? 'flex-row' : 'flex-row-reverse'}`}>
        <span className={`font-black text-[9px] sm:text-xs tracking-wider uppercase italic ${isPlayer ? 'text-blue-400' : 'text-red-400'} truncate`}>
          {label}
        </span>
        <span className="text-[8px] sm:text-xs font-mono font-bold text-slate-500 ml-1">
          {Math.ceil(current)} / {max}
        </span>
      </div>
      <div className="h-2.5 sm:h-4 w-full bg-slate-950 rounded-full border border-slate-700/50 p-[1.5px] shadow-inner overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) bg-gradient-to-r ${colorClass} relative`}
          style={{ width: `${percentage}%` }}
        >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-[shimmer_2s_infinite]"></div>
        </div>
      </div>
    </div>
  );
};

export default HealthBar;
