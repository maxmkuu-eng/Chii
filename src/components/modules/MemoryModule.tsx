import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Brain,
  Search,
  Plus,
  Trash2,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Info,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Tag,
} from 'lucide-react';
import { MemoryItem } from '../../types';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';

export const MemoryModule: React.FC = () => {
  const { memories, refreshMemories, settings, updateSettings, showToast } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isAiExtractOpen, setIsAiExtractOpen] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);

  // New Memory Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryItem['category']>('preference');
  const [newReason, setNewReason] = useState('');

  const filteredMemories = memories.filter(m => {
    const matchesSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.content.toLowerCase().includes(search.toLowerCase()) ||
      m.reason.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
    return true;
  });

  const handleToggleMemoryActive = async (mem: MemoryItem) => {
    try {
      await api.updateMemory(mem.id, { active: !mem.active });
      await refreshMemories();
      showToast({
        title: mem.active ? 'Memory Deactivated' : 'Memory Activated',
        message: `"${mem.title}" updated`,
        type: 'info',
      });
    } catch (err: any) {
      showToast({ title: 'Error', message: err?.message, type: 'error' });
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await api.deleteMemory(id);
      await refreshMemories();
      showToast({ title: 'Deleted', message: 'Memory removed permanently', type: 'info' });
    } catch (err: any) {
      showToast({ title: 'Error', message: err?.message, type: 'error' });
    }
  };

  const handleClearAll = async () => {
    try {
      await api.clearMemories();
      await refreshMemories();
      setIsClearAllModalOpen(false);
      showToast({ title: 'Cleared', message: 'All memories cleared', type: 'info' });
    } catch (err: any) {
      showToast({ title: 'Error', message: err?.message, type: 'error' });
    }
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      await api.createMemory({
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
        reason: newReason.trim() || 'Added manually by user.',
        active: true,
      });
      await refreshMemories();
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewContent('');
      setNewReason('');
      showToast({ title: 'Memory Saved', message: 'New memory created', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Error', message: err?.message, type: 'error' });
    }
  };

  const handleRunAiExtraction = async () => {
    if (!aiInputText.trim()) return;
    setIsExtracting(true);
    try {
      const suggestions = await api.extractMemories(aiInputText);
      setAiSuggestions(suggestions);
      if (suggestions.length === 0) {
        showToast({ title: 'Extraction', message: 'No explicit long-term facts found in text', type: 'info' });
      }
    } catch (err: any) {
      showToast({ title: 'Error', message: err?.message, type: 'error' });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAcceptAiSuggestion = async (sug: any) => {
    try {
      await api.createMemory({
        title: sug.title,
        content: sug.content,
        category: sug.category || 'fact',
        reason: sug.reason || 'Extracted automatically from text via AI analysis.',
        active: true,
      });
      await refreshMemories();
      setAiSuggestions(prev => prev.filter(s => s !== sug));
      showToast({ title: 'Saved', message: `Saved "${sug.title}" to memories`, type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Error', message: err?.message, type: 'error' });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-rose-500" /> BONGO Memory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage long-term facts, preferences, and custom context automatically utilized during AI interactions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Master memory on/off toggle */}
          <button
            onClick={() => updateSettings({ memoryEnabled: !settings.memoryEnabled })}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              settings.memoryEnabled
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
            }`}
          >
            {settings.memoryEnabled ? (
              <ToggleRight className="w-4 h-4 text-rose-500" />
            ) : (
              <ToggleLeft className="w-4 h-4" />
            )}
            <span>Memory: {settings.memoryEnabled ? 'Active' : 'Disabled'}</span>
          </button>

          <button
            onClick={() => setIsAiExtractOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 text-xs font-semibold border border-slate-700 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Memory Extractor</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Memory</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search saved facts, preferences, or reasons..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'preference', 'instruction', 'fact', 'work', 'personal'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                selectedCategory === cat
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {memories.length > 0 && (
          <button
            onClick={() => setIsClearAllModalOpen(true)}
            className="px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors shrink-0"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Memory List */}
      {filteredMemories.length === 0 ? (
        <EmptyState
          icon={Brain}
          title={search ? 'No matching memories' : 'Memory bank is empty'}
          description="BONGO AI automatically stores long-term facts and preferences to personalize responses, or you can create one manually."
          actionLabel="Create First Memory"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMemories.map(mem => (
            <div
              key={mem.id}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all ${
                mem.active
                  ? 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-rose-500/40'
                  : 'border-slate-200/50 dark:border-slate-800/50 opacity-60 bg-slate-50/50 dark:bg-slate-950/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
                    <Tag className="w-3.5 h-3.5" />
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{mem.title}</h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {mem.category}
                  </span>
                  <button
                    onClick={() => handleToggleMemoryActive(mem)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                    title={mem.active ? 'Deactivate' : 'Activate'}
                  >
                    {mem.active ? <ToggleRight className="w-5 h-5 text-rose-500" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleDeleteMemory(mem.id)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                    title="Delete Memory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                {mem.content}
              </p>

              {/* Reason / Origin Section */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-700 dark:text-slate-300">Why this exists: </strong>
                  <span>{mem.reason}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Memory Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Long-term Memory" maxWidth="md">
        <form onSubmit={handleCreateMemory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Memory Title
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. Code Architecture Preference"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Memory Content / Fact
            </label>
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="e.g. Always generate modular React components with Tailwind CSS utility classes."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as any)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                <option value="preference">Preference</option>
                <option value="instruction">Instruction</option>
                <option value="fact">Fact</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason / Origin
              </label>
              <input
                type="text"
                value={newReason}
                onChange={e => setNewReason(e.target.value)}
                placeholder="e.g. Specified in project kick-off"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
            >
              Save to Memory
            </button>
          </div>
        </form>
      </Modal>

      {/* AI Memory Extractor Modal */}
      <Modal
        isOpen={isAiExtractOpen}
        onClose={() => setIsAiExtractOpen(false)}
        title="AI Memory Extractor"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Paste user background, chat excerpts, or notes below. BONGO AI will detect and propose structured long-term memory items.
          </p>

          <textarea
            value={aiInputText}
            onChange={e => setAiInputText(e.target.value)}
            placeholder="Paste text to analyze here..."
            className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            rows={4}
          />

          <div className="flex justify-end">
            <button
              onClick={handleRunAiExtraction}
              disabled={isExtracting || !aiInputText.trim()}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isExtracting ? 'Extracting...' : 'Extract Memories'}</span>
            </button>
          </div>

          {aiSuggestions.length > 0 && (
            <div className="mt-4 space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Discovered Memory Candidates ({aiSuggestions.length}):
              </h4>
              {aiSuggestions.map((sug, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{sug.title}</span>
                      <span className="px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 text-[10px] uppercase font-bold">
                        {sug.category}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mb-1">{sug.content}</p>
                    <p className="text-[11px] text-slate-400 italic">Origin: {sug.reason}</p>
                  </div>
                  <button
                    onClick={() => handleAcceptAiSuggestion(sug)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] shrink-0"
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Clear All Confirmation Modal */}
      <Modal
        isOpen={isClearAllModalOpen}
        onClose={() => setIsClearAllModalOpen(false)}
        title="Clear All Memories"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-rose-500">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to clear all saved memories? AI responses will revert to default generalized context.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsClearAllModalOpen(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleClearAll}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
            >
              Clear All Memories
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
