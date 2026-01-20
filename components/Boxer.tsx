
import React from 'react';

interface BoxerProps {
  isPlayer: boolean;
  isHit: boolean;
  isAttacking: boolean;
  currentHp: number;
  maxHp: number;
}

const Boxer: React.FC<BoxerProps> = ({ isPlayer, isHit, isAttacking, currentHp, maxHp }) => {
  const baseClasses = "transition-transform duration-200 ease-in-out";
  const hpPercent = currentHp / maxHp;
  const isLowHp = hpPercent < 0.35 && currentHp > 0;
  
  let transformClass = "";
  if (isHit) {
    transformClass = "animate-shake opacity-80 filter brightness-150 saturate-200"; 
  } else if (isAttacking) {
    transformClass = isPlayer 
      ? "translate-x-16 sm:translate-x-48 z-10 scale-110" 
      : "-translate-x-16 sm:-translate-x-48 z-10 scale-110";
  } else {
    transformClass = "animate-idle"; 
  }

  return (
    <div 
        className={`relative w-28 h-28 sm:w-56 sm:h-56 flex items-center justify-center ${baseClasses} ${transformClass}`}
        style={!isHit && !isAttacking ? { animationDelay: isPlayer ? '0s' : '1.25s' } : {}}
    >
      {isLowHp && !isPlayer && (
        <div className="absolute -top-6 -right-2 z-20 opacity-70">
            <div className="w-3 h-3 bg-gray-400 rounded-full animate-ping"></div>
        </div>
      )}

      {isPlayer ? (
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
          <g transform={isAttacking ? "rotate(-10, 100, 100)" : ""}>
            <rect x="70" y="100" width="60" height="70" rx="10" fill="#3B82F6" />
            <circle cx="100" cy="70" r="35" fill="#FFD700" />
            <circle cx="100" cy="70" r="30" fill="#FDE68A" />
            <path d="M85 65 L95 70" stroke="#000" strokeWidth="3" />
            <path d="M115 65 L105 70" stroke="#000" strokeWidth="3" />
            <rect x="70" y="50" width="60" height="10" fill="#EF4444" />
            <circle cx="50" cy="110" r="25" fill="#EF4444" className={isAttacking ? "animate-ping" : ""} /> 
            <circle cx="150" cy="110" r="25" fill="#EF4444" />
          </g>
        </svg>
      ) : (
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
           <g transform={isAttacking ? "rotate(10, 100, 100)" : ""}>
            <path d="M60 100 L140 100 L130 180 L70 180 Z" fill={isLowHp ? "#475569" : "#64748B"} />
            <rect x="65" y="40" width="70" height="60" rx="5" fill="#94A3B8" />
            <rect x="75" y="55" width="50" height="20" rx="2" fill="#000" />
            <circle cx="90" cy="65" r="5" fill={isLowHp ? "#F59E0B" : "#EF4444"} className="animate-pulse" />
            <circle cx="110" cy="65" r="5" fill={isLowHp ? "#F59E0B" : "#EF4444"} className="animate-pulse" />
            <line x1="100" y1="40" x2="100" y2="20" stroke="#94A3B8" strokeWidth="4" />
            <circle cx="100" cy="15" r="5" fill={isLowHp ? "#EF4444" : "#22C55E"} />
            <rect x="30" y="100" width="40" height="40" rx="5" fill="#334155" />
            <rect x="130" y="100" width="40" height="40" rx="5" fill="#334155" />
           </g>
        </svg>
      )}
      
      {isHit && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
             <div className="text-4xl sm:text-6xl font-black text-white transform -rotate-12 animate-pop" style={{ textShadow: '4px 4px 0px #000' }}>
               砰!
             </div>
        </div>
      )}
    </div>
  );
};

export default Boxer;
