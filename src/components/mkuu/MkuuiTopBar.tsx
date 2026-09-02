import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Menu,
  ChevronDown,
  Sparkles,
  Zap,
  Bell,
  CheckCheck,
  Trash2,
  Share2,
  Edit2,
  ArrowLeft,
  Mic,
  PanelLeft,
  SquarePen,
  Check,
  X,
  Compass,
} from 'lucide-react';
import { ModuleId } from '../../types';

interface MkuuiTopBarProps {
  onOpenVoiceModal?: () => void;
}

export const MkuuiTopBar: React.FC<MkuuiTopBarProps> = ({ onOpenVoiceModal }) => {
  const {
    currentModule,
    navigateTo,
    activeConversation,
    createConversation,
    setMobileMenuOpen,
    desktopSidebarOpen,
    setDesktopSidebarOpen,
    settings,
    updateSettings,
    notifications,
    markNotificationRead,
    clearAllNotifications,
    clearActiveConversationMessages,
    updateConversationTitle,
    showToast,
  } = useApp();

  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const modelRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadNotifs = notifications.filter(n => !n.read);
  const unreadCount = unreadNotifs.length;

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSaveRename = () => {
    if (activeConversation && newTitle.trim()) {
      updateConversationTitle(activeConversation.id, newTitle.trim());
      showToast({ title: 'Title updated', message: 'Conversation title changed', type: 'success' });
    }
    setIsRenaming(false);
  };

  const getModuleName = (mod: ModuleId): string => {
    switch (mod) {
      case 'chat': return activeConversation?.title || 'ChatGPT';
      case 'studio': return 'Image Studio';
      case 'files': return 'File & Document Analysis';
      case 'vision': return 'Vision & OCR';
      case 'voice': return 'Voice Mode';
      case 'sms': return 'SMS Gateway & Inbox';
      case 'watu-wangu': return 'Watu Wangu (Namba & Simu)';
      case 'auto-reply': return 'SMS Auto Reply Engine';
      case 'history': return 'Chat History';
      case 'memory': return 'Custom Instructions';
      case 'gallery': return 'Image Gallery';
      case 'share': return 'Share Chat';
      case 'notifications': return 'Notifications';
      case 'account': return 'My Account';
      case 'settings': return 'Settings';
      case 'usage': return 'Usage & Stats';
      case 'help': return 'Help & FAQ';
      default: return 'MKUU AI';
    }
  };

  return (
    <header className="h-[52px] bg-white text-gray-900 border-b border-gray-200 px-3 sm:px-4 flex items-center justify-between z-30 shrink-0 select-none">
      {/* Left side: Menu / Sidebar Toggle, New Chat & Model Selector */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Top-Left Menu button */}
        <button
          id="top-left-menu-btn"
          onClick={() => {
            if (window.innerWidth < 1024) {
              setMobileMenuOpen(true);
            } else {
              setDesktopSidebarOpen(!desktopSidebarOpen);
            }
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-700 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer shrink-0 text-xs font-semibold"
          title="Fungua Menyu / Open Menu"
          aria-label="Open Menu"
        >
          <Menu className="w-5 h-5 text-gray-800" />
          <span className="hidden sm:inline font-medium">Menu</span>
        </button>

        {/* New Chat icon (like ChatGPT header) */}
        <button
          id="topbar-new-chat-btn"
          onClick={() => {
            createConversation();
            if (currentModule !== 'chat') navigateTo('chat');
          }}
          className="p-2 rounded-lg text-gray-600 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
          title="New chat"
        >
          <SquarePen className="w-4 h-4" />
        </button>

        {/* If in non-chat module, show Back Button */}
        {currentModule !== 'chat' ? (
          <button
            onClick={() => navigateTo('chat')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Rudi kwenye Chat</span>
            <span className="text-gray-400 hidden sm:inline">|</span>
            <span className="text-gray-600 font-normal hidden sm:inline truncate max-w-[160px]">
              {getModuleName(currentModule)}
            </span>
          </button>
        ) : (
          /* Brand Indicator with Logo */
          <div className="flex items-center gap-2 px-2 py-1">
            <img
              src="/logo.png"
              alt="MKUU AI"
              className="w-6 h-6 rounded-md object-cover border border-gray-200"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="text-sm font-bold text-gray-900 tracking-tight hidden sm:inline">
              MKUU AI
            </span>
          </div>
        )}

        {/* Conversation Title with Inline Rename */}
        {currentModule === 'chat' && activeConversation && (
          <div className="hidden md:flex items-center gap-1.5 min-w-0 ml-1">
            {isRenaming ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveRename()}
                  className="text-xs px-2 py-1 rounded bg-gray-100 border border-gray-300 text-gray-900 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveRename}
                  className="p-1 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsRenaming(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 group">
                <span className="text-xs text-gray-500 truncate max-w-[200px] lg:max-w-xs">
                  {activeConversation.title}
                </span>
                <button
                  onClick={() => {
                    setNewTitle(activeConversation.title);
                    setIsRenaming(true);
                  }}
                  className="text-gray-400 hover:text-gray-700 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Rename conversation"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side: Voice Mode, Share, Notifications */}
      <div className="flex items-center gap-1">
        {/* Voice Mode Quick Launch Button */}
        {onOpenVoiceModal && (
          <button
            onClick={onOpenVoiceModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-semibold transition-all cursor-pointer active:scale-95"
            title="Start Voice Mode"
          >
            <Mic className="w-3.5 h-3.5 text-gray-700" />
            <span className="hidden sm:inline">Voice</span>
          </button>
        )}

        {/* Share active chat */}
        {currentModule === 'chat' && activeConversation && (
          <button
            onClick={() => navigateTo('share')}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Share chat"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            id="mkuu-notifications-btn"
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-gray-200 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-gray-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markNotificationRead()}
                      className="text-[11px] text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Read all
                    </button>
                  )}
                  <button
                    onClick={() => clearAllNotifications()}
                    className="text-gray-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                    title="Clear all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markNotificationRead(notif.id);
                        if (notif.actionUrl) {
                          navigateTo(notif.actionUrl as ModuleId);
                          setNotifOpen(false);
                        }
                      }}
                      className={`p-3.5 transition-colors cursor-pointer hover:bg-gray-50 ${
                        !notif.read ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-gray-900">{notif.title}</span>
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

