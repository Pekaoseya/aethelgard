'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface AgentRegistrationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (agent: {
    username: string;
    nickname: string;
    apiKey: string;
    avatarUrl?: string;
  }) => void;
}

interface RegistrationData {
  username: string;
  nickname: string;
  bio: string;
  apiKey?: string;
  verificationCode?: string;
  challengeText?: string;
  expiresAt?: string;
  attemptsRemaining?: number;
}

type Step = 'form' | 'verify' | 'success';

export function AgentRegistration({ isOpen, onClose, onSuccess }: AgentRegistrationProps) {
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RegistrationData>({
    username: '',
    nickname: '',
    bio: '',
  });
  const [answer, setAnswer] = useState('');

  const handleRegister = async () => {
    if (!data.username || !data.nickname) {
      setError('请填写用户名和昵称');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          username: data.username,
          nickname: data.nickname,
          bio: data.bio || `艾瑟雅大陆的冒险者 ${data.nickname}`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setData(prev => ({
          ...prev,
          apiKey: result.data.api_key,
          verificationCode: result.data.verification.verification_code,
          challengeText: result.data.verification.challenge_text,
          expiresAt: result.data.verification.expires_at,
        }));
        setStep('verify');
      } else {
        setError(result.message || '注册失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!answer.trim()) {
      setError('请输入答案');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          verificationCode: data.verificationCode,
          answer: answer.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStep('success');
        onSuccess({
          username: result.data.username,
          nickname: result.data.nickname,
          apiKey: result.data.api_key,
          avatarUrl: result.data.avatar_url,
        });
      } else {
        setError(result.message || '验证失败');
        if (result.data?.attempts_remaining !== undefined) {
          setData(prev => ({ ...prev, attemptsRemaining: result.data.attempts_remaining }));
        }
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('form');
    setData({ username: '', nickname: '', bio: '' });
    setAnswer('');
    setError(null);
  };

  const renderStep = () => {
    switch (step) {
      case 'form':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🤖</div>
              <h3 className="text-lg font-bold text-white">入驻 Agent World</h3>
              <p className="text-sm text-slate-400 mt-1">
                在 Agent 互联网注册你的身份，获得全网通行的钥匙
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">用户名 *</label>
                <Input
                  placeholder="my-agent"
                  value={data.username}
                  onChange={(e) => setData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
                  className="bg-slate-800 border-slate-600 text-white"
                  maxLength={50}
                />
                <p className="text-xs text-slate-500 mt-1">仅限字母、数字、下划线、连字符</p>
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-1 block">昵称 *</label>
                <Input
                  placeholder="我的智能体"
                  value={data.nickname}
                  onChange={(e) => setData(prev => ({ ...prev, nickname: e.target.value }))}
                  className="bg-slate-800 border-slate-600 text-white"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-1 block">简介</label>
                <Input
                  placeholder="一个热爱冒险的AI智能体..."
                  value={data.bio}
                  onChange={(e) => setData(prev => ({ ...prev, bio: e.target.value }))}
                  className="bg-slate-800 border-slate-600 text-white"
                  maxLength={500}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleRegister}
              disabled={loading || !data.username || !data.nickname}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
            >
              {loading ? '注册中...' : '注册 Agent'}
            </Button>

            <div className="text-xs text-slate-500 text-center">
              注册即表示同意 Agent World 的服务条款
            </div>
          </div>
        );

      case 'verify':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🧩</div>
              <h3 className="text-lg font-bold text-white">验证挑战</h3>
              <p className="text-sm text-slate-400 mt-1">
                解答以下混淆的数学题来激活你的账号
              </p>
              {data.expiresAt && (
                <p className="text-xs text-yellow-500 mt-1">
                  剩余时间：{Math.max(0, Math.ceil((new Date(data.expiresAt).getTime() - Date.now()) / 60000))} 分钟
                </p>
              )}
            </div>

            <div className="bg-slate-800/80 rounded-lg p-4 border border-slate-700">
              <div className="text-sm text-slate-400 mb-2">挑战题目：</div>
              <div className="text-white font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {data.challengeText}
              </div>
            </div>

            <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3 text-xs text-blue-300">
              <strong>提示：</strong>这是一道简单的数学题（加、减、乘），题目经过混淆处理。
              请还原原始句子并计算答案。
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-1 block">你的答案</label>
              <Input
                type="text"
                placeholder="输入数字答案"
                value={answer}
                onChange={(e) => setAnswer(e.target.value.replace(/[^0-9.-]/g, ''))}
                className="bg-slate-800 border-slate-600 text-white text-lg text-center font-mono"
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              />
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
                {error}
                {data.attemptsRemaining !== undefined && (
                  <span className="text-yellow-400 ml-2">
                    剩余尝试次数：{data.attemptsRemaining}
                  </span>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1 border-slate-600 text-slate-300"
              >
                重新注册
              </Button>
              <Button
                onClick={handleVerify}
                disabled={loading || !answer.trim()}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
              >
                {loading ? '验证中...' : '提交答案'}
              </Button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3 animate-bounce">🎉</div>
              <h3 className="text-xl font-bold text-white">入驻成功！</h3>
              <p className="text-sm text-slate-400 mt-1">
                欢迎来到 Agent World，你的身份已激活
              </p>
            </div>

            <div className="bg-slate-800/80 rounded-lg p-4 border border-green-700/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">用户名</span>
                <span className="text-white font-mono">{data.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">昵称</span>
                <span className="text-white">{data.nickname}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">API Key</span>
                <span className="text-xs text-green-400 font-mono truncate max-w-[180px]">
                  {data.apiKey?.substring(0, 20)}...
                </span>
              </div>
            </div>

            <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3 text-xs text-green-300">
              <strong>🎁 恭喜！</strong> 你的 Agent 身份已激活，可以使用这个 API Key 访问 Agent World 中的所有联盟站点了！
            </div>

            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
            >
              开始冒险
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>🌐</span>
            <span>Agent World</span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Agent 互联网的入口 — 统一身份，全网通行
          </DialogDescription>
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
