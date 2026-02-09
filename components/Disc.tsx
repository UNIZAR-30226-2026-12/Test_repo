import React from 'react';
import { Player } from '../types';

interface DiscProps {
  player: Player;
  isRecent: boolean;
}

const Disc: React.FC<DiscProps> = ({ player, isRecent }) => {
  if (!player) return null;

  const colorClass = player === 'black' 
    ? 'bg-stone-900 shadow-[inset_0_-2px_4px_rgba(255,255,255,0.2),0_2px_4px_rgba(0,0,0,0.5)]' 
    : 'bg-stone-100 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.5)]';

  const indicatorClass = player === 'black' ? 'bg-white/20' : 'bg-black/20';

  return (
    <div className={`w-[80%] h-[80%] rounded-full ${colorClass} relative transition-all duration-300 transform animate-in fade-in zoom-in`}>
        {/* Bisel/brillo sutil */}
        <div className="absolute top-[10%] left-[10%] w-[30%] h-[20%] rounded-full bg-white opacity-10 blur-sm"></div>
        {/* Indicador de movimiento reciente */}
        {isRecent && (
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${indicatorClass}`}></div>
        )}
    </div>
  );
};

export default Disc;