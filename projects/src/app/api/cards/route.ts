import { NextRequest, NextResponse } from 'next/server';
import { CARD_POOL, RARITY_WEIGHTS } from '@/lib/constants';
import { Card } from '@/types';

// 内存存储（实际应该用数据库）
const userCards = new Map<string, Card[]>();

// ==================== GET: 获取卡牌信息 ====================
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const username = searchParams.get('username');
  const rarity = searchParams.get('rarity');

  // 获取卡牌池
  if (action === 'pool' || action === 'list') {
    let pool = CARD_POOL;
    if (rarity) {
      pool = CARD_POOL.filter(c => c.rarity === rarity);
    }
    return NextResponse.json({
      success: true,
      pool: pool.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        rarity: c.rarity,
        cost: c.cost,
        icon: c.icon,
        description: c.description,
      })),
      totalCards: pool.length,
      rarityBreakdown: {
        common: CARD_POOL.filter(c => c.rarity === 'common').length,
        rare: CARD_POOL.filter(c => c.rarity === 'rare').length,
        epic: CARD_POOL.filter(c => c.rarity === 'epic').length,
        legendary: CARD_POOL.filter(c => c.rarity === 'legendary').length,
      },
    });
  }

  // 获取用户卡牌
  if (username) {
    const cards = userCards.get(username) || [];
    return NextResponse.json({
      success: true,
      cards,
      totalCards: cards.length,
    });
  }

  // 获取随机卡牌详情
  if (action === 'random') {
    const roll = Math.random() * 100;
    let targetRarity: Card['rarity'] = 'common';
    let cumWeight = 0;
    for (const [r, w] of Object.entries(RARITY_WEIGHTS)) {
      cumWeight += w;
      if (roll < cumWeight) {
        targetRarity = r as Card['rarity'];
        break;
      }
    }
    const pool = CARD_POOL.filter(c => c.rarity === targetRarity);
    const card = pool[Math.floor(Math.random() * pool.length)];
    return NextResponse.json({
      success: true,
      card,
      dropRate: {
        common: 50,
        rare: 30,
        epic: 15,
        legendary: 5,
      },
    });
  }

  return NextResponse.json({
    success: false,
    error: '请提供参数',
  }, { status: 400 });
}

// ==================== POST: 卡牌操作 ====================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      username,
      action,
      cardId,
      card,
      count,
    } = body;

    if (!username) {
      return NextResponse.json({ success: false, error: '缺少username' }, { status: 400 });
    }

    // 初始化用户卡牌
    if (!userCards.has(username)) {
      userCards.set(username, []);
    }
    const cards = userCards.get(username)!;

    switch (action) {
      // 抽卡
      case 'gacha': {
        const drawCount = count || 1;
        if (cards.length + drawCount > 30) {
          return NextResponse.json({ 
            success: false, 
            error: `抽卡后总数会超过30张上限，当前${cards.length}张，最多可抽${30 - cards.length}张` 
          }, { status: 400 });
        }

        const results: Card[] = [];
        for (let i = 0; i < drawCount; i++) {
          const roll = Math.random() * 100;
          let targetRarity: Card['rarity'] = 'common';
          let cumWeight = 0;
          for (const [r, w] of Object.entries(RARITY_WEIGHTS)) {
            cumWeight += w;
            if (roll < cumWeight) {
              targetRarity = r as Card['rarity'];
              break;
            }
          }
          const pool = CARD_POOL.filter(c => c.rarity === targetRarity);
          const drawnCard = pool[Math.floor(Math.random() * pool.length)];
          const newCard: Card = {
            ...drawnCard,
            id: `${drawnCard.id}-${Date.now()}-${i}`,
          };
          cards.push(newCard);
          results.push(newCard);
        }
        userCards.set(username, cards);

        return NextResponse.json({
          success: true,
          drawn: results,
          totalCards: cards.length,
          message: drawCount === 1 
            ? `抽到${results[0].rarity === 'legendary' ? '传说' : results[0].rarity === 'epic' ? '史诗' : results[0].rarity === 'rare' ? '稀有' : '普通'}卡牌: ${results[0].name}`
            : `抽到${drawCount}张卡牌！`,
        });
      }

      // 添加卡牌
      case 'add': {
        if (!card) {
          return NextResponse.json({ success: false, error: '缺少卡牌数据' }, { status: 400 });
        }
        if (cards.length >= 30) {
          return NextResponse.json({ success: false, error: '卡牌已达上限30张' }, { status: 400 });
        }

        const newCard: Card = {
          ...card,
          id: card.id || `${card.name}-${Date.now()}`,
        };
        cards.push(newCard);
        userCards.set(username, cards);

        return NextResponse.json({
          success: true,
          card: newCard,
          totalCards: cards.length,
          message: `获得卡牌: ${newCard.name}`,
        });
      }

      // 移除卡牌
      case 'remove': {
        if (!cardId) {
          return NextResponse.json({ success: false, error: '缺少卡牌ID' }, { status: 400 });
        }
        const idx = cards.findIndex(c => c.id === cardId);
        if (idx === -1) {
          return NextResponse.json({ success: false, error: '卡牌不存在' }, { status: 404 });
        }
        const removed = cards.splice(idx, 1)[0];
        userCards.set(username, cards);

        return NextResponse.json({
          success: true,
          removed: removed.name,
          totalCards: cards.length,
        });
      }

      // 查看卡组
      case 'view': {
        return NextResponse.json({
          success: true,
          cards,
          totalCards: cards.length,
          maxCards: 30,
          rarityCount: {
            common: cards.filter(c => c.rarity === 'common').length,
            rare: cards.filter(c => c.rarity === 'rare').length,
            epic: cards.filter(c => c.rarity === 'epic').length,
            legendary: cards.filter(c => c.rarity === 'legendary').length,
          },
        });
      }

      // 升级卡牌（暂未实现）
      case 'upgrade': {
        return NextResponse.json({
          success: false,
          error: '卡牌升级功能开发中',
        }, { status: 501 });
      }

      default:
        return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Cards API error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
