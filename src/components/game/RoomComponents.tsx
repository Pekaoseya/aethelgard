'use client';

import { useState, useEffect } from 'react';
import { BattleRoom, RoomMember } from '@/types';
import { useGame } from '@/hooks/useGame';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface RoomListProps {
  onJoinRoom: (room: BattleRoom) => void;
}

export function RoomList({ onJoinRoom }: RoomListProps) {
  const [rooms, setRooms] = useState<BattleRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const { state } = useGame();
  
  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/room?status=waiting');
      const data = await res.json();
      if (data.success) {
        setRooms(data.rooms);
      }
    } catch (error) {
      console.error('获取房间列表失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000); // 每5秒刷新
    return () => clearInterval(interval);
  }, []);
  
  if (loading) {
    return <div className="text-center text-slate-400 py-8">加载中...</div>;
  }
  
  if (rooms.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="text-4xl">🏰</div>
        <p className="text-slate-400">暂无可用房间</p>
        <p className="text-sm text-slate-500">成为第一个创建房间的人吧！</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {rooms.map((room) => (
        <div
          key={room.id}
          className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-purple-500/50 transition-colors cursor-pointer"
          onClick={() => onJoinRoom(room)}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white">{room.roomName}</h3>
              <p className="text-sm text-slate-400">第{room.floor}层 | {room.members.length}/{room.maxMembers}人</p>
            </div>
            <div className="flex -space-x-2">
              {room.members.slice(0, 3).map((member, idx) => (
                <Avatar key={idx} className="w-8 h-8 border-2 border-slate-800">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback>{member.nickname[0]}</AvatarFallback>
                </Avatar>
              ))}
              {room.members.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white">
                  +{room.members.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface RoomPanelProps {
  room: BattleRoom;
  onLeave: () => void;
  onStartBattle: () => void;
}

export function RoomPanel({ room, onLeave, onStartBattle }: RoomPanelProps) {
  const { state } = useGame();
  const [ready, setReady] = useState(false);
  const currentMember = room.members.find(m => m.username === state.agentWorld.username);
  const isHost = room.hostUsername === state.agentWorld.username;
  
  const handleReady = async () => {
    const newReady = !ready;
    setReady(newReady);
    
    await fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ready',
        roomId: room.id,
        username: state.agentWorld.username,
        ready: newReady,
      }),
    });
  };
  
  const allReady = room.members.length >= 2 && room.members.every(m => m.isReady);
  
  return (
    <div className="space-y-6">
      {/* 房间信息 */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-500/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">{room.roomName}</h2>
          <div className="text-sm text-slate-400">第{room.floor}层</div>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <span className={cn(
            "px-3 py-1 rounded-full",
            room.status === 'waiting' ? "bg-yellow-600/30 text-yellow-400" :
            room.status === 'ready' ? "bg-green-600/30 text-green-400" :
            "bg-slate-600/30 text-slate-400"
          )}>
            {room.status === 'waiting' ? '等待中' : room.status === 'ready' ? '准备就绪' : room.status}
          </span>
          <span className="text-slate-400">{room.members.length}/{room.maxMembers} 人</span>
          {room.battleConfig.allowAlly && <span className="text-blue-400">🤝 允许结盟</span>}
          {room.battleConfig.allowCardExchange && <span className="text-green-400">🔄 可交换卡牌</span>}
        </div>
      </div>
      
      {/* 成员列表 */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>👥</span> 房间成员
        </h3>
        
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {room.members.map((member) => (
              <div
                key={member.username}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border",
                  member.username === state.agentWorld.username
                    ? "bg-purple-900/30 border-purple-500/50"
                    : "bg-slate-800/50 border-slate-700"
                )}
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback>{member.nickname[0]}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{member.nickname}</span>
                    {member.username === room.hostUsername && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-600/50 text-yellow-300 rounded">房主</span>
                    )}
                    {member.username === state.agentWorld.username && (
                      <span className="px-2 py-0.5 text-xs bg-purple-600/50 text-purple-300 rounded">你</span>
                    )}
                  </div>
                  <div className="text-sm text-slate-400">
                    Lv.{member.level} | 第{member.currentFloor}层
                  </div>
                </div>
                
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  member.isReady ? "bg-green-600 text-white" : "bg-slate-700 text-slate-400"
                )}>
                  {member.isReady ? '✓' : '○'}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      
      {/* 操作按钮 */}
      <div className="flex gap-3">
        {!isHost && (
          <Button
            onClick={handleReady}
            className={cn(
              "flex-1",
              ready
                ? "bg-green-600 hover:bg-green-700"
                : "bg-slate-700 hover:bg-slate-600"
            )}
          >
            {ready ? '✓ 已准备' : '准备'}
          </Button>
        )}
        
        {isHost && (
          <Button
            onClick={onStartBattle}
            disabled={!allReady}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50"
          >
            {allReady ? '🎮 开始战斗' : `等待其他人准备 (${room.members.filter(m => m.isReady).length}/${room.members.length})`}
          </Button>
        )}
        
        <Button
          onClick={onLeave}
          variant="outline"
          className="border-red-500/50 text-red-400 hover:bg-red-900/20"
        >
          离开房间
        </Button>
      </div>
      
      {/* 提示信息 */}
      <div className="text-sm text-slate-500 text-center">
        {isHost ? '你是房主，可以开始战斗' : '等待房主开始战斗...'}
      </div>
    </div>
  );
}

interface CreateRoomModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (room: BattleRoom) => void;
}

export function CreateRoomModal({ open, onClose, onCreated }: CreateRoomModalProps) {
  const { state } = useGame();
  const [roomName, setRoomName] = useState('');
  const [maxMembers, setMaxMembers] = useState(4);
  const [allowAlly, setAllowAlly] = useState(true);
  const [allowCardExchange, setAllowCardExchange] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          username: state.agentWorld.username,
          nickname: state.agentWorld.nickname,
          avatar: state.agentWorld.avatarUrl,
          level: state.agent.level,
          currentFloor: state.currentFloor,
          roomName: roomName || `${state.agentWorld.nickname}的房间`,
          maxMembers,
          allowAlly,
          allowCardExchange,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        onCreated(data.room);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('创建房间失败:', error);
      alert('创建房间失败');
    } finally {
      setLoading(false);
    }
  };
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>🏰</span> 创建房间
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">房间名称</label>
            <Input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder={`${state.agentWorld.nickname || '游客'}的房间`}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          
          <div>
            <label className="text-sm text-slate-400 mb-2 block">最大人数: {maxMembers}</label>
            <input
              type="range"
              min={2}
              max={8}
              value={maxMembers}
              onChange={(e) => setMaxMembers(parseInt(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowAlly}
                onChange={(e) => setAllowAlly(e.target.checked)}
                className="w-5 h-5 accent-purple-500"
              />
              <span className="text-white">🤝 允许结盟</span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowCardExchange}
                onChange={(e) => setAllowCardExchange(e.target.checked)}
                className="w-5 h-5 accent-purple-500"
              />
              <span className="text-white">🔄 允许卡牌交换</span>
            </label>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
          >
            {loading ? '创建中...' : '创建房间'}
          </Button>
          <Button onClick={onClose} variant="outline">
            取消
          </Button>
        </div>
      </div>
    </div>
  );
}
