'use client';

import { useGame } from '@/hooks/useGame';
import { cn } from '@/lib/utils';

export function TabNavigation() {
  const { state, setTab } = useGame();
  
  return (
    <nav className="bg-gradient-to-r from-slate-900 via-purple-900/30 to-slate-900 border-b border-purple-500/30 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-1">
          {/* 试炼之塔 - 唯一入口 */}
          <button
            onClick={() => setTab('tower')}
            className={cn(
              "relative px-6 py-4 font-medium transition-all",
              "hover:text-white",
              state.selectedTab === 'tower'
                ? "text-white"
                : "text-slate-400"
            )}
          >
            <span className="flex items-center gap-2">
              <span className="text-2xl">🏰</span>
              <span className="text-lg">试炼之塔</span>
              <span className="text-sm text-slate-500">观战台</span>
            </span>
            
            {/* Active indicator */}
            {state.selectedTab === 'tower' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-purple-400 rounded-t-full" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
