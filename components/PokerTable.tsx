import React, { useState, useEffect } from 'react';
import { TableState, Player, Card } from '@/types/poker';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { clsx } from 'clsx';

interface PokerTableProps {
  gameState: TableState;
  myPosition: number | null;
  onJoin: (pos: number) => void;
}

export const PokerTable: React.FC<PokerTableProps> = ({ gameState, myPosition, onJoin }) => {
  const [visibleBoardCount, setVisibleBoardCount] = useState(0);

  // Animate community cards one by one
  useEffect(() => {
    if (gameState.board.length > visibleBoardCount) {
      const timer = setTimeout(() => {
        setVisibleBoardCount(prev => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    } else if (gameState.board.length < visibleBoardCount) {
      // New hand started, reset board count
      setVisibleBoardCount(0);
    }
  }, [gameState.board.length, visibleBoardCount]);

  // Community cards for display (staggered)
  const displayBoard = gameState.board.slice(0, visibleBoardCount);
  // Corrected distribution for 9 players to prevent overlap and top cutoff
  const positions = [
    { bottom: '2%', left: '50%' },    // 0 - Bottom
    { bottom: '15%', left: '15%' },   // 1 - Bottom Left
    { top: '50%', left: '5%' },       // 2 - Mid Left
    { top: '15%', left: '15%' },      // 3 - Top Left
    { top: '12%', left: '50%' },      // 4 - Top (pushed down from 2% to 12%)
    { top: '15%', right: '15%' },     // 5 - Top Right
    { top: '50%', right: '5%' },      // 6 - Mid Right
    { bottom: '15%', right: '15%' },  // 7 - Bottom Right
    { bottom: '5%', left: '30%' },    // 8 - Bottom Left-ish (moved away from 7)
  ];

  return (
    <div className="relative w-full max-w-5xl aspect-[16/9] flex items-center justify-center">
      {/* The Felt */}
      <div className="poker-table absolute inset-0 rounded-[200px] flex flex-col items-center justify-center pointer-events-none">
        {/* Pot Display */}
        <div className="mb-4 text-center">
          <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest opacity-60">Main Pot</p>
          <p className="text-3xl font-black text-white font-mono">${gameState.pot}</p>
        </div>

        {/* Community Cards */}
        <div className="flex gap-3 h-24 mb-10">
          {[0, 1, 2, 3, 4].map((i) => {
            const card = displayBoard[i];
            const isNew = i >= visibleBoardCount - 1 && i < gameState.board.length;
            return (
              <div 
                key={i}
                className={clsx(
                  "w-16 h-24 rounded-lg border-2 flex flex-col items-center justify-center transition-all duration-500",
                  card ? "bg-white text-black border-white scale-100" : "border-white/10 bg-black/20 scale-95",
                  isNew && card && "animate-in zoom-in slide-in-from-top-4"
                )}
              >
                {card ? (
                  <CardDisplay card={card} />
                ) : (
                  <span className="text-white/5 text-[10px] font-black uppercase tracking-tighter">
                    {i < 3 ? 'Flop' : i === 3 ? 'Turn' : 'River'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Players around the table */}
      {positions.map((style, i) => {
        const player = gameState.players[i];
        return (
          <div 
            key={i} 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
            style={style}
          >
            {player ? (
              <PlayerAvatar 
                player={player} 
                isActive={gameState.activePosition === i}
                isDealer={gameState.dealerPosition === i}
                timer={gameState.activePosition === i ? gameState.timer : undefined}
              />
            ) : (
              myPosition === null && (
                <button 
                  onClick={() => onJoin(i)}
                  className="w-20 h-20 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center hover:border-orange-500 group transition-all"
                >
                  <span className="text-[10px] font-bold text-gray-500 group-hover:text-orange-500 uppercase tracking-widest">Join</span>
                </button>
              )
            )}
          </div>
        );
      })}
    </div>
  );
};

const CardDisplay = ({ card }: { card: Card }) => {
  const suitSymbols: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };
  const suitColors: Record<string, string> = { s: 'text-gray-900', h: 'text-red-600', d: 'text-blue-600', c: 'text-green-700' };
  
  return (
    <div className={clsx("flex flex-col items-center leading-none", suitColors[card.suit])}>
      <span className="text-lg font-bold">{card.rank}</span>
      <span className="text-2xl">{suitSymbols[card.suit]}</span>
    </div>
  );
};

