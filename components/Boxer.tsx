
import React from 'react';

interface BoxerProps {
  isPlayer: boolean;
  isHit: boolean;
  isAttacking: boolean;
  currentHp: number;
  maxHp: number;
}

const Boxer: React.FC<BoxerProps> = ({ isPlayer, isHit, isAttacking, currentHp, maxHp }) => {
  const hpPercent = currentHp / maxHp;
  const isLowHp = hpPercent < 0.35 && currentHp > 0;
  
  let transformClass = "";
  if (isHit) {
    transformClass = "animate-shake scale-95 brightness-150"; 
  } else if (isAttacking) {
    // 根据屏幕宽度调整冲刺距离
    const distance = window.innerWidth < 640 ? 40 : 100;
    transformClass = isPlayer 
      ? `translate-x-[${distance}px] scale-105 z-20` 
      : `-translate-x-[${distance}px] scale-105 z-20`;
  }

  return (
    <div 
        className={`relative h-full aspect-square flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.34, 1.56, 0.64, 1)] ${transformClass}`}
    >
      {isLowHp && !isPlayer && (
        <div className="absolute top-0 right-0 z-20">
            <div className="w-2 h-2 sm:w-4 sm:h-4 bg-red-500 rounded-full animate-ping"></div>
        </div>
      )}

      {isPlayer ? (
        <svg viewBox="0 0 200 200" className="h-full w-full drop-shadow-2xl overflow-visible">
          <g transform={isAttacking ? (isPlayer ? "rotate(-8, 100, 100)" : "rotate(8, 100, 100)") : ""}>
            <rect x="70" y="100" width="60" height="70" rx="12" fill="#3B82F6" className="shadow-lg" />
            <circle cx="100" cy="70" r="35" fill="#FFD700" />
            <circle cx="100" cy="70" r="30" fill="#FDE68A" />
            <rect x="85" y="65" width="4" height="2" rx="1" fill="#000" />
            <rect x="111" y="65" width="4" height="2" rx="1" fill="#000" />
            <rect x="70" y="50" width="60" height="8" rx="4" fill="#EF4444" />
            <circle cx="50" cy="110" r="24" fill="#EF4444" /> 
            <circle cx="150" cy="110" r="24" fill="#EF4444" />
          </g>
        </svg>
      ) : (
        <svg viewBox="0 0 200 200" className="h-full w-full drop-shadow-2xl overflow-visible">
           <g transform={isAttacking ? "rotate(8, 100, 100)" : ""}>
            <path d="M60 100 L140 100 L132 180 L68 180 Z" fill={isLowHp ? "#475569" : "#64748B"} />
            <rect x="65" y="40" width="70" height="60" rx="8" fill="#94A3B8" />
            <rect x="75" y="55" width="50" height="18" rx="4" fill="#000" />
            <circle cx="88" cy="64" r="4" fill={isLowHp ? "#F59E0B" : "#EF4444"} className="animate-pulse" />
            <circle cx="112" cy="64" r="4" fill={isLowHp ? "#F59E0B" : "#EF4444"} className="animate-pulse" />
            <line x1="100" y1="40" x2="100" y2="15" stroke="#94A3B8" strokeWidth="6" strokeLinecap="round" />
            <circle cx="100" cy="12" r="6" fill={isLowHp ? "#EF4444" : "#22C55E"} className="animate-pulse" />
            <rect x="30" y="105" width="35" height="35" rx="8" fill="#334155" />
            <rect x="135" y="105" width="35" height="35" rx="8" fill="#334155" />
           </g>
        </svg>
      )}
      
      {isHit && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
             <div className="text-2xl sm:text-6xl font-black text-white italic transform -rotate-12 animate-pop drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]" style={{ WebkitTextStroke: '1px #000' }}>
               砰!
             </div>
        </div>
      )}
      
      <style>{`
        @keyframes idle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-idle {
          animation: idle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Boxer;
