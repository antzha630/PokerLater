'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [playerName, setPlayerName] = useState('');
  const [tableId, setTableId] = useState('');
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName && tableId) {
      localStorage.setItem('playerName', playerName);
      router.push(`/${tableId}`);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-[#121212]">
      <div className="z-10 max-w-md w-full items-center justify-center font-mono text-sm flex flex-col gap-8 bg-[#1e1e1e] p-10 rounded-2xl border border-white/10 shadow-2xl">
        <h1 className="text-4xl font-black tracking-tighter text-orange-500 italic uppercase">PokerNow</h1>
        
        <form onSubmit={handleJoin} className="flex flex-col gap-4 w-full">
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Your Name</label>
            <input 
              type="text" 
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Amon Guy"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
              required
            />
          </div>
          
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Table ID</label>
            <input 
              type="text" 
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              placeholder="Lobby-123"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-lg mt-4 transition-all active:scale-95 shadow-lg shadow-orange-900/20"
          >
            ENTER THE ARENA
          </button>
        </form>
      </div>
    </main>
  );
}
