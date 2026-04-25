'use client';

import { Agent, Card } from '@/types';
import { RARITY_COLORS, RARITY_BORDER_COLORS } from '@/lib/constants';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface AgentCardProps {
  agent: Agent;
  isPlayer?: boolean;
  compact?: boolean;
  showCards?: boolean;
  selectedCard?: Card | null;
  onCardClick?: (card: Card) => void;
}

export function AgentCard({ 
  agent, 
  isPlayer = true, 
  compact = false,
  showCards = false,
  selectedCard,
  onCardClick 
}: AgentCardProps) {
  const hpPercent = (agent.currentHp / agent.maxHp) * 100;
  const expPercent = (agent.exp / agent.expToNext) * 100;
  
  if (compact) {
    return (
      <div className={cn(
        "bg-slate-800/80 rounded-lg p-3 border border-slate-600/50",
        "backdrop-blur-sm transition-all duration-300",
        agent.isDead && "opacity-50 grayscale"
      )}>
        <div className="flex items-center gap-3">
          <div className="text-3xl">{agent.avatar}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white truncate">{agent.name}</span>
              <span className="text-xs text-slate-400">Lv.{agent.level}</span>
            </div>
            <div className="mt-1">
              <Progress 
                value={hpPercent} 
                className="h-2 bg-slate-700"
              />
            </div>
            <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
              <span>HP: {agent.currentHp}/{agent.maxHp}</span>
              {agent.shield > 0 && (
                <span className="text-blue-400">护盾: {agent.shield}</span>
              )}
            </div>
          </div>
        </div>
        
        {showCards && agent.cards.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {agent.cards.slice(0, 5).map((card) => (
              <button
                key={card.id}
                onClick={() => onCardClick?.(card)}
                className={cn(
                  "px-2 py-1 rounded text-xs transition-all",
                  selectedCard?.id === card.id 
                    ? "bg-purple-600 ring-2 ring-purple-400" 
                    : "bg-slate-700 hover:bg-slate-600"
                )}
              >
                <span className="mr-1">{card.icon}</span>
                <span className="text-white">{card.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className={cn(
      "bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700/50",
      "backdrop-blur-sm transition-all duration-500",
      agent.isDead && "opacity-50 grayscale"
    )}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className={cn(
          "w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center text-4xl",
          "ring-2 ring-purple-500/50 transition-all duration-300",
          agent.isDead ? "grayscale" : "animate-pulse"
        )}>
          {agent.avatar}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">{agent.name}</h3>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="px-2 py-0.5 bg-purple-600/30 rounded text-purple-300">
              Lv.{agent.level}
            </span>
            <span>死亡: {agent.deathCount}次</span>
          </div>
        </div>
      </div>
      
      {/* HP Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-400">生命值</span>
          <span className="text-white font-mono">
            {agent.currentHp} / {agent.maxHp}
            {agent.shield > 0 && (
              <span className="text-blue-400 ml-2">+{agent.shield}</span>
            )}
          </span>
        </div>
        <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
            style={{ width: `${Math.max(0, hpPercent)}%` }}
          />
          {agent.shield > 0 && (
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
              style={{ width: `${Math.min(100, (agent.shield / agent.maxHp) * 100)}%`, opacity: 0.7 }}
            />
          )}
        </div>
      </div>
      
      {/* EXP Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-400">经验值</span>
          <span className="text-white font-mono">{agent.exp} / {agent.expToNext}</span>
        </div>
        <Progress value={expPercent} className="h-2 bg-slate-700" />
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-700/50 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-red-400">{agent.attack}</div>
          <div className="text-xs text-slate-400">攻击</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-blue-400">{agent.defense}</div>
          <div className="text-xs text-slate-400">防御</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-green-400">{agent.speed}</div>
          <div className="text-xs text-slate-400">速度</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-purple-400">{agent.cards.length}</div>
          <div className="text-xs text-slate-400">卡牌</div>
        </div>
      </div>
      
      {/* Buffs */}
      {agent.buffs.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-slate-400 mb-2">状态效果</div>
          <div className="flex flex-wrap gap-2">
            {agent.buffs.map((buff) => (
              <span 
                key={buff.id}
                className={cn(
                  "px-2 py-1 rounded text-xs",
                  buff.type.includes('_up') ? "bg-green-600/30 text-green-300" :
                  buff.type.includes('_down') ? "bg-red-600/30 text-red-300" :
                  "bg-blue-600/30 text-blue-300"
                )}
              >
                {buff.name} ({buff.duration}回合)
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Cards */}
      {showCards && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-400">手牌 ({agent.cards.length}/30)</span>
          </div>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {agent.cards.map((card) => (
              <button
                key={card.id}
                onClick={() => onCardClick?.(card)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm transition-all hover:scale-105",
                  RARITY_BORDER_COLORS[card.rarity],
                  "border-2 bg-slate-800/80",
                  selectedCard?.id === card.id && "ring-2 ring-purple-400 scale-105"
                )}
              >
                <span className="mr-1">{card.icon}</span>
                <span className="text-white">{card.name}</span>
                <span className="ml-2 text-xs text-slate-400">⚡{card.cost}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
