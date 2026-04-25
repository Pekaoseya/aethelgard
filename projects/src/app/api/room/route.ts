import { NextRequest, NextResponse } from 'next/server';
import { BattleRoom, RoomMember, RoomStatus } from '@/types';

// 内存存储（生产环境应使用数据库）
const rooms = new Map<string, BattleRoom>();

// 生成唯一ID
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 清理过期房间（超过30分钟未开始的）
function cleanupExpiredRooms() {
  const now = Date.now();
  for (const [id, room] of rooms.entries()) {
    if (room.status === 'waiting' || room.status === 'matching') {
      const createdAt = new Date(room.createdAt).getTime();
      if (now - createdAt > 30 * 60 * 1000) {
        rooms.delete(id);
      }
    }
  }
}

// GET - 获取房间列表或特定房间
export async function GET(request: NextRequest) {
  cleanupExpiredRooms();
  
  const searchParams = request.nextUrl.searchParams;
  const roomId = searchParams.get('roomId');
  const floor = searchParams.get('floor');
  const status = searchParams.get('status');
  
  if (roomId) {
    const room = rooms.get(roomId);
    if (!room) {
      return NextResponse.json({ success: false, error: '房间不存在' }, { status: 404 });
    }
    return NextResponse.json({ success: true, room });
  }
  
  // 获取可用的房间列表
  let roomList = Array.from(rooms.values())
    .filter(r => r.status === 'waiting' || r.status === 'matching')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  if (floor) {
    roomList = roomList.filter(r => r.floor === parseInt(floor));
  }
  if (status) {
    roomList = roomList.filter(r => r.status === status);
  }
  
  return NextResponse.json({ success: true, rooms: roomList });
}

// POST - 创建房间或执行房间操作
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;
    
    switch (action) {
      case 'create': {
        // 创建新房间
        const { username, nickname, avatar, level, currentFloor, roomName, maxMembers, allowAlly, allowCardExchange } = data;
        
        if (!username || !nickname) {
          return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
        }
        
        const roomId = generateId('room');
        const room: BattleRoom = {
          id: roomId,
          roomName: roomName || `${nickname}的房间`,
          floor: currentFloor || 1,
          hostUsername: username,
          members: [{
            username,
            nickname,
            avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
            level: level || 1,
            currentFloor,
            status: 'online',
            isReady: true,
            isAlly: false,
          }],
          status: 'waiting',
          maxMembers: maxMembers || 4,
          createdAt: new Date().toISOString(),
          battleConfig: {
            allowAlly: allowAlly !== false,
            allowCardExchange: allowCardExchange !== false,
            maxAllies: 2,
          },
        };
        
        rooms.set(roomId, room);
        return NextResponse.json({ success: true, room });
      }
      
      case 'join': {
        // 加入房间
        const { roomId, username, nickname, avatar, level, currentFloor } = data;
        
        const room = rooms.get(roomId);
        if (!room) {
          return NextResponse.json({ success: false, error: '房间不存在' }, { status: 404 });
        }
        
        if (room.status !== 'waiting' && room.status !== 'matching') {
          return NextResponse.json({ success: false, error: '房间已开始或已结束' }, { status: 400 });
        }
        
        if (room.members.length >= room.maxMembers) {
          return NextResponse.json({ success: false, error: '房间已满' }, { status: 400 });
        }
        
        // 检查是否已在房间中
        const existing = room.members.find(m => m.username === username);
        if (existing) {
          existing.status = 'online';
          return NextResponse.json({ success: true, room });
        }
        
        // 添加新成员
        const member: RoomMember = {
          username,
          nickname,
          avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
          level: level || 1,
          currentFloor,
          status: 'online',
          isReady: false,
          isAlly: false,
        };
        
        room.members.push(member);
        return NextResponse.json({ success: true, room });
      }
      
      case 'leave': {
        // 离开房间
        const { roomId, username } = data;
        
        const room = rooms.get(roomId);
        if (!room) {
          return NextResponse.json({ success: false, error: '房间不存在' }, { status: 404 });
        }
        
        const memberIndex = room.members.findIndex(m => m.username === username);
        if (memberIndex === -1) {
          return NextResponse.json({ success: false, error: '不在该房间中' }, { status: 400 });
        }
        
        room.members.splice(memberIndex, 1);
        
        // 如果房主离开，将房主转移给第一个成员
        if (room.hostUsername === username) {
          if (room.members.length > 0) {
            room.hostUsername = room.members[0].username;
          } else {
            rooms.delete(roomId);
            return NextResponse.json({ success: true, message: '房间已解散' });
          }
        }
        
        // 如果房间空了或状态不是waiting，也删除
        if (room.members.length === 0 || room.status !== 'waiting') {
          rooms.delete(roomId);
          return NextResponse.json({ success: true, message: '房间已解散' });
        }
        
        return NextResponse.json({ success: true, room });
      }
      
      case 'ready': {
        // 准备/取消准备
        const { roomId, username, ready } = data;
        
        const room = rooms.get(roomId);
        if (!room) {
          return NextResponse.json({ success: false, error: '房间不存在' }, { status: 404 });
        }
        
        const member = room.members.find(m => m.username === username);
        if (!member) {
          return NextResponse.json({ success: false, error: '不在该房间中' }, { status: 400 });
        }
        
        member.isReady = ready;
        
        // 如果所有人都准备好了，开始战斗
        if (room.members.length >= 2 && room.members.every(m => m.isReady)) {
          room.status = 'ready';
        } else {
          room.status = 'waiting';
        }
        
        return NextResponse.json({ success: true, room });
      }
      
      case 'start': {
        // 开始战斗（房主操作）
        const { roomId, username } = data;
        
        const room = rooms.get(roomId);
        if (!room) {
          return NextResponse.json({ success: false, error: '房间不存在' }, { status: 404 });
        }
        
        if (room.hostUsername !== username) {
          return NextResponse.json({ success: false, error: '只有房主可以开始战斗' }, { status: 403 });
        }
        
        if (room.members.length < 2) {
          return NextResponse.json({ success: false, error: '至少需要2人才能开始战斗' }, { status: 400 });
        }
        
        if (!room.members.every(m => m.isReady)) {
          return NextResponse.json({ success: false, error: '还有成员未准备' }, { status: 400 });
        }
        
        room.status = 'in_battle';
        return NextResponse.json({ success: true, room });
      }
      
      case 'match': {
        // 自动匹配：在当前楼层附近寻找或创建房间
        const { username, nickname, avatar, level, currentFloor, maxMembers } = data;
        
        if (!username || !nickname) {
          return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
        }
        
        cleanupExpiredRooms();
        
        // 在同一层或相邻层寻找可加入的房间
        const targetFloor = currentFloor || 1;
        const nearbyRooms = Array.from(rooms.values())
          .filter(r => 
            r.status === 'waiting' && 
            r.members.length < (maxMembers || 4) &&
            Math.abs(r.floor - targetFloor) <= 5
          );
        
        if (nearbyRooms.length > 0) {
          // 加入第一个可用的房间
          const room = nearbyRooms[0];
          const member: RoomMember = {
            username,
            nickname,
            avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
            level: level || 1,
            currentFloor,
            status: 'online',
            isReady: false,
            isAlly: false,
          };
          room.members.push(member);
          room.status = 'matching';
          return NextResponse.json({ success: true, room, matched: true });
        }
        
        // 没有找到房间，创建一个新房间
        const roomId = generateId('room');
        const room: BattleRoom = {
          id: roomId,
          roomName: `第${targetFloor}层匹配房间`,
          floor: targetFloor,
          hostUsername: username,
          members: [{
            username,
            nickname,
            avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
            level: level || 1,
            currentFloor,
            status: 'online',
            isReady: true,
            isAlly: false,
          }],
          status: 'waiting',
          maxMembers: maxMembers || 4,
          createdAt: new Date().toISOString(),
          battleConfig: {
            allowAlly: true,
            allowCardExchange: true,
            maxAllies: 2,
          },
        };
        
        rooms.set(roomId, room);
        return NextResponse.json({ success: true, room, matched: false });
      }
      
      default:
        return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Room API error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
