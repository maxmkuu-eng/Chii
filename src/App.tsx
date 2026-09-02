import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MkuuiTopBar } from './components/mkuu/MkuuiTopBar';
import { ConversationDrawer } from './components/mkuu/ConversationDrawer';
import { VoiceOverlay } from './components/mkuu/VoiceOverlay';
import { ToastContainer } from './components/common/Toast';

// Workspaces
import { DashboardModule } from './components/modules/DashboardModule';
import { ChatModule } from './components/modules/ChatModule';
import { SmsModule } from './components/modules/SmsModule';
import { WatuWanguModule } from './components/modules/WatuWanguModule';
import { AutoReplyModule } from './components/modules/AutoReplyModule';
import { HistoryModule } from './components/modules/HistoryModule';
import { MemoryModule } from './components/modules/MemoryModule';
import { FilesModule } from './components/modules/FilesModule';
import { VisionModule } from './components/modules/VisionModule';
import { StudioModule } from './components/modules/StudioModule';
import { GalleryModule } from './components/modules/GalleryModule';
import { VoiceModule } from './components/modules/VoiceModule';
import { ShareExportModule } from './components/modules/ShareExportModule';
import { NotificationsModule } from './components/modules/NotificationsModule';
import { AccountModule } from './components/modules/AccountModule';
import { SettingsModule } from './components/modules/SettingsModule';
import { UsageModule } from './components/modules/UsageModule';
import { HelpModule } from './components/modules/HelpModule';

const AppContent: React.FC = () => {
  const { currentModule } = useApp();
  const [voiceOverlayOpen, setVoiceOverlayOpen] = useState(false);

  const renderCurrentModule = () => {
    switch (currentModule) {
      case 'chat':
        return <ChatModule onOpenVoiceModal={() => setVoiceOverlayOpen(true)} />;
      case 'dashboard':
        return <DashboardModule />;
      case 'sms':
        return <SmsModule />;
      case 'watu-wangu':
        return <WatuWanguModule />;
      case 'auto-reply':
        return <AutoReplyModule />;
      case 'history':
        return <HistoryModule />;
      case 'memory':
        return <MemoryModule />;
      case 'files':
        return <FilesModule />;
      case 'vision':
        return <VisionModule />;
      case 'studio':
        return <StudioModule />;
      case 'gallery':
        return <GalleryModule />;
      case 'voice':
        return <VoiceModule />;
      case 'share':
        return <ShareExportModule />;
      case 'notifications':
        return <NotificationsModule />;
      case 'account':
        return <AccountModule />;
      case 'settings':
        return <SettingsModule />;
      case 'usage':
        return <UsageModule />;
      case 'help':
        return <HelpModule />;
      default:
        return <ChatModule onOpenVoiceModal={() => setVoiceOverlayOpen(true)} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-gray-900 font-sans transition-colors select-auto">
      {/* ChatGPT-style Left Navigation Sidebar */}
      <ConversationDrawer />

      {/* Main Workspace Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white relative">
        <MkuuiTopBar onOpenVoiceModal={() => setVoiceOverlayOpen(true)} />
        <main className="flex-1 overflow-y-auto scrollbar-thin bg-white">
          {renderCurrentModule()}
        </main>
      </div>

      {/* Real-time Voice Mode Overlay */}
      <VoiceOverlay
        isOpen={voiceOverlayOpen}
        onClose={() => setVoiceOverlayOpen(false)}
      />

      {/* Global Toast Alerts */}
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
