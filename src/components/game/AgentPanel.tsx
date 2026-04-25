'use client';

import { Agent } from '@/types';
import { RARITY_COLORS } from '@/lib/constants';
import { useGame } from '@/hooks/useGame';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function AgentPanel() {
  const { state } = useGame();
  const agent = state.agent;
  
  const hpPercent = (agent.currentHp / agent.maxHp) * 100;
  const expPercent = (agent.exp / agent.expToNext) * 100;
  
  return (
    <div className="space-y-6">
      {/* Agent Card */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600/30 to-slate-700 flex items-center justify-center text-5xl ring-4 ring-purple-500/50">
              {agent.avatar}
            </div>
            <div className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-purple-600 text-white text-sm font-bold">
              Lv.{agent.level}
            </div>
          </div>
          
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white mb-2">{agent.name}</h2>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>死亡次数: {agent.deathCount}</span>
              <span>•</span>
              <span>卡牌: {agent.cards.length}/30</span>
            </div>
          </div>
        </div>
        
        {/* HP Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400 flex items-center gap-2">
              <span>❤️</span> 生命值
            </span>
            <span className="text-white font-mono">
              {agent.currentHp} / {agent.maxHp}
              {agent.shield > 0 && (
                <span className="text-blue-400 ml-2">(+{agent.shield} 护盾)</span>
              )}
            </span>
          </div>
          <div className="relative h-4 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
              style={{ width: `${Math.max(0, hpPercent)}%` }}
            />
            {agent.shield > 0 && (
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-400"
                style={{ 
                  width: `${Math.min(100, (agent.shield / agent.maxHp) * 100)}%`,
                  opacity: 0.8
                }}
              />
            )}
          </div>
        </div>
        
        {/* EXP Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400 flex items-center gap-2">
              <span>✨</span> 经验值
            </span>
            <span className="text-white font-mono">
              {agent.exp} / {agent.expToNext}
            </span>
          </div>
          <Progress value={expPercent} className="h-3 bg-slate-700" />
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 rounded-xl p-4 text-center border border-red-800/30">
            <div className="text-3xl mb-1">⚔️</div>
            <div className="text-2xl font-bold text-red-400">{agent.attack}</div>
            <div className="text-xs text-slate-400">攻击力</div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl p-4 text-center border border-blue-800/30">
            <div className="text-3xl mb-1">🛡️</div>
            <div className="text-2xl font-bold text-blue-400">{agent.defense}</div>
            <div className="text-xs text-slate-400">防御力</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl p-4 text-center border border-green-800/30">
            <div className="text-3xl mb-1">💨</div>
            <div className="text-2xl font-bold text-green-400">{agent.speed}</div>
            <div className="text-xs text-slate-400">速度</div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 rounded-xl p-4 text-center border border-yellow-800/30">
            <div className="text-3xl mb-1">🏆</div>
            <div className="text-2xl font-bold text-yellow-400">{state.highestFloor}</div>
            <div className="text-xs text-slate-400">最高层</div>
          </div>
        </div>
      </div>
      
      {/* Buffs Section */}
      {agent.buffs.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>✨</span> 状态效果
          </h3>
          <div className="flex flex-wrap gap-3">
            {agent.buffs.map((buff) => (
              <div 
                key={buff.id}
                className={cn(
                  "px-4 py-2 rounded-lg flex items-center gap-2",
                  buff.type.includes('_up') ? "bg-green-900/50 border border-green-700" :
                  buff.type.includes('_down') ? "bg-red-900/50 border border-red-700" :
                  "bg-blue-900/50 border border-blue-700"
                )}
              >
                <span className={cn(
                  "text-sm font-medium",
                  buff.type.includes('_up') ? "text-green-300" :
                  buff.type.includes('_down') ? "text-red-300" :
                  "text-blue-300"
                )}>
                  {buff.name}
                </span>
                <span className="text-xs text-slate-400">
                  {buff.duration}回合
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Cards Section */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📦</span> 卡牌组 ({agent.cards.length}/30)
        </h3>
        
        {agent.cards.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <div className="text-4xl mb-2">📭</div>
            <p>还没有卡牌，继续挑战获取！</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {agent.cards.map((card) => (
              <div
                key={card.id}
                className={cn(
                  "px-4 py-3 rounded-xl transition-all hover:scale-105 cursor-pointer",
                  "bg-gradient-to-br",
                  card.type === 'attack' ? 'from-red-900/50 to-red-800/50' :
                  card.type === 'defense' ? 'from-blue-900/50 to-blue-800/50' :
                  card.type === 'skill' ? 'from-green-900/50 to-green-800/50' :
                  card.type === 'buff' ? 'from-yellow-900/50 to-yellow-800/50' :
                  'from-purple-900/50 to-purple-800/50',
                  RARITY_COLORS[card.rarity],
                  "border-2"
                )}
                style={{ borderColor: RARITY_COLORS[card.rarity] + '80' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{card.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-white">{card.name}</div>
                    <div className="text-xs text-slate-400">
                      ⚡{card.cost}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Stats Summary */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📊</span> 战斗统计
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{state.totalWins}</div>
            <div className="text-sm text-slate-400">胜利场次</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{state.totalDeaths}</div>
            <div className="text-sm text-slate-400">死亡次数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{state.highestFloor}</div>
            <div className="text-sm text-slate-400">最高层数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{agent.level}</div>
            <div className="text-sm text-slate-400">当前等级</div>
          </div>
        </div>
      </div>
    </div>
  );
}
