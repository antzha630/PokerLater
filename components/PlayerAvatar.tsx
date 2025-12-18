import React from 'react';
import { Player, Card as CardType } from '@/types/poker';
import { clsx } from 'clsx';

interface PlayerAvatarProps {
  player: Player;
  isActive: boolean;
  isDealer: boolean;
  timer?: number;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ player, isActive, isDealer, timer }) => {
  // Determine if player is on the top or bottom half of the table to flip UI
  // Positions 2, 3, 4, 5, 6 are generally "top" half
  const isTopHalf = player.position >= 2 && player.position <= 6;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Cards - Positioned above for bottom players, below for top players */}
      <div className={clsx(
        "flex gap-1 h-16 z-10 transition-all",
        isTopHalf ? "order-3 -mt-8" : "order-1 -mb-10"
      )}>
        {player.holeCards.map((card, idx) => (
          <div 
            key={idx}
            className={clsx(
              "w-12 h-16 rounded border-2 flex items-center justify-center shadow-2xl transform transition-transform",
              card ? "bg-white border-white rotate-1" : "bg-red-700 border-white/20 -rotate-1 shadow-inner",
              player.isFolded && !card && "opacity-0 scale-50",
              player.isFolded && card && "opacity-40 grayscale"
            )}
          >
            {card ? <CardSmall card={card} /> : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-6 h-8 border border-white/10 rounded-sm opacity-20"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Label (Speech Bubble) */}
      {player.lastAction && (
        <div className={clsx(
          "absolute z-20 animate-in fade-in zoom-in duration-300",
          isTopHalf ? "top-24" : "-top-16"
        )}>
          {!isTopHalf && <div className="bg-white text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_4px_10px_rgba(0,0,0,0.5)] border-2 border-black/5 whitespace-nowrap">
            {player.lastAction}
          </div>}
          {/* Small tail for the bubble */}
          {!isTopHalf && <div className="w-2 h-2 bg-white rotate-45 mx-auto -mt-1 shadow-lg border-r border-b border-black/5"></div>}
          
          {isTopHalf && <div className="w-2 h-2 bg-white rotate-45 mx-auto mb-[-4px] shadow-lg border-l border-t border-black/5 relative z-10"></div>}
          {isTopHalf && <div className="bg-white text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_4px_10px_rgba(0,0,0,0.5)] border-2 border-black/5 whitespace-nowrap">
            {player.lastAction}
          </div>}
        </div>
      )}

      {/* Avatar Circle */}
      <div className={clsx(
        "relative w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center bg-[#1e1e1e] shadow-2xl transition-all order-2",
        isActive ? "border-orange-500 scale-110 shadow-orange-500/20" : "border-white/10",
        player.isFolded && "opacity-40 scale-95"
      )}>
        {isActive && (
          <div className="absolute inset-0 rounded-full border-4 border-orange-500 animate-ping opacity-20"></div>
        )}

        {timer !== undefined && isActive && (
          <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-orange-600 border-2 border-white flex items-center justify-center shadow-lg z-20">
            <span className="text-[10px] font-black text-white font-mono">{timer}</span>
          </div>
        )}
        
        <p className="text-[10px] font-black uppercase text-gray-500 tracking-tighter truncate max-w-[80px]">
          {player.name}
        </p>
        <p className="text-sm font-black text-white font-mono">
          ${player.chips}
        </p>
        
        {player.bet > 0 && (
          <div className="absolute -bottom-6 bg-black/80 px-2 py-0.5 rounded border border-white/10 text-[10px] font-bold text-yellow-500 font-mono">
            BET: ${player.bet}
          </div>
        )}

        {isDealer && (
            <div className="absolute -right-2 top-0 w-6 h-6 bg-white rounded-full flex items-center justify-center border border-gray-300 shadow-md">
                <span className="text-[10px] font-black text-black">D</span>
            </div>
        )}

        {player.lastAction && (
             <div className="hidden">
                {player.lastAction}
             </div>
        )}
      </div>
    </div>
  );
};

const CardSmall = ({ card }: { card: CardType }) => {
  const suitSymbols: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };
  const suitColors: Record<string, string> = { s: 'text-gray-900', h: 'text-red-600', d: 'text-blue-600', c: 'text-green-700' };
  
  return (
    <div className={clsx("flex flex-col items-center leading-[0.8] text-[10px]", suitColors[card.suit])}>
      <span className="font-bold">{card.rank}</span>
      <span className="text-base">{suitSymbols[card.suit]}</span>
    </div>
  );
};

