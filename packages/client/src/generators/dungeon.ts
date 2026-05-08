/**
 * 程序化地牢/迷宫生成器
 * 使用 BSP (Binary Space Partitioning) + 房间连接算法
 */

export interface Room {
    x: number;
    y: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
}

export interface DungeonConfig {
    width: number;       // 地图宽度（格子）
    height: number;      // 地图高度（格子）
    roomMinSize: number; // 最小房间尺寸
    roomMaxSize: number; // 最大房间尺寸
    maxRooms: number;    // 最大房间数
    seed?: number;       // 随机种子
}

export interface TileType {
    id: number;
    name: string;
    walkable: boolean;
    damage?: number;
}

// 默认瓦片类型
export const TILE_TYPES: Record<string, TileType> = {
    VOID: { id: 0, name: '虚空', walkable: false },
    FLOOR: { id: 1, name: '地板', walkable: true },
    WALL: { id: 2, name: '墙壁', walkable: false },
    DOOR: { id: 3, name: '门', walkable: true },
    CHEST: { id: 4, name: '宝箱', walkable: true },
    STAIRS_DOWN: { id: 5, name: '下楼', walkable: true },
    STAIRS_UP: { id: 6, name: '上楼', walkable: true },
    TRAP: { id: 7, name: '陷阱', walkable: true, damage: 10 },
    WATER: { id: 8, name: '水', walkable: true },
    LAVA: { id: 9, name: '岩浆', walkable: false },
    SPAWNER: { id: 10, name: '敌人出生点', walkable: true },
};

export class DungeonGenerator {
    private config: DungeonConfig;
    private rooms: Room[] = [];
    private map: number[][] = [];
    private rng: () => number;

    constructor(config: Partial<DungeonConfig> = {}) {
        this.config = {
            width: config.width || 80,
            height: config.height || 60,
            roomMinSize: config.roomMinSize || 6,
            roomMaxSize: config.roomMaxSize || 15,
            maxRooms: config.maxRooms || 30,
            seed: config.seed,
        };

        // 简单的随机数生成器（带种子）
        this.rng = this.createRNG(this.config.seed);
    }

    private createRNG(seed?: number): () => number {
        let s = seed ?? Date.now();
        return () => {
            s = (s * 1103515245 + 12345) & 0x7fffffff;
            return s / 0x7fffffff;
        };
    }

    /**
     * 生成地牢
     */
    generate(): { map: number[][], rooms: Room[], width: number, height: number } {
        // 初始化地图（全部填充墙壁）
        this.map = Array(this.config.height)
            .fill(null)
            .map(() => Array(this.config.width).fill(TILE_TYPES.WALL.id));

        this.rooms = [];

        // 生成房间
        this.generateRooms();

        // 连接房间
        this.connectRooms();

        // 添加特殊元素
        this.addSpecialElements();

        return {
            map: this.map,
            rooms: this.rooms,
            width: this.config.width,
            height: this.config.height,
        };
    }

    /**
     * 生成随机房间
     */
    private generateRooms(): void {
        for (let i = 0; i < this.config.maxRooms * 3; i++) {
            if (this.rooms.length >= this.config.maxRooms) break;

            const room = this.createRoom();
            if (this.canPlaceRoom(room)) {
                this.placeRoom(room);
                this.rooms.push(room);
            }
        }
    }

    private createRoom(): Room {
        const width = Math.floor(
            this.rng() * (this.config.roomMaxSize - this.config.roomMinSize + 1) +
            this.config.roomMinSize
        );
        const height = Math.floor(
            this.rng() * (this.config.roomMaxSize - this.config.roomMinSize + 1) +
            this.config.roomMinSize
        );
        const x = Math.floor(this.rng() * (this.config.width - width - 2)) + 1;
        const y = Math.floor(this.rng() * (this.config.height - height - 2)) + 1;

        return {
            x,
            y,
            width,
            height,
            centerX: Math.floor(x + width / 2),
            centerY: Math.floor(y + height / 2),
        };
    }

    private canPlaceRoom(room: Room): boolean {
        // 留一格墙的间隙
        const padding = 1;
        for (let y = room.y - padding; y < room.y + room.height + padding; y++) {
            for (let x = room.x - padding; x < room.x + room.width + padding; x++) {
                if (y >= 0 && y < this.config.height && x >= 0 && x < this.config.width) {
                    if (this.map[y][x] === TILE_TYPES.FLOOR.id) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    private placeRoom(room: Room): void {
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                this.map[y][x] = TILE_TYPES.FLOOR.id;
            }
        }
    }

    /**
     * 连接所有房间（L字形走廊）
     */
    private connectRooms(): void {
        for (let i = 1; i < this.rooms.length; i++) {
            const roomA = this.rooms[i - 1];
            const roomB = this.rooms[i];
            this.createCorridor(roomA.centerX, roomA.centerY, roomB.centerX, roomB.centerY);
        }

        // 添加一些随机连接（增加循环，让地图更有趣）
        for (let i = 0; i < Math.floor(this.rooms.length / 3); i++) {
            const roomA = this.rooms[Math.floor(this.rng() * this.rooms.length)];
            const roomB = this.rooms[Math.floor(this.rng() * this.rooms.length)];
            if (roomA !== roomB) {
                this.createCorridor(roomA.centerX, roomA.centerY, roomB.centerX, roomB.centerY);
            }
        }
    }

    private createCorridor(x1: number, y1: number, x2: number, y2: number): void {
        let x = x1;
        let y = y1;

        // 随机选择先水平还是先垂直
        if (this.rng() > 0.5) {
            // 先水平
            while (x !== x2) {
                this.map[y][x] = TILE_TYPES.FLOOR.id;
                x += x < x2 ? 1 : -1;
            }
            while (y !== y2) {
                this.map[y][x] = TILE_TYPES.FLOOR.id;
                y += y < y2 ? 1 : -1;
            }
        } else {
            // 先垂直
            while (y !== y2) {
                this.map[y][x] = TILE_TYPES.FLOOR.id;
                y += y < y2 ? 1 : -1;
            }
            while (x !== x2) {
                this.map[y][x] = TILE_TYPES.FLOOR.id;
                x += x < x2 ? 1 : -1;
            }
        }
        this.map[y][x] = TILE_TYPES.FLOOR.id;
    }

    /**
     * 添加特殊元素
     */
    private addSpecialElements(): void {
        if (this.rooms.length < 2) return;

        // 楼梯（第一间房到最后一间房）
        const firstRoom = this.rooms[0];
        const lastRoom = this.rooms[this.rooms.length - 1];
        this.map[firstRoom.centerY][firstRoom.centerX] = TILE_TYPES.STAIRS_UP.id;
        this.map[lastRoom.centerY][lastRoom.centerX] = TILE_TYPES.STAIRS_DOWN.id;

        // 宝箱（随机房间）
        const chestCount = Math.floor(this.rng() * 3) + 2;
        for (let i = 0; i < chestCount; i++) {
            const room = this.rooms[Math.floor(this.rng() * this.rooms.length)];
            const cx = room.x + Math.floor(this.rng() * room.width);
            const cy = room.y + Math.floor(this.rng() * room.height);
            if (this.map[cy][cx] === TILE_TYPES.FLOOR.id) {
                this.map[cy][cx] = TILE_TYPES.CHEST.id;
            }
        }

        // 陷阱
        const trapCount = Math.floor(this.rng() * 5) + 3;
        for (let i = 0; i < trapCount; i++) {
            const room = this.rooms[Math.floor(this.rng() * this.rooms.length)];
            const cx = room.x + Math.floor(this.rng() * room.width);
            const cy = room.y + Math.floor(this.rng() * room.height);
            if (this.map[cy][cx] === TILE_TYPES.FLOOR.id) {
                this.map[cy][cx] = TILE_TYPES.TRAP.id;
            }
        }

        // 敌人出生点
        for (let i = 1; i < this.rooms.length - 1) {
            const room = this.rooms[i];
            if (this.rng() > 0.5) {
                this.map[room.centerY][room.centerX] = TILE_TYPES.SPAWNER.id;
            }
        }
    }

    /**
     * 获取玩家出生点
     */
    getSpawnPoint(): { x: number, y: number } {
        if (this.rooms.length === 0) {
            return { x: this.config.width / 2, y: this.config.height / 2 };
        }
        return {
            x: this.rooms[0].centerX,
            y: this.rooms[0].centerY,
        };
    }

    /**
     * 导出为 CSV 格式（RPG-JS 可用）
     */
    toCSV(): string {
        return this.map.map(row => row.join(',')).join(',\n');
    }

    /**
     * 导出为 JSON 格式
     */
    toJSON(): object {
        return {
            width: this.config.width,
            height: this.config.height,
            tilewidth: 32,
            tileheight: 32,
            tilesets: [
                {
                    firstgid: 1,
                    name: 'dungeon_tiles',
                    tilewidth: 32,
                    tileheight: 32,
                    tilecount: 11,
                    columns: 4,
                }
            ],
            layers: [
                {
                    name: 'ground',
                    width: this.config.width,
                    height: this.config.height,
                    data: this.map.flat(),
                }
            ],
        };
    }
}

/**
 * 无限地牢生成器（分层）
 */
export class InfiniteDungeon {
    private floors: DungeonGenerator[] = [];
    private currentFloor: number = 1;

    generateFloor(floor: number, seed?: number): {
        map: number[][],
        rooms: Room[],
        width: number,
        height: number,
        floor: number
    } {
        // 地牢越深，房间越小，敌人越多
        const config: Partial<DungeonConfig> = {
            width: Math.max(40, 80 - floor * 5),
            height: Math.max(30, 60 - floor * 5),
            roomMinSize: Math.max(4, 6 - Math.floor(floor / 3)),
            roomMaxSize: Math.max(8, 15 - floor),
            maxRooms: Math.max(5, 30 - floor * 2),
            seed: seed ?? Date.now() + floor * 1000,
        };

        const generator = new DungeonGenerator(config);
        const result = generator.generate();

        this.floors[floor] = generator;
        this.currentFloor = floor;

        return {
            ...result,
            floor,
        };
    }

    getCurrentFloor(): number {
        return this.currentFloor;
    }
}

/**
 * 迷宫生成器（使用递归回溯算法）
 */
export class MazeGenerator {
    private width: number;
    private height: number;
    private map: number[][] = [];
    private rng: () => number;

    constructor(width: number, height: number, seed?: number) {
        // 确保奇数尺寸
        this.width = width % 2 === 0 ? width + 1 : width;
        this.height = height % 2 === 0 ? height + 1 : height;
        this.rng = this.createRNG(seed);
    }

    private createRNG(seed?: number): () => number {
        let s = seed ?? Date.now();
        return () => {
            s = (s * 1103515245 + 12345) & 0x7fffffff;
            return s / 0x7fffffff;
        };
    }

    generate(): { map: number[][], width: number, height: number } {
        // 初始化迷宫（全墙）
        this.map = Array(this.height)
            .fill(null)
            .map(() => Array(this.width).fill(TILE_TYPES.WALL.id));

        // 从 (1,1) 开始生成
        this.carve(1, 1);

        // 添加入口和出口
        this.map[1][0] = TILE_TYPES.DOOR.id; // 入口
        this.map[this.height - 2][this.width - 1] = TILE_TYPES.DOOR.id; // 出口

        return {
            map: this.map,
            width: this.width,
            height: this.height,
        };
    }

    private carve(x: number, y: number): void {
        this.map[y][x] = TILE_TYPES.FLOOR.id;

        // 随机方向
        const directions = [
            [0, -2], [0, 2], [-2, 0], [2, 0]
        ].sort(() => this.rng() - 0.5);

        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx > 0 && nx < this.width - 1 && ny > 0 && ny < this.height - 1) {
                if (this.map[ny][nx] === TILE_TYPES.WALL.id) {
                    // 打通墙壁
                    this.map[y + dy / 2][x + dx / 2] = TILE_TYPES.FLOOR.id;
                    this.carve(nx, ny);
                }
            }
        }
    }
}
