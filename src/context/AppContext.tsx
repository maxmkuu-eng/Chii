import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ModuleId,
  Conversation,
  ChatMessage,
  AppSettings,
  AppNotification,
  MemoryItem,
  UserProfile,
} from '../types';
import { api } from '../services/api';

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface AppContextType {
  currentModule: ModuleId;
  navigateTo: (module: ModuleId) => void;
  // Conversations & Chat
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  createConversation: (initialTitle?: string) => Conversation;
  selectConversation: (id: string) => void;
  updateConversationTitle: (id: string, newTitle: string) => void;
  deleteConversation: (id: string) => void;
  deleteMultipleConversations: (ids: string[]) => void;
  clearAllConversations: () => void;
  togglePinConversation: (id: string) => void;
  toggleFavoriteConversation: (id: string) => void;
  addMessageToActiveConversation: (message: ChatMessage) => void;
  updateMessageInActiveConversation: (messageId: string, updates: Partial<ChatMessage>) => void;
  deleteMessageFromActiveConversation: (messageId: string) => void;
  clearActiveConversationMessages: () => void;
  // Settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  // Notifications
  notifications: AppNotification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id?: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  // Memories
  memories: MemoryItem[];
  refreshMemories: () => Promise<void>;
  // User Profile & Identity
  profile: UserProfile | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  refreshProfile: () => Promise<void>;
  // Toasts
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  // UI State
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  desktopSidebarOpen: boolean;
  setDesktopSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  serverHealth: { status: string; hasApiKey: boolean; name?: string } | null;
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  preferredModel: 'gemini-2.5-flash',
  streaming: true,
  streamSpeed: 'normal',
  temperature: 0.7,
  defaultSystemPrompt: 'Wewe ni MKUU AI, msaidizi mkuu mwenye akili bandia ya kisasa, heshima, umakini wa hali ya juu na uwezo wa kutoa taarifa sahihi na zilizothibitishwa. Jibu kwa lugha ya Kiswahili fasaha (au Kiingereza kulingana na mtumiaji), ukitumia mpangilio nadhifu wa Markdown, maelezo yaliyo wazi, na unapotoa matokeo ya mechi, habari za hivi karibuni au taarifa za mtandaoni, orodhesha vyanzo vilivyothibitishwa (Verified Sources).',
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
};

const initialSampleConversation: Conversation = {
  id: 'conv_welcome',
  title: 'Karibu MKUU AI',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isPinned: true,
  isFavorite: true,
  messages: [
    {
      id: 'msg_welcome_1',
      role: 'model',
      content: `# Karibu MKUU AI 👑

Mimi ni **MKUU AI**, msaidizi wako mkuu mwenye akili bandia ya kisasa na uwezo wa hali ya juu:

- **🌐 Utafutaji Halisi Mtandaoni**: Pata taarifa mpya, matokeo ya michezo (kama NBC Premier League), na habari zenye vyanzo vilivyothibitishwa.
- **🎨 MKUU AI Studio**: Unda picha za kuvutia za 3D na michoro ya kidijitali moja kwa moja kutoka kwa maelezo yako.
- **📁 Uchambuzi wa Nyaraka & Files**: Chakata na chambua mafaili ya PDF, DOCX, TXT, CSV na ripoti za kifedha.
- **👁️ Vision & OCR**: Soma maandishi kwenye picha na fanya uchambuzi wa picha za kielektroniki.
- **🧠 Kumbukumbu (Memory)**: Hifadhi mapendeleo yako na miongozo ya kazi zako.

Je, ninaweza kukusaidia nini leo, Boss Max?`,
      timestamp: new Date().toISOString(),
      status: 'complete',
    },
  ],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentModule, setCurrentModule] = useState<ModuleId>('chat');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [serverHealth, setServerHealth] = useState<{ status: string; hasApiKey: boolean; name?: string } | null>(null);

  // Settings State with LocalStorage persistence
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('mkuu_settings') || localStorage.getItem('bongo_settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  // Conversations State with LocalStorage persistence
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('mkuu_conversations') || localStorage.getItem('bongo_conversations');
      return saved ? JSON.parse(saved) : [initialSampleConversation];
    } catch {
      return [initialSampleConversation];
    }
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    try {
      const savedId = localStorage.getItem('mkuu_active_conv') || localStorage.getItem('bongo_active_conv');
      return savedId || 'conv_welcome';
    } catch {
      return 'conv_welcome';
    }
  });

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Memories State
  const [memories, setMemories] = useState<MemoryItem[]>([]);

  // User Profile & Owner Identity State
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Apply Theme class to document root
  useEffect(() => {
    const isDark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('mkuu_settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Persist conversations
  useEffect(() => {
    try {
      localStorage.setItem('mkuu_conversations', JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  useEffect(() => {
    if (activeConversationId) {
      try {
        localStorage.setItem('mkuu_active_conv', activeConversationId);
      } catch {}
    }
  }, [activeConversationId]);

  // Initial Data Fetching from server
  useEffect(() => {
    api.getHealth()
      .then(h => setServerHealth(h))
      .catch(() => setServerHealth({ status: 'offline', hasApiKey: false }));

    refreshNotifications();
    refreshMemories();
    refreshProfile();
  }, []);

  const refreshProfile = async () => {
    try {
      const p = await api.getProfile();
      setProfile(p);
    } catch {
      // Fallback local defaults
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    const updated = await api.updateProfile(updates);
    setProfile(updated);
    refreshMemories();
    return updated;
  };

  const showToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const refreshNotifications = async () => {
    try {
      const list = await api.getNotifications();
      setNotifications(list);
    } catch {
      // Fallback
    }
  };

  const markNotificationRead = async (id?: string) => {
    await api.markNotificationsRead(id);
    setNotifications(prev => prev.map(n => (!id || n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = async () => {
    await api.clearNotifications();
    setNotifications([]);
  };

  const refreshMemories = async () => {
    try {
      const list = await api.getMemories();
      setMemories(list);
    } catch {}
  };

  const navigateTo = (module: ModuleId) => {
    setCurrentModule(module);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    showToast({ title: 'Settings Updated', message: 'Preferences saved successfully', type: 'success' });
  };

  // Conversation Helpers
  const createConversation = (initialTitle?: string): Conversation => {
    const newConv: Conversation = {
      id: 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: initialTitle || 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: false,
      isFavorite: false,
      messages: [],
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    return newConv;
  };

  const selectConversation = (id: string) => {
    setActiveConversationId(id);
    navigateTo('chat');
  };

  const updateConversationTitle = (id: string, newTitle: string) => {
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, title: newTitle, updatedAt: new Date().toISOString() } : c))
    );
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (activeConversationId === id) {
        setActiveConversationId(filtered[0]?.id || null);
      }
      return filtered;
    });
    showToast({ title: 'Mazungumzo Yamefutwa', message: 'Mazungumzo yameondolewa kwenye historia', type: 'info' });
  };

  const deleteMultipleConversations = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    setConversations(prev => {
      const filtered = prev.filter(c => !idSet.has(c.id));
      if (activeConversationId && idSet.has(activeConversationId)) {
        setActiveConversationId(filtered[0]?.id || null);
      }
      return filtered;
    });
    showToast({
      title: 'Mazungumzo Yamefutwa',
      message: `Mazungumzo ${ids.length} yamefutwa kikamilifu`,
      type: 'info',
    });
  };

  const clearAllConversations = () => {
    const newEmptyConv = createConversation('Mazungumzo Mapya');
    setConversations([newEmptyConv]);
    setActiveConversationId(newEmptyConv.id);
    showToast({
      title: 'Historia Imefutwa',
      message: 'Historia yote ya mazungumzo imesafishwa',
      type: 'info',
    });
  };

  const togglePinConversation = (id: string) => {
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
  };

  const toggleFavoriteConversation = (id: string) => {
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
    );
  };

  const addMessageToActiveConversation = (message: ChatMessage) => {
    if (!activeConversationId) return;
    setConversations(prev =>
      prev.map(c => {
        if (c.id === activeConversationId) {
          const updatedMessages = [...c.messages, message];
          let updatedTitle = c.title;
          if (c.messages.length === 0 && message.role === 'user') {
            updatedTitle = message.content.slice(0, 36) + (message.content.length > 36 ? '...' : '');
          }
          return {
            ...c,
            title: updatedTitle,
            messages: updatedMessages,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
  };

  const updateMessageInActiveConversation = (messageId: string, updates: Partial<ChatMessage>) => {
    if (!activeConversationId) return;
    setConversations(prev =>
      prev.map(c => {
        if (c.id === activeConversationId) {
          return {
            ...c,
            messages: c.messages.map(m => (m.id === messageId ? { ...m, ...updates } : m)),
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
  };

  const deleteMessageFromActiveConversation = (messageId: string) => {
    if (!activeConversationId) return;
    setConversations(prev =>
      prev.map(c => {
        if (c.id === activeConversationId) {
          return {
            ...c,
            messages: c.messages.filter(m => m.id !== messageId),
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
    showToast({ title: 'Ujumbe Umefutwa', message: 'Ujumbe umeondolewa kwenye mazungumzo', type: 'info' });
  };

  const clearActiveConversationMessages = () => {
    if (!activeConversationId) return;
    setConversations(prev =>
      prev.map(c => (c.id === activeConversationId ? { ...c, messages: [], updatedAt: new Date().toISOString() } : c))
    );
    showToast({ title: 'Yamesafishwa', message: 'Ujumbe wote kwenye chat hii umefutwa', type: 'info' });
  };

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setMobileMenuOpen(prev => !prev);
    } else {
      setDesktopSidebarOpen(prev => !prev);
    }
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        currentModule,
        navigateTo,
        conversations,
        activeConversationId,
        activeConversation,
        createConversation,
        selectConversation,
        updateConversationTitle,
        deleteConversation,
        deleteMultipleConversations,
        clearAllConversations,
        togglePinConversation,
        toggleFavoriteConversation,
        addMessageToActiveConversation,
        updateMessageInActiveConversation,
        deleteMessageFromActiveConversation,
        clearActiveConversationMessages,
        settings,
        updateSettings,
        notifications,
        unreadCount,
        refreshNotifications,
        markNotificationRead,
        clearAllNotifications,
        memories,
        refreshMemories,
        profile,
        updateProfile,
        refreshProfile,
        toasts,
        showToast,
        removeToast,
        mobileMenuOpen,
        setMobileMenuOpen,
        desktopSidebarOpen,
        setDesktopSidebarOpen,
        toggleSidebar,
        serverHealth,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
