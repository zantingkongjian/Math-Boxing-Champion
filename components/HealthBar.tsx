import React from 'react';

interface HealthBarProps {
  current: number;
  max: number;
  isPlayer: boolean;
  label: string;
}

const HealthBar: React.FC<HealthBarProps> = ({ current, max, isPlayer, label }) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  let colorClass = 'bg-green-500';
  if (percentage < 50) colorClass = 'bg-yellow-500';
  if (percentage < 25) colorClass = 'bg-red-600';

  return (
    <div className={`flex-1 max-w-[45%] ${isPlayer ? 'mr-auto' : 'ml-auto text-right'}`}>
      <div className="flex justify-between items-end mb-1 px-1">
        <span className={`font-bold uppercase tracking-wider text-xs sm:text-sm ${isPlayer ? 'text-blue-300' : 'text-red-300'}`}>
          {label}
        </span>
        <span className="text-xs sm:text-sm font-mono text-gray-400">{current}/{max}</span>
      </div>
      <div className="h-4 sm:h-6 w-full bg-slate-800 rounded-full border-2 border-slate-700 overflow-hidden relative shadow-inner">
        <div 
          className={`h-full transition-all duration-500 ease-out ${colorClass} relative`}
          style={{ width: `${percentage}%` }}
        >
            <div className="absolute top-0 right-0 bottom-0 w-1 bg-white opacity-30"></div>
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white opacity-20 rounded-t-full"></div>
        </div>
      </div>
    </div>
  );
};

export default HealthBar;