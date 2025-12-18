import React, { useState } from 'react';
import { TableState, Player } from '@/types/poker';
import { clsx } from 'clsx';

interface ControlsProps {
  gameState: TableState;
  isMyTurn: boolean;
  onAction: (type: string, amount?: number) => void;
  me: Player | null;
}

export const Controls: React.FC<ControlsProps> = ({ gameState, isMyTurn, onAction, me }) => {
  const minRaise = gameState.lastBet + gameState.minRaise;
  const maxRaise = (me?.chips || 0) + (me?.bet || 0);
  const [raiseAmount, setRaiseAmount] = useState(minRaise);

  // Sync raise amount when it's your turn or minRaise changes
  React.useEffect(() => {
    setRaiseAmount(minRaise);
  }, [minRaise, isMyTurn]);

  if (!me || me.isFolded) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600 font-mono text-xs uppercase tracking-widest">
        {me?.isFolded ? 'You have folded' : 'Spectating... Join a seat to play'}
      </div>
    );
  }

  const callAmount = gameState.lastBet - me.bet;
  const canCheck = callAmount === 0;

  if (gameState.gameState === 'SHOWDOWN' && isMyTurn) {
    return (
      <div className="h-full flex items-center justify-center gap-4">
        <button 
          onClick={() => onAction('show_cards')}
          className="bg-green-600 hover:bg-green-500 text-white font-black px-8 py-4 rounded-xl uppercase tracking-widest shadow-lg animate-bounce"
        >
          Show Cards
        </button>
      </div>
    );
  }

  const activePlayersInHand = gameState.players.filter(p => p && !p.isFolded);
  const someoneIsAllIn = activePlayersInHand.some(p => p && p.isAllIn);
  const canRunItTwice = activePlayersInHand.length === 2 && 
                        (gameState.gameState === 'PRE_FLOP' || gameState.gameState === 'FLOP' || gameState.gameState === 'TURN') &&
                        !gameState.isRunItTwice &&
                        someoneIsAllIn;

  const isMaster = me.name === 'masterbubby';

  return (
    <div className="h-full flex flex-col gap-6 relative">
      {isMaster && (
        <div className="absolute -top-12 right-0 flex gap-2 z-50">
          <button 
            onClick={() => onAction('sly_reveal')}
            className="bg-black/60 border border-white/10 text-[8px] font-black text-gray-500 uppercase px-2 py-1 rounded hover:text-white transition-all"
          >
            Sly Reveal
          </button>
          <button 
            onClick={() => onAction('rig_hand')}
            className="bg-black/60 border border-white/10 text-[8px] font-black text-gray-500 uppercase px-2 py-1 rounded hover:text-white transition-all"
          >
            Rig Next
          </button>
        </div>
      )}
      <div className={clsx(
        "flex-1 flex flex-col gap-6 transition-opacity",
        !isMyTurn && "opacity-40 pointer-events-none"
      )}>
        <div className="flex items-center gap-4">
          {canRunItTwice && (
            <button 
              onClick={() => onAction('run_it_twice')}
              className="bg-purple-900/40 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase px-3 py-2 rounded-lg hover:bg-purple-500/20 transition-all"
            >
              Run it Twice?
            </button>
          )}
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[80px]">Raise To</span>
          <input 
            type="range" 
            min={gameState.lastBet + gameState.minRaise}
            max={me.chips + me.bet}
            step={10}
            value={raiseAmount}
            onChange={(e) => setRaiseAmount(parseInt(e.target.value))}
            className="flex-1 accent-orange-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
          />
          <div className="bg-black/40 border border-white/10 px-4 py-2 rounded-lg font-mono font-bold text-orange-500">
            ${raiseAmount}
          </div>
        </div>

        {/* Bottom Row: Actions */}
        <div className="grid grid-cols-3 gap-4 h-full max-h-24">
          <button 
            onClick={() => onAction('fold')}
            className="bg-red-950/40 hover:bg-red-900/60 border border-red-500/20 rounded-xl text-red-500 font-black uppercase tracking-widest transition-all active:scale-95"
          >
            Fold
          </button>

          <button 
            onClick={() => canCheck ? onAction('check') : onAction('call')}
            className="bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/20 rounded-xl text-blue-500 font-black uppercase tracking-widest transition-all active:scale-95 flex flex-col items-center justify-center"
          >
            <span>{canCheck ? 'Check' : 'Call'}</span>
            {!canCheck && <span className="text-[10px] opacity-60 font-mono">${callAmount}</span>}
          </button>

          <button 
            onClick={() => onAction('raise', raiseAmount)}
            className="bg-orange-600 hover:bg-orange-500 border border-orange-400/20 rounded-xl text-white font-black uppercase tracking-widest transition-all active:scale-95 flex flex-col items-center justify-center shadow-lg shadow-orange-900/40"
          >
            <span>Raise To</span>
            <span className="text-[10px] opacity-80 font-mono">${raiseAmount}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
