import React from 'react';

interface BoxerProps {
  isPlayer: boolean;
  isHit: boolean;
  isAttacking: boolean;
  currentHp: number;
  maxHp: number;
}

const Boxer: React.FC<BoxerProps> = ({ isPlayer, isHit, isAttacking, currentHp, maxHp }) => {
  // Simple CSS transforms for animations
  const baseClasses = "transition-transform duration-200 ease-in-out";
  
  const hpPercent = currentHp / maxHp;
  const isLowHp = hpPercent < 0.35 && currentHp > 0;
  
  let transformClass = "";
  if (isHit) {
    transformClass = "animate-shake opacity-80 filter brightness-150 saturate-200"; // Flash white/shake
  } else if (isAttacking) {
    transformClass = isPlayer 
      ? "translate-x-24 sm:translate-x-48 z-10 scale-110" 
      : "-translate-x-24 sm:-translate-x-48 z-10 scale-110";
  } else {
    transformClass = "animate-idle"; // Idle breathing
  }

  return (
    <div 
        className={`relative w-40 h-40 sm:w-56 sm:h-56 flex items-center justify-center ${baseClasses} ${transformClass}`}
        style={!isHit && !isAttacking ? { animationDelay: isPlayer ? '0s' : '1.25s' } : {}}
    >
      {/* Smoke Effect for Low HP */}
      {isLowHp && !isPlayer && (
        <div className="absolute -top-10 -right-5 z-20 opacity-70">
            <div className="w-4 h-4 bg-gray-400 rounded-full animate-ping absolute top-0 left-0"></div>
            <div className="w-6 h-6 bg-gray-500 rounded-full animate-ping absolute top-4 left-4 animation-delay-500"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full animate-ping absolute top-2 -left-4 animation-delay-200"></div>
        </div>
      )}

      {isPlayer ? (
        // Player Avatar (The Kid Hero)
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
          <g transform={isAttacking ? "rotate(-10, 100, 100)" : ""}>
             {/* Body */}
            <rect x="70" y="100" width="60" height="70" rx="10" fill="#3B82F6" />
            {/* Head */}
            <circle cx="100" cy="70" r="35" fill="#FFD700" />
            <circle cx="100" cy="70" r="30" fill="#FDE68A" />
            {/* Eyes (determined) */}
            <path d="M85 65 L95 70" stroke="#000" strokeWidth="3" />
            <path d="M115 65 L105 70" stroke="#000" strokeWidth="3" />
            {/* Sweatband */}
            <rect x="70" y="50" width="60" height="10" fill="#EF4444" />
            
            {/* Gloves */}
            <circle cx="50" cy="110" r="25" fill="#EF4444" className={isAttacking ? "animate-ping" : ""} /> 
            <circle cx="150" cy="110" r="25" fill="#EF4444" />
          </g>
        </svg>
      ) : (
        // Opponent Avatar (The Math Robot)
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
           <g transform={isAttacking ? "rotate(10, 100, 100)" : ""}>
             {/* Body */}
            <path d="M60 100 L140 100 L130 180 L70 180 Z" fill={isLowHp ? "#475569" : "#64748B"} />
            
            {/* Cracks if Low HP */}
            {isLowHp && <path d="M70 110 L90 130 L80 140" stroke="black" strokeWidth="2" fill="none" opacity="0.5"/>}

            {/* Head */}
            <rect x="65" y="40" width="70" height="60" rx="5" fill="#94A3B8" />
            {/* Robot Eye */}
            <rect x="75" y="55" width="50" height="20" rx="2" fill="#000" />
            
            {/* Eye Color changes based on HP */}
            <circle cx="90" cy="65" r="5" fill={isLowHp ? "#F59E0B" : "#EF4444"} className="animate-pulse" />
            <circle cx="110" cy="65" r="5" fill={isLowHp ? "#F59E0B" : "#EF4444"} className="animate-pulse" />
            
            {/* Antenna */}
            <line x1="100" y1="40" x2="100" y2="20" stroke="#94A3B8" strokeWidth="4" />
            <circle cx="100" cy="15" r="5" fill={isLowHp ? "#EF4444" : "#22C55E"} />

            {/* Gloves */}
            <rect x="30" y="100" width="40" height="40" rx="5" fill="#334155" />
            <rect x="130" y="100" width="40" height="40" rx="5" fill="#334155" />
           </g>
        </svg>
      )}
      
      {/* Hit Effect */}
      {isHit && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
             <div className="text-6xl font-black text-white transform -rotate-12 animate-pop" style={{ textShadow: '4px 4px 0px #000' }}>
               砰!
             </div>
        </div>
      )}
    </div>
  );
};

export default Boxer;