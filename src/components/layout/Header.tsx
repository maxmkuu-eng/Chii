import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  CheckCheck,
  Trash2,
  ExternalLink,
  ShieldCheck,
  CircleDot,
  User,
  Crown,
  Plus,
  PanelLeft,
} from 'lucide-react';
import { ModuleId } from '../../types';

export const Header: React.FC = () => {
  const {
    currentModule,
    navigateTo,
    createConversation,
    activeConversation,
    settings,
    updateSettings,
    notifications,
    unreadCount,
    markNotificationRead,
    clearAllNotifications,
    profile,
    toggleSidebar,
    desktopSidebarOpen,
  } = useApp();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    updateSettings({
      theme: settings.theme === 'dark' ? 'light' : 'dark',
    });
  };

  const getModuleName = (mod: ModuleId): string => {
    switch (mod) {
      case 'chat':
        return activeConversation?.title || 'BONGO Chat';
      case 'sms':
        return 'BONGO SMS';
      case 'auto-reply':
        return 'Auto Reply Engine';
      case 'history':
        return 'Chat History';
      case 'memory':
        return 'Memory';
      case 'files':
        return 'Files & Documents';
      case 'vision':
        return 'Vision Analysis';
      case 'studio':
        return 'Image Tools';
      case 'gallery':
        return 'Gallery';
      case 'voice':
        return 'Voice Assistant';
      case 'share':
        return 'Share & Export';
      case 'notifications':
        return 'Notifications';
      case 'account':
        return 'Account & Security';
      case 'settings':
        return 'Preferences';
      case 'usage':
        return 'Usage Metrics';
      case 'help':
        return 'Help & Guides';
      case 'dashboard':
        return 'Overview';
      default:
        return 'BONGO AI';
    }
  };

  return (
    <header className="h-14 border-b border-slate-800/80 flex items-center justify-between px-3 sm:px-6 bg-[#09090C] sticky top-0 z-30 select-none">
      {/* Left: Side Menu Toggle Button + Brand / Module Title */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
        <button
          id="side-menu-toggle-button"
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-1.5 cursor-pointer"
          aria-label="Toggle Side Navigation Menu"
          title="Toggle Navigation Menu"
        >
          {desktopSidebarOpen ? (
            <Menu className="w-5 h-5" />
          ) : (
            <PanelLeft className="w-5 h-5 text-amber-500" />
          )}
        </button>

        {/* Minimal Branding / Context Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            onClick={() => navigateTo('chat')}
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <span className="font-bold tracking-tight text-sm sm:text-base text-white">
              BONGO <span className="text-amber-500">AI</span>
            </span>
          </div>

          <span className="text-slate-600 hidden sm:inline text-sm">/</span>

          <span className="text-xs sm:text-sm font-medium text-slate-300 truncate max-w-[160px] sm:max-w-xs md:max-w-md">
            {getModuleName(currentModule)}
          </span>
        </div>
      </div>

      {/* Right Actions: New Chat, Notifications, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Quick New Chat Button */}
        <button
          id="header-new-chat-btn"
          onClick={() => {
            createConversation();
            navigateTo('chat');
          }}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all active:scale-98 cursor-pointer shadow-sm"
          title="Start a new chat session"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span className="hidden sm:inline">New Chat</span>
        </button>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            id="notifications-bell-btn"
            onClick={() => setNotifOpen(!notifOpen)}
            className="w-8 h-8 rounded-lg border border-slate-800 flex items-center justify-center text-slate-400 hover:border-slate-700 hover:text-white transition-colors relative cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-[#09090C]" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#111115] border border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#0D0D10]">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-slate-200">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-500 text-black text-[10px] font-bold rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markNotificationRead()}
                      className="text-[11px] text-amber-500 hover:underline font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Mark read
                    </button>
                  )}
                  <button
                    onClick={() => clearAllNotifications()}
                    className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                    title="Clear all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/80 scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">No new notifications</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 hover:bg-slate-800/50 transition-colors cursor-pointer text-left ${
                        !n.read ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-[#0D0D10] border-t border-slate-800 text-center">
                <button
                  onClick={() => {
                    setNotifOpen(false);
                    navigateTo('notifications');
                  }}
                  className="text-xs font-medium text-amber-500 hover:underline cursor-pointer"
                >
                  View all in Notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Minimal Theme Switcher */}
        <button
          id="header-theme-toggle-btn"
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg border border-slate-800 flex items-center justify-center text-slate-400 hover:border-slate-700 hover:text-white transition-colors cursor-pointer"
          title={settings.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {settings.theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Profile Avatar Button */}
        <div className="relative" ref={profileRef}>
          <button
            id="profile-avatar-button"
            onClick={() => setProfileOpen(!profileOpen)}
            className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-colors cursor-pointer ${
              profile?.isOwner
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-400 hover:border-amber-400'
                : 'bg-slate-800 border-slate-700 text-white hover:border-slate-600'
            }`}
            aria-label="User Profile Menu"
          >
            {profile?.isOwner ? <Crown className="w-3.5 h-3.5 text-amber-400" /> : (profile?.name?.charAt(0) || 'U')}
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#111115] border border-slate-800 shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-150 text-left">
              <div className="px-3 py-2 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-200">{profile?.name || 'Max'}</p>
                  {profile?.isOwner && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-black flex items-center gap-0.5">
                      <Crown className="w-2.5 h-2.5" /> OWNER
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">{profile?.preferredTitle || 'Boss Max'}</p>
                <div className="mt-1 flex items-center justify-between text-[10px]">
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> Verified Pro
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigateTo('account');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/80 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-amber-500" />
                  <span>Account & Profile</span>
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigateTo('usage');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/80 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <CircleDot className="w-3.5 h-3.5 text-slate-400" />
                  <span>Usage & Metrics</span>
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigateTo('settings');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/80 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>Preferences</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
