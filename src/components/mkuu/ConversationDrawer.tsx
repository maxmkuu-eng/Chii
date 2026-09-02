import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  SquarePen,
  Search,
  Pin,
  Trash2,
  Edit2,
  Sparkles,
  Eye,
  FolderSearch,
  Mic,
  Brain,
  Sliders,
  Smartphone,
  BarChart3,
  HelpCircle,
  X,
  ChevronRight,
  PanelLeftClose,
  Sun,
  Moon,
  Check,
  Share2,
  History,
  AlertTriangle,
  MoreHorizontal,
  Compass,
  User,
  ShieldCheck,
  CheckCheck,
  Zap,
  Users,
  ChevronDown,
  Bot,
} from 'lucide-react';
import { ModuleId, Conversation } from '../../types';
import { Modal } from '../common/Modal';

export const ConversationDrawer: React.FC = () => {
  const {
    currentModule,
    navigateTo,
    createConversation,
    conversations,
    activeConversationId,
    selectConversation,
    deleteConversation,
    togglePinConversation,
    toggleFavoriteConversation,
    updateConversationTitle,
    profile,
    mobileMenuOpen,
    setMobileMenuOpen,
    desktopSidebarOpen,
    setDesktopSidebarOpen,
    settings,
    updateSettings,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [modelSelectorExpanded, setModelSelectorExpanded] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Close on Escape key on mobile
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mobileMenuOpen) setMobileMenuOpen(false);
        setActiveMenuId(null);
        setProfileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen, setMobileMenuOpen]);

  const handleNewChat = () => {
    createConversation();
    navigateTo('chat');
    setMobileMenuOpen(false);
  };

  const handleSelectChat = (id: string) => {
    selectConversation(id);
    if (currentModule !== 'chat') {
      navigateTo('chat');
    }
    setMobileMenuOpen(false);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      updateConversationTitle(id, editTitle.trim());
      showToast({ title: 'Jina limebadilishwa', message: 'Kichwa cha mazungumzo kimesasishwa', type: 'success' });
    }
    setEditingConvId(null);
  };

  const toggleTheme = () => {
    updateSettings({
      theme: settings.theme === 'dark' ? 'light' : 'dark',
    });
  };

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(c => c.title.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  // Group conversations by date (ChatGPT style)
  const groupedConversations = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const sevenDaysAgo = today - 7 * 86400000;
    const thirtyDaysAgo = today - 30 * 86400000;

    const pinned: Conversation[] = [];
    const todayList: Conversation[] = [];
    const yesterdayList: Conversation[] = [];
    const sevenDaysList: Conversation[] = [];
    const thirtyDaysList: Conversation[] = [];
    const earlierList: Conversation[] = [];

    filteredConversations.forEach(c => {
      if (c.isPinned) {
        pinned.push(c);
        return;
      }
      const cTime = new Date(c.updatedAt || c.createdAt).getTime();
      if (cTime >= today) {
        todayList.push(c);
      } else if (cTime >= yesterday) {
        yesterdayList.push(c);
      } else if (cTime >= sevenDaysAgo) {
        sevenDaysList.push(c);
      } else if (cTime >= thirtyDaysAgo) {
        thirtyDaysList.push(c);
      } else {
        earlierList.push(c);
      }
    });

    return { pinned, todayList, yesterdayList, sevenDaysList, thirtyDaysList, earlierList };
  }, [filteredConversations]);

  const toolItems = [
    { id: 'auto-reply' as ModuleId, label: 'SMS Auto Reply (AI Engine)', icon: Bot, badge: 'Smart' },
    { id: 'watu-wangu' as ModuleId, label: 'Watu Wangu (Namba & VIPs)', icon: Users, badge: 'Simu' },
    { id: 'sms' as ModuleId, label: 'SMS Gateway & Inbox', icon: Smartphone, badge: 'Live' },
    { id: 'studio' as ModuleId, label: 'Image Studio (DALL·E)', icon: Sparkles, badge: 'Art' },
    { id: 'files' as ModuleId, label: 'Nyaraka & Files', icon: FolderSearch, badge: null },
    { id: 'vision' as ModuleId, label: 'Vision & OCR Scan', icon: Eye, badge: null },
    { id: 'voice' as ModuleId, label: 'Voice Mode (Sauti)', icon: Mic, badge: null },
    { id: 'memory' as ModuleId, label: 'Custom Instructions', icon: Brain, badge: null },
    { id: 'usage' as ModuleId, label: 'Matumizi & API Usage', icon: BarChart3, badge: null },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          id="mkuu-drawer-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* ChatGPT-style Sidebar Container */}
      <aside
        id="mkuu-navigation-drawer"
        aria-label="ChatGPT Navigation Sidebar"
        className={`
          fixed lg:static top-0 bottom-0 left-0 z-50
          w-[260px] h-full bg-[#f9f9f9] text-gray-900
          flex flex-col flex-shrink-0 border-r border-gray-200
          shadow-2xl lg:shadow-none
          transition-all duration-200 ease-in-out select-none font-sans
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${!desktopSidebarOpen ? 'lg:-ml-[260px]' : ''}
        `}
      >
        {/* Top Header: Sidebar toggle & New Chat button */}
        <div className="p-3 pb-2 flex items-center justify-between shrink-0">
          <div
            onClick={handleNewChat}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-200/60 transition-colors cursor-pointer group flex-1 mr-1"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <img
                src="/logo.png"
                alt="MKUU AI"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="font-bold text-sm text-gray-900 tracking-tight">MKUU AI</span>
              <span className="text-[10px] text-gray-500 truncate">
                {settings.preferredModel === 'gemini-2.5-pro'
                  ? 'MKUU 3.7 Pro'
                  : settings.preferredModel === 'gemini-2.5-flash-lite'
                  ? 'MKUU Flash Lite'
                  : 'MKUU 3.7 Flash'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            {/* New Chat icon */}
            <button
              onClick={handleNewChat}
              id="chatgpt-new-chat-btn"
              className="p-2 rounded-lg text-gray-600 hover:text-black hover:bg-gray-200/60 transition-colors cursor-pointer"
              title="New chat (Ctrl+N)"
            >
              <SquarePen className="w-4 h-4" />
            </button>

            {/* Desktop collapse toggle */}
            <button
              onClick={() => setDesktopSidebarOpen(false)}
              className="hidden lg:flex p-2 rounded-lg text-gray-600 hover:text-black hover:bg-gray-200/60 transition-colors cursor-pointer"
              title="Close sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-black hover:bg-gray-200/60 transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Model Selector in Side Menu (As requested) */}
        <div className="px-2 pb-2 shrink-0">
          <button
            onClick={() => setModelSelectorExpanded(!modelSelectorExpanded)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-gray-200/50 hover:bg-gray-200/80 text-gray-800 text-xs font-semibold transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>
                Model:{' '}
                {settings.preferredModel === 'gemini-2.5-pro'
                  ? '3.7 Pro'
                  : settings.preferredModel === 'gemini-2.5-flash-lite'
                  ? 'Flash Lite'
                  : '3.7 Flash'}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-500 transition-transform ${
                modelSelectorExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {modelSelectorExpanded && (
            <div className="mt-1 space-y-1 p-1 bg-white rounded-xl border border-gray-200 shadow-sm animate-in fade-in duration-150">
              {/* Flash */}
              <button
                onClick={() => {
                  updateSettings({ preferredModel: 'gemini-2.5-flash' });
                  setModelSelectorExpanded(false);
                  showToast({ title: 'Model Updated', message: 'MKUU 3.7 Flash selected', type: 'success' });
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                  settings.preferredModel === 'gemini-2.5-flash' || !settings.preferredModel
                    ? 'bg-gray-100 font-bold text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  <div>
                    <div className="text-xs">MKUU 3.7 Flash</div>
                    <div className="text-[9px] text-gray-500 font-normal">Haraka, akili & uwezo mkuu</div>
                  </div>
                </div>
                {(settings.preferredModel === 'gemini-2.5-flash' || !settings.preferredModel) && (
                  <Check className="w-3.5 h-3.5 text-gray-900" />
                )}
              </button>

              {/* Pro */}
              <button
                onClick={() => {
                  updateSettings({ preferredModel: 'gemini-2.5-pro' });
                  setModelSelectorExpanded(false);
                  showToast({ title: 'Model Updated', message: 'MKUU 3.7 Pro selected', type: 'success' });
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                  settings.preferredModel === 'gemini-2.5-pro'
                    ? 'bg-gray-100 font-bold text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <div>
                    <div className="text-xs">MKUU 3.7 Pro</div>
                    <div className="text-[9px] text-gray-500 font-normal">Uchambuzi wa kina & hesabu</div>
                  </div>
                </div>
                {settings.preferredModel === 'gemini-2.5-pro' && (
                  <Check className="w-3.5 h-3.5 text-gray-900" />
                )}
              </button>

              {/* Flash Lite */}
              <button
                onClick={() => {
                  updateSettings({ preferredModel: 'gemini-2.5-flash-lite' });
                  setModelSelectorExpanded(false);
                  showToast({ title: 'Model Updated', message: 'MKUU Flash Lite selected', type: 'success' });
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                  settings.preferredModel === 'gemini-2.5-flash-lite'
                    ? 'bg-gray-100 font-bold text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  <div>
                    <div className="text-xs">MKUU Flash Lite</div>
                    <div className="text-[9px] text-gray-500 font-normal">Kasi ya juu zaidi</div>
                  </div>
                </div>
                {settings.preferredModel === 'gemini-2.5-flash-lite' && (
                  <Check className="w-3.5 h-3.5 text-gray-900" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Max Explore Button */}
        <div className="px-2 pb-2 shrink-0">
          <button
            onClick={() => setToolsExpanded(!toolsExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-200/60 text-gray-800 text-xs font-medium transition-colors cursor-pointer text-left group"
          >
            <div className="flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-gray-500 group-hover:text-black" />
              <span className="font-semibold text-gray-900">Max Explore</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">
              {toolsExpanded ? '−' : '+'}
            </span>
          </button>

          {toolsExpanded && (
            <div className="mt-1 space-y-0.5 pl-2 animate-in fade-in duration-150">
              {toolItems.map(item => {
                const Icon = item.icon;
                const isActive = currentModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigateTo(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all group cursor-pointer text-left ${
                      isActive
                        ? 'bg-gray-200 text-gray-900 font-semibold'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="w-3.5 h-3.5 shrink-0 text-gray-500" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-gray-200 text-gray-700">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Search Chats */}
        <div className="px-2 pb-2 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg bg-gray-200/60 border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-gray-400 hover:text-black p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Chat History */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4 scrollbar-thin text-left">
          {/* Pinned Chats */}
          {groupedConversations.pinned.length > 0 && (
            <div className="space-y-0.5">
              <div className="text-[11px] font-medium text-gray-500 px-2 py-1">
                Pinned
              </div>
              {groupedConversations.pinned.map(c => renderConversationItem(c))}
            </div>
          )}

          {/* Today */}
          {groupedConversations.todayList.length > 0 && (
            <div className="space-y-0.5">
              <div className="text-[11px] font-medium text-gray-500 px-2 py-1">
                Today
              </div>
              {groupedConversations.todayList.map(c => renderConversationItem(c))}
            </div>
          )}

          {/* Yesterday */}
          {groupedConversations.yesterdayList.length > 0 && (
            <div className="space-y-0.5">
              <div className="text-[11px] font-medium text-gray-500 px-2 py-1">
                Yesterday
              </div>
              {groupedConversations.yesterdayList.map(c => renderConversationItem(c))}
            </div>
          )}

          {/* Previous 7 Days */}
          {groupedConversations.sevenDaysList.length > 0 && (
            <div className="space-y-0.5">
              <div className="text-[11px] font-medium text-gray-500 px-2 py-1">
                Previous 7 Days
              </div>
              {groupedConversations.sevenDaysList.map(c => renderConversationItem(c))}
            </div>
          )}

          {/* Previous 30 Days */}
          {groupedConversations.thirtyDaysList.length > 0 && (
            <div className="space-y-0.5">
              <div className="text-[11px] font-medium text-gray-500 px-2 py-1">
                Previous 30 Days
              </div>
              {groupedConversations.thirtyDaysList.map(c => renderConversationItem(c))}
            </div>
          )}

          {/* Earlier */}
          {groupedConversations.earlierList.length > 0 && (
            <div className="space-y-0.5">
              <div className="text-[11px] font-medium text-gray-500 px-2 py-1">
                Earlier
              </div>
              {groupedConversations.earlierList.map(c => renderConversationItem(c))}
            </div>
          )}

          {filteredConversations.length === 0 && (
            <div className="py-8 text-center text-xs text-gray-400">
              {searchQuery ? 'No chats found' : 'No conversation history'}
            </div>
          )}
        </div>

        {/* ChatGPT-Style Bottom User Profile Section */}
        <div className="p-2 border-t border-gray-200 shrink-0 relative" ref={profileMenuRef}>
          {profileMenuOpen && (
            <div className="absolute bottom-full left-2 right-2 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-1.5 text-xs text-left animate-in fade-in zoom-in-95 duration-150 divide-y divide-gray-100">
              <div className="py-1">
                <button
                  onClick={() => {
                    navigateTo('account');
                    setProfileMenuOpen(false);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-800 transition-colors text-left cursor-pointer"
                >
                  <User className="w-4 h-4 text-gray-500" />
                  <span>My Account ({profile?.name || 'Max'})</span>
                </button>

                <button
                  onClick={() => {
                    navigateTo('sms');
                    setProfileMenuOpen(false);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-800 transition-colors text-left cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-gray-500" />
                  <span>SMS & Auto-Reply Gateway</span>
                </button>

                <button
                  onClick={() => {
                    navigateTo('memory');
                    setProfileMenuOpen(false);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-800 transition-colors text-left cursor-pointer"
                >
                  <Brain className="w-4 h-4 text-gray-500" />
                  <span>Custom Instructions & Memory</span>
                </button>

                <button
                  onClick={() => {
                    navigateTo('settings');
                    setProfileMenuOpen(false);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-800 transition-colors text-left cursor-pointer"
                >
                  <Sliders className="w-4 h-4 text-gray-500" />
                  <span>Settings (Mipangilio)</span>
                </button>
              </div>

              <div className="py-1">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-800 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {settings.theme === 'dark' ? <Sun className="w-4 h-4 text-gray-500" /> : <Moon className="w-4 h-4 text-gray-500" />}
                    <span>Theme: {settings.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    navigateTo('help');
                    setProfileMenuOpen(false);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-800 transition-colors text-left cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-gray-500" />
                  <span>Help & FAQ</span>
                </button>
              </div>
            </div>
          )}

          {/* Profile capsule button */}
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="w-full p-2 rounded-lg hover:bg-gray-200/60 transition-colors flex items-center justify-between text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-black flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                {profile?.name?.charAt(0) || 'M'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-900 truncate">
                    {profile?.name || 'Max Mkuu'}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-gray-200 text-gray-700">
                    Pro
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 truncate">
                  {profile?.email || 'maxmkuu@gmail.com'}
                </p>
              </div>
            </div>
            <MoreHorizontal className="w-4 h-4 text-gray-400 group-hover:text-gray-800 shrink-0" />
          </button>
        </div>
      </aside>

      {/* Delete Confirmation Modal for Drawer */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete chat?"
        maxWidth="sm"
      >
        <div className="space-y-4 text-left">
          <div className="flex items-start gap-3 text-rose-500">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs text-gray-700 space-y-1">
              <p className="font-semibold text-gray-900">
                This will delete the conversation permanently.
              </p>
              {conversations.find(c => c.id === deleteConfirmId) && (
                <p className="italic text-gray-600 bg-gray-100 p-2 rounded-lg truncate">
                  "{conversations.find(c => c.id === deleteConfirmId)?.title}"
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="px-3.5 py-2 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (deleteConfirmId) {
                  deleteConversation(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-sm active:scale-95"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </>
  );

  function renderConversationItem(c: Conversation) {
    const isActive = activeConversationId === c.id && currentModule === 'chat';
    const isEditing = editingConvId === c.id;
    const isMenuOpen = activeMenuId === c.id;

    return (
      <div
        key={c.id}
        className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
          isActive
            ? 'bg-gray-200 text-gray-900 font-medium'
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/50'
        }`}
        onClick={() => !isEditing && handleSelectChat(c.id)}
      >
        {isEditing ? (
          <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveRename(c.id)}
              className="flex-1 px-2 py-0.5 text-xs rounded bg-white border border-gray-300 text-gray-900 focus:outline-none"
              autoFocus
            />
            <button
              onClick={() => handleSaveRename(c.id)}
              className="p-1 text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setEditingConvId(null)}
              className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="truncate">{c.title || 'New chat'}</span>
            </div>

            {/* ChatGPT-style Three dots menu */}
            <div
              className={`flex items-center gap-0.5 ${
                isMenuOpen || isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              } transition-opacity ml-1 shrink-0 relative`}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveMenuId(isMenuOpen ? null : c.id)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                title="Options"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {/* Context Dropdown */}
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-1 text-xs text-left animate-in fade-in zoom-in-95 duration-100"
                >
                  <button
                    onClick={() => {
                      togglePinConversation(c.id);
                      setActiveMenuId(null);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <Pin className="w-3.5 h-3.5" />
                    <span>{c.isPinned ? 'Unpin' : 'Pin'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingConvId(c.id);
                      setEditTitle(c.title);
                      setActiveMenuId(null);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Rename</span>
                  </button>

                  <button
                    onClick={() => {
                      setDeleteConfirmId(c.id);
                      setActiveMenuId(null);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }
};

