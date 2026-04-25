'use client';

import { useState, useEffect, useCallback } from 'react';
import { TOWER_FLOORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Swords, Shield, Zap, MapPin, Layers, Skull, Star } from 'lucide-react';

// 迷宫格子类型映射
const CELL_ICONS: Record<string, string> = {
  empty: '',
  wall: '🧱',
  player: '🤖',
  monster: '👾',
  boss: '👹',
  other_agent: '⚔️',
  exit: '🚪',
  chest: '📦',
  start: '🏠',
};

const CELL_COLORS: Record<string, string> = {
  empty: 'bg-slate-700/30',
  wall: 'bg-slate-900',
  player: 'bg-purple-500 ring-2 ring-purple-300',
  monster: 'bg-orange-600/70',
  boss: 'bg-red-800/80 animate-pulse',
  other_agent: 'bg-cyan-600/70',
  exit: 'bg-green-600/70',
  chest: 'bg-yellow-600/70',
  start: 'bg-blue-600/50',
};

// 迷宫中的Agent状态
interface MazeAgentState {
  username: string;
  currentFloor: number;
  mazeX: number;
  mazeY: number;
  currentEvent?: string;
  battleId?: string;
}

// 楼层战斗信息
interface FloorBattleInfo {
  id: string;
  floor: number;
  attacker: string;
  defender: string;
  attackerHp: number;
  defenderHp: number;
  result?: string;
  timestamp: number;
}

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

interface TowerViewProps {
  myAgent: MyAgent | null;
}

export function TowerView({ myAgent }: TowerViewProps) {
  const [agentStates, setAgentStates] = useState<MazeAgentState[]>([]);
  const [floorMaze, setFloorMaze] = useState<any[][] | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [fullAgentData, setFullAgentData] = useState<Record<string, any>>({});
  
  // 获取所有Agent的迷宫状态（从maze API获取在迷宫中移动的，从register API获取已注册但未进入迷宫的）
  const fetchAgentStates = useCallback(async () => {
    try {
      // 同时获取两个API的数据
      const [mazeRes, regRes] = await Promise.all([
        fetch('/api/maze'),
        fetch('/api/agent/register'),
      ]);
      
      const mazeData = await mazeRes.json();
      const regData = await regRes.json();
      
      // 合并数据
      if (mazeData.success && mazeData.agentStates) {
        setAgentStates(mazeData.agentStates);
      } else if (regData.success && regData.agents) {
        // 如果maze没有数据，用注册表数据
        const agents = regData.agents.map((a: any) => ({
          username: a.username,
          currentFloor: a.currentFloor,
          mazeX: 0,
          mazeY: 0,
          currentEvent: null,
          battleId: null,
        }));
        setAgentStates(agents);
      }

      // 获取完整Agent数据
      if (regData.success && regData.agents) {
        const agentMap: Record<string, any> = {};
        regData.agents.forEach((a: any) => {
          agentMap[a.username] = a;
        });
        setFullAgentData(agentMap);
      }
    } catch (error) {
      console.error('获取Agent状态失败:', error);
    }
  }, []);
  
  // 获取指定楼层的迷宫
  const fetchFloorMaze = useCallback(async (floor: number) => {
    try {
      const res = await fetch(`/api/maze?floor=${floor}`);
      const data = await res.json();
      if (data.success) {
        setFloorMaze(data.maze);
      }
    } catch (error) {
      console.error('获取迷宫失败:', error);
    }
  }, []);
  
  // 初始化和刷新
  useEffect(() => {
    fetchAgentStates();
    fetchFloorMaze(selectedFloor);
    
    const interval = setInterval(() => {
      fetchAgentStates();
      fetchFloorMaze(selectedFloor);
      setLastUpdate(new Date());
    }, 2000);
    
    return () => clearInterval(interval);
  }, [fetchAgentStates, fetchFloorMaze, selectedFloor]);
  
  // 获取某层所有Agent
  const agentsOnFloor = agentStates.filter(a => a.currentFloor === selectedFloor);
  
  // 获取该层正在战斗的Agent
  const agentsInBattle = agentsOnFloor.filter(a => a.battleId);
  
  // 统计
  const totalAgents = agentStates.length;
  const inBattleCount = agentStates.filter(a => a.battleId).length;
  const floorsOccupied = new Set(agentStates.map(a => a.currentFloor)).size;
  
  // 获取楼层事件统计
  const getFloorStats = (floor: number) => {
    const agents = agentStates.filter(a => a.currentFloor === floor);
    const inBattle = agents.filter(a => a.battleId).length;
    return { agentCount: agents.length, inBattle };
  };

  // 获取我的Agent数据
  const getMyAgentFullData = () => {
    if (!myAgent) return null;
    return fullAgentData[myAgent.username] || myAgent;
  };

  const myAgentFull = getMyAgentFullData();
  const hpPercent = myAgentFull ? (myAgentFull.currentHp / myAgentFull.maxHp) * 100 : 0;
  const expPercent = myAgentFull ? ((myAgentFull.exp % 100) / 100) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* 顶部统计栏 */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900/50 to-slate-900 rounded-xl p-4 border border-purple-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🏰</span> 艾瑟雅大陆 - 试炼之塔
            </h2>
            <p className="text-sm text-slate-400">观战模式 · Agent自主探险中 · {lastUpdate.toLocaleTimeString()}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{totalAgents}</div>
              <div className="text-xs text-slate-400">在线Agent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{inBattleCount}</div>
              <div className="text-xs text-slate-400">正在战斗</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{floorsOccupied}</div>
              <div className="text-xs text-slate-400">探索楼层</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-4">
        {/* 左侧：楼层网格总览 */}
        <div className="col-span-3 space-y-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <h3 className="text-sm font-bold text-white mb-3">📊 楼层总览 (1-50)</h3>
            <div className="grid grid-cols-10 gap-1">
              {TOWER_FLOORS.slice(0, 50).map((floor) => {
                const stats = getFloorStats(floor.floor);
                const hasAgents = stats.agentCount > 0;
                const hasBattle = stats.inBattle > 0;
                const isMyFloor = myAgentFull?.currentFloor === floor.floor;
                
                return (
                  <button
                    key={floor.floor}
                    onClick={() => setSelectedFloor(floor.floor)}
                    className={cn(
                      "aspect-square rounded text-[10px] font-bold transition-all relative",
                      selectedFloor === floor.floor && "ring-2 ring-purple-400",
                      isMyFloor && "ring-2 ring-yellow-400",
                      !hasAgents && !isMyFloor && "bg-slate-800/50 text-slate-600",
                      hasAgents && !hasBattle && !isMyFloor && "bg-blue-600/70 text-white hover:bg-blue-600",
                      hasBattle && "bg-red-600/70 text-white animate-pulse"
                    )}
                  >
                    {floor.floor}
                    {hasAgents && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full text-white text-[8px] flex items-center justify-center">
                        {stats.agentCount}
                      </span>
                    )}
                    {isMyFloor && !hasAgents && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
            
            <h3 className="text-sm font-bold text-white mb-3 mt-4">📊 楼层总览 (51-100)</h3>
            <div className="flex flex-wrap gap-1">
              {TOWER_FLOORS.slice(50).map((floor) => {
                const stats = getFloorStats(floor.floor);
                const hasAgents = stats.agentCount > 0;
                const isMyFloor = myAgentFull?.currentFloor === floor.floor;
                
                return (
                  <button
                    key={floor.floor}
                    onClick={() => setSelectedFloor(floor.floor)}
                    className={cn(
                      "w-6 h-6 rounded text-[9px] font-bold transition-all relative",
                      selectedFloor === floor.floor && "ring-2 ring-purple-400",
                      isMyFloor && "ring-2 ring-yellow-400",
                      !hasAgents && !isMyFloor && "bg-slate-800/50 text-slate-600",
                      hasAgents && !isMyFloor && "bg-blue-600/70 text-white"
                    )}
                  >
                    {floor.floor}
                    {isMyFloor && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* 图例 */}
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-slate-800/50" />
                <span className="text-slate-500">无人</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-blue-600/70" />
                <span className="text-slate-300">探索中</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-red-600/70 animate-pulse" />
                <span className="text-slate-300">战斗中</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-yellow-400" />
                <span className="text-slate-300">我的</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 中间：楼层迷宫详情 */}
        <div className="col-span-5 space-y-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  第{selectedFloor}层 · {TOWER_FLOORS[selectedFloor - 1]?.name}
                </h3>
                <p className="text-sm text-slate-400">
                  {selectedFloor % 10 === 0 ? '👹 Boss层' : '⚔️ 普通层'} · 
                  {agentsOnFloor.length} 个Agent在此探索
                </p>
              </div>
              {myAgentFull?.currentFloor === selectedFloor && (
                <Button 
                  size="sm" 
                  className="bg-yellow-600 hover:bg-yellow-500 text-white"
                  onClick={() => setSelectedFloor(myAgentFull.currentFloor)}
                >
                  追踪我的Agent
                </Button>
              )}
            </div>
            
            {/* 迷宫显示 */}
            {floorMaze ? (
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="grid gap-1" style={{ 
                  gridTemplateColumns: `repeat(${floorMaze[0]?.length || 7}, minmax(0, 1fr))` 
                }}>
                  {floorMaze.map((row: any[], y: number) =>
                    row.map((cell: any, x: number) => {
                      // 检查该位置是否有Agent
                      const agentHere = agentsOnFloor.find(a => a.mazeX === x && a.mazeY === y);
                      // 只有有真实Agent时才显示player，否则用原始格子类型
                      const displayType = agentHere ? 'player' : cell.type;
                      // 如果格子是player类型但没有真实Agent，不显示任何内容
                      const showContent = displayType !== 'player' || agentHere;
                      
                      // Boss特殊样式
                      const isBoss = cell.type === 'boss';
                      
                      return (
                        <div
                          key={`${x}-${y}`}
                          className={cn(
                            "aspect-square rounded flex items-center justify-center transition-all relative",
                            cell.type === 'player' && !agentHere 
                              ? 'bg-slate-700/30'  // 无Agent时用空格子背景
                              : CELL_COLORS[displayType] || 'bg-slate-700/30',
                            isBoss && "ring-2 ring-red-500",
                            cell.type === 'wall' && "cursor-not-allowed",
                            cell.type !== 'wall' && cell.type !== 'player' && "cursor-pointer hover:ring-2 hover:ring-white/30"
                          )}
                          title={
                            cell.type === 'monster' 
                              ? `${cell.content} Lv.${cell.level} HP:${cell.hp}`
                              : cell.type === 'boss'
                              ? `BOSS: ${cell.content} Lv.${cell.level} HP:${cell.hp}`
                              : cell.type === 'other_agent'
                              ? `其他Agent: ${cell.agentInfo?.nickname || '未知'} Lv.${cell.level}`
                              : cell.type === 'chest'
                              ? `${cell.rarity === 'legendary' ? '传说' : cell.rarity === 'epic' ? '史诗' : cell.rarity === 'rare' ? '稀有' : '普通'}宝箱`
                              : cell.type === 'exit'
                              ? '出口 - 通往下一层'
                              : cell.type === 'start'
                              ? '起点'
                              : ''
                          }
                        >
                          {agentHere ? (
                            <div className="relative flex flex-col items-center">
                              <img 
                                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${agentHere.username}`} 
                                alt={agentHere.username}
                                className={cn(
                                  "w-8 h-8 rounded-full bg-slate-700",
                                  agentHere.username === myAgent?.username && "ring-2 ring-yellow-400"
                                )}
                              />
                              {agentHere.battleId && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                              )}
                            </div>
                          ) : cell.type === 'boss' ? (
                            <div className="flex flex-col items-center">
                              <span className="text-2xl">👹</span>
                              <span className="text-[8px] text-red-300 font-bold">BOSS</span>
                            </div>
                          ) : cell.type === 'monster' ? (
                            <div className="flex flex-col items-center">
                              <span className="text-lg">👾</span>
                              <span className="text-[8px] text-orange-300">Lv.{cell.level}</span>
                            </div>
                          ) : cell.type === 'other_agent' ? (
                            <div className="flex flex-col items-center">
                              <span className="text-lg">⚔️</span>
                              <span className="text-[8px] text-cyan-300 truncate max-w-full">
                                {cell.agentInfo?.nickname?.slice(0, 4) || 'Agent'}
                              </span>
                            </div>
                          ) : (
                            cell.type !== 'player' ? CELL_ICONS[displayType] : ''
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                
                {/* 迷宫图例 */}
                <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <span className="text-lg">🤖</span>
                    <span>Agent</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-orange-500">👾</span> 小怪
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-red-500">👹</span> Boss
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-cyan-500">⚔️</span> 其他Agent
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">📦</span> 宝箱
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-green-500">🚪</span> 出口
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🧱</span> 墙壁
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                加载中...
              </div>
            )}
          </div>
          
          {/* 该层Agent列表 */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <h3 className="text-sm font-bold text-white mb-3">📍 该层Agent</h3>
            {agentsOnFloor.length === 0 ? (
              <div className="text-center py-4 text-slate-500">
                该层暂无Agent
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {agentsOnFloor.map((agent) => (
                  <div
                    key={agent.username}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg transition-all",
                      agent.battleId ? "bg-red-900/30 border border-red-500/50" : "bg-slate-700/50",
                      agent.username === myAgent?.username && "border border-yellow-500/50"
                    )}
                  >
                    <img 
                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=${agent.username}`} 
                      alt={agent.username}
                      className={cn(
                        "w-8 h-8 rounded-full bg-slate-700",
                        agent.username === myAgent?.username && "ring-2 ring-yellow-400"
                      )}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">
                          {agent.username}
                          {agent.username === myAgent?.username && (
                            <span className="ml-2 text-xs text-yellow-400">(我)</span>
                          )}
                        </span>
                        {agent.battleId && (
                          <span className="px-2 py-0.5 bg-red-600/50 rounded text-xs text-red-200 animate-pulse">
                            ⚔️ 战斗中
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        位置: ({agent.mazeX}, {agent.mazeY})
                        {agent.currentEvent && ` · ${agent.currentEvent}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* 右侧：动态与排行 */}
        <div className="col-span-4 space-y-4">
          {/* 我的Agent详情 - 优先显示 */}
          {myAgentFull && (
            <Card className="bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 border-yellow-500/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-yellow-400 flex items-center gap-2 text-lg">
                    <img src={myAgentFull.avatar} alt="" className="w-8 h-8 rounded-full border-2 border-yellow-500" />
                    {myAgentFull.username}
                  </CardTitle>
                  <div className="text-xs text-yellow-400/70 flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    我的Agent
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 楼层 & 状态 */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-400" />
                    <span className="text-white font-bold">第{myAgentFull.currentFloor}层</span>
                    {fullAgentData[myAgentFull.username]?.status === 'in_battle' && (
                      <span className="px-2 py-0.5 bg-red-600/50 rounded text-xs text-red-200 animate-pulse ml-2">
                        ⚔️ 战斗中
                      </span>
                    )}
                  </div>
                  <div className="text-yellow-400 flex items-center gap-1">
                    <Layers className="w-4 h-4" />
                    Lv.{myAgentFull.level}
                  </div>
                </div>

                {/* HP条 */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1 text-red-400">
                      <Heart className="w-3 h-3" /> HP
                    </span>
                    <span className="text-white">{myAgentFull.currentHp} / {myAgentFull.maxHp}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all"
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>
                </div>

                {/* 盾牌条 */}
                {myAgentFull.shield > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-1 text-blue-400">
                        <Shield className="w-3 h-3" /> 护盾
                      </span>
                      <span className="text-white">{myAgentFull.shield}</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                        style={{ width: `${Math.min((myAgentFull.shield / myAgentFull.maxHp) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 经验条 */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1 text-purple-400">
                      <Star className="w-3 h-3" /> 经验
                    </span>
                    <span className="text-white">{myAgentFull.exp % 100} / 100</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 transition-all"
                      style={{ width: `${expPercent}%` }}
                    />
                  </div>
                </div>

                {/* 属性 */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex flex-col items-center p-2 bg-slate-800/50 rounded-lg">
                    <Swords className="w-4 h-4 text-orange-400 mb-1" />
                    <span className="text-white font-bold">{myAgentFull.attack}</span>
                    <span className="text-[10px] text-slate-400">攻击</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-slate-800/50 rounded-lg">
                    <Shield className="w-4 h-4 text-blue-400 mb-1" />
                    <span className="text-white font-bold">{myAgentFull.defense}</span>
                    <span className="text-[10px] text-slate-400">防御</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-slate-800/50 rounded-lg">
                    <Zap className="w-4 h-4 text-yellow-400 mb-1" />
                    <span className="text-white font-bold">{myAgentFull.speed}</span>
                    <span className="text-[10px] text-slate-400">速度</span>
                  </div>
                </div>

                {/* 统计 */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-700">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Star className="w-3 h-3 text-purple-400" /> 最高: F{myAgentFull.highestFloor}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Layers className="w-3 h-3 text-blue-400" /> 卡牌: {myAgentFull.cardCount}/30
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Skull className="w-3 h-3 text-red-400" /> 死亡: {myAgentFull.deathCount}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* 实时动态 */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <h3 className="text-sm font-bold text-white mb-3">⚡ 实时动态</h3>
            <ScrollArea className="h-48">
              <div className="space-y-2 text-sm">
                {agentStates.slice(0, 10).map((agent, i) => (
                  <div key={`${agent.username}-${i}`} className="flex items-center gap-2 text-slate-300">
                    <img 
                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=${agent.username}`} 
                      alt={agent.username}
                      className={cn(
                        "w-6 h-6 rounded-full bg-slate-700",
                        agent.username === myAgent?.username && "ring-2 ring-yellow-400"
                      )}
                    />
                    <span className={cn("truncate max-w-[100px]", agent.username === myAgent?.username && "text-yellow-400")}>
                      {agent.username}
                    </span>
                    <span className="text-slate-500">F{agent.currentFloor}</span>
                    {agent.battleId ? (
                      <span className="text-red-400 ml-auto">⚔️</span>
                    ) : agent.currentEvent ? (
                      <span className="text-yellow-400 ml-auto">📍</span>
                    ) : (
                      <span className="text-green-400 ml-auto">🔍</span>
                    )}
                  </div>
                ))}
                {agentStates.length === 0 && (
                  <div className="text-center text-slate-500 py-4">
                    暂无动态
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          
          {/* 楼层排名 */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <h3 className="text-sm font-bold text-white mb-3">🏆 楼层进度榜</h3>
            <div className="space-y-2">
              {[...new Map(agentStates.map(a => [a.currentFloor, a])).values()]
                .sort((a, b) => b.currentFloor - a.currentFloor)
                .slice(0, 5)
                .map((agent, i) => (
                  <div key={`${agent.username}-rank-${i}`} className="flex items-center gap-2">
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      i === 0 && "bg-yellow-500/50 text-yellow-200",
                      i === 1 && "bg-slate-400/50 text-slate-200",
                      i === 2 && "bg-orange-600/50 text-orange-200",
                      i > 2 && "bg-slate-700/50 text-slate-400"
                    )}>
                      {i + 1}
                    </span>
                    <img 
                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=${agent.username}`} 
                      alt={agent.username}
                      className={cn(
                        "w-6 h-6 rounded-full bg-slate-700 shrink-0",
                        agent.username === myAgent?.username && "ring-2 ring-yellow-400"
                      )}
                    />
                    <span className={cn("text-slate-300 truncate", agent.username === myAgent?.username && "text-yellow-400")}>
                      {agent.username}
                    </span>
                    <span className="text-purple-400 ml-auto shrink-0">F{agent.currentFloor}</span>
                  </div>
                ))}
              {agentStates.length === 0 && (
                <div className="text-center text-slate-500 py-2">
                  暂无排名数据
                </div>
              )}
            </div>
          </div>
          
          {/* Boss层提示 */}
          {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].includes(selectedFloor) && (
            <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 rounded-xl p-4 border border-red-500/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">👹</span>
                <span className="text-red-400 font-bold">BOSS层警告</span>
              </div>
              <p className="text-sm text-slate-300">
                第{selectedFloor}层有Boss守卫！击败Boss可获得传说卡牌奖励！
              </p>
              <div className="mt-2 text-xs text-slate-400">
                当前层Agent: {agentsOnFloor.length}人
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
