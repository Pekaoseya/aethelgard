'use client';

import { Card } from '@/types';
import { RARITY_COLORS, RARITY_BORDER_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface BattleCardProps {
  card: Card;
  isSelected?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const CARD_TYPE_COLORS: Record<string, string> = {
  attack: 'from-red-600/80 to-red-800/80',
  defense: 'from-blue-600/80 to-blue-800/80',
  skill: 'from-green-600/80 to-green-800/80',
  buff: 'from-yellow-600/80 to-yellow-800/80',
  debuff: 'from-purple-600/80 to-purple-800/80',
};

const CARD_TYPE_ICONS: Record<string, string> = {
  attack: '⚔️',
  defense: '🛡️',
  skill: '✨',
  buff: '💪',
  debuff: '💀',
};

export function BattleCard({ 
  card, 
  isSelected = false, 
  isDisabled = false,
  onClick,
  size = 'md'
}: BattleCardProps) {
  const sizeClasses = {
    sm: 'w-20 h-28 text-xs',
    md: 'w-28 h-40 text-sm',
    lg: 'w-36 h-52 text-base',
  };
  
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "relative rounded-xl transition-all duration-300",
        "bg-gradient-to-br shadow-lg",
        CARD_TYPE_COLORS[card.type],
        sizeClasses[size],
        isSelected 
          ? "ring-4 ring-yellow-400 scale-110 z-10" 
          : "hover:scale-105 hover:z-5",
        isDisabled && "opacity-50 cursor-not-allowed",
        !isDisabled && "cursor-pointer",
        RARITY_BORDER_COLORS[card.rarity],
        "border-2"
      )}
      style={{
        boxShadow: isSelected 
          ? `0 0 20px ${RARITY_COLORS[card.rarity]}80`
          : `0 4px 12px rgba(0,0,0,0.3)`,
      }}
    >
      {/* Rarity indicator */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ backgroundColor: RARITY_COLORS[card.rarity] }}
      />
      
      {/* Cost */}
      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
        <span className="text-yellow-400 font-bold text-sm">{card.cost}</span>
      </div>
      
      {/* Content */}
      <div className="flex flex-col items-center justify-center h-full p-2">
        {/* Icon */}
        <div className={cn(
          "text-3xl mb-2 transition-transform",
          size === 'lg' && "text-4xl"
        )}>
          {card.icon}
        </div>
        
        {/* Name */}
        <div className="text-white font-bold text-center leading-tight mb-1">
          {card.name}
        </div>
        
        {/* Type */}
        <div className="text-xs text-white/70 mb-2">
          {CARD_TYPE_ICONS[card.type]} {card.type}
        </div>
        
        {/* Description */}
        <div className="text-xs text-white/80 text-center leading-tight px-1">
          {card.description}
        </div>
      </div>
      
      {/* Glow effect for legendary */}
      {card.rarity === 'legendary' && (
        <div className="absolute inset-0 rounded-xl animate-pulse bg-gradient-to-br from-purple-500/20 to-transparent pointer-events-none" />
      )}
    </button>
  );
}
