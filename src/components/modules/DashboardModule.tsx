import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  Smartphone,
  FolderSearch,
  Eye,
  Sparkles,
  Brain,
  Mic,
  Search,
  ArrowRight,
  Zap,
  Activity,
  Layers,
  Image as ImageIcon,
  BarChart3,
  Globe,
} from 'lucide-react';
import { ModuleId } from '../../types';
import { api } from '../../services/api';

export const DashboardModule: React.FC = () => {
  const { navigateTo, createConversation, conversations, memories, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const modulesList: Array<{
    id: ModuleId;
    title: string;
    description: string;
    icon: any;
    status: string;
    metric: string;
    iconColor: string;
    hoverBorder: string;
  }> = [
    {
      id: 'chat',
      title: 'MKUU Chat',
      description: 'Production-ready streaming AI with session persistence and history.',
      icon: MessageSquare,
      status: 'Status: Active',
      metric: `${conversations.length} Sessions`,
      iconColor: 'bg-amber-500/10 text-amber-500',
      hoverBorder: 'hover:border-amber-500/50',
    },
    {
      id: 'sms',
      title: 'MKUU SMS',
      description: 'Manage cellular SMS inbox, conversations, dual-SIM routing, and auto-replies.',
      icon: Smartphone,
      status: 'Engine: Telephony',
      metric: 'Dual-SIM Ready',
      iconColor: 'bg-amber-500/10 text-amber-500',
      hoverBorder: 'hover:border-amber-500/50',
    },
    {
      id: 'auto-reply',
      title: 'Auto Reply',
      description: 'Intelligent AI-driven SMS auto-responder with rule filters and safety checks.',
      icon: Sparkles,
      status: 'Rule Engine',
      metric: 'AI Filter Active',
      iconColor: 'bg-emerald-500/10 text-emerald-500',
      hoverBorder: 'hover:border-emerald-500/50',
    },
    {
      id: 'files',
      title: 'MKUU Files',
      description: 'Multi-document RAG analyzer. Support for PDF, DOCX, and TXT.',
      icon: FolderSearch,
      status: 'Engine Ready',
      metric: 'Multi-Doc',
      iconColor: 'bg-blue-500/10 text-blue-500',
      hoverBorder: 'hover:border-blue-500/50',
    },
    {
      id: 'vision',
      title: 'MKUU Vision',
      description: 'Independent visual understanding. OCR and spatial analysis module.',
      icon: Eye,
      status: 'Module Ready',
      metric: 'v2.4 Vision',
      iconColor: 'bg-purple-500/10 text-purple-500',
      hoverBorder: 'hover:border-purple-500/50',
    },
    {
      id: 'studio',
      title: 'MKUU Studio',
      description: 'Generative image workspace with background removal and variations.',
      icon: Sparkles,
      status: 'Ready Prov.',
      metric: 'GenArt',
      iconColor: 'bg-emerald-500/10 text-emerald-500',
      hoverBorder: 'hover:border-emerald-500/50',
    },
    {
      id: 'memory',
      title: 'MKUU Memory',
      description: 'Cross-conversation long-term preference engine and fact storage.',
      icon: Brain,
      status: 'Optimized',
      metric: `${memories.length} Entities`,
      iconColor: 'bg-cyan-500/10 text-cyan-500',
      hoverBorder: 'hover:border-cyan-500/50',
    },
    {
      id: 'voice',
      title: 'MKUU Voice',
      description: 'Bilateral speech-to-text and low-latency vocal synthesis.',
      icon: Mic,
      status: 'Web Audio',
      metric: 'Active STT',
      iconColor: 'bg-pink-500/10 text-pink-500',
      hoverBorder: 'hover:border-pink-500/50',
    },
    {
      id: 'gallery',
      title: 'Image Gallery',
      description: 'High-resolution asset viewer, format exports, and catalog.',
      icon: ImageIcon,
      status: 'Storage: Local',
      metric: 'Gallery Repo',
      iconColor: 'bg-amber-500/10 text-amber-500',
      hoverBorder: 'hover:border-amber-500/50',
    },
    {
      id: 'usage',
      title: 'MKUU Usage',
      description: 'Detailed token auditing and provider cost management dashboard.',
      icon: BarChart3,
      status: '84% Limit',
      metric: 'Live Stats',
      iconColor: 'bg-slate-500/10 text-slate-400',
      hoverBorder: 'hover:border-slate-500/50',
    },
  ];

  const quickStarters = [
    {
      label: 'Compare 2 Documents',
      module: 'files' as ModuleId,
      action: () => navigateTo('files'),
    },
    {
      label: 'Extract Text from Image (OCR)',
      module: 'vision' as ModuleId,
      action: () => navigateTo('vision'),
    },
    {
      label: 'Generate Digital Art Wallpaper',
      module: 'studio' as ModuleId,
      action: () => navigateTo('studio'),
    },
    {
      label: 'Start Voice Conversation',
      module: 'voice' as ModuleId,
      action: () => navigateTo('voice'),
    },
    {
      label: 'Review User Preferences',
      module: 'memory' as ModuleId,
      action: () => navigateTo('memory'),
    },
  ];

  const handleTestSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.querySearch(searchQuery);
      setSearchResult(res);
      showToast({
        title: 'Search Architecture Verified',
        message: 'Live Web Search placeholder endpoint responded successfully.',
        type: 'info',
      });
    } catch (err: any) {
      showToast({ title: 'Search Error', message: err?.message, type: 'error' });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 flex-1 w-full animate-in fade-in duration-200">
        {/* Sleek Hero Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-mono uppercase tracking-wider mb-2">
              <Zap className="w-3 h-3" />
              <span>Independent Module Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1.5">
              Karibu kwenye MKUU AI.
            </h1>
            <p className="text-slate-500 text-sm">
              Select an independent module to begin your intelligent workspace session.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                createConversation();
                navigateTo('chat');
              }}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs tracking-tight shadow-md shadow-amber-500/10 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Launch Chat</span>
            </button>
            <button
              onClick={() => navigateTo('files')}
              className="px-4 py-2 rounded-lg bg-[#111114] hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs border border-slate-800 transition-all flex items-center gap-2 cursor-pointer"
            >
              <FolderSearch className="w-3.5 h-3.5 text-blue-400" />
              <span>Files RAG</span>
            </button>
          </div>
        </div>

        {/* 4-Column Sleek Suite Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs uppercase tracking-widest text-slate-500 font-semibold flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-amber-500" /> Intelligent Suites
            </h2>
            <span className="text-[10px] font-mono text-slate-600">8 MODULES LOADED</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {modulesList.map(mod => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.id}
                  id={`module-card-${mod.id}`}
                  onClick={() => navigateTo(mod.id)}
                  className={`bg-[#111114] border border-slate-800 p-5 rounded-xl flex flex-col justify-between ${mod.hoverBorder} cursor-pointer group transition-all duration-150 text-left`}
                >
                  <div>
                    <div className={`w-10 h-10 ${mod.iconColor} rounded-lg flex items-center justify-center mb-4 text-xl`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-white mb-1 group-hover:text-amber-500 transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-slate-500 text-xs leading-relaxed mb-4">
                      {mod.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 uppercase flex justify-between items-center">
                    <span>{mod.status}</span>
                    <span className="text-slate-400 group-hover:text-amber-500 transition-colors">
                      {mod.metric}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Search Architecture Stub */}
        <div className="bg-[#111114] border border-slate-800 rounded-xl p-5 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-white">
                Live Web Search
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-500 border border-amber-500/20">
                Architectural Provider
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              STUB_READY: PLUG_ANY_SEARCH_API
            </span>
          </div>

          <form onSubmit={handleTestSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Query external knowledge architecture (e.g. 'Tech trends 2026')..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-800 bg-[#0A0A0B] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSearching ? 'Querying...' : 'Query'}
            </button>
          </form>

          {searchResult && (
            <div className="mt-3 p-3 rounded-lg bg-[#0A0A0B] border border-slate-800 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span>PROVIDER: <strong className="text-slate-300">{searchResult.provider}</strong></span>
                <span>STATUS: <strong className="text-amber-500">{searchResult.status}</strong></span>
              </div>
              <p className="text-slate-400">{searchResult.summary}</p>
            </div>
          )}
        </div>

        {/* Quick Launch Chips */}
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2.5 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-500" /> Quick Task Starters
          </div>
          <div className="flex flex-wrap gap-2">
            {quickStarters.map((starter, i) => (
              <button
                key={i}
                onClick={starter.action}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#111114] text-slate-300 hover:text-amber-500 hover:border-amber-500/30 border border-slate-800 transition-all flex items-center gap-1.5 group cursor-pointer"
              >
                <span>{starter.label}</span>
                <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sleek Engineered Ecosystem Footer */}
      <footer className="h-12 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between px-6 lg:px-8 bg-[#0D0D10] text-[10px] text-slate-500 font-mono mt-auto shrink-0 select-none">
        <div>ENVIRONMENT: PRODUCTION / MODULE_VER: 1.0.4</div>
        <div className="hidden md:block">PROVIDER_API: ABSTRACTION_LAYER_STABLE</div>
        <div>&copy; 2024 BONGO AI ENGINEERED ECOSYSTEM</div>
      </footer>
    </div>
  );
};

