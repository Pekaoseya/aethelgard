import type * as Party from "partykit/server";

/**
 * 智障探险队 - RPG 游戏服务器
 * 
 * Agent 通过 WebSocket 连接，加入游戏世界
 */

// ============== 类型定义 ==============

export interface Position {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  name: string;
  character: string;        // 角色类型: repeater, carper, saint, hallucinator, sycophant, prophet
  position: Position;
  hp: number;
  maxHp: number;
  gold: number;
  inventory: string[];
  emotion: string;          // 情绪状态
  chaos: number;           // 混沌值
  connectedAt: number;
}

export interface GameState {
  players: Map<string, Player>;
  map: TileType[][];
  npcs: NPC[];
  items: Item[];
  floor: number;
  maxFloors: number;
}

export interface TileType {
  type: 'grass' | 'wall' | 'path' | 'water' | 'door';
  passable: boolean;
}

export interface NPC {
  id: string;
  name: string;
  position: Position;
  dialogue: string[];
  isHostile: boolean;
}

export interface Item {
  id: string;
  name: string;
  type: 'gold' | 'potion' | 'weapon' | 'armor';
  position: Position;
  value: number;
  collectedBy?: string;
}

// ============== 消息类型 ==============

export type ClientMessage = 
  | { type: 'join'; payload: { name: string; character: string } }
  | { type: 'move'; payload: { direction: 'up' | 'down' | 'left' | 'right' } }
  | { type: 'interact'; payload: { targetId?: string } }
  | { type: 'use_item'; payload: { itemId: string } }
  | { type: 'say'; payload: { message: string } }
  | { type: 'ping' };

export type ServerMessage = 
  | { type: 'welcome'; payload: { playerId: string; state: SerializedGameState } }
  | { type: 'player_joined'; payload: Player }
  | { type: 'player_left'; payload: { playerId: string } }
  | { type: 'player_moved'; payload: { playerId: string; position: Position } }
  | { type: 'player_action'; payload: { playerId: string; action: string; result: string } }
  | { type: 'item_collected'; payload: { playerId: string; itemId: string; itemName: string } }
  | { type: 'npc_spotted'; payload: { playerId: string; npcId: string } }
  | { type: 'npc_talked'; payload: { playerId: string; npcId: string; dialogue: string } }
  | { type: 'floor_changed'; payload: { floor: number; state: SerializedGameState } }
  | { type: 'error'; payload: { message: string } }
  | { type: 'pong' };

export interface SerializedGameState {
  players: Player[];
  map: TileType[][];
  npcs: NPC[];
  items: Item[];
  floor: number;
}

// ============== 游戏服务器 ==============

export default class RPGServer implements Party.Server {
  private gameState: GameState;
  private readonly MAP_WIDTH = 30;
  private readonly MAP_HEIGHT = 20;
  private readonly MAX_FLOORS = 5;

  constructor(readonly room: Party.Room) {
    this.gameState = this.initializeGame();
  }

  // ============== 初始化 ==============

  private initializeGame(): GameState {
    return {
      players: new Map(),
      map: this.generateMap(1),
      npcs: this.generateNPCs(),
      items: this.generateItems(),
      floor: 1,
      maxFloors: this.MAX_FLOORS
    };
  }

  private generateMap(floor: number): TileType[][] {
    const map: TileType[][] = [];
    
    // 生成基础地图（草地为主，有墙壁边界）
    for (let y = 0; y < this.MAP_HEIGHT; y++) {
      map[y] = [];
      for (let x = 0; x < this.MAP_WIDTH; x++) {
        // 边界是墙
        if (x === 0 || x === this.MAP_WIDTH - 1 || y === 0 || y === this.MAP_HEIGHT - 1) {
          map[y][x] = { type: 'wall', passable: false };
        }
        // 随机生成一些障碍物
        else if (Math.random() < 0.15) {
          map[y][x] = { type: 'wall', passable: false };
        }
        // 随机生成路径
        else if (Math.random() < 0.1) {
          map[y][x] = { type: 'path', passable: true };
        }
        // 随机生成水
        else if (Math.random() < 0.05) {
          map[y][x] = { type: 'water', passable: false };
        }
        // 默认草地
        else {
          map[y][x] = { type: 'grass', passable: true };
        }
      }
    }

    // 确保有通往楼梯的位置
    // 入口（左上角）
    map[1][1] = { type: 'path', passable: true };
    // 出口（右下角）
    map[this.MAP_HEIGHT - 2][this.MAP_WIDTH - 2] = { type: 'path', passable: true };

    return map;
  }

  private generateNPCs(): NPC[] {
    const npcTypes = [
      { name: '智慧的向导', dialogue: ['欢迎来到智障探险队的世界！', '小心那些看起来很傻的队友...'] },
      { name: '神秘的商人', dialogue: ['要买点什么吗？', '这个价值连城！'] },
      { name: '迷路的旅人', dialogue: ['我迷路了...', '你能帮帮我吗？'] },
      { name: '疯狂的科学家', dialogue: ['实验！实验！', '这是我的最新发明！'] },
      { name: '沉睡的巨人', dialogue: ['*呼噜声*', 'Zzz...'] }
    ];

    const npcs: NPC[] = [];
    const count = 3 + Math.floor(Math.random() * 3); // 3-5 个 NPC

    for (let i = 0; i < count; i++) {
      const npc = npcTypes[i % npcTypes.length];
      let x: number, y: number;
      
      // 找到有效位置
      do {
        x = 2 + Math.floor(Math.random() * (this.MAP_WIDTH - 4));
        y = 2 + Math.floor(Math.random() * (this.MAP_HEIGHT - 4));
      } while (!this.gameState.map[y][x].passable);

      npcs.push({
        id: `npc_${i}_${Date.now()}`,
        name: npc.name,
        position: { x, y },
        dialogue: npc.dialogue,
        isHostile: Math.random() < 0.2
      });
    }

    return npcs;
  }

  private generateItems(): Item[] {
    const items: Item[] = [];

    // 生成金币
    for (let i = 0; i < 10; i++) {
      let x: number, y: number;
      do {
        x = 2 + Math.floor(Math.random() * (this.MAP_WIDTH - 4));
        y = 2 + Math.floor(Math.random() * (this.MAP_HEIGHT - 4));
      } while (!this.gameState.map[y][x].passable);

      items.push({
        id: `gold_${i}`,
        name: '金币',
        type: 'gold',
        position: { x, y },
        value: 10 + Math.floor(Math.random() * 40)
      });
    }

    // 生成药水
    for (let i = 0; i < 5; i++) {
      let x: number, y: number;
      do {
        x = 2 + Math.floor(Math.random() * (this.MAP_WIDTH - 4));
        y = 2 + Math.floor(Math.random() * (this.MAP_HEIGHT - 4));
      } while (!this.gameState.map[y][x].passable);

      items.push({
        id: `potion_${i}`,
        name: '治疗药水',
        type: 'potion',
        position: { x, y },
        value: 30
      });
    }

    return items;
  }

  // ============== 连接处理 ==============

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(`[${this.room.id}] 连接: ${conn.id}`);
    conn.send(JSON.stringify({ type: 'connected', payload: { message: '连接到智障探险队服务器' } }));
  }

  async onClose(conn: Party.Connection) {
    console.log(`[${this.room.id}] 断开: ${conn.id}`);
    const player = this.gameState.players.get(conn.id);
    if (player) {
      this.gameState.players.delete(conn.id);
      this.room.broadcast(JSON.stringify({
        type: 'player_left',
        payload: { playerId: conn.id }
      }));
    }
  }

  async onMessage(message: string, sender: Party.Connection) {
    try {
      const msg: ClientMessage = JSON.parse(message);
      
      switch (msg.type) {
        case 'join':
          this.handleJoin(sender, msg.payload);
          break;
        case 'move':
          this.handleMove(sender, msg.payload.direction);
          break;
        case 'interact':
          this.handleInteract(sender, msg.payload.targetId);
          break;
        case 'use_item':
          this.handleUseItem(sender, msg.payload.itemId);
          break;
        case 'say':
          this.handleSay(sender, msg.payload.message);
          break;
        case 'ping':
          sender.send(JSON.stringify({ type: 'pong' }));
          break;
        default:
          sender.send(JSON.stringify({ 
            type: 'error', 
            payload: { message: `未知消息类型: ${msg.type}` } 
          }));
      }
    } catch (e) {
      console.error('消息解析错误:', e);
      sender.send(JSON.stringify({ 
        type: 'error', 
        payload: { message: '消息格式错误' } 
      }));
    }
  }

  // ============== 消息处理 ==============

  private handleJoin(conn: Party.Connection, payload: { name: string; character: string }) {
    console.log(`[${this.room.id}] ${payload.name} (${payload.character}) 加入游戏`);

    // 找到有效出生点
    let spawnX = 2, spawnY = 2;
    for (let y = 1; y < this.MAP_HEIGHT - 1; y++) {
      for (let x = 1; x < this.MAP_WIDTH - 1; x++) {
        if (this.gameState.map[y][x].passable) {
          spawnX = x;
          spawnY = y;
          break;
        }
      }
    }

    const player: Player = {
      id: conn.id,
      name: payload.name,
      character: payload.character,
      position: { x: spawnX, y: spawnY },
      hp: 100,
      maxHp: 100,
      gold: 0,
      inventory: [],
      emotion: 'happy',
      chaos: Math.floor(Math.random() * 30),
      connectedAt: Date.now()
    };

    this.gameState.players.set(conn.id, player);

    // 发送欢迎消息（包含完整状态）
    conn.send(JSON.stringify({
      type: 'welcome',
      payload: {
        playerId: conn.id,
        state: this.serializeState()
      }
    } satisfies ServerMessage));

    // 广播玩家加入
    this.room.broadcast(JSON.stringify({
      type: 'player_joined',
      payload: player
    } satisfies ServerMessage), [conn.id]);
  }

  private handleMove(conn: Party.Connection, direction: 'up' | 'down' | 'left' | 'right') {
    const player = this.gameState.players.get(conn.id);
    if (!player) return;

    const { position } = player;
    let newX = position.x;
    let newY = position.y;

    switch (direction) {
      case 'up': newY--; break;
      case 'down': newY++; break;
      case 'left': newX--; break;
      case 'right': newX++; break;
    }

    // 检查碰撞
    if (newX >= 0 && newX < this.MAP_WIDTH && newY >= 0 && newY < this.MAP_HEIGHT) {
      const tile = this.gameState.map[newY][newX];
      
      if (tile.passable) {
        // 混沌效果：有一定概率随机移动
        if (Math.random() * 100 < player.chaos) {
          const directions = ['up', 'down', 'left', 'right'] as const;
          const randomDir = directions[Math.floor(Math.random() * 4)];
          this.handleMove(conn, randomDir);
          return;
        }

        player.position = { x: newX, y: newY };
        
        // 广播移动
        this.room.broadcast(JSON.stringify({
          type: 'player_moved',
          payload: { playerId: conn.id, position: player.position }
        } satisfies ServerMessage));

        // 检查物品拾取
        this.checkItemPickup(player);
        
        // 检查 NPC 互动
        this.checkNPCProximity(player);
        
        // 检查楼梯（下楼）
        this.checkStairs(player);
      }
    }
  }

  private handleInteract(conn: Party.Connection, targetId?: string) {
    const player = this.gameState.players.get(conn.id);
    if (!player) return;

    // 与 NPC 对话
    const nearbyNPC = this.findNearbyNPC(player);
    if (nearbyNPC) {
      const dialogue = nearbyNPC.dialogue[Math.floor(Math.random() * nearbyNPC.dialogue.length)];
      
      this.room.broadcast(JSON.stringify({
        type: 'npc_talked',
        payload: { playerId: conn.id, npcId: nearbyNPC.id, dialogue }
      } satisfies ServerMessage));
    }
  }

  private handleUseItem(conn: Party.Connection, itemId: string) {
    const player = this.gameState.players.get(conn.id);
    if (!player) return;

    const itemIndex = player.inventory.indexOf(itemId);
    if (itemIndex === -1) {
      conn.send(JSON.stringify({
        type: 'error',
        payload: { message: '物品不存在' }
      }));
      return;
    }

    player.inventory.splice(itemIndex, 1);
    
    if (itemId.startsWith('potion')) {
      player.hp = Math.min(player.maxHp, player.hp + 30);
    }

    conn.send(JSON.stringify({
      type: 'player_action',
      payload: { playerId: conn.id, action: 'use_item', result: '使用了物品' }
    }));
  }

  private handleSay(conn: Party.Connection, message: string) {
    const player = this.gameState.players.get(conn.id);
    if (!player) return;

    // 混沌效果：随机改变消息
    if (Math.random() * 100 < player.chaos) {
      const chaoticMessages = ['...', '嘿嘿嘿！', '???', '咕噜咕噜', '我是谁我在哪'];
      message = chaoticMessages[Math.floor(Math.random() * chaoticMessages.length)];
    }

    this.room.broadcast(JSON.stringify({
      type: 'player_action',
      payload: { playerId: conn.id, action: 'say', result: message }
    }));
  }

  // ============== 游戏逻辑 ==============

  private checkItemPickup(player: Player) {
    for (const item of this.gameState.items) {
      if (item.collectedBy) continue;
      
      if (item.position.x === player.position.x && item.position.y === player.position.y) {
        item.collectedBy = player.id;
        
        if (item.type === 'gold') {
          player.gold += item.value;
        } else {
          player.inventory.push(item.id);
        }

        this.room.broadcast(JSON.stringify({
          type: 'item_collected',
          payload: { playerId: player.id, itemId: item.id, itemName: item.name }
        }));
      }
    }
  }

  private checkNPCProximity(player: Player) {
    const nearbyNPC = this.findNearbyNPC(player);
    if (nearbyNPC) {
      this.room.broadcast(JSON.stringify({
        type: 'npc_spotted',
        payload: { playerId: player.id, npcId: nearbyNPC.id }
      }));
    }
  }

  private findNearbyNPC(player: Player): NPC | null {
    const range = 1;
    for (const npc of this.gameState.npcs) {
      if (Math.abs(npc.position.x - player.position.x) <= range &&
          Math.abs(npc.position.y - player.position.y) <= range) {
        return npc;
      }
    }
    return null;
  }

  private checkStairs(player: Player) {
    // 右下角是楼梯
    if (player.position.x === this.MAP_WIDTH - 2 && player.position.y === this.MAP_HEIGHT - 2) {
      if (this.gameState.floor < this.gameState.maxFloors) {
        this.gameState.floor++;
        this.gameState.map = this.generateMap(this.gameState.floor);
        this.gameState.items = this.generateItems();
        
        // 重置玩家位置到左上角
        player.position = { x: 2, y: 2 };

        this.room.broadcast(JSON.stringify({
          type: 'floor_changed',
          payload: { floor: this.gameState.floor, state: this.serializeState() }
        }));
      }
    }
  }

  // ============== 序列化 ==============

  private serializeState(): SerializedGameState {
    return {
      players: Array.from(this.gameState.players.values()),
      map: this.gameState.map,
      npcs: this.gameState.npcs,
      items: this.gameState.items,
      floor: this.gameState.floor
    };
  }
}

RPGServer satisfies Party.Worker;
