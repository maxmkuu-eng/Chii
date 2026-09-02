import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Sliders,
  Sparkles,
  Volume2,
  Brain,
  Zap,
  Globe,
  Image as ImageIcon,
  Check,
  RotateCcw,
} from 'lucide-react';
import { AppSettings } from '../../types';

export const SettingsModule: React.FC = () => {
  const { settings, updateSettings, showToast } = useApp();

  const handleResetDefaults = () => {
    updateSettings({
      theme: 'dark',
      streaming: true,
      streamSpeed: 'normal',
      temperature: 0.7,
      defaultSystemPrompt: 'Wewe ni MKUU AI, msaidizi mkuu wa akili mnemba (AI) mahiri, mnyoofu, anayeheshimu na kumtii Boss Max kikamilifu. Toa majibu yaliyopangiliwa vizuri kwa Kiswahili fasaha na Kiingereza inapobidi.',
      memoryEnabled: true,
      voiceOutput: true,
      voicePitch: 1.0,
      voiceRate: 1.0,
      preferredVoice: 'default',
      soundEffects: true,
      notificationsEnabled: true,
      autoSaveHistory: true,
      searchProviderStub: 'placeholder',
      imageProviderStub: 'gemini',
    });
    showToast({ title: 'Reset Complete', message: 'Settings restored to factory defaults', type: 'info' });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-amber-500" /> System Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure theme aesthetics, inference parameters, voice options, and provider integrations.
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all self-start sm:self-auto"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* 1. Appearance & Interface */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Moon className="w-4 h-4 text-amber-500" /> Appearance & Theme
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['dark', 'light', 'system'] as const).map(themeOption => (
            <button
              key={themeOption}
              onClick={() => updateSettings({ theme: themeOption })}
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold capitalize transition-all ${
                settings.theme === themeOption
                  ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>{themeOption} Theme</span>
              {settings.theme === themeOption && <Check className="w-4 h-4 text-amber-500" />}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Model Reasoning & Inference Parameters */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-500" /> AI Inference & System Directives
        </h3>

        {/* Temperature */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Model Temperature (Creativity)</span>
            <span className="text-amber-500 font-mono">{settings.temperature}</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={settings.temperature}
            onChange={e => updateSettings({ temperature: parseFloat(e.target.value) })}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>0.0 (Precise / Code Focused)</span>
            <span>1.0 (Highly Creative)</span>
          </div>
        </div>

        {/* Default System Prompt */}
        <div className="space-y-1.5 pt-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Global AI Persona / System Instruction
          </label>
          <textarea
            value={settings.defaultSystemPrompt}
            onChange={e => updateSettings({ defaultSystemPrompt: e.target.value })}
            rows={3}
            className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed font-mono"
          />
        </div>

        {/* Streaming & Speed */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Streaming Response Mode
            </h4>
            <p className="text-[11px] text-slate-400">
              Render tokens incrementally in real-time as they are synthesized.
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.streaming}
            onChange={e => updateSettings({ streaming: e.target.checked })}
            className="w-5 h-5 accent-amber-500"
          />
        </div>
      </div>

      {/* 3. Provider Abstractions (Search & Image) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-500" /> Replaceable Provider Architecture
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <ImageIcon className="w-4 h-4 text-purple-500" />
              <span>Image Studio Provider</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Configured via IMAGE_PROVIDER / IMAGE_MODEL.
            </p>
            <select
              value={settings.imageProviderStub}
              onChange={e => updateSettings({ imageProviderStub: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="gemini">Gemini Multi-modal Engine (Default)</option>
              <option value="custom_mock">Custom External Endpoint</option>
            </select>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Globe className="w-4 h-4 text-amber-500" />
              <span>Web Search Provider</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Configured via SEARCH_PROVIDER.
            </p>
            <select
              value={settings.searchProviderStub}
              onChange={e => updateSettings({ searchProviderStub: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="placeholder">BONGO Search Architecture Stub</option>
              <option value="custom_engine">External Search Gateway</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
