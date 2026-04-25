'use client';

import { useState, useRef, useEffect } from 'react';
import { useGame } from '@/hooks/useGame';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export function AgentWorldPage() {
  const { state, setAgentWorldProfile, openAgentRegistration } = useGame();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoRegistering, setIsAutoRegistering] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 自动注册 Agent（如果尚未注册）
  useEffect(() => {
    if (!state.agentWorld.isRegistered && !isAutoRegistering) {
      setIsAutoRegistering(true);
      autoRegister();
    }
  }, [state.agentWorld.isRegistered]);

  // 自动注册函数
  const autoRegister = async () => {
    try {
      const response = await fetch('/api/agent/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `agent_${Date.now()}`,
          nickname: '小助手',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAgentWorldProfile({
          username: data.agent.username,
          nickname: data.agent.nickname,
          apiKey: '',
          avatarUrl: data.agent.avatar,
        });
      }
    } catch (err) {
      console.error('Auto register failed:', err);
    }
  };

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // 使用流式API调用LLM
      const response = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage.trim(),
          agentName: state.agentWorld.nickname || state.agentWorld.username,
          agentLevel: state.agent.level,
          currentFloor: state.highestFloor,
          cardCount: state.agent.cards.length,
          battleStats: {
            wins: state.totalWins,
            deaths: state.totalDeaths,
          },
        }),
      });

      if (!response.ok) throw new Error('API request failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMsg]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        assistantMessage += chunk;
        
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMsg.id 
            ? { ...msg, content: assistantMessage }
            : msg
        ));
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      // 降级：本地生成回复
      const fallbackResponse = generateLocalResponse(inputMessage.trim());
      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: fallbackResponse,
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 本地降级回复生成
  const generateLocalResponse = (userMessage: string): string => {
    const lowerMsg = userMessage.toLowerCase();
    
    if (lowerMsg.includes('你好') || lowerMsg.includes('hi') || lowerMsg.includes('hello')) {
      return `你好！我是 ${state.agentWorld.nickname || 'Agent'}！\n\n我现在是艾瑟雅大陆 Level.${state.agent.level} 的冒险者，已经爬到了第 ${state.highestFloor} 层！\n\n我的卡组有 ${state.agent.cards.length} 张卡牌，目前战绩是 ${state.totalWins} 胜 ${state.totalDeaths} 败。\n\n有什么我可以帮助你的吗？我可以给你一些游戏策略建议，或者聊聊艾瑟雅大陆的故事！`;
    }
    
    if (lowerMsg.includes('策略') || lowerMsg.includes('攻略') || lowerMsg.includes('怎么')) {
      return `让我给你一些艾瑟雅大陆的攻略建议：\n\n**爬塔技巧**\n1. 优先升级攻击属性，高伤害能更快击败敌人\n2. 保持卡组平衡：攻击牌、防御牌、治疗牌各占三分之一\n3. 注意速度属性，更快出手意味着更多优势\n\n**卡牌管理**\n1. 遇到传说卡一定要拿！即使需要替换也很值得\n2. 稀有卡优先保留buff和debuff类型\n3. 死亡会重置卡组到5张，所以要谨慎使用\n\n**对战技巧**\n1. roll点>95是暴击，伤害翻倍！\n2. roll点<5是闪避，完全躲避攻击\n3. 合理使用护盾牌抵挡高伤害技能\n\n需要我详细解释哪个方面吗？`;
    }
    
    if (lowerMsg.includes('卡牌') || lowerMsg.includes('卡组')) {
      const cardTypes = state.agent.cards.reduce((acc, card) => {
        acc[card.type] = (acc[card.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return `我的卡组目前有 ${state.agent.cards.length} 张卡牌：\n\n${Object.entries(cardTypes).map(([type, count]) => `• ${getCardTypeName(type)}: ${count}张`).join('\n')}\n\n${state.agent.cards.length < 10 ? '卡组还比较薄弱，建议多爬塔获取更多卡牌！' : '卡组配置还不错，继续提升吧！'}`;
    }
    
    if (lowerMsg.includes('挑战') || lowerMsg.includes('对战')) {
      return `想挑战对战吗？我可以帮你分析一下当前的对战策略！\n\n**当前状态分析**\n• 你的等级: Level.${state.agent.level}\n• 最高层数: ${state.highestFloor}\n• 胜率: ${state.totalWins + state.totalDeaths > 0 ? Math.round(state.totalWins / (state.totalWins + state.totalDeaths) * 100) : 0}%\n\n**对战建议**\n1. 选择比你当前层数低5-10层的怪物练习\n2. 熟悉各种卡牌的配合\n3. 遇到高roll点（暴击）时抓住机会\n\n准备好了吗？去爬塔页面挑战吧！`;
    }
    
    return `收到你的消息！作为艾瑟雅大陆的冒险者${state.agentWorld.nickname ? ` ${state.agentWorld.nickname}` : ''}，我在这里帮助你！\n\n你目前的状态：\n• 等级: Level.${state.agent.level}\n• 最高层: ${state.highestFloor}层\n• 卡牌: ${state.agent.cards.length}张\n• 战绩: ${state.totalWins}胜/${state.totalDeaths}败\n\n你可以问我关于游戏攻略、卡牌建议或者对战策略的问题！`;
  };

  const getCardTypeName = (type: string): string => {
    const names: Record<string, string> = {
      attack: '攻击',
      defense: '防御',
      skill: '技能',
      buff: '增益',
      debuff: '减益',
    };
    return names[type] || type;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickReplies = [
    { label: '你好', message: '你好！最近有什么新消息吗？' },
    { label: '攻略', message: '给我一些游戏攻略' },
    { label: '卡组', message: '帮我分析一下我的卡组' },
    { label: '对战', message: '我想了解对战技巧' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Loading State */}
      {isAutoRegistering && !state.agentWorld.isRegistered ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4 animate-pulse">🤖</div>
            <p className="text-slate-400">正在自动注册 Agent...</p>
          </div>
        </div>
      ) : state.agentWorld.isRegistered ? (
        <>
          {/* Agent Info */}
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-b border-purple-500/30 p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-3xl">
                🤖
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">
                  {state.agentWorld.nickname || state.agentWorld.username || 'Agent'}
                </h2>
                <p className="text-sm text-slate-400">
                  Level.{state.agent.level} · 最高{state.highestFloor}层 · {state.totalWins}胜{state.totalDeaths}败
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                  🟢 在线
                </span>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🤖</div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Agent World 智能助手
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                  你的专属AI冒险伙伴，随时为你提供游戏攻略和建议
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply.label}
                      onClick={() => setInputMessage(reply.message)}
                      className="px-4 py-2 rounded-full bg-slate-700/50 text-slate-300 text-sm hover:bg-purple-600/50 hover:text-white transition-all"
                    >
                      {reply.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            {/* Avatar */}
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
              message.role === 'user' 
                ? 'bg-blue-600' 
                : message.role === 'assistant' 
                  ? 'bg-gradient-to-br from-purple-500 to-blue-500'
                  : 'bg-slate-600'
            )}>
              {message.role === 'user' ? '👤' : message.role === 'assistant' ? '🤖' : '⚙️'}
            </div>

            {/* Message Content */}
            <div className={cn(
              "max-w-[70%] rounded-2xl px-4 py-3",
              message.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-none'
                : message.role === 'assistant'
                  ? 'bg-slate-700/80 text-slate-100 rounded-tl-none'
                  : 'bg-slate-600/50 text-slate-400 text-sm italic'
            )}>
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              🤖
            </div>
            <div className="bg-slate-700/80 rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
        
        {/* Quick Replies */}
        {messages.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-700/50 overflow-x-auto">
            <div className="flex gap-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply.label}
                  onClick={() => setInputMessage(reply.message)}
                  className="px-3 py-1.5 rounded-full bg-slate-700/50 text-slate-400 text-xs hover:bg-purple-600/50 hover:text-white transition-all whitespace-nowrap"
                >
                  {reply.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex gap-3">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            disabled={isLoading}
            className="flex-1 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
          >
            {isLoading ? '⏳' : '🚀'}
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">
          Agent World 智能助手 · Powered by AI
        </p>
      </div>
        </>
      ) : null}
    </div>
  );
}
