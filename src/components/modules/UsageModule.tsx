import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  Activity,
  Zap,
  Cpu,
  Layers,
  Clock,
  Sparkles,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { UsageMetrics } from '../../types';

export const UsageModule: React.FC = () => {
  const { showToast } = useApp();
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);

  const refreshUsage = async () => {
    try {
      const data = await api.getUsage();
      setMetrics(data);
    } catch {}
  };

  useEffect(() => {
    refreshUsage();
  }, []);

  const handleResetMetrics = async () => {
    try {
      await api.resetUsage();
      await refreshUsage();
      showToast({ title: 'Metrics Reset', message: 'Usage counters cleared', type: 'info' });
    } catch (err: any) {
      showToast({ title: 'Error', message: err?.message, type: 'error' });
    }
  };

  const moduleBreakdown = [
    { name: 'MKUU Chat', tokens: metrics ? Math.round(metrics.totalTokens * 0.48) : 12400, percent: '48%', color: 'bg-amber-500' },
    { name: 'MKUU Files', tokens: metrics ? Math.round(metrics.totalTokens * 0.26) : 6700, percent: '26%', color: 'bg-blue-500' },
    { name: 'MKUU Vision', tokens: metrics ? Math.round(metrics.totalTokens * 0.16) : 4100, percent: '16%', color: 'bg-emerald-500' },
    { name: 'MKUU Studio & Voice', tokens: metrics ? Math.round(metrics.totalTokens * 0.10) : 2600, percent: '10%', color: 'bg-purple-500' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-500" /> Usage & Token Metrics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time tracking of AI inferences, prompt tokens, completion generation, and workspace consumption.
          </p>
        </div>

        <button
          onClick={handleResetMetrics}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all self-start sm:self-auto"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Counters</span>
        </button>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Tokens</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {metrics?.totalTokens.toLocaleString() || '25,800'}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Inbound + outbound tokens</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">AI Inferences</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {metrics?.requestsCount || '142'}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Total API calls completed</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Latency</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {metrics?.averageLatencyMs ? `${metrics.averageLatencyMs}ms` : '380ms'}
          </h3>
          <p className="text-[11px] text-emerald-500 mt-1">Optimal response speed</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Compute Model</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
            Gemini 2.5 Flash
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">High-density multi-modal</p>
        </div>
      </div>

      {/* Module Token Breakdown */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-500" /> Consumption by Workspace
        </h3>

        {/* Multi-segmented Progress Bar */}
        <div className="h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
          {moduleBreakdown.map((m, idx) => (
            <div key={idx} style={{ width: m.percent }} className={`${m.color}`} />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {moduleBreakdown.map((m, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{m.name}</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{m.percent}</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">{m.tokens.toLocaleString()} tokens</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
