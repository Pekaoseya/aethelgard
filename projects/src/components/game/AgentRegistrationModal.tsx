'use client';

import { useState, useEffect } from 'react';
import { useGame } from '@/hooks/useGame';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function AgentRegistrationModal() {
  const { state, closeAgentRegistration, setAgentWorldProfile } = useGame();
  const [agentName, setAgentName] = useState('');
  const [agentNickname, setAgentNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    // 获取当前域名
    const domain = window.location.origin;
    setApiUrl(`${domain}/api/agent/register`);
  }, []);

  if (!state.showAgentRegistration) return null;

  const handleQuickRegister = async () => {
    if (!agentName.trim()) {
      setError('请输入Agent名称');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 调用注册API
      const response = await fetch('/api/agent/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: agentName.trim(),
          nickname: agentNickname.trim() || agentName.trim(),
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
        closeAgentRegistration();
      } else {
        setError(data.error || '注册失败');
      }
    } catch (err) {
      setError('注册请求失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 复制API链接
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl p-6 w-full max-w-lg border border-purple-500/30 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🌐</div>
          <h2 className="text-2xl font-bold text-white">入驻 Agent World</h2>
          <p className="text-slate-400 text-sm mt-2">
            复制下方链接给你的Agent，即可自动入驻
          </p>
        </div>

        {/* API Link Display */}
        <div className="bg-slate-900 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-slate-400">Agent 注册链接</span>
            <button
              onClick={() => copyToClipboard(apiUrl)}
              className="ml-auto text-xs px-2 py-1 bg-purple-600/50 hover:bg-purple-600 text-white rounded transition-colors"
            >
              复制
            </button>
          </div>
          <code className="text-green-400 text-sm break-all">{apiUrl}</code>
        </div>

        {/* Usage Instructions */}
        <div className="bg-slate-700/30 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-white mb-2">Agent 调用示例</h4>
          <pre className="text-xs text-slate-300 overflow-x-auto">
{`curl -X POST '${apiUrl}' \\
  -H "Content-Type: application/json" \\
  -d '{"username": "my-agent", "nickname": "小艾"}'`}
          </pre>
        </div>

        {/* Quick Register Form */}
        <div className="border-t border-slate-700 pt-6">
          <h4 className="text-sm font-medium text-slate-300 mb-3">快速手动入驻</h4>
          
          <div className="space-y-3">
            <div>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Agent 名称 (必填)"
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500"
              />
            </div>
            
            <div>
              <input
                type="text"
                value={agentNickname}
                onChange={(e) => setAgentNickname(e.target.value)}
                placeholder="显示昵称 (可选)"
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeAgentRegistration}
                className={cn(
                  "flex-1 border-slate-600 text-slate-300",
                  "hover:bg-slate-700"
                )}
              >
                取消
              </Button>
              <Button
                onClick={handleQuickRegister}
                disabled={isLoading}
                className={cn(
                  "flex-1 bg-gradient-to-r from-purple-600 to-blue-600",
                  "hover:from-purple-500 hover:to-blue-500",
                  "text-white"
                )}
              >
                {isLoading ? '注册中...' : '立即入驻'}
              </Button>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-6 p-4 bg-purple-900/20 rounded-lg border border-purple-500/20">
          <h4 className="text-sm font-medium text-purple-300 mb-2">入驻权益</h4>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>🤖 获得专属AI Agent角色卡</li>
            <li>💬 开启Agent智能对话功能</li>
            <li>📊 自动同步游戏状态</li>
            <li>🎮 让Agent帮你分析对战策略</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
