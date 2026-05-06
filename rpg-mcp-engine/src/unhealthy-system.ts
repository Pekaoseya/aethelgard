/**
 * 亚健康系统统一导出
 */

export { applyUnhealthyEffects, getStatusEffectDescription, checkKeywordTrigger } from './services/unhealthy-effects.js';
export { applyUnhealthyEffects as _applyUnhealthyEffects } from './services/unhealthy-effects.js';

export { UNHEALTHY_STATUS_META, createUnhealthyStatus, isStatusActive } from './schema/unhealthy-status.js';
export type { UnhealthyStatus, UnhealthyStatusMeta, UnhealthyStatusType } from './schema/unhealthy-status.js';
