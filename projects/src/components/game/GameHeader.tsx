'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, ChevronDown, LogOut, X, Heart, Swords, Shield, Zap, MapPin, Layers, Skull } from 'lucide-react';

interface TowerStats {
  totalAgents: number;
  floorsOccupied: number;
  highestFloor: number;
  inBattle: number;
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

export function GameHeader({ onAgentLogin }: { onAgentLogin?: (agent: MyAgent | null) => void }) {
  const [stats, setStats] = useState<TowerStats>({
    totalAgents: 0,
    floorsOccupied: 0,
    highestFloor: 1,
    inBattle: 0,
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // 我的Agent状态
  const [showMyPanel, setShowMyPanel] = useState(false);
  const [myAgent, setMyAgent] = useState<MyAgent | null>(null);
  const [loginInput, setLoginInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 加载已保存的Agent
  useEffect(() => {
    const savedUsername = localStorage.getItem('myAgentUsername');
    if (savedUsername) {
      setIsLoggingIn(true);
      fetch(`/api/agent/register?username=${encodeURIComponent(savedUsername)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.agent) {
            setMyAgent(data.agent);
            onAgentLogin?.(data.agent);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoggingIn(false));
    }
  }, [onAgentLogin]);

  // 从后端API获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/agent/register');
        const data = await res.json();
        
        if (data.success && data.agents) {
          const agents = data.agents;
          const floors = new Set(agents.map((a: any) => a.currentFloor));
          const maxFloor = Math.max(...agents.map((a: any) => a.highestFloor), 1);
          const inBattle = agents.filter((a: any) => a.status === 'in_battle').length;
          
          setStats({
            totalAgents: agents.length,
            floorsOccupied: floors.size,
            highestFloor: maxFloor,
            inBattle,
          });
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error('获取统计失败:', error);
      }
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  // 登录Agent
  const handleLogin = useCallback(async () => {
    if (!loginInput.trim()) return;
    
    setIsLoggingIn(true);
    try {
      const res = await fetch(`/api/agent/register?username=${encodeURIComponent(loginInput.trim())}`);
      const data = await res.json();
      
      if (data.success && data.agent) {
        setMyAgent(data.agent);
        localStorage.setItem('myAgentUsername', loginInput.trim());
        onAgentLogin?.(data.agent);
        setShowMyPanel(false);
      } else {
        alert(data.error || 'Agent不存在');
      }
    } catch (error) {
      console.error('登录失败:', error);
    }
    setIsLoggingIn(false);
  }, [loginInput, onAgentLogin]);

  // 登出
  const handleLogout = useCallback(() => {
    setMyAgent(null);
    localStorage.removeItem('myAgentUsername');
    onAgentLogin?.(null);
    setLoginInput('');
  }, [onAgentLogin]);

  // 刷新我的Agent
  const refreshMyAgent = useCallback(async () => {
    if (!myAgent) return;
    try {
      const res = await fetch(`/api/agent/register?username=${encodeURIComponent(myAgent.username)}`);
      const data = await res.json();
      if (data.success && data.agent) {
        setMyAgent(data.agent);
        onAgentLogin?.(data.agent);
      }
    } catch (error) {
      console.error('刷新失败:', error);
    }
  }, [myAgent, onAgentLogin]);

  // 定期刷新
  useEffect(() => {
    if (!myAgent) return;
    const interval = setInterval(refreshMyAgent, 2000);
    return () => clearInterval(interval);
  }, [myAgent, refreshMyAgent]);

  const hpPercent = myAgent ? (myAgent.currentHp / myAgent.maxHp) * 100 : 0;

  return (
    <>
      <header className="bg-gradient-to-r from-slate-900 via-purple-900/30 to-slate-900 border-b border-purple-500/30 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="text-3xl">⚔️</div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">艾瑟雅大陆</h1>
              <p className="text-xs text-slate-400">试炼之塔 · 观战模式</p>
            </div>
          </div>
          
          {/* 实时统计 */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <div className="text-center">
                <div className="text-xs text-slate-400">在线Agent</div>
                <div className="text-lg font-bold text-purple-400">
                  {stats.totalAgents}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xl">🏔️</span>
              <div className="text-center">
                <div className="text-xs text-slate-400">探索楼层</div>
                <div className="text-lg font-bold text-green-400">
                  {stats.floorsOccupied}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xl">⬆️</span>
              <div className="text-center">
                <div className="text-xs text-slate-400">最高层</div>
                <div className="text-lg font-bold text-yellow-400">
                  {stats.highestFloor}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xl">⚔️</span>
              <div className="text-center">
                <div className="text-xs text-slate-400">战斗中</div>
                <div className="text-lg font-bold text-red-400">
                  {stats.inBattle}
                </div>
              </div>
            </div>

            {/* 我的Agent按钮 */}
            <div className="relative">
              <Button
                onClick={() => setShowMyPanel(!showMyPanel)}
                variant={myAgent ? "default" : "outline"}
                className={cn(
                  "gap-2",
                  myAgent 
                    ? "bg-purple-600 hover:bg-purple-500" 
                    : "border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                )}
              >
                <User className="w-4 h-4" />
                {myAgent ? myAgent.username : '我的Agent'}
                <ChevronDown className={cn("w-4 h-4 transition-transform", showMyPanel && "rotate-180")} />
              </Button>
              
              {/* 下拉面板 */}
              {showMyPanel && (
                <div className="absolute right-0 top-full mt-2 w-80 z-50">
                  <Card className="bg-slate-900 border-purple-500/50 shadow-xl shadow-purple-500/20">
                    {myAgent ? (
                      <>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-purple-400 flex items-center gap-2">
                              <img src={myAgent.avatar} alt="" className="w-8 h-8 rounded-full border border-purple-500" />
                              {myAgent.username}
                            </CardTitle>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={handleLogout}
                              className="text-slate-400 hover:text-red-400"
                            >
                              <LogOut className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* HP条 */}
                          <div>
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                              <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-400" /> HP</span>
                              <span>{myAgent.currentHp} / {myAgent.maxHp}</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all"
                                style={{ width: `${hpPercent}%` }}
                              />
                            </div>
                          </div>

                          {/* 属性 */}
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-1 text-slate-300">
                              <Layers className="w-3 h-3 text-purple-400" /> Lv.{myAgent.level}
                            </div>
                            <div className="flex items-center gap-1 text-slate-300">
                              <MapPin className="w-3 h-3 text-green-400" /> F{myAgent.currentFloor}
                            </div>
                            <div className="flex items-center gap-1 text-slate-300">
                              <Swords className="w-3 h-3 text-orange-400" /> {myAgent.attack} ATK
                            </div>
                            <div className="flex items-center gap-1 text-slate-300">
                              <Shield className="w-3 h-3 text-blue-400" /> {myAgent.defense} DEF
                            </div>
                          </div>

                          {/* 卡牌 & 死亡 */}
                          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-700">
                            <span className="text-slate-400">卡牌: {myAgent.cardCount}/30</span>
                            <span className="flex items-center gap-1 text-slate-400">
                              <Skull className="w-3 h-3 text-red-400" /> 死亡: {myAgent.deathCount}
                            </span>
                            <span className="text-yellow-400">最高: F{myAgent.highestFloor}</span>
                          </div>
                        </CardContent>
                      </>
                    ) : (
                      <CardContent className="py-4">
                        <p className="text-sm text-slate-400 mb-3 text-center">输入Agent名称登录查看状态</p>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Agent名称..."
                            value={loginInput}
                            onChange={(e) => setLoginInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            className="bg-slate-800 border-purple-500/30 text-white"
                          />
                          <Button 
                            onClick={handleLogin}
                            disabled={isLoggingIn}
                            className="bg-purple-600 hover:bg-purple-500"
                          >
                            登录
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-500">
              更新: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </header>

      {/* 点击外部关闭面板 */}
      {showMyPanel && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMyPanel(false)}
        />
      )}
    </>
  );
}
