/**
 * 智障角色系统导出
 */

export { BaseAgent } from './base-agent.js';
export type { AgentConfig, MemoryEntry, AgentState } from './base-agent.js';

export { RepeaterAgent } from './repeater-agent.js';
export { CarperAgent } from './carper-agent.js';
export { SaintAgent } from './saint-agent.js';
export { HallucinatorAgent } from './hallucinator-agent.js';
export { SycophantAgent } from './sycophant-agent.js';
export { ProphetAgent } from './prophet-agent.js';

export { AgentFactory } from './agent-factory.js';
export type { StupidAgentType, CreateAgentOptions } from './agent-factory.js';

export { REPEATER_CONFIG } from './prompts/repeater.js';
export { CARPER_CONFIG } from './prompts/carper.js';
export { SAINT_CONFIG } from './prompts/saint.js';
export { HALLUCINATOR_CONFIG } from './prompts/hallucinator.js';
export { SYCOPHANT_CONFIG } from './prompts/sycophant.js';
export { PROPHET_CONFIG } from './prompts/prophet.js';
