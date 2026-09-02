import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserCheck,
  ShieldCheck,
  Crown,
  Key,
  Database,
  Lock,
  Mail,
  User,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Sliders,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { Modal } from '../common/Modal';

export const AccountModule: React.FC = () => {
  const { profile, updateProfile, refreshProfile, showToast } = useApp();

  const [name, setName] = useState(profile?.name || 'Max');
  const [email, setEmail] = useState(profile?.email || 'maxmkuu@gmail.com');
  const [bio, setBio] = useState(profile?.bio || 'Lead Architect & Owner of the MKUU AI Ecosystem.');
  const [preferredTitle, setPreferredTitle] = useState(profile?.preferredTitle || 'Boss Max');
  const [addressingStyle, setAddressingStyle] = useState<'owner_respectful' | 'professional' | 'friendly' | 'neutral' | 'custom'>(
    profile?.addressingStyle || 'owner_respectful'
  );
  const [customAddressingTitle, setCustomAddressingTitle] = useState(profile?.customAddressingTitle || 'Boss Max');
  const [syncWithMemory, setSyncWithMemory] = useState(profile?.syncWithMemory ?? true);

  const [isSaving, setIsSaving] = useState(false);
  const [isResetDataModal, setIsResetDataModal] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || 'Max');
      setEmail(profile.email || 'maxmkuu@gmail.com');
      setBio(profile.bio || 'Lead Architect & Owner of the MKUU AI Ecosystem.');
      setPreferredTitle(profile.preferredTitle || 'Boss Max');
      setAddressingStyle(profile.addressingStyle || 'owner_respectful');
      setCustomAddressingTitle(profile.customAddressingTitle || profile.preferredTitle || 'Boss Max');
      setSyncWithMemory(profile.syncWithMemory ?? true);
    }
  }, [profile]);

  const isOwner = email.trim().toLowerCase() === 'maxmkuu@gmail.com' || (profile?.isOwner && email.trim().toLowerCase() === (profile.ownerEmail || 'maxmkuu@gmail.com').toLowerCase());

  const effectiveTitle = addressingStyle === 'custom'
    ? (customAddressingTitle || 'Boss Max')
    : preferredTitle;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        name,
        email,
        bio,
        preferredTitle: effectiveTitle,
        addressingStyle,
        customAddressingTitle,
        syncWithMemory,
      });
      showToast({
        title: 'Profile Updated',
        message: 'Owner identity and addressing preferences saved successfully.',
        type: 'success',
      });
    } catch {
      showToast({
        title: 'Save Failed',
        message: 'Unable to update account settings.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetQuickPreset = (presetTitle: string, style: 'owner_respectful' | 'professional' | 'friendly' | 'neutral' | 'custom') => {
    setPreferredTitle(presetTitle);
    setAddressingStyle(style);
  };

  const handlePurgeAllData = () => {
    localStorage.clear();
    setIsResetDataModal(false);
    showToast({ title: 'Storage Reset', message: 'Local client caches cleared. Reloading page...', type: 'warning' });
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-amber-500" /> Account & Owner Identity
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your authenticated profile, preferred addressing honorifics, and personality configuration.
          </p>
        </div>

        <button
          onClick={() => refreshProfile()}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
          <span>Reload Profile</span>
        </button>
      </div>

      {/* Owner Identity Status Banner */}
      <div className={`p-5 sm:p-6 rounded-2xl border text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl transition-all ${
        isOwner
          ? 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-950 border-amber-500/40 shadow-amber-500/5'
          : 'bg-gradient-to-r from-slate-900 to-slate-950 border-slate-800'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl border shadow-inner ${
            isOwner
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}>
            {isOwner ? <Crown className="w-7 h-7 text-amber-400 animate-pulse" /> : name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-white">{name}</h3>
              {isOwner ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
                  <Crown className="w-3 h-3" /> VERIFIED OWNER ({effectiveTitle})
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                  WORKSPACE MEMBER
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>{email}</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 font-medium">Addressed as: "{effectiveTitle}"</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl shrink-0">
          <ShieldCheck className="w-4 h-4" />
          <span>Server-Side Secrets Enforced</span>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Section 1: User Profile & Identity */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <User className="w-4 h-4 text-amber-500" /> Workspace Credentials & Display Identity
            </h3>
            <span className="text-[11px] text-slate-500">Authenticated user profile</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Max"
                className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Used to identify the user in conversations and logs.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Authenticated Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. maxmkuu@gmail.com"
                className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {isOwner
                  ? '✨ Verified owner email (unlocks personalized owner persona).'
                  : 'Non-owner email. MKUU AI will treat this profile as a standard collaborator.'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              User Biography / Role
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={2}
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Section 2: Preferred Title & Addressing Style */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-500" /> Addressing Style & Honorific Configuration
            </h3>
            <span className="text-[11px] text-amber-500 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Dynamic System Prompt Injection
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Configure how MKUU AI addresses you across Chat, Voice, and SMS interactions. When configured as owner,
            MKUU AI naturally maintains a loyal, respectful, and direct partnership.
          </p>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Quick Honorific Presets
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSetQuickPreset('Boss Max', 'owner_respectful')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  effectiveTitle === 'Boss Max' && addressingStyle === 'owner_respectful'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                👑 Boss Max (Owner Mode)
              </button>

              <button
                type="button"
                onClick={() => handleSetQuickPreset('Max', 'friendly')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  effectiveTitle === 'Max' && addressingStyle === 'friendly'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                🤝 Max (Friendly First Name)
              </button>

              <button
                type="button"
                onClick={() => handleSetQuickPreset('Mr. Max', 'professional')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  effectiveTitle === 'Mr. Max' && addressingStyle === 'professional'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                👔 Mr. Max (Professional)
              </button>

              <button
                type="button"
                onClick={() => handleSetQuickPreset('Sir', 'professional')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  effectiveTitle === 'Sir' && addressingStyle === 'professional'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                🎩 Sir (Formal)
              </button>

              <button
                type="button"
                onClick={() => setAddressingStyle('custom')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  addressingStyle === 'custom'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                ✍️ Custom Title...
              </button>
            </div>
          </div>

          {/* Addressing Style Radio Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
              addressingStyle === 'owner_respectful'
                ? 'bg-amber-500/10 border-amber-500/40 text-slate-900 dark:text-white'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}>
              <input
                type="radio"
                name="addressingStyle"
                checked={addressingStyle === 'owner_respectful'}
                onChange={() => setAddressingStyle('owner_respectful')}
                className="mt-0.5 text-amber-500 focus:ring-amber-500"
              />
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>👑 Loyal Owner Respect</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Naturally addresses as "{preferredTitle}" during greetings and task handoffs. Loyal, high-speed, direct.
                </p>
              </div>
            </label>

            <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
              addressingStyle === 'friendly'
                ? 'bg-amber-500/10 border-amber-500/40 text-slate-900 dark:text-white'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}>
              <input
                type="radio"
                name="addressingStyle"
                checked={addressingStyle === 'friendly'}
                onChange={() => setAddressingStyle('friendly')}
                className="mt-0.5 text-amber-500 focus:ring-amber-500"
              />
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>🤝 Friendly & Direct</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Uses your first name in a warm, collaborative, and conversational peer cadence.
                </p>
              </div>
            </label>

            <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
              addressingStyle === 'professional'
                ? 'bg-amber-500/10 border-amber-500/40 text-slate-900 dark:text-white'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}>
              <input
                type="radio"
                name="addressingStyle"
                checked={addressingStyle === 'professional'}
                onChange={() => setAddressingStyle('professional')}
                className="mt-0.5 text-amber-500 focus:ring-amber-500"
              />
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>👔 Formal Professional</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Uses structured, polished corporate addressing with strict formal greetings.
                </p>
              </div>
            </label>

            <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
              addressingStyle === 'neutral'
                ? 'bg-amber-500/10 border-amber-500/40 text-slate-900 dark:text-white'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}>
              <input
                type="radio"
                name="addressingStyle"
                checked={addressingStyle === 'neutral'}
                onChange={() => setAddressingStyle('neutral')}
                className="mt-0.5 text-amber-500 focus:ring-amber-500"
              />
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>⚡ Minimalist / Neutral</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Zero honorifics. Directly executes answers and tasks without addressing names.
                </p>
              </div>
            </label>
          </div>

          {/* Custom title input if custom or selected */}
          {addressingStyle === 'custom' && (
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/30 space-y-2">
              <label className="block text-xs font-bold text-amber-600 dark:text-amber-400">
                Custom Honorific Title
              </label>
              <input
                type="text"
                value={customAddressingTitle}
                onChange={e => setCustomAddressingTitle(e.target.value)}
                placeholder="e.g. Boss Max, Mkuu Max, Captain Max..."
                className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-500/30 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          {/* Memory sync checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={syncWithMemory}
                onChange={e => setSyncWithMemory(e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded border-slate-300 dark:border-slate-700 focus:ring-amber-500"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Synchronize identity preferences with MKUU Memory system automatically
              </span>
            </label>
          </div>
        </div>

        {/* Section 3: Live Persona Interaction Simulation Preview */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 text-white space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Persona Preview Simulation
            </h3>
            <span className="text-[10px] text-slate-400">Natural cadence test</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] font-bold text-amber-500 uppercase">Swahili Greeting:</span>
              <p className="text-slate-200 mt-1 font-mono text-[11px]">
                "Karibu {effectiveTitle}. Nimepanga ripoti zote na mifumo iko tayari."
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Task Acknowledgment:</span>
              <p className="text-slate-200 mt-1 font-mono text-[11px]">
                "Sawa {effectiveTitle}, nimekuelewa. Naanza kufanya uchambuzi mara moja."
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] font-bold text-blue-400 uppercase">Natural Follow-up (No spam):</span>
              <p className="text-slate-200 mt-1 font-mono text-[11px]">
                "Hii hapa muundo wa mradi uliouomba: [Code & Diagrams]. Nini kingine niongeze?"
              </p>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 italic mt-1">
            Note: MKUU AI never forces "{effectiveTitle}" on every single sentence; it balances natural respect and swift execution.
          </p>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/10 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            <span>{isSaving ? 'Saving...' : 'Save Persona & Identity Settings'}</span>
          </button>
        </div>
      </form>

      {/* Security and Boundary Notice */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-500" /> Security & Architectural Boundaries
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200">Owner Privilege Boundary</h4>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Owner identity configures loyal respectful persona, but does <strong>NOT bypass</strong> Android security, SMS permissions, file privacy, or sandbox boundaries.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200">Honesty & Anti-Fabrication</h4>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                MKUU AI never pretends to complete actions that did not take place. If a tool or API fails, MKUU AI clearly discloses the failure.
              </p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-rose-500">Reset Local Client Cache</h4>
            <p className="text-[11px] text-slate-400">Purges browser localStorage and reboots memory state.</p>
          </div>
          <button
            onClick={() => setIsResetDataModal(true)}
            className="px-3 py-1.5 border border-rose-500/40 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Reset Client Data
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isResetDataModal}
        onClose={() => setIsResetDataModal(false)}
        title="Reset Client Data"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-rose-500">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure? This will wipe all local caches, conversations, and settings stored in your browser.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsResetDataModal(false)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handlePurgeAllData}
              className="px-4 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
            >
              Confirm Reset
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
