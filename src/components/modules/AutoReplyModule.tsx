import React, { useState, useEffect, useMemo } from 'react';
import {
  Bot,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  Clock,
  Calendar,
  Users,
  UserX,
  Plus,
  Trash2,
  Send,
  Sliders,
  Settings,
  RefreshCw,
  Zap,
  Smartphone,
  Check,
  X,
  FileText,
  Activity,
  History,
  MessageSquare,
  HelpCircle,
  Filter,
  ArrowRight,
} from 'lucide-react';
import {
  AutoReplySettings,
  AutoReplyLog,
  AutoReplyAudience,
  AutoReplyStyle,
  AutoReplyScheduleType,
  SimCard,
  ScheduleRule,
} from '../../types';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';

const DAYS_OF_WEEK = [
  { id: 0, label: 'Jumapili', short: 'Jpi' },
  { id: 1, label: 'Jumatatu', short: 'Jtt' },
  { id: 2, label: 'Jumanne', short: 'Jnn' },
  { id: 3, label: 'Jumatano', short: 'Jtn' },
  { id: 4, label: 'Alhamisi', short: 'Alh' },
  { id: 5, label: 'Ijumaa', short: 'Ijm' },
  { id: 6, label: 'Jumamosi', short: 'Jms' },
];

const PRESET_TEMPLATES = [
  {
    title: 'Kikao / Mkutano',
    instruction: 'Mwambie mtumaji niko kwenye mkutano muhimu kwa sasa. Nitampigia mara tu nitakapomaliza kabla ya jioni.',
    template: 'Habari, niko kwenye mkutano kwa sasa. Nitakupigia mara baada ya kikao.',
  },
  {
    title: 'Safari / Nje ya Ofisi',
    instruction: 'Mjumlishe kuwa niko safarini nje ya ofisi na upatikanaji wa mtandao ni mdogo. Kwa dharura atume WhatsApp.',
    template: 'Habari, niko safarini kwa sasa. Kwa dharura tafadhali nitumie ujumbe wa WhatsApp.',
  },
  {
    title: 'Masaa ya Kazi Yamemalizika',
    instruction: 'Mueleze kuwa masaa ya kazi yamefungwa kwa leo. Ujumbe wake umepokelewa na atajibiwa kesho asubuhi saa 2:30.',
    template: 'Habari, ofisi yetu imefungwa kwa sasa. Ujumbe wako umepokelewa na tutakujibu kesho asubuhi.',
  },
  {
    title: 'Msaada wa Wateja',
    instruction: 'Jibu kama msaidizi wa kibinafsi wa Boss Max kwa heshima na uombe aeleze shida yake vizuri ili asaidiwe haraka.',
    template: 'Habari, umewasiliana na Msaidizi wa Max. Tafadhali eleza huduma unayohitaji na tutakuhudumia.',
  },
];

export const AutoReplyModule: React.FC = () => {
  const { showToast } = useApp();

  // Active Tab within AutoReply Standalone
  const [activeTab, setActiveTab] = useState<'settings' | 'audience' | 'schedule' | 'simulate' | 'logs'>('settings');

  // Core Data States
  const [settings, setSettings] = useState<AutoReplySettings | null>(null);
  const [simCards, setSimCards] = useState<SimCard[]>([]);
  const [logs, setLogs] = useState<AutoReplyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Editing States
  const [enabled, setEnabled] = useState(true);
  const [killSwitchActive, setKillSwitchActive] = useState(false);
  const [replyStyle, setReplyStyle] = useState<AutoReplyStyle>('ai_generated');
  const [aiInstructions, setAiInstructions] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedSimSlot, setSelectedSimSlot] = useState<'SIM 1' | 'SIM 2'>('SIM 1');
  const [audience, setAudience] = useState<AutoReplyAudience>('everyone');
  const [scheduleType, setScheduleType] = useState<AutoReplyScheduleType>('always');
  const [excludedNumbers, setExcludedNumbers] = useState<string[]>([]);
  const [newExcludedNumber, setNewExcludedNumber] = useState('');

  // Schedule States
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startHour, setStartHour] = useState('08:00');
  const [endHour, setEndHour] = useState('17:00');

  // Simulation States
  const [simSender, setSimSender] = useState('+255 712 345 678');
  const [simSenderName, setSimSenderName] = useState('Mteja / Rafiki');
  const [simContent, setSimContent] = useState('Habari Max, uko ofisini leo tuonane kuhusu mradi wetu?');
  const [simSlot, setSimSlot] = useState<'SIM 1' | 'SIM 2'>('SIM 1');
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    attempted: boolean;
    sent: boolean;
    reason?: string;
    log?: AutoReplyLog;
  } | null>(null);

  // Load Initial Data
  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedSettings, fetchedSims, fetchedLogs] = await Promise.all([
        api.sms.getAutoReplySettings(),
        api.sms.getSimCards(),
        api.sms.getAutoReplyLogs(),
      ]);

      setSettings(fetchedSettings);
      setSimCards(fetchedSims);
      setLogs(fetchedLogs);

      // Populate local editing state
      setEnabled(fetchedSettings.enabled);
      setKillSwitchActive(fetchedSettings.killSwitchActive);
      setReplyStyle(fetchedSettings.replyStyle || 'ai_generated');
      setAiInstructions(fetchedSettings.aiInstructions || '');
      setCustomMessage(fetchedSettings.customMessage || '');
      setSelectedSimSlot(fetchedSettings.selectedSimSlot || 'SIM 1');
      setAudience(fetchedSettings.audience || 'everyone');
      setScheduleType(fetchedSettings.scheduleType || 'always');
      setExcludedNumbers(fetchedSettings.excludedNumbers || []);

      if (fetchedSettings.schedules && fetchedSettings.schedules.length > 0) {
        const first = fetchedSettings.schedules[0];
        setSelectedDays(first.days || [1, 2, 3, 4, 5]);
        setStartHour(
          `${String(first.startHour).padStart(2, '0')}:${String(first.startMinute).padStart(2, '0')}`
        );
        setEndHour(
          `${String(first.endHour).padStart(2, '0')}:${String(first.endMinute).padStart(2, '0')}`
        );
      }
    } catch (err: any) {
      showToast({
        title: 'Hitilafu ya Auto Reply',
        message: err.message || 'Haikuweza kupakia taarifa za SMS Auto-Reply',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Settings Function
  const handleSaveSettings = async () => {
    if (saving) return;
    try {
      setSaving(true);
      const [startH, startM] = startHour.split(':').map(Number);
      const [endH, endM] = endHour.split(':').map(Number);

      const schedules: ScheduleRule[] = [
        {
          days: selectedDays,
          startHour: isNaN(startH) ? 8 : startH,
          startMinute: isNaN(startM) ? 0 : startM,
          endHour: isNaN(endH) ? 17 : endH,
          endMinute: isNaN(endM) ? 0 : endM,
          description: 'Masaa ya kazi yaliyopangwa',
        },
      ];

      const updated = await api.sms.updateAutoReplySettings({
        enabled,
        killSwitchActive,
        replyStyle,
        aiInstructions: aiInstructions.trim(),
        customMessage: customMessage.trim(),
        selectedSimSlot,
        audience,
        scheduleType,
        excludedNumbers,
        schedules,
      });

      setSettings(updated);
      showToast({
        title: 'Mipangilio Imehifadhiwa',
        message: 'Kanuni na mipangilio ya SMS Auto-Reply zimesasishwa kikamilifu.',
        type: 'success',
      });
    } catch (err: any) {
      showToast({
        title: 'Hitilafu ya Kuhifadhi',
        message: err.message || 'Haikuweza kuhifadhi mipangilio ya Auto Reply',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Toggle Master Switch
  const handleToggleMaster = async () => {
    const nextState = !enabled;
    setEnabled(nextState);
    try {
      await api.sms.updateAutoReplySettings({ enabled: nextState });
      showToast({
        title: nextState ? 'Auto-Reply Imewashwa' : 'Auto-Reply Imezimwa',
        message: nextState
          ? 'MKUU AI sasa itajibu SMS zinazoingia kulingana na kanuni zako.'
          : 'Ujibu wa kiotomatiki umezimwa. Hakuna SMS itakayojibiwa na AI.',
        type: nextState ? 'success' : 'info',
      });
    } catch (err: any) {
      setEnabled(!nextState);
      showToast({ title: 'Hitilafu', message: err.message, type: 'error' });
    }
  };

  // Toggle Emergency Kill Switch
  const handleToggleKillSwitch = async () => {
    try {
      const res = await api.sms.toggleKillSwitch(!killSwitchActive);
      setKillSwitchActive(res.killSwitchActive);
      setEnabled(res.enabled);
      showToast({
        title: res.killSwitchActive ? '⚠️ KILL SWITCH IMEWASHWA' : 'Kill Switch Imezimwa',
        message: res.killSwitchActive
          ? 'Majibu yote ya kiotomatiki yamesitishwa mara moja kwa usalama.'
          : 'Mfumo wa kawaida wa SMS Auto-Reply umerejeshwa.',
        type: res.killSwitchActive ? 'error' : 'success',
      });
    } catch (err: any) {
      showToast({ title: 'Hitilafu ya Kill Switch', message: err.message, type: 'error' });
    }
  };

  // Add Excluded Number (Blacklist)
  const handleAddExcludedNumber = () => {
    if (!newExcludedNumber.trim()) return;
    const clean = newExcludedNumber.trim();
    if (excludedNumbers.includes(clean)) {
      showToast({ title: 'Namba Ipo Tayari', message: 'Namba hii tayari imezuiwa.', type: 'warning' });
      return;
    }
    const updated = [...excludedNumbers, clean];
    setExcludedNumbers(updated);
    setNewExcludedNumber('');
  };

  // Remove Excluded Number
  const handleRemoveExcludedNumber = (num: string) => {
    setExcludedNumbers(excludedNumbers.filter(n => n !== num));
  };

  // Run Live Simulation
  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simSender.trim() || !simContent.trim() || simulating) return;

    try {
      setSimulating(true);
      setSimulationResult(null);

      const result = await api.sms.simulateIncomingSms({
        sender: simSender.trim(),
        senderName: simSenderName.trim() || undefined,
        content: simContent.trim(),
        simSlot,
      });

      setSimulationResult({
        attempted: result.autoReplyAttempted,
        sent: result.autoReplySent,
        reason: result.reason,
        log: result.log,
      });

      // Refresh logs
      const updatedLogs = await api.sms.getAutoReplyLogs();
      setLogs(updatedLogs);

      if (result.autoReplySent) {
        showToast({
          title: 'SMS Imejibiwa Kiotomatiki!',
          message: `Jibu limetumwa kwa ${simSender}`,
          type: 'success',
        });
      } else {
        showToast({
          title: 'SMS Haikujibiwa',
          message: result.reason || 'Kanuni imezuia au Auto-Reply haikuwashwa.',
          type: 'info',
        });
      }
    } catch (err: any) {
      showToast({
        title: 'Hitilafu ya Jaribio',
        message: err.message || 'Jaribio la Auto-Reply limeshindwa.',
        type: 'error',
      });
    } finally {
      setSimulating(false);
    }
  };

  // Clear Logs
  const handleClearLogs = async () => {
    try {
      await api.sms.clearAutoReplyLogs();
      setLogs([]);
      showToast({
        title: 'Historia Imefutwa',
        message: 'Kumbukumbu zote za SMS Auto-Reply zimeondolewa.',
        type: 'info',
      });
    } catch (err: any) {
      showToast({ title: 'Hitilafu', message: err.message, type: 'error' });
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-y-auto">
      {/* Top Header Banner */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 shrink-0 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center shadow-md shrink-0">
              <Bot className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-extrabold text-gray-900 tracking-tight">
                  SMS Auto Reply Engine
                </h1>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    killSwitchActive
                      ? 'bg-rose-100 text-rose-800'
                      : enabled
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      killSwitchActive ? 'bg-rose-600 animate-pulse' : enabled ? 'bg-emerald-600' : 'bg-gray-400'
                    }`}
                  />
                  {killSwitchActive ? 'KILL SWITCH (ZIMA)' : enabled ? 'IMEWASHWA (LIVE)' : 'IMEZIMWA'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Feature inayojitegemea ya majibu ya kiotomatiki ya SMS kwa akili ya AI ya Kiswahili
              </p>
            </div>
          </div>

          {/* Quick Action Controls: Master Toggle & Kill Switch */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMaster}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                enabled
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              {enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{enabled ? 'Zima Auto-Reply' : 'Washa Auto-Reply'}</span>
            </button>

            <button
              onClick={handleToggleKillSwitch}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                killSwitchActive
                  ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-md animate-pulse'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              }`}
              title="Emergency Kill Switch"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{killSwitchActive ? 'Sitisha Kill Switch' : 'Kill Switch'}</span>
            </button>
          </div>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="flex items-center gap-2 mt-4 max-w-6xl mx-auto overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
          {[
            { id: 'settings', label: 'Kanuni za AI & Majibu', icon: Bot },
            { id: 'audience', label: 'Walengwa & Namba Zilizozuiwa', icon: Users },
            { id: 'schedule', label: 'Ratiba & Masaa ya Kazi', icon: Clock },
            { id: 'simulate', label: 'Pima / Jaribu Sasa (Live Test)', icon: Send },
            { id: 'logs', label: `Kumbukumbu za Majibu (${logs.length})`, icon: History },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-black text-white shadow-xs font-bold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        {loading ? (
          <div className="py-20 text-center text-gray-500 space-y-3">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-medium">Inapakia mfumo wa SMS Auto Reply...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* TAB 1: SETTINGS & AI RULES */}
            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Reply Style & AI Instructions */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Style Mode Selector */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Chagua Jinsi ya Kujibu SMS (Reply Style)</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* AI Auto Reply */}
                      <div
                        onClick={() => setReplyStyle('ai_generated')}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          replyStyle === 'ai_generated'
                            ? 'border-black bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Bot className="w-5 h-5 text-purple-600" />
                          {replyStyle === 'ai_generated' && <Check className="w-4 h-4 text-black font-bold" />}
                        </div>
                        <h4 className="text-xs font-bold text-gray-900">AI Smart Assistant</h4>
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                          AI inaelewa maana ya SMS na kujibu kwa Kiswahili fasaha chenye heshima.
                        </p>
                      </div>

                      {/* AI with Custom Instructions */}
                      <div
                        onClick={() => setReplyStyle('ai_with_instructions')}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          replyStyle === 'ai_with_instructions'
                            ? 'border-black bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Sliders className="w-5 h-5 text-amber-600" />
                          {replyStyle === 'ai_with_instructions' && <Check className="w-4 h-4 text-black font-bold" />}
                        </div>
                        <h4 className="text-xs font-bold text-gray-900">AI + Maelekezo Maalum</h4>
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                          AI inajibu kwa kufuata maelekezo maalum uliyoiwekea (mf. kueleza uko wapi).
                        </p>
                      </div>

                      {/* Custom Template Message */}
                      <div
                        onClick={() => setReplyStyle('custom_message')}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          replyStyle === 'custom_message'
                            ? 'border-black bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          {replyStyle === 'custom_message' && <Check className="w-4 h-4 text-black font-bold" />}
                        </div>
                        <h4 className="text-xs font-bold text-gray-900">Ujumbe Uliotungwa (Template)</h4>
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                          Ujumbe mmoja uliotungwa unaotumwa sawa kwa kila mtu bila kutumia AI.
                        </p>
                      </div>
                    </div>

                    {/* AI Custom Instructions Input */}
                    {(replyStyle === 'ai_with_instructions' || replyStyle === 'ai_generated') && (
                      <div className="pt-2 space-y-2">
                        <label className="block text-xs font-bold text-gray-800">
                          Maelekezo Maalum kwa AI (AI Prompt Instructions)
                        </label>
                        <textarea
                          rows={3}
                          value={aiInstructions}
                          onChange={e => setAiInstructions(e.target.value)}
                          placeholder="Mf. 'Mwakilishe Boss Max kwa heshima. Waambie niko kwenye mkutano na mradi wa Dodoma hadi saa 10 jioni. Waombe waache ujumbe mfupi nitawapigia.'"
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-black text-gray-900 bg-white leading-relaxed"
                        />
                      </div>
                    )}

                    {/* Custom Fixed Message Input */}
                    {replyStyle === 'custom_message' && (
                      <div className="pt-2 space-y-2">
                        <label className="block text-xs font-bold text-gray-800">
                          Ujumbe Maalum Utakaotumwa
                        </label>
                        <textarea
                          rows={3}
                          value={customMessage}
                          onChange={e => setCustomMessage(e.target.value)}
                          placeholder="Mf. Habari, niko nje ya ofisi kwa sasa. Ujumbe wako umepokelewa na nitakupigia mara tu nikirejea."
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-black text-gray-900 bg-white leading-relaxed"
                        />
                      </div>
                    )}
                  </div>

                  {/* Quick Preset Templates */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-3">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider text-gray-500">
                      Sampuli za Haraka (Quick Presets)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {PRESET_TEMPLATES.map((preset, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setAiInstructions(preset.instruction);
                            setCustomMessage(preset.template);
                            showToast({
                              title: 'Preset Imewekwa',
                              message: `Maelekezo ya "${preset.title}" yamewekwa.`,
                              type: 'info',
                            });
                          }}
                          className="p-3 rounded-xl border border-gray-200 hover:border-black hover:bg-gray-50 transition-all cursor-pointer group text-left"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-900 group-hover:text-black">
                              {preset.title}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-black transition-transform group-hover:translate-x-0.5" />
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                            {preset.instruction}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: SIM Selection & Save Actions */}
                <div className="space-y-5">
                  {/* SIM Card Selection */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-3">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4" />
                      <span>SIM ya Kutuma Majibu</span>
                    </h3>

                    <div className="space-y-2">
                      {simCards.map(sim => (
                        <div
                          key={sim.id}
                          onClick={() => setSelectedSimSlot(sim.slotLabel)}
                          className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                            selectedSimSlot === sim.slotLabel
                              ? 'border-black bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-800">
                              {sim.slotLabel === 'SIM 1' ? '1' : '2'}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-gray-900">
                                {sim.displayName || sim.carrierName}
                              </div>
                              <div className="text-[10px] text-gray-500">
                                {sim.phoneNumber || sim.carrierName}
                              </div>
                            </div>
                          </div>
                          {selectedSimSlot === sim.slotLabel && (
                            <CheckCircle2 className="w-4 h-4 text-black" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary & Save Button */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-4">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider text-gray-500">
                      Hali ya Sasa (Engine Status)
                    </h3>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500">Hali:</span>
                        <span className="font-bold text-gray-900">
                          {enabled ? 'Iko Hewani (Active)' : 'Imezimwa'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500">Njia:</span>
                        <span className="font-bold text-gray-900">
                          {replyStyle === 'ai_generated'
                            ? 'AI Smart Assistant'
                            : replyStyle === 'ai_with_instructions'
                            ? 'AI + Instructions'
                            : 'Template'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500">SIM Slot:</span>
                        <span className="font-bold text-gray-900">{selectedSimSlot}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-500">Walengwa:</span>
                        <span className="font-bold text-gray-900 capitalize">{audience.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveSettings}
                      disabled={saving}
                      className="w-full py-2.5 rounded-xl bg-black hover:bg-gray-800 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>{saving ? 'Inahifadhi...' : 'Hifadhi Mabadiliko Yote'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: AUDIENCE & BLACKLIST */}
            {activeTab === 'audience' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Target Audience Selector */}
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Nani Anayestahili Kujibiwa Kiotomatiki?</span>
                  </h3>

                  <div className="space-y-2.5">
                    {[
                      {
                        id: 'everyone' as AutoReplyAudience,
                        title: 'Kila Mtu (Everyone)',
                        desc: 'Jibu namba yoyote inayotuma SMS kwa mara ya kwanza au mara kwa mara.',
                      },
                      {
                        id: 'watu_wangu_only' as AutoReplyAudience,
                        title: 'Watu Wangu Pekee (VIPs & Inner Circle)',
                        desc: 'Jibu namba zilizohifadhiwa kwenye orodha ya Watu Wangu pekee.',
                      },
                      {
                        id: 'exclude_watu_wangu' as AutoReplyAudience,
                        title: 'Wageni Pekee (Exclude Watu Wangu)',
                        desc: 'Watu Wangu hawajibiwi na AI (mimi binafsi nitawasiliana nao). Wageni pekee ndio watajibiwa.',
                      },
                    ].map(item => (
                      <div
                        key={item.id}
                        onClick={() => setAudience(item.id)}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          audience === item.id
                            ? 'border-black bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-gray-900">{item.title}</h4>
                          {audience === item.id && <CheckCircle2 className="w-4 h-4 text-black" />}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="w-full py-2.5 rounded-xl bg-black hover:bg-gray-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer mt-2"
                  >
                    Hifadhi Walengwa
                  </button>
                </div>

                {/* Excluded Numbers (Blacklist) */}
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <UserX className="w-4 h-4 text-rose-600" />
                      <span>Orodha ya Namba Zilizozuiwa (Blacklist)</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Namba zilizo hapa hazitajibiwa kabisa na AI Auto-Reply (kwa mfano namba za matangazo au spam).
                    </p>
                  </div>

                  {/* Add Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newExcludedNumber}
                      onChange={e => setNewExcludedNumber(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddExcludedNumber()}
                      placeholder="Weka namba mf. +255 7XX XXX XXX au jina"
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-black font-mono text-gray-900"
                    />
                    <button
                      onClick={handleAddExcludedNumber}
                      className="px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Zuia</span>
                    </button>
                  </div>

                  {/* List of Excluded Numbers */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pt-2">
                    {excludedNumbers.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-xs">
                        Hakuna namba iliyozuiwa kwa sasa.
                      </div>
                    ) : (
                      excludedNumbers.map((num, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs"
                        >
                          <span className="font-mono font-bold text-gray-800">{num}</span>
                          <button
                            onClick={() => handleRemoveExcludedNumber(num)}
                            className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            title="Ondoa Kwenye Blacklist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SCHEDULE & WORK HOURS */}
            {activeTab === 'schedule' && (
              <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Ratiba ya Kufanya Kazi ya Auto-Reply</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Chagua muda na siku ambazo ungependa MKUU AI iwashe majibu ya kiotomatiki.
                  </p>
                </div>

                {/* Schedule Type Toggle */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setScheduleType('always')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      scheduleType === 'always'
                        ? 'border-black bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">Muda Wote (24/7 Always)</span>
                      {scheduleType === 'always' && <CheckCircle2 className="w-4 h-4 text-black" />}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Inafanya kazi masaa 24 kila siku bila kikomo cha muda.
                    </p>
                  </div>

                  <div
                    onClick={() => setScheduleType('custom')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      scheduleType === 'custom'
                        ? 'border-black bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">Ratiba Maalum (Custom Time)</span>
                      {scheduleType === 'custom' && <CheckCircle2 className="w-4 h-4 text-black" />}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Inafanya kazi tu kwenye masaa na siku maalum ulizopanga.
                    </p>
                  </div>
                </div>

                {/* Days of Week Selector */}
                {scheduleType === 'custom' && (
                  <div className="space-y-4 pt-2 border-t border-gray-100">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">
                        Siku za Wiki Zinazotumika
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map(day => {
                          const isSelected = selectedDays.includes(day.id);
                          return (
                            <button
                              key={day.id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedDays(selectedDays.filter(d => d !== day.id));
                                } else {
                                  setSelectedDays([...selectedDays, day.id]);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-black text-white shadow-xs'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {day.short}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time Window */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Saa ya Kuanza (Start Time)
                        </label>
                        <input
                          type="time"
                          value={startHour}
                          onChange={e => setStartHour(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-black bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Saa ya Kumaliza (End Time)
                        </label>
                        <input
                          type="time"
                          value={endHour}
                          onChange={e => setEndHour(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-black bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="w-full py-2.5 rounded-xl bg-black hover:bg-gray-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Hifadhi Ratiba
                </button>
              </div>
            )}

            {/* TAB 4: SIMULATE / LIVE TEST */}
            {activeTab === 'simulate' && (
              <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Send className="w-4 h-4 text-purple-600" />
                    <span>Pima Majibu ya SMS (Live Test & Simulation)</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Tuma ujumbe wa majaribio kuona jinsi AI itakavyojibu mara moja kulingana na kanuni ulizoweka.
                  </p>
                </div>

                <form onSubmit={handleRunSimulation} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Namba ya Mtumaji (Sender Number) *
                      </label>
                      <input
                        type="text"
                        required
                        value={simSender}
                        onChange={e => setSimSender(e.target.value)}
                        placeholder="+255 7XX XXX XXX"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 font-mono text-gray-900 focus:outline-none focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Jina la Mtumaji (Hiari)
                      </label>
                      <input
                        type="text"
                        value={simSenderName}
                        onChange={e => setSimSenderName(e.target.value)}
                        placeholder="Mf. Juma Meneja"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Ujumbe Ulioingia (Incoming SMS Content) *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={simContent}
                      onChange={e => setSimContent(e.target.value)}
                      placeholder="Andika SMS ya mfano itakayotumwa..."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-black leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-600">Simulate via:</span>
                      <select
                        value={simSlot}
                        onChange={e => setSimSlot(e.target.value as any)}
                        className="px-2.5 py-1 text-xs rounded-lg border border-gray-300 bg-white font-bold text-gray-800"
                      >
                        <option value="SIM 1">SIM 1</option>
                        <option value="SIM 2">SIM 2</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={simulating}
                      className="px-5 py-2.5 rounded-xl bg-black hover:bg-gray-800 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      {simulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      <span>{simulating ? 'Inachambua & Kujibu...' : 'Pima Auto-Reply Sasa'}</span>
                    </button>
                  </div>
                </form>

                {/* Simulation Output Card */}
                {simulationResult && (
                  <div
                    className={`p-4 rounded-2xl border animate-in fade-in zoom-in-95 duration-200 ${
                      simulationResult.sent
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : 'bg-amber-50 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs mb-2">
                      {simulationResult.sent ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>SMS Imejibiwa Kiotomatiki na MKUU AI</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Auto-Reply Haikutumwa ({simulationResult.reason || 'Kizuizi cha Kanuni'})</span>
                        </>
                      )}
                    </div>

                    {simulationResult.log?.generatedResponse && (
                      <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs font-medium text-gray-900 mt-2 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-gray-400">Jibu Lililotolewa:</span>
                        <p className="leading-relaxed font-sans">{simulationResult.log.generatedResponse}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: LOGS & HISTORY */}
            {activeTab === 'logs' && (
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <History className="w-4 h-4 text-gray-700" />
                      <span>Kumbukumbu za SMS Zilizojibiwa</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Historia kamili ya ujumbe wote ulioingia na majibu yaliyotolewa na AI
                    </p>
                  </div>

                  {logs.length > 0 && (
                    <button
                      onClick={handleClearLogs}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-rose-50 hover:text-rose-700 text-gray-600 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Futa Kumbukumbu</span>
                    </button>
                  )}
                </div>

                {logs.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 space-y-2 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <History className="w-8 h-8 mx-auto text-gray-300" />
                    <p className="text-xs font-bold text-gray-700">Hakuna kumbukumbu za majibu kwa sasa</p>
                    <p className="text-[11px] text-gray-500">
                      Ujumbe unaoingia utakaojibiwa kiotomatiki utaonekana hapa moja kwa moja.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {logs.map(log => (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all bg-white shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 font-mono">
                              {log.senderName ? `${log.senderName} (${log.sender})` : log.sender}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-bold">
                              {log.simSlot}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                log.status === 'sent'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : log.status === 'skipped'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {log.status === 'sent'
                                ? 'Imejibiwa'
                                : log.status === 'skipped'
                                ? 'Imerukwa (Skipped)'
                                : 'Imeshindwa'}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {/* Incoming Message */}
                        <div className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">
                            Ujumbe Ulioingia:
                          </span>
                          "{log.incomingMessage}"
                        </div>

                        {/* Generated Response */}
                        {log.generatedResponse && (
                          <div className="text-xs text-emerald-950 bg-emerald-50/70 border border-emerald-100 p-2.5 rounded-xl">
                            <span className="text-[10px] font-bold text-emerald-700 uppercase block mb-0.5 flex items-center gap-1">
                              <Bot className="w-3 h-3" />
                              <span>Jibu Lililotumwa na AI:</span>
                            </span>
                            "{log.generatedResponse}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
