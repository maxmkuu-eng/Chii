import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  History,
  Search,
  Pin,
  Star,
  Trash2,
  Edit2,
  MessageSquare,
  ArrowRight,
  Filter,
  Calendar,
  AlertTriangle,
  CheckSquare,
  Square,
  X,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';

export const HistoryModule: React.FC = () => {
  const {
    conversations,
    selectConversation,
    deleteConversation,
    deleteMultipleConversations,
    clearAllConversations,
    updateConversationTitle,
    togglePinConversation,
    toggleFavoriteConversation,
    createConversation,
    showToast,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pinned' | 'favorites'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'title'>('date_desc');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingTitle, setRenamingTitle] = useState('');

  // Filtering & Sorting
  const filteredConversations = conversations
    .filter(c => {
      const matchesSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.messages.some(m => m.content.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;
      if (filterType === 'pinned') return c.isPinned;
      if (filterType === 'favorites') return c.isFavorite;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortBy === 'date_asc') return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

  const handleSaveRename = () => {
    if (renamingId && renamingTitle.trim()) {
      updateConversationTitle(renamingId, renamingTitle.trim());
      showToast({ title: 'Jina Limebadilishwa', message: 'Kichwa cha mazungumzo kimesasishwa', type: 'success' });
    }
    setRenamingId(null);
    setRenamingTitle('');
  };

  const handleConfirmSingleDelete = () => {
    if (deleteConfirmId) {
      deleteConversation(deleteConfirmId);
      setSelectedIds(prev => prev.filter(id => id !== deleteConfirmId));
      setDeleteConfirmId(null);
    }
  };

  const handleConfirmBatchDelete = () => {
    if (selectedIds.length > 0) {
      deleteMultipleConversations(selectedIds);
      setSelectedIds([]);
      setShowBatchDeleteModal(false);
    }
  };

  const handleConfirmClearAll = () => {
    clearAllConversations();
    setSelectedIds([]);
    setShowClearAllModal(false);
  };

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredConversations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredConversations.map(c => c.id));
    }
  };

  const conversationToDelete = conversations.find(c => c.id === deleteConfirmId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-amber-500" /> Historia ya Mazungumzo (Chat History)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tafuta, panga, bandika, na udhibiti au ufute mazungumzo yako yote yaliyopita.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {conversations.length > 0 && (
            <button
              onClick={() => setShowClearAllModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
              title="Futa historia yote ya mazungumzo"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Futa Yote (Clear All)</span>
            </button>
          )}

          <button
            onClick={() => {
              createConversation();
              selectConversation(conversations[0]?.id);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Mazungumzo Mapya</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tafuta mazungumzo au maudhui ya ujumbe..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'pinned', 'favorites'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider capitalize transition-all cursor-pointer ${
                filterType === tab
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab === 'all' ? 'Yote (All)' : tab === 'pinned' ? 'Yaliyobandikwa' : 'Vipendwa'}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="text-xs py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="date_desc">Mapya Zaidi (Newest)</option>
            <option value="date_asc">Ya Zamani (Oldest)</option>
            <option value="title">Kialfabeti (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Batch Selection Action Bar (Appears when items are selected) */}
      {filteredConversations.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200 hover:text-amber-500 cursor-pointer"
            >
              {selectedIds.length === filteredConversations.length && filteredConversations.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-amber-500" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {selectedIds.length === filteredConversations.length && filteredConversations.length > 0
                  ? 'Acha Kuchagua Yote'
                  : 'Chagua Yote (Select All)'}
              </span>
            </button>

            {selectedIds.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                {selectedIds.length} yamechaguliwa
              </span>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium cursor-pointer"
              >
                Ghairi
              </button>
              <button
                onClick={() => setShowBatchDeleteModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm cursor-pointer active:scale-95 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Futa Yaliyochaguliwa ({selectedIds.length})</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Conversations List */}
      {filteredConversations.length === 0 ? (
        <EmptyState
          icon={History}
          title={search ? 'Hakuna mazungumzo yanayofanana' : 'Hakuna historia ya mazungumzo'}
          description={
            search
              ? 'Jaribu kurekebisha maneno ya utafutaji au vigezo vya vichujio.'
              : 'Mazungumzo yako yote yatahifadhiwa na kupangwa hapa kiotomatiki.'
          }
          actionLabel="Anzisha Mazungumzo"
          onAction={() => createConversation()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredConversations.map(conv => {
            const lastMsg = conv.messages[conv.messages.length - 1];
            const msgCount = conv.messages.length;
            const isSelected = selectedIds.includes(conv.id);

            return (
              <div
                key={conv.id}
                id={`history-item-${conv.id}`}
                className={`group flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all relative ${
                  isSelected
                    ? 'border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20 dark:bg-amber-950/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-amber-500/40 dark:hover:border-amber-500/40 shadow-sm hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Selection Checkbox */}
                      <button
                        onClick={e => toggleSelect(conv.id, e)}
                        className="text-slate-400 hover:text-amber-500 cursor-pointer p-0.5 shrink-0"
                        title={isSelected ? 'Ondoa kwenye uchaguzi' : 'Chagua mazungumzo haya'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-amber-500" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                        )}
                      </button>

                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <h3
                        onClick={() => selectConversation(conv.id)}
                        className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-amber-500 transition-colors cursor-pointer"
                        title={conv.title}
                      >
                        {conv.title}
                      </h3>
                    </div>

                    {/* Action buttons (Pin, Favorite, Rename, Delete) */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => togglePinConversation(conv.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          conv.isPinned ? 'text-amber-500 bg-amber-500/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                        title={conv.isPinned ? 'Ondoa Pin' : 'Weka Pin'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleFavoriteConversation(conv.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          conv.isFavorite ? 'text-amber-500 bg-amber-500/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                        title={conv.isFavorite ? 'Ondoa Kwenye Vipendwa' : 'Weka Kwenye Vipendwa'}
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setRenamingId(conv.id);
                          setRenamingTitle(conv.title);
                        }}
                        className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg transition-colors cursor-pointer"
                        title="Badilisha Jina"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(conv.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Futa Mazungumzo Haya (Delete)"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </button>
                    </div>
                  </div>

                  <p
                    onClick={() => selectConversation(conv.id)}
                    className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed cursor-pointer"
                  >
                    {lastMsg ? lastMsg.content : 'Mazungumzo matupu (Empty conversation)'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </span>
                    <span>{msgCount} {msgCount === 1 ? 'ujumbe' : 'jumbe'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDeleteConfirmId(conv.id)}
                      className="text-rose-500/80 hover:text-rose-500 font-semibold px-2 py-1 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      Futa
                    </button>
                    <button
                      onClick={() => selectConversation(conv.id)}
                      className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      <span>Fungua Chat</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rename Modal */}
      <Modal
        isOpen={Boolean(renamingId)}
        onClose={() => setRenamingId(null)}
        title="Badilisha Kichwa cha Mazungumzo"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <input
            type="text"
            value={renamingTitle}
            onChange={e => setRenamingTitle(e.target.value)}
            className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="Kichwa kipya..."
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setRenamingId(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Ghairi
            </button>
            <button
              onClick={handleSaveRename}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer"
            >
              Hifadhi
            </button>
          </div>
        </div>
      </Modal>

      {/* Single Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Futa Mazungumzo (Delete Conversation)"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-rose-500">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white">
                Una uhakika unataka kufuta mazungumzo haya?
              </p>
              {conversationToDelete && (
                <p className="italic text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 p-2 rounded-lg truncate">
                  "{conversationToDelete.title}"
                </p>
              )}
              <p className="text-[11px] text-rose-500 dark:text-rose-400">
                Hatua hii itafuta ujumbe wote uliomo kwenye mazungumzo haya na haitaweza kurudishwa.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Ghairi
            </button>
            <button
              onClick={handleConfirmSingleDelete}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-sm active:scale-95"
            >
              Futa Kabisa (Delete)
            </button>
          </div>
        </div>
      </Modal>

      {/* Batch Delete Confirmation Modal */}
      <Modal
        isOpen={showBatchDeleteModal}
        onClose={() => setShowBatchDeleteModal(false)}
        title={`Futa Mazungumzo ${selectedIds.length} Yaliyochaguliwa`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-rose-500">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white">
                Una uhakika unataka kufuta mazungumzo {selectedIds.length} mara moja?
              </p>
              <p className="text-[11px] text-rose-500 dark:text-rose-400">
                Mazungumzo yote uliyochagua yataondolewa kabisa kwenye mfumo.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowBatchDeleteModal(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Ghairi
            </button>
            <button
              onClick={handleConfirmBatchDelete}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-sm active:scale-95"
            >
              Futa Mazungumzo {selectedIds.length}
            </button>
          </div>
        </div>
      </Modal>

      {/* Clear All History Confirmation Modal */}
      <Modal
        isOpen={showClearAllModal}
        onClose={() => setShowClearAllModal(false)}
        title="Futa Historia Yote (Clear All History)"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-rose-500">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white">
                Una uhakika unataka kufuta historia nzima ya mazungumzo?
              </p>
              <p className="text-[11px] text-rose-500 dark:text-rose-400">
                Hii itafuta mazungumzo yako yote {conversations.length} na kuanzisha ukurasa mpya safi.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowClearAllModal(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Ghairi
            </button>
            <button
              onClick={handleConfirmClearAll}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-sm active:scale-95"
            >
              Futa Historia Yote
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

