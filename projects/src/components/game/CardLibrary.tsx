'use client';

import { useState } from 'react';
import { Card, CardRarity } from '@/types';
import { RARITY_COLORS, RARITY_BORDER_COLORS, CARD_POOL } from '@/lib/constants';
import { useGame } from '@/hooks/useGame';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function CardLibrary() {
  const { state } = useGame();
  const [selectedRarity, setSelectedRarity] = useState<CardRarity | 'all'>('all');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  
  const filteredCards = selectedRarity === 'all' 
    ? CARD_POOL 
    : CARD_POOL.filter(c => c.rarity === selectedRarity);
  
  const rarityOrder: CardRarity[] = ['common', 'rare', 'epic', 'legendary'];
  
  const getCardCount = (cardId: string) => {
    return state.agent.cards.filter(c => c.name === cardId).length;
  };
  
  const isInDeck = (card: Card) => {
    return state.agent.cards.some(c => c.name === card.name);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>📚</span> 卡牌库
        </h2>
        <div className="text-slate-400">
          拥有: <span className="text-white font-bold">{state.agent.cards.length}</span> / 30
        </div>
      </div>
      
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedRarity('all')}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-all",
            selectedRarity === 'all'
              ? "bg-purple-600 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          )}
        >
          全部 ({CARD_POOL.length})
        </button>
        {rarityOrder.map((rarity) => (
          <button
            key={rarity}
            onClick={() => setSelectedRarity(rarity)}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
              selectedRarity === rarity
                ? "bg-purple-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            )}
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: RARITY_COLORS[rarity] }}
            />
            {rarity === 'common' && '普通'}
            {rarity === 'rare' && '稀有'}
            {rarity === 'epic' && '史诗'}
            {rarity === 'legendary' && '传说'}
            <span className="text-xs opacity-70">
              ({CARD_POOL.filter(c => c.rarity === rarity).length})
            </span>
          </button>
        ))}
      </div>
      
      {/* Card grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredCards.map((card) => {
          const count = getCardCount(card.name);
          const inDeck = isInDeck(card);
          
          return (
            <button
              key={card.id}
              onClick={() => setSelectedCard(card)}
              className={cn(
                "relative rounded-xl overflow-hidden transition-all hover:scale-105",
                "bg-gradient-to-br",
                card.type === 'attack' ? 'from-red-700/80 to-red-900/80' :
                card.type === 'defense' ? 'from-blue-700/80 to-blue-900/80' :
                card.type === 'skill' ? 'from-green-700/80 to-green-900/80' :
                card.type === 'buff' ? 'from-yellow-700/80 to-yellow-900/80' :
                'from-purple-700/80 to-purple-900/80',
                RARITY_BORDER_COLORS[card.rarity],
                "border-2"
              )}
            >
              {/* Count badge */}
              {count > 0 && (
                <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-xs font-bold text-white z-10">
                  x{count}
                </div>
              )}
              
              {/* In deck indicator */}
              {inDeck && (
                <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-green-500 z-10" />
              )}
              
              <div className="p-3 text-center">
                <div className="text-3xl mb-2">{card.icon}</div>
                <div className="text-xs font-bold text-white truncate">{card.name}</div>
                <div 
                  className="text-[10px] mt-1 px-1 py-0.5 rounded"
                  style={{ backgroundColor: RARITY_COLORS[card.rarity] + '40' }}
                >
                  {card.rarity}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Card detail modal */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="bg-slate-900 border-slate-700">
          {selectedCard && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-4xl">{selectedCard.icon}</span>
                  <span>{selectedCard.name}</span>
                  <span 
                    className="text-sm px-2 py-1 rounded"
                    style={{ backgroundColor: RARITY_COLORS[selectedCard.rarity] }}
                  >
                    {selectedCard.rarity}
                  </span>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-slate-400">类型</div>
                    <div className="text-lg font-bold text-white">{selectedCard.type}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-400">消耗</div>
                    <div className="text-lg font-bold text-yellow-400">⚡{selectedCard.cost}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-400">效果值</div>
                    <div className="text-lg font-bold text-purple-400">{selectedCard.effect.value}%</div>
                  </div>
                </div>
                
                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-2">效果描述</div>
                  <div className="text-white">{selectedCard.description}</div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">拥有数量:</span>
                  <span className="text-white font-bold">{getCardCount(selectedCard.name)}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
