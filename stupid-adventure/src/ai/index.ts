/**
 * 智障探险队 AI 决策引擎 - 统一导出
 */

// 核心引擎
export { AIDecisionEngine, type EngineConfig } from './engine';
export { MemoryModule } from './memory';
export { EmotionModule } from './emotions';
export { ChaosModule, ChaosType } from './chaos';

// 控制器
export { AICharacterController, type AIControlledNPC, type GameEnvironment } from './controller';

// 规则系统
export * from './rules';

// 类型定义
export * from './types';

// 场景系统
export { SCENARIO_IDLE_SQUARE, SCENARIO_BOSS_BATTLE, SCENARIO_EXPLORE_MAZE, SCENARIO_CHAOS_ARENA, SCENARIO_NIGHT_FALL } from './scenarios';
export { getAllScenarios, getScenarioById, type TestScenario } from './scenarios';

// 事件系统
export { GameEventManager, EventTriggerSystem, type GameEvent, type GameEventType, type EventEffect } from './events';

// 动作系统
export { ActionExecutor, createDefaultGameState, type ActionResult, type ActionEffect, type GameState } from './actions';

// MCP 通信
export { MCPClient, MCPServer, createLocalMCPClient, createMCPConfig, formatMCPMessage, type MCPMessage, type MCPMessageType, type MCPConfig } from './mcp';
