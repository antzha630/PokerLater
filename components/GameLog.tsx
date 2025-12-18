import React from 'react';

interface GameLogProps {
  logs: string[];
}

export const GameLog: React.FC<GameLogProps> = ({ logs }) => {
  return (
    <div className="h-full flex flex-col p-4 gap-2 overflow-hidden">
      <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest border-b border-white/5 pb-2 mb-2">
        Table Actions
      </h3>
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 scrollbar-hide">
        {logs.map((log, i) => (
          <div key={i} className="text-[11px] font-medium text-gray-400 animate-in fade-in slide-in-from-left-2 duration-500">
            <span className="text-gray-600 mr-2 font-mono">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};


