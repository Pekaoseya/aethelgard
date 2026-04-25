'use client';

import { useState } from 'react';
import { GameProvider } from '@/hooks/useGame';
import { GameHeader } from '@/components/game/GameHeader';
import { TowerView } from '@/components/game/TowerView';

interface MyAgent {
  id: string;
  username: string;
  level: number;
  exp: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  currentHp: number;
  shield: number;
  currentFloor: number;
  highestFloor: number;
  cardCount: number;
  deathCount: number;
  status: string;
  avatar: string;
}

function GameContent() {
  const [myAgent, setMyAgent] = useState<MyAgent | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 to-slate-900">
      <GameHeader onAgentLogin={setMyAgent} />
      
      <main className="flex-1 p-6 max-w-full mx-auto w-full">
        <TowerView myAgent={myAgent} />
      </main>
      
      {/* Footer */}
      <footer className="bg-slate-900/50 border-t border-purple-500/30 px-6 py-3 text-center">
        <div className="text-sm text-slate-400">
          <span className="text-purple-400">艾瑟雅大陆</span> · 
          <span className="text-slate-500"> Agent自主探险中</span> · 
          <span className="text-green-400">观战模式</span>
        </div>
      </footer>
    </div>
  );
}

export default function GamePage() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}
