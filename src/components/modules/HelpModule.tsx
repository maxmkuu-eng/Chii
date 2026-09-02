import React from 'react';
import {
  HelpCircle,
  Layers,
  ShieldCheck,
  Zap,
  Code,
  Keyboard,
  Sparkles,
  Search,
  Brain,
  FolderSearch,
  Eye,
  Radio,
  FileCheck,
} from 'lucide-react';

export const HelpModule: React.FC = () => {
  const architecturalFeatures = [
    {
      title: 'Independent Module Workspaces',
      description: 'Every feature (Chat, Memory, Files, Vision, Studio, Voice) maintains its own UI, state, API routes, and error boundaries.',
      icon: Layers,
      color: 'text-amber-500 bg-amber-500/10',
    },
    {
      title: 'Server-Side Secret Architecture',
      description: 'AI model keys and backend secrets are executed exclusively server-side in Node.js. No credentials ever touch client browsers.',
      icon: ShieldCheck,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      title: 'Replaceable Provider Abstraction',
      description: 'Future providers for Live Web Search and Studio Image Rendering can be swapped seamlessly by modifying environment variables.',
      icon: Zap,
      color: 'text-purple-500 bg-purple-500/10',
    },
  ];

  const shortcuts = [
    { key: 'Enter', description: 'Send current message in Chat or submit prompt' },
    { key: 'Shift + Enter', description: 'Create a new line in composer without sending' },
    { key: 'Escape', description: 'Close any active modal or image preview' },
  ];

  const moduleGuide = [
    { name: 'MKUU Chat', role: 'Real-time conversational intelligence with streaming, code syntax, and attachments', icon: Sparkles },
    { name: 'MKUU Memory', role: 'Maintains long-term preferences, project constraints, and fact memory banks', icon: Brain },
    { name: 'MKUU Files', role: 'Multi-document comparison, structured table extraction, and file synthesis', icon: FolderSearch },
    { name: 'MKUU Vision', role: 'Visual tensor reasoning, OCR text extraction, UI wireframe critiques', icon: Eye },
    { name: 'MKUU Studio', role: 'AI image generator and editor with aspect ratio and style options', icon: Layers },
    { name: 'MKUU Voice', role: 'Hands-free spoken conversations with real-time audio synthesis', icon: Radio },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-amber-500" /> Help & Architecture Guide
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Explore the design philosophy, modular architecture, and operational guidelines of MKUU AI.
        </p>
      </div>

      {/* Architectural Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {architecturalFeatures.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Workspace Reference */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-amber-500" /> Workspace Directory
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {moduleGuide.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{mod.name}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {mod.role}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Keyboard Shortcuts Table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-amber-500" /> Keyboard Shortcuts
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {shortcuts.map((sc, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">{sc.description}</span>
              <kbd className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200 shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
