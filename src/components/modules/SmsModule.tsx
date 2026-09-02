import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  SmsConversation,
  SmsMessage,
  SimCard,
  SmsPermissions,
  AutoReplySettings,
  AutoReplyLog,
  SmsNotificationSettings,
  PermissionState,
} from '../../types';
import {
  Smartphone,
  Send,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Radio,
  Sliders,
  Clock,
  History,
  Bell,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Play,
  RotateCcw,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  Settings as SettingsIcon,
  Phone,
  User,
  Users,
  Power,
  AlertOctagon,
  Trash2,
  ArrowRight,
  Cpu,
  Eye,
  Calendar,
} from 'lucide-react';
import { KillSwitchControl } from '../sms/KillSwitchControl';
import { WatuWanguManager } from '../sms/WatuWanguManager';
import { SmsInboxView } from '../sms/SmsInboxView';

type SmsTab = 'inbox' | 'compose' | 'watuwangu' | 'autoreply' | 'sims' | 'permissions' | 'notifications' | 'history' | 'simulator';

export const SmsModule: React.FC = () => {
  const { showToast } = useApp();

  const [activeTab, setActiveTab] = useState<SmsTab>('inbox');
  const [conversations, setConversations] = useState<SmsConversation[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [simCards, setSimCards] = useState<SimCard[]>([]);
  const [permissions, setPermissions] = useState<SmsPermissions>({
    readSms: 'granted',
    receiveSms: 'granted',
    sendSms: 'granted',
    notifications: 'granted',
  });
  const [autoReplySettings, setAutoReplySettings] = useState<AutoReplySettings | null>(null);
  const [logs, setLogs] = useState<AutoReplyLog[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<SmsNotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter in Inbox
  const [searchQuery, setSearchQuery] = useState('');
  const [replyInput, setReplyInput] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Manual Compose State
  const [composeRecipient, setComposeRecipient] = useState('');
  const [composeRecipientName, setComposeRecipientName] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [composeSimSlot, setComposeSimSlot] = useState<'SIM 1' | 'SIM 2'>('SIM 1');
  const [isSendingCompose, setIsSendingCompose] = useState(false);

  // Auto Reply First-Time Confirmation Modal State
  const [showAutoReplyConfirmModal, setShowAutoReplyConfirmModal] = useState(false);

  // Permission Pre-Request Explanation Modal State
  const [pendingPermissionReq, setPendingPermissionReq] = useState<keyof SmsPermissions | null>(null);

  // Auto Reply Log Inspection Drawer
  const [selectedLog, setSelectedLog] = useState<AutoReplyLog | null>(null);

  // Live Simulator State
  const [simSender, setSimSender] = useState('+255 754 888 111');
  const [simSenderName, setSimSenderName] = useState('Alex Johnson');
  const [simContent, setSimContent] = useState('Hey Max! Are you available to review the project deliverables this afternoon?');
  const [simSlotTarget, setSimSlotTarget] = useState<'SIM 1' | 'SIM 2'>('SIM 1');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any | null>(null);

  // Load all SMS Subsystem data
  const loadData = async () => {
    try {
      setLoading(true);
      const [convs, sims, perms, arSettings, arLogs, notifSettings] = await Promise.all([
        api.sms.getConversations(),
        api.sms.getSimCards(),
        api.sms.getPermissions(),
        api.sms.getAutoReplySettings(),
        api.sms.getAutoReplyLogs(),
        api.sms.getNotificationSettings(),
      ]);

      setConversations(convs);
      setSimCards(sims);
      setPermissions(perms);
      setAutoReplySettings(arSettings);
      setLogs(arLogs);
      setNotificationSettings(notifSettings);

      if (convs.length > 0 && !selectedThreadId) {
        setSelectedThreadId(convs[0].id);
      }
    } catch (err: any) {
      showToast({ title: 'Error Loading SMS', message: err.message || 'Failed to connect to SMS module', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedThread = useMemo(() => {
    return conversations.find(c => c.id === selectedThreadId) || null;
  }, [conversations, selectedThreadId]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      c =>
        c.phoneNumber.toLowerCase().includes(q) ||
        (c.contactName && c.contactName.toLowerCase().includes(q)) ||
        c.lastMessage.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  // Handle Permission Request Flow with mandatory pre-explanation
  const handleRequestPermission = (permKey: keyof SmsPermissions) => {
    setPendingPermissionReq(permKey);
  };

  const confirmGrantPermission = async () => {
    if (!pendingPermissionReq) return;
    try {
      const updated = await api.sms.updatePermission(pendingPermissionReq, 'granted');
      setPermissions(updated);
      showToast({ title: 'Permission Granted', message: `Android ${pendingPermissionReq} permission enabled`, type: 'success' });
    } catch {
      showToast({ title: 'Error', message: 'Failed to update permission state', type: 'error' });
    } finally {
      setPendingPermissionReq(null);
    }
  };

  const denyPermission = async (permanent = false) => {
    if (!pendingPermissionReq) return;
    try {
      const updated = await api.sms.updatePermission(
        pendingPermissionReq,
        permanent ? 'permanently_denied' : 'denied'
      );
      setPermissions(updated);
      showToast({
        title: 'Permission Denied',
        message: `Feature requiring ${pendingPermissionReq} will be disabled safely`,
        type: 'warning',
      });
    } catch {} finally {
      setPendingPermissionReq(null);
    }
  };

  // Toggle Auto Reply with First-Time safety check
  const handleToggleAutoReply = async (targetValue: boolean) => {
    if (!autoReplySettings) return;

    if (targetValue && !autoReplySettings.firstTimeConfirmed) {
      setShowAutoReplyConfirmModal(true);
      return;
    }

    try {
      const updated = await api.sms.updateAutoReplySettings({ enabled: targetValue });
      setAutoReplySettings(updated);
      showToast({
        title: targetValue ? 'Auto Reply Activated' : 'Auto Reply Deactivated',
        message: targetValue
          ? `BONGO will automatically respond using ${updated.selectedSimSlot}`
          : 'BONGO will not respond to incoming SMS automatically',
        type: targetValue ? 'success' : 'info',
      });
    } catch {
      showToast({ title: 'Error', message: 'Failed to toggle Auto Reply state', type: 'error' });
    }
  };

  const handleConfirmFirstTimeAutoReply = async () => {
    try {
      const updated = await api.sms.updateAutoReplySettings({
        enabled: true,
        firstTimeConfirmed: true,
      });
      setAutoReplySettings(updated);
      setShowAutoReplyConfirmModal(false);
      showToast({
        title: 'Auto Reply Enabled',
        message: `BONGO Auto Reply is now ON using ${updated.selectedSimSlot}`,
        type: 'success',
      });
    } catch {
      showToast({ title: 'Error', message: 'Failed to activate Auto Reply', type: 'error' });
    }
  };

  // Send Manual Reply in Active Thread
  const handleSendThreadReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || !replyInput.trim() || sendingReply) return;

    try {
      setSendingReply(true);
      const res = await api.sms.sendSms({
        recipient: selectedThread.phoneNumber,
        recipientName: selectedThread.contactName,
        content: replyInput.trim(),
        simSlot: selectedThread.simSlot,
      });

      setConversations(prev =>
        prev.map(c => (c.id === selectedThread.id ? res.thread : c))
      );
      setReplyInput('');
      showToast({ title: 'SMS Sent', message: `Delivered via ${selectedThread.simSlot}`, type: 'success' });
    } catch (err: any) {
      showToast({ title: 'SMS Failed', message: err.message || 'Could not send SMS', type: 'error' });
    } finally {
      setSendingReply(false);
    }
  };

  // Manual Compose
  const handleManualCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeRecipient.trim() || !composeContent.trim() || isSendingCompose) return;

    try {
      setIsSendingCompose(true);
      const res = await api.sms.sendSms({
        recipient: composeRecipient.trim(),
        recipientName: composeRecipientName.trim() || undefined,
        content: composeContent.trim(),
        simSlot: composeSimSlot,
      });

      await loadData();
      setSelectedThreadId(res.thread.id);
      setActiveTab('inbox');
      setComposeRecipient('');
      setComposeRecipientName('');
      setComposeContent('');
      showToast({ title: 'SMS Sent Successfully', message: `Dispatched via ${composeSimSlot}`, type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Failed to Send SMS', message: err.message || 'Send operation failed', type: 'error' });
    } finally {
      setIsSendingCompose(false);
    }
  };

  // Execute Live SMS Simulation Pipeline
  const handleRunSimulator = async () => {
    if (!simSender.trim() || !simContent.trim() || isSimulating) return;

    try {
      setIsSimulating(true);
      setSimResult(null);

      const res = await api.sms.simulateIncomingSms({
        sender: simSender.trim(),
        senderName: simSenderName.trim() || undefined,
        content: simContent.trim(),
        simSlot: simSlotTarget,
      });

      setSimResult(res);
      await loadData();

      if (res.autoReplySent) {
        showToast({
          title: 'Auto Reply Generated & Sent',
          message: `Responded via ${autoReplySettings?.selectedSimSlot}`,
          type: 'success',
        });
      } else if (res.autoReplyAttempted) {
        showToast({
          title: 'Auto Reply Skipped/Failed',
          message: res.reason || 'Pipeline evaluated safely without sending',
          type: 'warning',
        });
      } else {
        showToast({
          title: 'Incoming SMS Ingested',
          message: 'Saved to inbox. Auto Reply was not triggered.',
          type: 'info',
        });
      }
    } catch (err: any) {
      showToast({ title: 'Simulation Error', message: err.message || 'Simulation pipeline failed', type: 'error' });
    } finally {
      setIsSimulating(false);
    }
  };

  // Permission badge helper
  const renderPermissionBadge = (state: PermissionState) => {
    switch (state) {
      case 'granted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Granted
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> Denied
          </span>
        );
      case 'permanently_denied':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-600/20 text-red-300 border border-red-500/30">
            <ShieldX className="w-3 h-3" /> Blocked in Settings
          </span>
        );
      case 'required':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> Required
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0B] text-slate-200">
      {/* Top Banner: Module Overview & Live Auto Reply Status */}
      <div className="border-b border-slate-800 bg-[#111114] px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">MKUU SMS & Auto Reply</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                  Isolated Workspace
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage cellular SMS communications, dual-SIM routing, sensitive Android permissions, and intelligent AI auto-replies.
              </p>
            </div>
          </div>

          {/* Master Auto Reply Control Quick Header & Kill Switch */}
          <div className="flex items-center gap-3 bg-[#0D0D10] border border-slate-800 p-2 rounded-xl">
            {/* Emergency Kill Switch Compact Button */}
            <KillSwitchControl
              killSwitchActive={autoReplySettings?.killSwitchActive || false}
              onStatusChange={async () => {
                await loadData();
              }}
              compact={true}
            />

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Auto Reply Engine</span>
              <span className="text-xs font-semibold flex items-center justify-end gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    autoReplySettings?.enabled && !autoReplySettings?.killSwitchActive
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-slate-600'
                  }`}
                />
                <span
                  className={
                    autoReplySettings?.killSwitchActive
                      ? 'text-red-400 font-bold'
                      : autoReplySettings?.enabled
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }
                >
                  {autoReplySettings?.killSwitchActive
                    ? 'KILLED (DHARURA)'
                    : autoReplySettings?.enabled
                    ? `ACTIVE (${autoReplySettings.selectedSimSlot})`
                    : 'DISABLED'}
                </span>
              </span>
            </div>

            <button
              onClick={() => handleToggleAutoReply(!autoReplySettings?.enabled)}
              id="sms-auto-reply-master-toggle"
              disabled={autoReplySettings?.killSwitchActive}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                autoReplySettings?.enabled && !autoReplySettings?.killSwitchActive
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {autoReplySettings?.enabled ? 'Turn OFF' : 'Turn ON'}
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto mt-4 pt-2 border-t border-slate-800/60 scrollbar-thin">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'inbox'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Inbox & Threads</span>
            {conversations.length > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">
                {conversations.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('watuwangu')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'watuwangu'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Watu Wangu (VIP)</span>
          </button>

          <button
            onClick={() => setActiveTab('compose')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'compose'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send SMS</span>
          </button>

          <button
            onClick={() => setActiveTab('autoreply')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'autoreply'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto Reply Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('sims')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sims'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>SIM Selection</span>
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'permissions'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Permissions</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notifications</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Auto Reply History</span>
            {logs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">
                {logs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-purple-400/80 hover:text-purple-300 hover:bg-purple-950/30 border border-transparent'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Live Test Simulator</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* ============================================================ */}
        {/* TAB 1: INBOX & CONVERSATION THREADS (WITH DELETE & BATCH) */}
        {/* ============================================================ */}
        {activeTab === 'inbox' && (
          <SmsInboxView
            conversations={conversations}
            selectedThreadId={selectedThreadId}
            onSelectThread={setSelectedThreadId}
            onRefreshData={loadData}
            onOpenInComposer={(recipient, name, sim) => {
              setComposeRecipient(recipient);
              setComposeRecipientName(name || '');
              if (sim) setComposeSimSlot(sim);
              setActiveTab('compose');
            }}
          />
        )}

        {/* ============================================================ */}
        {/* TAB 1.5: WATU WANGU (INNER CIRCLE & VIP CONTACTS) */}
        {/* ============================================================ */}
        {activeTab === 'watuwangu' && (
          <WatuWanguManager
            onSelectContactToCompose={(phoneNumber, name) => {
              setComposeRecipient(phoneNumber);
              setComposeRecipientName(name);
              setActiveTab('compose');
            }}
          />
        )}

        {/* ============================================================ */}
        {/* TAB 2: SEND SMS / COMPOSER */}
        {/* ============================================================ */}
        {activeTab === 'compose' && (
          <div className="h-full overflow-y-auto p-6 max-w-3xl mx-auto scrollbar-thin">
            <div className="bg-[#111114] border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 pb-5 border-b border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Direct SMS Dispatcher</h2>
                  <p className="text-xs text-slate-400">Compose and transmit cellular SMS through selected hardware line.</p>
                </div>
              </div>

              <form onSubmit={handleManualCompose} className="mt-5 space-y-5">
                {/* SIM Selection Radio */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Select Outgoing SIM Line
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {simCards.map(sim => (
                      <div
                        key={sim.id}
                        onClick={() => setComposeSimSlot(sim.slotLabel)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          composeSimSlot === sim.slotLabel
                            ? 'bg-amber-500/10 border-amber-500/50 text-white'
                            : 'bg-[#0D0D10] border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Radio
                            className={`w-4 h-4 ${
                              composeSimSlot === sim.slotLabel ? 'text-amber-500' : 'text-slate-600'
                            }`}
                          />
                          <div>
                            <div className="text-xs font-bold">{sim.displayName}</div>
                            <div className="text-[11px] font-mono text-slate-400">{sim.phoneNumber}</div>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                            sim.isAvailable
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {sim.isAvailable ? 'Online' : 'Disabled'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recipient Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Recipient Phone Number <span className="text-amber-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={composeRecipient}
                      onChange={e => setComposeRecipient(e.target.value)}
                      placeholder="+255 754 000 000"
                      required
                      className="w-full bg-[#0D0D10] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Contact Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={composeRecipientName}
                      onChange={e => setComposeRecipientName(e.target.value)}
                      placeholder="e.g. Alex Johnson"
                      className="w-full bg-[#0D0D10] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                {/* Message Content & Segment Counter */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Message Content <span className="text-amber-500">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {composeContent.length} chars • {Math.max(1, Math.ceil(composeContent.length / 160))} SMS segment(s)
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={composeContent}
                    onChange={e => setComposeContent(e.target.value)}
                    placeholder="Type your SMS message here..."
                    required
                    className="w-full bg-[#0D0D10] border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none"
                  />
                </div>

                {/* Safety Warnings & Action */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    Sending an SMS will transmit via standard carrier cellular protocols using <strong>{composeSimSlot}</strong>. Standard carrier SMS rates apply based on your active SIM subscription.
                  </span>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setComposeRecipient('');
                      setComposeContent('');
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800"
                  >
                    Reset Fields
                  </button>
                  <button
                    type="submit"
                    disabled={!composeRecipient.trim() || !composeContent.trim() || isSendingCompose}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-amber-500/10"
                  >
                    {isSendingCompose ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Transmit SMS</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: AUTO REPLY CONFIGURATION & RULES */}
        {/* ============================================================ */}
        {activeTab === 'autoreply' && autoReplySettings && (
          <div className="h-full overflow-y-auto p-6 max-w-4xl mx-auto space-y-6 scrollbar-thin">
            {/* Master Emergency Kill Switch Banner */}
            <KillSwitchControl
              killSwitchActive={autoReplySettings.killSwitchActive || false}
              onStatusChange={async () => {
                await loadData();
              }}
            />

            {/* Status Card */}
            <div className="bg-[#111114] border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">MKUU Auto Reply Module</h2>
                    <p className="text-xs text-slate-400">
                      Configure automated response filters, reply personality, and dual-SIM transmission line.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleAutoReply(!autoReplySettings.enabled)}
                  disabled={autoReplySettings.killSwitchActive}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    autoReplySettings.enabled && !autoReplySettings.killSwitchActive
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      autoReplySettings.enabled && !autoReplySettings.killSwitchActive ? 'bg-black animate-ping' : 'bg-slate-500'
                    }`}
                  />
                  <span>
                    {autoReplySettings.killSwitchActive
                      ? 'Auto Reply: KILLED'
                      : autoReplySettings.enabled
                      ? 'Auto Reply: ON'
                      : 'Auto Reply: OFF'}
                  </span>
                </button>
              </div>

              {/* SIM Line for Auto Reply */}
              <div className="mt-5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Auto Reply Outgoing SIM Line
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {simCards.map(sim => (
                    <div
                      key={sim.id}
                      onClick={async () => {
                        const updated = await api.sms.updateAutoReplySettings({
                          selectedSimSlot: sim.slotLabel,
                          selectedSimId: sim.id,
                        });
                        setAutoReplySettings(updated);
                        showToast({
                          title: 'Auto Reply SIM Updated',
                          message: `Auto replies will route via ${sim.slotLabel}`,
                          type: 'info',
                        });
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        autoReplySettings.selectedSimSlot === sim.slotLabel
                          ? 'bg-amber-500/10 border-amber-500 text-white shadow-sm'
                          : 'bg-[#0D0D10] border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Radio
                          className={`w-4 h-4 ${
                            autoReplySettings.selectedSimSlot === sim.slotLabel
                              ? 'text-amber-500'
                              : 'text-slate-600'
                          }`}
                        />
                        <div>
                          <div className="text-xs font-bold">{sim.displayName}</div>
                          <div className="text-[11px] font-mono text-slate-400">{sim.phoneNumber}</div>
                        </div>
                      </div>
                      {autoReplySettings.selectedSimSlot === sim.slotLabel && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-black font-bold">
                          Selected Line
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Audience Filters */}
            <div className="bg-[#111114] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <User className="w-4 h-4 text-amber-500" />
                <span>Audience & Sender Filters</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { id: 'everyone', label: 'Watu Wote (Everyone)', desc: 'Respond to all incoming SMS messages from any sender' },
                  { id: 'watu_wangu_only', label: '⭐ Watu Wangu Tu (VIPs Only)', desc: 'Only reply to contacts saved in your Watu Wangu inner circle' },
                  { id: 'exclude_watu_wangu', label: 'Usijibu Watu Wangu', desc: 'Reply to others, but leave Watu Wangu for your direct manual attention' },
                  { id: 'selected_contacts', label: 'Selected Contacts', desc: 'Only reply to authorized contacts' },
                  { id: 'selected_numbers', label: 'Selected Numbers', desc: 'Only reply to specific configured phone numbers' },
                ].map(opt => (
                  <div
                    key={opt.id}
                    onClick={async () => {
                      const updated = await api.sms.updateAutoReplySettings({
                        audience: opt.id as any,
                      });
                      setAutoReplySettings(updated);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      autoReplySettings.audience === opt.id
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-sm'
                        : 'bg-[#0D0D10] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold mb-1">{opt.label}</div>
                    <div className="text-[11px] text-slate-500">{opt.desc}</div>
                  </div>
                ))}
              </div>

              {/* Excluded Numbers Section */}
              <div className="pt-3 border-t border-slate-800/60">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Excluded Senders & Promos (Never Auto Reply)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {autoReplySettings.excludedNumbers.map((num, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5"
                    >
                      <span>{num}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Schedule Rules */}
            <div className="bg-[#111114] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>Auto Reply Schedule</span>
              </h3>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="scheduleType"
                    checked={autoReplySettings.scheduleType === 'always'}
                    onChange={async () => {
                      const updated = await api.sms.updateAutoReplySettings({ scheduleType: 'always' });
                      setAutoReplySettings(updated);
                    }}
                    className="accent-amber-500"
                  />
                  <span>Always active (24/7)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="scheduleType"
                    checked={autoReplySettings.scheduleType === 'custom'}
                    onChange={async () => {
                      const updated = await api.sms.updateAutoReplySettings({ scheduleType: 'custom' });
                      setAutoReplySettings(updated);
                    }}
                    className="accent-amber-500"
                  />
                  <span>Custom Schedule</span>
                </label>
              </div>

              {autoReplySettings.scheduleType === 'custom' && (
                <div className="space-y-2 pt-2">
                  {autoReplySettings.schedules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#0D0D10] border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <div>
                          <p className="font-semibold text-white">{rule.description}</p>
                          <p className="text-[11px] text-slate-500">
                            Active Window: {rule.startHour.toString().padStart(2, '0')}:
                            {rule.startMinute.toString().padStart(2, '0')} – {rule.endHour.toString().padStart(2, '0')}:
                            {rule.endMinute.toString().padStart(2, '0')}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Rule Configured
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reply Behavior & Style */}
            <div className="bg-[#111114] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-500" />
                <span>Response Style & Intelligence</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'ai_with_instructions', label: 'AI + Custom Instructions', desc: 'Gemini AI evaluates SMS and crafts concise reply following your rules' },
                  { id: 'ai_generated', label: 'Pure AI-Generated', desc: 'BONGO reads message and automatically determines optimal response' },
                  { id: 'custom_message', label: 'Fixed Template Message', desc: 'Static predetermined text message sent identically to every incoming SMS' },
                ].map(style => (
                  <div
                    key={style.id}
                    onClick={async () => {
                      const updated = await api.sms.updateAutoReplySettings({
                        replyStyle: style.id as any,
                      });
                      setAutoReplySettings(updated);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      autoReplySettings.replyStyle === style.id
                        ? 'bg-amber-500/10 border-amber-500 text-white'
                        : 'bg-[#0D0D10] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold mb-1">{style.label}</div>
                    <div className="text-[11px] text-slate-500">{style.desc}</div>
                  </div>
                ))}
              </div>

              {/* Instructions or Fixed Text Area */}
              {autoReplySettings.replyStyle !== 'custom_message' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    AI Auto Reply Prompt Guidelines
                  </label>
                  <textarea
                    rows={3}
                    value={autoReplySettings.aiInstructions}
                    onChange={e =>
                      setAutoReplySettings({ ...autoReplySettings, aiInstructions: e.target.value })
                    }
                    onBlur={async () => {
                      await api.sms.updateAutoReplySettings({
                        aiInstructions: autoReplySettings.aiInstructions,
                      });
                      showToast({ title: 'Saved', message: 'AI instructions updated', type: 'success' });
                    }}
                    placeholder="e.g. Keep replies short and polite. Mention that Max is in surgery and will follow up tomorrow."
                    className="w-full bg-[#0D0D10] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Fixed Auto Reply Text Template
                  </label>
                  <textarea
                    rows={3}
                    value={autoReplySettings.customMessage}
                    onChange={e =>
                      setAutoReplySettings({ ...autoReplySettings, customMessage: e.target.value })
                    }
                    onBlur={async () => {
                      await api.sms.updateAutoReplySettings({
                        customMessage: autoReplySettings.customMessage,
                      });
                      showToast({ title: 'Saved', message: 'Custom template message updated', type: 'success' });
                    }}
                    placeholder="e.g. Hi, I am currently unavailable. I will respond to your text as soon as possible."
                    className="w-full bg-[#0D0D10] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: SIM CARDS & DUAL-SIM MANAGEMENT */}
        {/* ============================================================ */}
        {activeTab === 'sims' && (
          <div className="h-full overflow-y-auto p-6 max-w-3xl mx-auto space-y-6 scrollbar-thin">
            <div className="bg-[#111114] border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 pb-5 border-b border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Dual-SIM Hardware Manager</h2>
                  <p className="text-xs text-slate-400">
                    Explicit carrier slot routing. BONGO will never assume SIM 1 or silently switch SIM lines.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {simCards.map(sim => (
                  <div
                    key={sim.id}
                    className="p-5 bg-[#0D0D10] border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-amber-400">
                        {sim.slotLabel}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-white">{sim.carrierName}</h3>
                          <span
                            className={`text-[10px] px-2 py-0.2 rounded font-mono ${
                              sim.isAvailable
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {sim.isAvailable ? 'SIM Active' : 'Disconnected / No Signal'}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">{sim.phoneNumber || 'Number not broadcasted'}</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Slot #{sim.slotIndex} • Signal Level: {sim.signalStrength || 4}/5 bars
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          const updated = await api.sms.updateSimCards([
                            { id: sim.id, isAvailable: !sim.isAvailable },
                          ]);
                          setSimCards(updated);
                          showToast({
                            title: 'SIM State Toggled',
                            message: `${sim.slotLabel} is now ${!sim.isAvailable ? 'Online' : 'Offline'}`,
                            type: 'info',
                          });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          sim.isAvailable
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {sim.isAvailable ? 'Simulate Disconnect' : 'Simulate Reconnect'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Safety Rule Notice */}
              <div className="mt-5 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-amber-400">Strict Dual-SIM Safeguard:</strong> If your selected Auto Reply SIM becomes unavailable, BONGO will <strong>NOT</strong> switch automatically to the other SIM card. It will halt automatic sending and issue an error notification to protect you from transmitting on the wrong personal or enterprise line.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: PERMISSIONS SETUP & ANDROID INTEGRATION */}
        {/* ============================================================ */}
        {activeTab === 'permissions' && (
          <div className="h-full overflow-y-auto p-6 max-w-3xl mx-auto space-y-6 scrollbar-thin">
            <div className="bg-[#111114] border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 pb-5 border-b border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">BONGO SMS Permission Center</h2>
                  <p className="text-xs text-slate-400">
                    Sensitive Android telephony permissions required for background reception and automated SMS replies.
                  </p>
                </div>
              </div>

              {/* Permissions List */}
              <div className="mt-5 space-y-3">
                {[
                  {
                    key: 'readSms' as keyof SmsPermissions,
                    title: 'Read SMS (READ_SMS)',
                    desc: 'Allows BONGO to read incoming SMS text content to evaluate Auto Reply rules and thread history.',
                    state: permissions.readSms,
                  },
                  {
                    key: 'receiveSms' as keyof SmsPermissions,
                    title: 'Receive SMS Events (RECEIVE_SMS)',
                    desc: 'Triggers the background receiver when a new SMS arrives on SIM 1 or SIM 2.',
                    state: permissions.receiveSms,
                  },
                  {
                    key: 'sendSms' as keyof SmsPermissions,
                    title: 'Send SMS (SEND_SMS)',
                    desc: 'Transmits direct manual SMS and automated AI replies using the selected SIM line.',
                    state: permissions.sendSms,
                  },
                  {
                    key: 'notifications' as keyof SmsPermissions,
                    title: 'Notifications (POST_NOTIFICATIONS)',
                    desc: 'Alerts you when auto-replies are dispatched, or if a SIM card error occurs.',
                    state: permissions.notifications,
                  },
                ].map(item => (
                  <div
                    key={item.key}
                    className="p-4 bg-[#0D0D10] border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xs font-bold text-white">{item.title}</h3>
                        {renderPermissionBadge(item.state)}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.state !== 'granted' ? (
                        <button
                          onClick={() => handleRequestPermission(item.key)}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Request Permission
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            const updated = await api.sms.updatePermission(item.key, 'denied');
                            setPermissions(updated);
                            showToast({
                              title: 'Permission Revoked',
                              message: `${item.title} has been set to denied`,
                              type: 'warning',
                            });
                          }}
                          className="px-2.5 py-1 text-slate-400 hover:text-rose-400 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Android Settings Help Callout */}
              <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="text-xs text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-300">Android System Policy:</span> If you permanently deny a permission, Android security blocks BONGO from showing system dialogs. You can re-enable permissions at any time via <strong>Android Settings &gt; Apps &gt; BONGO AI &gt; Permissions</strong>.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 6: NOTIFICATIONS SETTINGS */}
        {/* ============================================================ */}
        {activeTab === 'notifications' && notificationSettings && (
          <div className="h-full overflow-y-auto p-6 max-w-3xl mx-auto space-y-6 scrollbar-thin">
            <div className="bg-[#111114] border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 pb-5 border-b border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">SMS Notification Settings</h2>
                  <p className="text-xs text-slate-400">
                    Control independent alerts for incoming messages, auto-reply actions, and hardware alerts.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  {
                    key: 'newSms' as keyof SmsNotificationSettings,
                    label: 'New Incoming SMS Notifications',
                    desc: 'Notify when an SMS is received on SIM 1 or SIM 2',
                  },
                  {
                    key: 'autoReplySent' as keyof SmsNotificationSettings,
                    label: 'Auto Reply Sent Confirmation',
                    desc: 'Show notification summary each time BONGO dispatches an automated reply',
                  },
                  {
                    key: 'autoReplyFailed' as keyof SmsNotificationSettings,
                    label: 'Auto Reply Failure Alerts',
                    desc: 'Alert if an automatic response fails to transmit',
                  },
                  {
                    key: 'permissionWarnings' as keyof SmsNotificationSettings,
                    label: 'Permission Warning Alerts',
                    desc: 'Warn if incoming messages cannot be processed due to missing permissions',
                  },
                  {
                    key: 'simUnavailableWarnings' as keyof SmsNotificationSettings,
                    label: 'SIM Unavailability Warnings',
                    desc: 'Alert if your configured Auto Reply SIM card is disconnected',
                  },
                ].map(item => (
                  <div
                    key={item.key}
                    className="p-3.5 bg-[#0D0D10] border border-slate-800 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <h3 className="text-xs font-bold text-white">{item.label}</h3>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(notificationSettings[item.key])}
                        onChange={async e => {
                          const updated = await api.sms.updateNotificationSettings({
                            [item.key]: e.target.checked,
                          });
                          setNotificationSettings(updated);
                          showToast({ title: 'Preferences Updated', message: item.label, type: 'info' });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 7: AUTO REPLY LOGS & HISTORY */}
        {/* ============================================================ */}
        {activeTab === 'history' && (
          <div className="h-full overflow-y-auto p-6 max-w-5xl mx-auto space-y-6 scrollbar-thin">
            <div className="bg-[#111114] border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between pb-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Auto Reply Execution History</h2>
                    <p className="text-xs text-slate-400">
                      Audit log of every incoming SMS evaluated by BONGO Auto Reply rules and AI models.
                    </p>
                  </div>
                </div>

                {logs.length > 0 && (
                  <button
                    onClick={async () => {
                      await api.sms.clearAutoReplyLogs();
                      setLogs([]);
                      showToast({ title: 'Logs Cleared', message: 'Auto Reply history cleared', type: 'info' });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Logs</span>
                  </button>
                )}
              </div>

              {/* Logs Table */}
              <div className="mt-5 overflow-x-auto">
                {logs.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <History className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-500" />
                    <p className="text-xs">No Auto Reply log records yet.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="pb-3 px-3">Status</th>
                        <th className="pb-3 px-3">Sender</th>
                        <th className="pb-3 px-3">Incoming Message</th>
                        <th className="pb-3 px-3">Generated Response</th>
                        <th className="pb-3 px-3">SIM</th>
                        <th className="pb-3 px-3">Time</th>
                        <th className="pb-3 px-3 text-right">Inspect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {logs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            {log.status === 'sent' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" /> Sent
                              </span>
                            )}
                            {log.status === 'skipped' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <AlertTriangle className="w-3 h-3" /> Skipped
                              </span>
                            )}
                            {log.status === 'failed' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <XCircle className="w-3 h-3" /> Failed
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-white whitespace-nowrap">
                            {log.senderName || log.sender}
                          </td>
                          <td className="py-3.5 px-3 text-slate-300 max-w-xs truncate">
                            {log.incomingMessage}
                          </td>
                          <td className="py-3.5 px-3 text-amber-300/90 max-w-xs truncate">
                            {log.generatedResponse || (
                              <span className="text-slate-600 italic">No reply dispatched</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                            {log.simSlot}
                          </td>
                          <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 8: LIVE TEST SIMULATOR */}
        {/* ============================================================ */}
        {activeTab === 'simulator' && (
          <div className="h-full overflow-y-auto p-6 max-w-4xl mx-auto space-y-6 scrollbar-thin">
            <div className="bg-[#111114] border border-purple-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3 pb-5 border-b border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Live SMS & Auto Reply Pipeline Test Runner</h2>
                  <p className="text-xs text-slate-400">
                    Simulate an incoming cellular SMS event to verify rule evaluation, SIM routing, and live Gemini AI response generation.
                  </p>
                </div>
              </div>

              {/* Simulation Input Controls */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Sender Phone Number
                  </label>
                  <input
                    type="text"
                    value={simSender}
                    onChange={e => setSimSender(e.target.value)}
                    className="w-full bg-[#0D0D10] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Sender Contact Name
                  </label>
                  <input
                    type="text"
                    value={simSenderName}
                    onChange={e => setSimSenderName(e.target.value)}
                    className="w-full bg-[#0D0D10] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Receiving SIM Slot
                </label>
                <div className="flex gap-3">
                  {(['SIM 1', 'SIM 2'] as const).map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSimSlotTarget(slot)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        simSlotTarget === slot
                          ? 'bg-purple-500/20 border-purple-500 text-white'
                          : 'bg-[#0D0D10] border-slate-800 text-slate-400'
                      }`}
                    >
                      {slot} (Receiving Line)
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Incoming SMS Message Text
                </label>
                <textarea
                  rows={3}
                  value={simContent}
                  onChange={e => setSimContent(e.target.value)}
                  className="w-full bg-[#0D0D10] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500/50 resize-none"
                />
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={handleRunSimulator}
                  disabled={isSimulating}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-purple-600/20"
                >
                  {isSimulating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-white" />
                  )}
                  <span>Run Pipeline Simulation</span>
                </button>
              </div>

              {/* Simulation Execution Result */}
              {simResult && (
                <div className="mt-6 pt-6 border-t border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    <span>Pipeline Trace Output</span>
                  </h3>

                  <div className="p-4 bg-[#0D0D10] border border-slate-800 rounded-xl space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Incoming Message Ingested:</span>
                      <span className="font-semibold text-emerald-400">✓ Saved to Inbox</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Auto Reply Outcome:</span>
                      {simResult.autoReplySent ? (
                        <span className="font-bold text-emerald-400">✓ Generated & Dispatched</span>
                      ) : (
                        <span className="font-bold text-amber-400">⚠ Skipped ({simResult.reason})</span>
                      )}
                    </div>

                    {simResult.log?.generatedResponse && (
                      <div className="pt-2 border-t border-slate-800/60">
                        <span className="text-[11px] font-bold text-slate-400 block mb-1">
                          Generated Response Text:
                        </span>
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
                          "{simResult.log.generatedResponse}"
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: FIRST TIME AUTO REPLY SAFETY CONFIRMATION */}
      {/* ============================================================ */}
      {showAutoReplyConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#111114] border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-white">Enable BONGO Auto Reply?</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Auto Reply will allow BONGO to automatically respond to incoming SMS messages using the selected SIM (<strong>{autoReplySettings?.selectedSimSlot}</strong>).
              </p>
            </div>

            <div className="p-3 bg-[#0D0D10] border border-slate-800 rounded-xl text-[11px] text-slate-400 leading-relaxed">
              ✓ Only senders matching your rules will receive responses.<br />
              ✓ You can disable Auto Reply at any time from this workspace.
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAutoReplyConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFirstTimeAutoReply}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
              >
                Enable Auto Reply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: SENSITIVE PERMISSION PRE-REQUEST EXPLANATION */}
      {/* ============================================================ */}
      {pendingPermissionReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#111114] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-white">Permission Required</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                "BONGO needs SMS permission so it can receive and respond to messages when you enable Auto Reply."
              </p>
            </div>

            <div className="p-3 bg-[#0D0D10] border border-slate-800 rounded-xl text-[11px] text-slate-400">
              Target Permission: <strong className="text-amber-400 font-mono">{pendingPermissionReq}</strong>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => denyPermission(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Not now
              </button>
              <button
                onClick={confirmGrantPermission}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
              >
                Allow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: LOG INSPECTOR DRAWER */}
      {/* ============================================================ */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#111114] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-amber-500" />
                <span>Auto Reply Inspection</span>
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-white">{selectedLog.status.toUpperCase()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400">Sender:</span>
                <span className="font-mono text-white">{selectedLog.senderName || selectedLog.sender}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400">SIM Used:</span>
                <span className="font-mono text-amber-400">{selectedLog.simSlot} ({selectedLog.simCarrier || 'Vodacom TZ'})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-300">{new Date(selectedLog.timestamp).toLocaleString()}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Incoming Message:</span>
                <div className="p-3 bg-[#0D0D10] border border-slate-800 rounded-xl text-slate-200">
                  {selectedLog.incomingMessage}
                </div>
              </div>

              {selectedLog.generatedResponse && (
                <div>
                  <span className="text-amber-400 block mb-1">Generated Response:</span>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200">
                    {selectedLog.generatedResponse}
                  </div>
                </div>
              )}

              {selectedLog.statusReason && (
                <div>
                  <span className="text-rose-400 block mb-1">Status Reason / Decision:</span>
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-200">
                    {selectedLog.statusReason}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
