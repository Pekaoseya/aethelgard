'use client';

import { useState, useEffect } from 'react';
import { BattleState, Card, AIOpponent } from '@/types';
import { AgentCard } from './AgentCard';
import { BattleCard } from './BattleCard';
import { useGame } from '@/hooks/useGame';
import { cn } from '@/lib/utils';
import { generateAIOpponent, aiSelectCard } from '@/lib/game-engine';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BattleArenaProps {
  floor: number;
}

export function BattleArena({ floor }: BattleArenaProps) {
  const { state, dispatch, selectCard, confirmCardUse } = useGame();
  const [enemy, setEnemy] = useState<AIOpponent | null>(null);
  const [animating, setAnimating] = useState(false);
  
  useEffect(() => {
    const opponent = generateAIOpponent(floor);
    setEnemy(opponent);
  }, [floor]);
  
  if (!state.battleState || !enemy) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }
  
  const battle = state.battleState;
  
  const handleCardClick = (card: Card) => {
    if (battle.phase !== 'playing') return;
    selectCard(battle.playerSelectedCard?.id === card.id ? null : card);
  };
  
  const handleConfirmCard = () => {
    if (!battle.playerSelectedCard || animating) return;
    
    setAnimating(true);
    
    // AI选择卡牌
    const enemyCard = aiSelectCard(
      enemy.cards,
      enemy.hp,
      enemy.maxHp,
      state.agent.currentHp
    );
    
    dispatch({ 
      type: 'UPDATE_BATTLE_STATE', 
      payload: { enemySelectedCard: enemyCard } 
    });
    
    setTimeout(() => {
      confirmCardUse();
      setAnimating(false);
    }, 1500);
  };
  
  const handleEndBattle = () => {
    dispatch({ type: 'CLEAR_BATTLE' });
  };
  
  // 创建临时enemy agent用于显示
  const enemyAgent = {
    id: 'enemy',
    name: enemy.name,
    avatar: enemy.avatar,
    level: enemy.level,
    exp: 0,
    expToNext: 100,
    hp: enemy.hp,
    maxHp: enemy.maxHp,
    attack: enemy.attack,
    defense: enemy.defense,
    speed: enemy.speed,
    currentHp: enemy.hp,
    shield: 0,
    cards: [],
    maxCards: 30,
    isDead: false,
    deathCount: 0,
    buffs: [],
  };
  
  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'damage': return 'text-red-400';
      case 'critical': return 'text-yellow-400';
      case 'heal': return 'text-green-400';
      case 'buff': return 'text-blue-400';
      case 'dodge': return 'text-cyan-400';
      default: return 'text-slate-300';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Battle header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800/80 rounded-full">
          <span className="text-2xl">🏰</span>
          <span className="text-xl font-bold text-white">第{floor}层: {enemy.name}</span>
          <span className="text-2xl">🏰</span>
        </div>
        
        {battle.winner && (
          <div className={cn(
            "mt-4 px-6 py-3 rounded-xl text-xl font-bold animate-bounce",
            battle.winner === 'player'
              ? "bg-green-600/80 text-white"
              : "bg-red-600/80 text-white"
          )}>
            {battle.winner === 'player' ? '🎉 胜利!' : '💀 失败...'}
          </div>
        )}
      </div>
      
      {/* Battle arena */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player side */}
        <div className="space-y-4">
          <AgentCard 
            agent={state.agent} 
            isPlayer={true}
            compact={false}
          />
          
          {/* Player cards */}
          {battle.phase === 'playing' && !battle.winner && (
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="text-sm text-slate-400 mb-3">选择一张卡牌出招</div>
              <div className="flex flex-wrap gap-3 justify-center">
                {battle.playerCards.map((card) => (
                  <BattleCard
                    key={card.id}
                    card={card}
                    isSelected={battle.playerSelectedCard?.id === card.id}
                    onClick={() => handleCardClick(card)}
                    size="sm"
                  />
                ))}
              </div>
              
              {battle.playerSelectedCard && (
                <button
                  onClick={handleConfirmCard}
                  disabled={animating}
                  className={cn(
                    "w-full mt-4 py-3 rounded-lg font-bold text-white",
                    "bg-gradient-to-r from-purple-600 to-purple-800",
                    "hover:from-purple-500 hover:to-purple-700",
                    "transition-all shadow-lg shadow-purple-500/30",
                    animating && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {animating ? '⚔️ 战斗中...' : '⚔️ 出招!'}
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Center - Battle log */}
        <div className="space-y-4">
          {/* Turn info */}
          <div className="bg-slate-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white mb-2">
              第{battle.turn || 1}回合
            </div>
            <div className={cn(
              "text-sm px-3 py-1 rounded-full inline-block",
              battle.phase === 'playing' ? "bg-green-600/50 text-green-300" :
              battle.phase === 'finished' ? "bg-yellow-600/50 text-yellow-300" :
              "bg-slate-600/50 text-slate-300"
            )}>
              {battle.phase === 'playing' ? '⚔️ 行动中' :
               battle.phase === 'finished' ? '🏁 战斗结束' :
               '⏳ 准备中'}
            </div>
          </div>
          
          {/* Roll results */}
          {battle.rollResult && (
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="text-sm text-slate-400 mb-2 text-center">🎲 Roll点结果</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xs text-slate-400">你</div>
                  <div className="text-3xl font-bold text-purple-400">
                    {battle.rollResult.playerRoll}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-400">敌人</div>
                  <div className="text-3xl font-bold text-red-400">
                    {battle.rollResult.enemyRoll}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Battle log */}
          <ScrollArea className="h-64 bg-slate-900/50 rounded-xl p-4">
            <div className="space-y-2">
              {battle.battleLog.map((log, i) => (
                <div 
                  key={i}
                  className={cn(
                    "text-sm py-1 border-l-2 pl-2",
                    getLogTypeColor(log.type),
                    log.type === 'critical' && "font-bold",
                    log.type === 'info' && "text-slate-400"
                  )}
                >
                  {log.message}
                </div>
              ))}
            </div>
          </ScrollArea>
          
          {/* Used cards */}
          {(battle.playerSelectedCard || battle.enemySelectedCard) && (
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="text-sm text-slate-400 mb-2 text-center">本回合出牌</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-1">你的出牌</div>
                  {battle.playerSelectedCard && (
                    <div className={cn(
                      "px-3 py-2 rounded-lg text-sm",
                      "bg-purple-900/50 border border-purple-500/50"
                    )}>
                      {battle.playerSelectedCard.icon} {battle.playerSelectedCard.name}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-1">敌人出牌</div>
                  {battle.enemySelectedCard && (
                    <div className={cn(
                      "px-3 py-2 rounded-lg text-sm",
                      "bg-red-900/50 border border-red-500/50"
                    )}>
                      {battle.enemySelectedCard.icon} {battle.enemySelectedCard.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Enemy side */}
        <div className="space-y-4">
          <AgentCard 
            agent={enemyAgent} 
            isPlayer={false}
            compact={false}
          />
          
          {/* Enemy cards (hidden except during animation) */}
          {animating && battle.enemySelectedCard && (
            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
              <div className="text-sm text-slate-400 mb-2">敌人使用</div>
              <BattleCard
                card={battle.enemySelectedCard}
                size="md"
              />
            </div>
          )}
        </div>
      </div>
      
      {/* End battle button */}
      {battle.winner && (
        <button
          onClick={handleEndBattle}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-xl text-white",
            "bg-gradient-to-r from-slate-700 to-slate-800",
            "hover:from-slate-600 hover:to-slate-700",
            "transition-all shadow-lg"
          )}
        >
          {battle.winner === 'player' ? '🎁 领取奖励并继续' : '🔄 重新挑战'}
        </button>
      )}
    </div>
  );
}
