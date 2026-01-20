
import React from 'react';

const RingBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* 远景灯光 */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full"></div>
      <div className="absolute top-0 right-1/4 w-64 h-64 bg-red-500/10 blur-[100px] rounded-full"></div>
      
      {/* 擂台地面 */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-slate-800 border-t-8 border-slate-700">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      </div>
      
      {/* 围栏绳索 */}
      <div className="absolute bottom-1/3 left-0 right-0 h-1 bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.5)] transform -skew-y-1"></div>
      <div className="absolute bottom-[30%] left-0 right-0 h-1 bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.5)] transform skew-y-1"></div>
      <div className="absolute bottom-[27%] left-0 right-0 h-1 bg-white/20"></div>
    </div>
  );
};

export default RingBackground;
