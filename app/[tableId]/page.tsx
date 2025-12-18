'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { TableState, Player } from '@/types/poker';
import { PokerTable } from '@/components/PokerTable';
import { GameLog } from '@/components/GameLog';
import { Controls } from '@/components/Controls';

export default function TablePage() {
  const { tableId } = useParams();
  const [gameState, setGameState] = useState<TableState | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [myPosition, setMyPosition] = useState<number | null>(null);
  const playerNameRef = useRef<string | null>(null);

  useEffect(() => {
    playerNameRef.current = localStorage.getItem('playerName');
    const newSocket = io();

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setSocket(newSocket);
      // Immediately request state to break the connection deadlock
      newSocket.emit('request_state', { tableId });
    });

    newSocket.on('game_update', (data: TableState) => {
      setGameState(data);
    });

    newSocket.on('error', (msg: string) => {
      alert(msg);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinPosition = (position: number) => {
    if (socket && playerNameRef.current) {
      const amountStr = prompt('Enter buy-in amount (e.g. 1000):', '1000');
      if (amountStr === null) return; // User cancelled
      
      const chips = parseInt(amountStr);
      if (isNaN(chips) || chips <= 0) {
        alert('Invalid amount. Please enter a positive number.');
        return;
      }

      socket.emit('join_table', {
        tableId,
        playerName: playerNameRef.current,
        chips,
        position
      });
      setMyPosition(position);
    }
  };

  const handleAction = (type: string, amount?: number) => {
    if (socket) {
      if (type === 'show_cards') {
        socket.emit('show_cards');
      } else if (type === 'run_it_twice') {
        socket.emit('request_run_it_twice');
      } else if (type === 'sly_reveal') {
        socket.emit('toggle_sly_reveal');
      } else if (type === 'rig_hand') {
        socket.emit('rig_next_hand');
      } else {
        socket.emit('player_action', { type, amount });
      }
    }
  };

  const startGame = () => {
      if (socket) socket.emit('start_game');
  };

  if (!gameState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121212] text-white">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-mono text-xs uppercase tracking-widest text-gray-500">Connecting to Table...</p>
        </div>
      </div>
    );
  }

  const me = myPosition !== null ? gameState.players[myPosition] : null;
  const isMyTurn = myPosition !== null && gameState.activePosition === myPosition;

  return (
    <main className="flex min-h-screen flex-col bg-[#0a0a0a] overflow-hidden">
      <div className="flex-1 relative flex items-center justify-center p-4">
        <PokerTable 
          gameState={gameState} 
          onJoin={joinPosition} 
          myPosition={myPosition}
        />
        
        {/* Game Info Overlay */}
        <div className="absolute top-8 left-8 flex flex-col gap-1">
          <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">
            {tableId}
          </h2>
          <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">
            {gameState.gameState.replace('_', ' ')}
          </p>
        </div>

        {gameState.gameState === 'WAITING' && (
            <div className="absolute top-8 right-8">
                <button 
                    onClick={startGame}
                    className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-6 py-2 rounded-full transition-all"
                >
                    START GAME
                </button>
            </div>
        )}
      </div>

      <div className="h-64 bg-[#121212] border-t border-white/5 flex">
        <div className="flex-1 p-4">
          <Controls 
            gameState={gameState} 
            isMyTurn={isMyTurn} 
            onAction={handleAction}
            me={me}
          />
        </div>
        <div className="w-80 border-l border-white/5">
          <GameLog logs={gameState.gameFeed} />
        </div>
      </div>
    </main>
  );
}

