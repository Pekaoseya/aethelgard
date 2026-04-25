'use client';

import { useState } from 'react';
import { Card } from '@/types';
import { RARITY_COLORS, RARITY_BORDER_COLORS } from '@/lib/constants';
import { useGame } from '@/hooks/useGame';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function CardGachaModal() {
  const { state, replaceCard, autoReplaceCard, clearPendingCard } = useGame();
  const [showCard, setShowCard] = useState(false);
  const [selectedKeep, setSelectedKeep] = useState<string | null>(null);
  
  if (!state.showGachaModal || !state.pendingCardReward) return null;
  
  const newCard = state.pendingCardReward;
  
  const handleReveal = () => {
    setShowCard(true);
  };
  
  const handleReplace = () => {
    if (selectedKeep) {
      replaceCard(selectedKeep);
      setShowCard(false);
      setSelectedKeep(null);
    }
  };
  
  const handleAutoReplace = () => {
    autoReplaceCard();
    setShowCard(false);
    setSelectedKeep(null);
  };
  
  const handleSkip = () => {
    clearPendingCard();
    setShowCard(false);
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 max-w-2xl w-full mx-4 border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4 animate-bounce">🎴</div>
          <h2 className="text-2xl font-bold text-white">
            {showCard ? '获得新卡牌!' : '即将揭晓...'}
          </h2>
        </div>
        
        {/* Card reveal */}
        <div className="flex justify-center mb-8">
          {!showCard ? (
            <div 
              className="w-48 h-64 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 
                         flex items-center justify-center cursor-pointer
                         hover:scale-105 transition-transform duration-300"
              onClick={handleReveal}
            >
              <div className="text-6xl animate-pulse">❓</div>
            </div>
          ) : (
            <div className="relative">
              {/* Glow effect */}
              <div 
                className="absolute inset-0 rounded-xl blur-xl opacity-50"
                style={{ backgroundColor: RARITY_COLORS[newCard.rarity] }}
              />
              
              {/* Card */}
              <div 
                className={cn(
                  "relative w-48 h-64 rounded-xl overflow-hidden",
                  "bg-gradient-to-br shadow-xl",
                  newCard.type === 'attack' ? 'from-red-700 to-red-900' :
                  newCard.type === 'defense' ? 'from-blue-700 to-blue-900' :
                  newCard.type === 'skill' ? 'from-green-700 to-green-900' :
                  newCard.type === 'buff' ? 'from-yellow-700 to-yellow-900' :
                  'from-purple-700 to-purple-900'
                )}
              >
                {/* Rarity border */}
                <div 
                  className="absolute inset-0 rounded-xl border-4"
                  style={{ borderColor: RARITY_COLORS[newCard.rarity] }}
                />
                
                {/* Content */}
                <div className="relative h-full flex flex-col items-center justify-center p-4 text-center">
                  {/* Rarity label */}
                  <div 
                    className="absolute top-2 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ 
                      backgroundColor: RARITY_COLORS[newCard.rarity],
                      color: '#fff'
                    }}
                  >
                    {newCard.rarity.toUpperCase()}
                  </div>
                  
                  {/* Icon */}
                  <div className="text-6xl mb-4">{newCard.icon}</div>
                  
                  {/* Name */}
                  <div className="text-xl font-bold text-white mb-2">{newCard.name}</div>
                  
                  {/* Type */}
                  <div className="text-sm text-white/70 mb-4">{newCard.type}</div>
                  
                  {/* Cost */}
                  <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                    <span className="text-yellow-400 font-bold">{newCard.cost}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Description */}
        {showCard && (
          <div className="text-center mb-8">
            <div className="text-white/80 mb-2">{newCard.description}</div>
            {state.agent.cards.length >= 30 && (
              <div className="text-yellow-400 text-sm">
                你的卡组已满(30/30)! 请选择一张卡牌替换
              </div>
            )}
          </div>
        )}
        
        {/* Card selection for replacement */}
        {showCard && state.agent.cards.length >= 30 && (
          <div className="mb-8">
            <div className="text-sm text-slate-400 mb-3 text-center">选择要替换的卡牌:</div>
            <div className="flex flex-wrap gap-2 justify-center max-h-32 overflow-y-auto">
              {state.agent.cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => setSelectedKeep(card.id)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm transition-all",
                    RARITY_BORDER_COLORS[card.rarity],
                    "border-2 bg-slate-800/80",
                    selectedKeep === card.id 
                      ? "ring-2 ring-yellow-400" 
                      : "hover:scale-105"
                  )}
                >
                  <span>{card.icon}</span>
                  <span className="ml-1 text-white">{card.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-4 justify-center">
          {showCard ? (
            <>
              <Button
                variant="outline"
                onClick={handleSkip}
                className="px-6"
              >
                跳过
              </Button>
              <Button
                variant="outline"
                onClick={handleAutoReplace}
                className="px-6"
              >
                随机替换
              </Button>
              {state.agent.cards.length >= 30 && selectedKeep ? (
                <Button
                  onClick={handleReplace}
                  className="px-6 bg-purple-600 hover:bg-purple-700"
                >
                  确认替换
                </Button>
              ) : (
                <Button
                  onClick={handleSkip}
                  className="px-6 bg-green-600 hover:bg-green-700"
                >
                  收入囊中!
                </Button>
              )}
            </>
          ) : (
            <Button
              onClick={handleReveal}
              className="px-8 py-6 text-lg bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700"
            >
              🎴 点击揭示卡牌
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
