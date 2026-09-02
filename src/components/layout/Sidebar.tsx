import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  Plus,
  History,
  Eye,
  FolderSearch,
  Mic,
  Sparkles,
  Brain,
  User,
  Sliders,
  Smartphone,
  Zap,
  Users,
  Bell,
  ShieldCheck,
  Lock,
  BarChart3,
  HelpCircle,
  X,
  Crown,
  ChevronRight,
  Sun,
  Moon,
  Settings,
  PanelLeftClose,
} from 'lucide-react';
import { ModuleId } from '../../types';

export const Sidebar: React.FC = () => {
  const {
    currentModule,
    navigateTo,
    createConversation,
    conversations,
    unreadCount,
    memories,
    profile,
    mobileMenuOpen,
    setMobileMenuOpen,
    desktopSidebarOpen,
    setDesktopSidebarOpen,
    settings,
    updateSettings,
  } = useApp();

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen, setMobileMenuOpen]);

  const handleNavClick = (moduleId: ModuleId) => {
    navigateTo(moduleId);
    setMobileMenuOpen(false);
  };

  const handleNewChat = () => {
    createConversation();
    navigateTo('chat');
    setMobileMenuOpen(false);
  };

  const toggleTheme = () => {
    updateSettings({
      theme: settings.theme === 'dark' ? 'light' : 'dark',
    });
  };

  const navCategories = [
    {
      label: 'MAIN',
      items: [
        {
          id: 'chat' as ModuleId,
          label: 'BONGO Chat',
          icon: MessageSquare,
          badge: null,
          action: () => handleNavClick('chat'),
        },
        {
          id: 'new-chat-action',
          label: 'New Conversation',
          icon: Plus,
          badge: null,
          action: handleNewChat,
          isAction: true,
        },
        {
          id: 'history' as ModuleId,
          label: 'Chat History',
          icon: History,
          badge: conversations.length > 0 ? String(conversations.length) : null,
          action: () => handleNavClick('history'),
        },
      ],
    },
    {
      label: 'AI TOOLS',
      items: [
        {
          id: 'vision' as ModuleId,
          label: 'Vision',
          icon: Eye,
          badge: 'OCR & Diagrams',
          action: () => handleNavClick('vision'),
        },
        {
          id: 'files' as ModuleId,
          label: 'Files',
          icon: FolderSearch,
          badge: null,
          action: () => handleNavClick('files'),
        },
        {
          id: 'voice' as ModuleId,
          label: 'Voice',
          icon: Mic,
          badge: null,
          action: () => handleNavClick('voice'),
        },
        {
          id: 'studio' as ModuleId,
          label: 'Image Tools',
          icon: Sparkles,
          badge: null,
          action: () => handleNavClick('studio'),
        },
      ],
    },
    {
      label: 'PERSONAL',
      items: [
        {
          id: 'memory' as ModuleId,
          label: 'Memory',
          icon: Brain,
          badge: memories.length > 0 ? String(memories.length) : null,
          action: () => handleNavClick('memory'),
        },
        {
          id: 'account' as ModuleId,
          label: 'Profile',
          icon: User,
          badge: profile?.isOwner ? 'Owner' : null,
          action: () => handleNavClick('account'),
        },
        {
          id: 'settings' as ModuleId,
          label: 'Preferences',
          icon: Sliders,
          badge: null,
          action: () => handleNavClick('settings'),
        },
      ],
    },
    {
      label: 'COMMUNICATION',
      items: [
        {
          id: 'sms' as ModuleId,
          label: 'SMS',
          icon: Smartphone,
          badge: 'Live',
          action: () => handleNavClick('sms'),
        },
        {
          id: 'auto-reply' as ModuleId,
          label: 'Auto Reply',
          icon: Zap,
          badge: null,
          action: () => handleNavClick('auto-reply'),
        },
        {
          id: 'contacts-link',
          label: 'Contacts',
          icon: Users,
          badge: null,
          action: () => handleNavClick('sms'),
        },
      ],
    },
    {
      label: 'SYSTEM',
      items: [
        {
          id: 'notifications' as ModuleId,
          label: 'Notifications',
          icon: Bell,
          badge: unreadCount > 0 ? String(unreadCount) : null,
          badgeColor: 'amber',
          action: () => handleNavClick('notifications'),
        },
        {
          id: 'permissions-link',
          label: 'Permissions',
          icon: ShieldCheck,
          badge: 'Active',
          action: () => handleNavClick('sms'),
        },
        {
          id: 'security-link',
          label: 'Security',
          icon: Lock,
          badge: null,
          action: () => handleNavClick('account'),
        },
        {
          id: 'usage' as ModuleId,
          label: 'Usage Metrics',
          icon: BarChart3,
          badge: null,
          action: () => handleNavClick('usage'),
        },
        {
          id: 'help' as ModuleId,
          label: 'Help & Guides',
          icon: HelpCircle,
          badge: null,
          action: () => handleNavClick('help'),
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileMenuOpen && (
        <div
          id="mobile-drawer-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Side Drawer / Sidebar Container */}
      <aside
        id="app-sidebar-drawer"
        aria-label="Main Navigation Drawer"
        className={`
          fixed lg:static top-0 bottom-0 left-0 z-50
          w-72 h-full bg-[#0E0E12] text-slate-200
          flex flex-col flex-shrink-0 border-r border-slate-800/80
          shadow-2xl lg:shadow-none
          transition-all duration-200 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${!desktopSidebarOpen ? 'lg:-ml-72' : ''}
        `}
      >
        {/* Drawer Header: Brand Logo & Close Button */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-[#0B0B0E] shrink-0">
          <div
            className="flex items-center gap-3 cursor-pointer select-none group"
            onClick={() => {
              navigateTo('chat');
              setMobileMenuOpen(false);
            }}
          >
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-black text-black text-lg shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              B
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-base text-white">
                  BONGO <span className="text-amber-500">AI</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  v2.0
                </span>
              </div>
              <span className="text-[10px] text-slate-500">Premium AI Assistant</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Desktop collapse toggle */}
            <button
              onClick={() => setDesktopSidebarOpen(false)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Profile Card */}
        <div
          onClick={() => {
            navigateTo('account');
            setMobileMenuOpen(false);
          }}
          className="mx-3 mt-3 p-2.5 rounded-xl bg-[#131318] border border-slate-800 hover:border-amber-500/30 cursor-pointer transition-all flex items-center justify-between group shrink-0"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
                profile?.isOwner
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  : 'bg-slate-800 border-slate-700 text-white'
              }`}
            >
              {profile?.isOwner ? <Crown className="w-4 h-4 text-amber-400" /> : (profile?.name?.charAt(0) || 'U')}
            </div>
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-white truncate">
                  {profile?.name || 'Max'}
                </span>
                {profile?.isOwner && (
                  <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-amber-500 text-black">
                    OWNER
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {profile?.preferredTitle || 'Boss Max'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>

        {/* Prominent New Conversation CTA Button */}
        <div className="px-3 pt-3 pb-1 shrink-0">
          <button
            onClick={handleNewChat}
            id="sidebar-new-chat-btn"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs tracking-tight shadow-md shadow-amber-500/15 active:scale-[0.99] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Categorized Navigation List */}
        <nav
          className="flex-1 py-3 px-3 overflow-y-auto space-y-4 scrollbar-thin text-left"
          aria-label="Sidebar Modules"
        >
          {navCategories.map(category => (
            <div key={category.label} className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-3 py-1 select-none">
                {category.label}
              </div>
              <div className="space-y-0.5">
                {category.items.map(item => {
                  const Icon = item.icon;
                  const isActive = currentModule === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`nav-item-${item.id}`}
                      onClick={item.action}
                      className={`w-full min-h-[40px] flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group cursor-pointer text-left ${
                        isActive
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.badgeColor === 'amber' || isActive
                                ? 'bg-amber-500 text-black'
                                : 'bg-slate-800 text-slate-400 group-hover:text-slate-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Drawer Footer: Theme switch & Settings */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0B0B0E] flex items-center justify-between shrink-0 text-slate-400">
          <button
            onClick={() => {
              navigateTo('settings');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 text-xs font-medium transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:text-amber-400 hover:bg-slate-800/60 transition-colors"
            title={settings.theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
            aria-label="Toggle Theme"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
