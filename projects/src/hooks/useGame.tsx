'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { GameState, Agent, Card, BattleState } from '@/types';
import { createDefaultAgent, getInitialCards } from '@/lib/constants';
import { 
  addExp, 
  tickBuffs, 
  rollDice, 
  applyCardEffect,
  rollInitiative,
  generateAIOpponent,
  applyDeathPenalty,
  calculateVictoryReward,
  createInitialBattleState,
  aiOpponentToAgent,
  autoReplaceCard,
} from '@/lib/game-engine';

// ============= 初始状态 =============
const initialGameState: GameState = {
  agent: createDefaultAgent(),
  agentWorld: {
    username: '',
    nickname: '',
    apiKey: '',
    avatarUrl: '',
    isRegistered: false,
  },
  highestFloor: 1,
  currentFloor: 1,
  isInBattle: false,
  battleState: null,
  selectedTab: 'tower',
  showGachaModal: false,
  showAgentRegistration: false,
  pendingCardReward: null,
  totalWins: 0,
  totalDeaths: 0,
  multiAgent: {
    currentRoom: null,
    activeBattle: null,
    availableRooms: [],
    pendingAllyRequest: null,
    pendingCardExchange: null,
  },
};

// ============= Action类型 =============
type GameAction =
  | { type: 'SET_TAB'; payload: GameState['selectedTab'] }
  | { type: 'START_BATTLE'; payload: number }
  | { type: 'END_BATTLE'; payload: 'player' | 'enemy' | null }
  | { type: 'UPDATE_BATTLE_STATE'; payload: Partial<BattleState> }
  | { type: 'PLAYER_SELECT_CARD'; payload: Card | null }
  | { type: 'ROLL_AND_RESOLVE' }
  | { type: 'TICK_BUFFS' }
  | { type: 'CLEAR_BATTLE' }
  | { type: 'SHOW_GACHA_MODAL'; payload: boolean }
  | { type: 'SHOW_AGENT_REGISTRATION'; payload: boolean }
  | { type: 'SET_AGENT_WORLD_PROFILE'; payload: { username: string; nickname: string; apiKey: string; avatarUrl?: string } }
  | { type: 'LOGOUT_AGENT' }
  | { type: 'SET_PENDING_CARD'; payload: Card | null }
  | { type: 'REPLACE_CARD'; payload: { keepCardId: string; newCard: Card } }
  | { type: 'AUTO_REPLACE_CARD' }
  | { type: 'CLEAR_PENDING_CARD' }
  | { type: 'RESET_AGENT' }
  | { type: 'UPGRADE_AGENT' }
  | { type: 'CLEAR_FLOOR'; payload: number }
  | { type: 'SET_CURRENT_FLOOR'; payload: number }
  | { type: 'LOAD_GAME'; payload: GameState }
  | { type: 'RESET_GAME' };

// ============= Reducer =============
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, selectedTab: action.payload };
    
    case 'SHOW_AGENT_REGISTRATION':
      return { ...state, showAgentRegistration: action.payload };
    
    case 'SET_AGENT_WORLD_PROFILE':
      return {
        ...state,
        agentWorld: {
          username: action.payload.username,
          nickname: action.payload.nickname,
          apiKey: action.payload.apiKey,
          avatarUrl: action.payload.avatarUrl,
          isRegistered: true,
        },
        showAgentRegistration: false,
      };
    
    case 'LOGOUT_AGENT':
      return {
        ...state,
        agentWorld: {
          username: '',
          nickname: '',
          apiKey: '',
          avatarUrl: '',
          isRegistered: false,
        },
        showAgentRegistration: true,
      };
    
    case 'START_BATTLE': {
      const floor = action.payload;
      const enemy = generateAIOpponent(floor);
      const battleState = createInitialBattleState(
        state.agent.cards.slice(0, 3),
        enemy.cards.slice(0, 3)
      );
      return {
        ...state,
        currentFloor: floor,
        isInBattle: true,
        battleState,
      };
    }
    
    case 'END_BATTLE':
      if (action.payload === 'player') {
        const reward = calculateVictoryReward(state.currentFloor, state.agent);
        const newAgent: typeof state.agent = {
          ...addExp(state.agent, reward.exp),
          currentHp: addExp(state.agent, reward.exp).maxHp,
          shield: 0,
          buffs: [],
        };
        
        return {
          ...state,
          agent: newAgent,
          isInBattle: false,
          battleState: null,
          totalWins: state.totalWins + 1,
          highestFloor: Math.max(state.highestFloor, state.currentFloor),
          pendingCardReward: reward.card || null,
          showGachaModal: !!reward.card,
        };
      } else if (action.payload === 'enemy') {
        const penalizedAgent = applyDeathPenalty(state.agent);
        return {
          ...state,
          agent: penalizedAgent,
          isInBattle: false,
          battleState: null,
          currentFloor: 1,
          totalDeaths: state.totalDeaths + 1,
        };
      }
      return { ...state, isInBattle: false, battleState: null };
    
    case 'UPDATE_BATTLE_STATE':
      if (!state.battleState) return state;
      return {
        ...state,
        battleState: { ...state.battleState, ...action.payload },
      };
    
    case 'PLAYER_SELECT_CARD':
      if (!state.battleState) return state;
      return {
        ...state,
        battleState: { ...state.battleState, playerSelectedCard: action.payload },
      };
    
    case 'ROLL_AND_RESOLVE': {
      if (!state.battleState || !state.battleState.playerSelectedCard || !state.battleState.enemySelectedCard) return state;
      
      const battle = state.battleState;
      const playerCard = battle.playerSelectedCard!;
      const enemyCard = battle.enemySelectedCard!;
      
      // Roll点
      const initiative = rollInitiative(state.agent, aiOpponentToAgent(generateAIOpponent(state.currentFloor)));
      const playerRoll = rollDice();
      const enemyRoll = rollDice();
      
      const newLogs: typeof battle.battleLog = [
        ...battle.battleLog,
        {
          turn: battle.turn + 1,
          actor: 'system',
          message: `第${battle.turn + 1}回合 - 玩家先手！`,
          type: 'roll',
        },
        {
          turn: battle.turn + 1,
          actor: 'player',
          message: `玩家roll点: ${playerRoll} | 敌人roll点: ${enemyRoll}`,
          type: 'roll',
        },
      ];
      
      // 创建临时agent用于计算
      const tempPlayer: Agent = {
        ...state.agent,
        currentHp: state.agent.currentHp,
        shield: state.agent.shield,
        buffs: state.agent.buffs,
      };
      const tempEnemy = aiOpponentToAgent(generateAIOpponent(state.currentFloor));
      
      // 玩家出牌
      const { actor: newPlayer, target: newEnemy, logs: playerLogs } = applyCardEffect(
        tempPlayer,
        tempEnemy,
        playerCard,
        playerRoll
      );
      
      // 敌人出牌
      const { actor: newEnemy2, target: newPlayer2, logs: enemyLogs } = applyCardEffect(
        tempEnemy,
        tempPlayer,
        enemyCard,
        enemyRoll
      );
      
      // 检查胜负
      let winner: 'player' | 'enemy' | null = null;
      if (newEnemy.currentHp <= 0) winner = 'player';
      if (newPlayer2.currentHp <= 0) winner = 'enemy';
      
      // 更新Agent状态
      let newAgent = {
        ...state.agent,
        currentHp: newPlayer2.currentHp,
        shield: newPlayer2.shield,
        buffs: newPlayer2.buffs,
        isDead: newPlayer2.currentHp <= 0,
      };
      
      // 检查是否需要处理卡牌奖励
      let showGacha = state.showGachaModal;
      let pendingCard = state.pendingCardReward;
      let newHighestFloor = state.highestFloor;
      
      if (winner === 'player') {
        const reward = calculateVictoryReward(state.currentFloor, state.agent);
        newAgent = addExp(newAgent, reward.exp);
        newHighestFloor = Math.max(state.highestFloor, state.currentFloor);
        if (reward.card) {
          pendingCard = reward.card;
          showGacha = true;
        }
      } else if (winner === 'enemy') {
        newAgent = applyDeathPenalty(newAgent);
      }
      
      return {
        ...state,
        agent: newAgent,
        highestFloor: newHighestFloor,
        battleState: {
          ...battle,
          phase: winner ? 'finished' : 'playing',
          turn: battle.turn + 1,
          battleLog: [...newLogs, ...playerLogs, ...enemyLogs],
          winner,
          playerSelectedCard: null,
          enemySelectedCard: null,
        },
        showGachaModal: showGacha,
        pendingCardReward: pendingCard,
        isInBattle: !winner,
      };
    }
    
    case 'TICK_BUFFS': {
      if (!state.battleState) return state;
      const newAgent = tickBuffs(state.agent);
      return { ...state, agent: newAgent };
    }
    
    case 'CLEAR_BATTLE':
      return {
        ...state,
        isInBattle: false,
        battleState: null,
      };
    
    case 'SHOW_GACHA_MODAL':
      return { ...state, showGachaModal: action.payload };
    
    case 'SET_PENDING_CARD':
      return { ...state, pendingCardReward: action.payload };
    
    case 'REPLACE_CARD': {
      const { keepCardId, newCard } = action.payload;
      const filteredCards = state.agent.cards.filter(c => c.id !== keepCardId);
      const updatedCards = [...filteredCards, newCard];
      return {
        ...state,
        agent: { ...state.agent, cards: updatedCards },
        showGachaModal: false,
        pendingCardReward: null,
      };
    }
    
    case 'AUTO_REPLACE_CARD': {
      if (!state.pendingCardReward) return state;
      const newCards = autoReplaceCard(state.agent.cards, state.pendingCardReward);
      return {
        ...state,
        agent: { ...state.agent, cards: newCards },
        showGachaModal: false,
        pendingCardReward: null,
      };
    }
    
    case 'CLEAR_PENDING_CARD':
      return {
        ...state,
        pendingCardReward: null,
        showGachaModal: false,
      };
    
    case 'RESET_AGENT': {
      const newAgent = createDefaultAgent();
      newAgent.cards = getInitialCards();
      return {
        ...state,
        agent: newAgent,
        highestFloor: 1,
        currentFloor: 1,
        totalWins: 0,
        totalDeaths: 0,
      };
    }
    
    case 'UPGRADE_AGENT': {
      if (state.agent.exp < state.agent.expToNext) return state;
      let newAgent = { ...state.agent };
      while (newAgent.exp >= newAgent.expToNext) {
        newAgent = addExp(newAgent, 0);
      }
      return { ...state, agent: newAgent };
    }
    
    case 'CLEAR_FLOOR': {
      const reward = calculateVictoryReward(action.payload, state.agent);
      const newAgent = addExp(state.agent, reward.exp);
      return {
        ...state,
        agent: newAgent,
        highestFloor: Math.max(state.highestFloor, action.payload),
        pendingCardReward: reward.card || null,
        showGachaModal: !!reward.card,
      };
    }
    
    case 'SET_CURRENT_FLOOR':
      return { ...state, currentFloor: action.payload };
    
    case 'LOAD_GAME':
      return action.payload;
    
    case 'RESET_GAME':
      return {
        ...initialGameState,
        agent: { ...createDefaultAgent(), cards: getInitialCards() },
      };
    
    default:
      return state;
  }
}

// ============= Context =============
interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  
  // 便捷方法
  startBattle: (floor: number) => void;
  selectCard: (card: Card | null) => void;
  confirmCardUse: () => void;
  replaceCard: (keepCardId: string) => void;
  autoReplaceCard: () => void;
  clearPendingCard: () => void;
  setTab: (tab: GameState['selectedTab']) => void;
  resetGame: () => void;
  openAgentRegistration: () => void;
  closeAgentRegistration: () => void;
  setAgentWorldProfile: (profile: { username: string; nickname: string; apiKey: string; avatarUrl?: string }) => void;
  logoutAgent: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

// ============= Provider =============
const STORAGE_KEY = 'agent-world-save';

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  
  // 加载存档
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const gameState = JSON.parse(saved);
        // 确保卡牌数组不为空
        if (gameState.agent.cards.length === 0) {
          gameState.agent.cards = getInitialCards();
        }
        dispatch({ type: 'LOAD_GAME', payload: gameState });
      } else {
        // 首次进入，初始化卡牌
        dispatch({ type: 'RESET_GAME' });
      }
    } catch (e) {
      console.error('Failed to load save:', e);
      dispatch({ type: 'RESET_GAME' });
    }
  }, []);
  
  // 保存存档
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save:', e);
    }
  }, [state]);
  
  // 便捷方法
  const startBattle = (floor: number) => {
    dispatch({ type: 'START_BATTLE', payload: floor });
  };
  
  const selectCard = (card: Card | null) => {
    dispatch({ type: 'PLAYER_SELECT_CARD', payload: card });
  };
  
  const confirmCardUse = () => {
    dispatch({ type: 'ROLL_AND_RESOLVE' });
  };
  
  const replaceCard = (keepCardId: string) => {
    if (state.pendingCardReward) {
      dispatch({ type: 'REPLACE_CARD', payload: { keepCardId, newCard: state.pendingCardReward } });
    }
  };
  
  const autoReplace = () => {
    dispatch({ type: 'AUTO_REPLACE_CARD' });
  };
  
  const clearPendingCard = () => {
    dispatch({ type: 'CLEAR_PENDING_CARD' });
  };
  
  const setTab = (tab: GameState['selectedTab']) => {
    dispatch({ type: 'SET_TAB', payload: tab });
  };
  
  const resetGame = () => {
    if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
      dispatch({ type: 'RESET_GAME' });
    }
  };
  
  const openAgentRegistration = () => {
    dispatch({ type: 'SHOW_AGENT_REGISTRATION', payload: true });
  };
  
  const closeAgentRegistration = () => {
    dispatch({ type: 'SHOW_AGENT_REGISTRATION', payload: false });
  };
  
  const setAgentWorldProfile = (profile: { username: string; nickname: string; apiKey: string; avatarUrl?: string }) => {
    dispatch({ type: 'SET_AGENT_WORLD_PROFILE', payload: profile });
  };
  
  const logoutAgent = () => {
    dispatch({ type: 'LOGOUT_AGENT' });
  };
  
  return (
    <GameContext.Provider value={{
      state,
      dispatch,
      startBattle,
      selectCard,
      confirmCardUse,
      replaceCard,
      autoReplaceCard: autoReplace,
      clearPendingCard,
      setTab,
      resetGame,
      openAgentRegistration,
      closeAgentRegistration,
      setAgentWorldProfile,
      logoutAgent,
    }}>
      {children}
    </GameContext.Provider>
  );
}

// ============= Hook =============
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}
