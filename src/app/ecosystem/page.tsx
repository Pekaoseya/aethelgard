'use client';

import { useState, useEffect, useCallback } from 'react';

interface Agent {
  id: string;
  name: string;
  emoji: string;
  personality: string;
  defect: string;
  status: string;
  pos: { x: number; y: number };
  floor: number;
  hp: number;
  maxHp: number;
  [key: string]: unknown;
}

interface Monster {
  id: string;
  x: number;
  y: number;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
}

interface Chest {
  id: string;
  x: number;
  y: number;
  opened: boolean;
}

interface Floor {
  floor: number;
  name: string;
  size: number;
  maze: string[];
  monsters: Monster[];
  chests: Chest[];
  agents: {
    id: string;
    name: string;
    emoji: string;
    pos: { x: number; y: number };
    hp: number;
    maxHp: number;
    status: string;
  }[];
}

interface EcosystemStatus {
  success: boolean;
  tick: number;
  agents: { [key: string]: Agent };
  floors: Floor[];
  eventCount: number;
}

interface Event {
  id: number;
  timestamp: string;
  type: string;
  agent: string;
  agentId: string;
  agentEmoji: string;
  message: string;
  details: Record<string, unknown>;
}

const EVENT_COLORS: Record<string, string> = {
  combat: 'border-red-500 bg-red-500/10',
  friendly_fire: 'border-amber-500 bg-amber-500/10',
  defect: 'border-amber-500 bg-amber-500/10',
  kill: 'border-green-500 bg-green-500/10',
  chest: 'border-yellow-500 bg-yellow-500/10',
  collision: 'border-purple-500 bg-purple-500/10',
  gathering: 'border-pink-500 bg-pink-500/10',
  floor_cleared: 'border-cyan-500 bg-cyan-500/10',
  thinking: 'border-blue-500 bg-blue-500/10',
  system: 'border-slate-500 bg-slate-500/10',
};

const CELL_RENDER: Record<string, string> = {
  '🧱': '🧱',
  '🚪': '🚪',
  '👹': '👹',
  '📦': '📦',
  '·': '·',
  'wall': '🧱',
  'exit': '🚪',
  'monster': '👹',
  'chest': '📦',
  'empty': '·',
};

export default function EcosystemPage() {
  const [status, setStatus] = useState<EcosystemStatus | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [tickSpeed, setTickSpeed] = useState(500);
  const [tickCount, setTickCount] = useState(0);
  const [runTime, setRunTime] = useState(0);
  const [latestEventId, setLatestEventId] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [autoTickInterval, setAutoTickInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/ecosystem/status');
      const data: EcosystemStatus = await res.json();
      setStatus(data);
      setTickCount(data.tick);
    } catch (e) {
      console.error('Failed to fetch status:', e);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/ecosystem/events?since=${latestEventId}`);
      const data = await res.json();
      if (data.events?.length > 0) {
        setLatestEventId(data.latestId);
        setEvents(prev => [...data.events.reverse(), ...prev].slice(0, 50));
      }
    } catch (e) {
      console.error('Failed to fetch events:', e);
    }
  }, [latestEventId]);

  const singleTick = useCallback(async () => {
    try {
      const res = await fetch('/api/ecosystem/tick', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTickCount(data.tick);
        if (!startTime) setStartTime(Date.now());
      }
    } catch (e) {
      console.error('Failed to tick:', e);
    }
  }, [startTime]);

  const startAuto = useCallback(() => {
    if (autoTickInterval) clearInterval(autoTickInterval);
    const interval = setInterval(async () => {
      await singleTick();
      await fetchEvents();
    }, tickSpeed);
    setAutoTickInterval(interval);
    setIsRunning(true);
  }, [autoTickInterval, singleTick, fetchEvents, tickSpeed]);

  const stopAuto = useCallback(() => {
    if (autoTickInterval) {
      clearInterval(autoTickInterval);
      setAutoTickInterval(null);
    }
    setIsRunning(false);
  }, [autoTickInterval]);

  const speedUp = useCallback(() => {
    setTickSpeed(prev => Math.max(100, prev - 100));
  }, []);

  const reset = useCallback(() => {
    stopAuto();
    window.location.reload();
  }, [stopAuto]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (startTime) {
        setRunTime(Math.floor((Date.now() - startTime) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  useEffect(() => {
    if (isRunning && autoTickInterval) {
      stopAuto();
      startAuto();
    }
  }, [tickSpeed]);

  const renderMap = (floor: Floor) => {
    const grid: string[][] = [];
    for (let y = 0; y < floor.size; y++) {
      grid[y] = [];
      for (let x = 0; x < floor.size; x++) {
        const mazeRow = floor.maze[y] || '';
        const cell = mazeRow[x] || '·';
        grid[y][x] = cell;
      }
    }

    // 叠加Agent
    floor.agents.forEach(agent => {
      if (agent.pos.y < grid.length && agent.pos.x < grid[0].length) {
        grid[agent.pos.y][agent.pos.x] = agent.emoji;
      }
    });

    return grid.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => (
          <span key={x} className="w-6 h-6 flex items-center justify-center text-sm">
            {CELL_RENDER[cell] || cell}
          </span>
        ))}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🏰 艾瑟雅大陆 - Agent生态圈
          </h1>
          <p className="text-slate-400">
            6个独特Agent的有趣互动：抢怪、误伤、碰撞、围观...
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          {!isRunning ? (
            <button
              onClick={startAuto}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
            >
              🚀 自动运行
            </button>
          ) : (
            <button
              onClick={stopAuto}
              className="px-6 py-2.5 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition"
            >
              ⏸️ 暂停
            </button>
          )}
          <button
            onClick={singleTick}
            className="px-6 py-2.5 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition"
          >
            ▶️ 单步
          </button>
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-500 transition"
          >
            🔄 重置
          </button>
          <button
            onClick={speedUp}
            className="px-6 py-2.5 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition"
          >
            ⚡ 加速
          </button>
        </div>

        {/* Stats */}
        <div className="text-center text-slate-400 mb-8">
          Tick: <span className="text-purple-400 font-mono">{tickCount}</span>
          {' | '}
          运行时间: <span className="text-purple-400 font-mono">{runTime}s</span>
          {' | '}
          速度: <span className="text-purple-400 font-mono">{tickSpeed}ms/tick</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Agents + Maps */}
          <div className="lg:col-span-2 space-y-6">
            {/* Agent Cards */}
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                👥 Agent家族
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {status?.agents && Object.values(status.agents).map(agent => (
                  <div
                    key={agent.id}
                    className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{agent.emoji}</span>
                      <div>
                        <div className="font-semibold text-white">{agent.name}</div>
                        <div className="text-xs text-slate-400">
                          📍第{agent.floor}层 | {agent.status === 'dead' ? '💀' : '🟢'}{agent.status}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-amber-400 mb-2">
                      ⚠️ {agent.defect}
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-400 h-1.5 rounded-full transition-all"
                        style={{ width: `${(agent.hp / agent.maxHp) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 mt-4 text-xs text-slate-500 justify-center">
                <span>🧱 墙</span>
                <span>👹 怪物</span>
                <span>📦 宝箱</span>
                <span>🚪 出口</span>
                <span>· 空地</span>
              </div>
            </div>

            {/* Maps */}
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                🗺️ 生态圈地图
              </h2>
              {status?.floors && status.floors.length > 0 ? (
                <div className="space-y-6">
                  {status.floors.map(floor => (
                    <div key={floor.floor}>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-purple-300">
                          第{floor.floor}层 - {floor.name}
                        </h3>
                        <div className="flex gap-3 text-sm">
                          <span className="text-red-400">👹 {floor.monsters.length}</span>
                          <span className="text-yellow-400">📦 {floor.chests.filter(c => !c.opened).length}</span>
                        </div>
                      </div>
                      <div className="bg-black/30 rounded-xl p-4 overflow-x-auto">
                        <div className="font-mono text-sm leading-relaxed whitespace-pre">
                          {renderMap(floor)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-500 py-8">
                  等待初始化...
                </div>
              )}
            </div>
          </div>

          {/* Right: Events */}
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50 h-fit max-h-[800px]">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              📜 实时事件
            </h2>
            <div className="space-y-2 overflow-y-auto max-h-[700px] pr-2">
              {events.map(event => (
                <div
                  key={event.id}
                  className={`rounded-lg p-3 border-l-4 ${EVENT_COLORS[event.type] || EVENT_COLORS.system}`}
                >
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                    <span className="uppercase">{event.type}</span>
                    <span>{event.agentEmoji}{event.agent}</span>
                  </div>
                  <div className="text-sm text-slate-300">
                    {event.message}
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  暂无事件...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
