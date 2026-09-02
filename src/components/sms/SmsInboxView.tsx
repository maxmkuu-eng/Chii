import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  MessageSquare,
  Smartphone,
  Send,
  Sparkles,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  RotateCcw,
  Check,
  Phone,
  User,
  MoreVertical,
} from 'lucide-react';
import { SmsConversation, SmsMessage } from '../../types';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';

interface SmsInboxViewProps {
  conversations: SmsConversation[];
  selectedThreadId: string | null;
  onSelectThread: (threadId: string | null) => void;
  onRefreshData: () => Promise<void>;
  onOpenInComposer: (phoneNumber: string, name?: string, simSlot?: 'SIM 1' | 'SIM 2') => void;
}

export const SmsInboxView: React.FC<SmsInboxViewProps> = ({
  conversations,
  selectedThreadId,
  onSelectThread,
  onRefreshData,
  onOpenInComposer,
}) => {
  const { showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [replyInput, setReplyInput] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Selection & Batch Delete Mode
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([]);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<SmsConversation | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<{ threadId: string; messageId: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  // Send reply in current thread
  const handleSendThreadReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || !replyInput.trim() || sendingReply) return;

    try {
      setSendingReply(true);
      await api.sms.sendSms({
        recipient: selectedThread.phoneNumber,
        recipientName: selectedThread.contactName,
        content: replyInput.trim(),
        simSlot: selectedThread.simSlot,
      });

      setReplyInput('');
      await onRefreshData();
      showToast({
        title: 'SMS Sent',
        message: `Replied via ${selectedThread.simSlot}`,
        type: 'success',
      });
    } catch (err: any) {
      showToast({
        title: 'Failed to Send',
        message: err.message || 'Error sending reply',
        type: 'error',
      });
    } finally {
      setSendingReply(false);
    }
  };

  // Delete single thread
  const handleConfirmDeleteThread = async () => {
    if (!threadToDelete || deleting) return;
    try {
      setDeleting(true);
      await api.sms.deleteConversation(threadToDelete.id);
      showToast({
        title: 'SMS Thread Deleted',
        message: `Conversation with ${threadToDelete.contactName || threadToDelete.phoneNumber} deleted.`,
        type: 'info',
      });
      if (selectedThreadId === threadToDelete.id) {
        const remaining = conversations.filter(c => c.id !== threadToDelete.id);
        onSelectThread(remaining.length > 0 ? remaining[0].id : null);
      }
      setThreadToDelete(null);
      await onRefreshData();
    } catch (err: any) {
      showToast({
        title: 'Delete Error',
        message: err.message || 'Failed to delete conversation',
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Delete single message inside thread
  const handleConfirmDeleteMessage = async () => {
    if (!messageToDelete || deleting) return;
    try {
      setDeleting(true);
      await api.sms.deleteMessage(messageToDelete.threadId, messageToDelete.messageId);
      showToast({
        title: 'Message Deleted',
        message: 'SMS message removed from conversation.',
        type: 'info',
      });
      setMessageToDelete(null);
      await onRefreshData();
    } catch (err: any) {
      showToast({
        title: 'Delete Error',
        message: err.message || 'Failed to delete message',
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Batch delete selected threads
  const handleConfirmBatchDelete = async () => {
    if (selectedThreadIds.length === 0 || deleting) return;
    try {
      setDeleting(true);
      const res = await api.sms.batchDeleteConversations(selectedThreadIds);
      showToast({
        title: 'Threads Deleted',
        message: `Successfully deleted ${res.deletedCount} conversations.`,
        type: 'success',
      });
      setSelectedThreadIds([]);
      setIsSelectMode(false);
      setShowBatchDeleteModal(false);
      onSelectThread(null);
      await onRefreshData();
    } catch (err: any) {
      showToast({
        title: 'Batch Delete Error',
        message: err.message || 'Failed to delete selected conversations',
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Clear all conversations
  const handleConfirmClearAll = async () => {
    try {
      setDeleting(true);
      await api.sms.clearAllConversations();
      showToast({
        title: 'Inbox Cleared',
        message: 'All SMS conversations have been deleted.',
        type: 'info',
      });
      setSelectedThreadIds([]);
      setIsSelectMode(false);
      setShowClearAllModal(false);
      onSelectThread(null);
      await onRefreshData();
    } catch (err: any) {
      showToast({
        title: 'Clear Inbox Error',
        message: err.message || 'Failed to clear SMS inbox',
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelectThread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedThreadIds(prev =>
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedThreadIds.length === filteredConversations.length) {
      setSelectedThreadIds([]);
    } else {
      setSelectedThreadIds(filteredConversations.map(c => c.id));
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-[#0A0A0B]">
      {/* Sidebar Threads List */}
      <div className="w-full md:w-80 lg:w-96 border-r border-slate-800 flex flex-col bg-[#111114] shrink-0 h-full">
        {/* Search & Actions Bar */}
        <div className="p-3 border-b border-slate-800 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search SMS contacts or content..."
              className="w-full bg-[#0D0D10] border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Controls: Batch select toggle & Clear inbox */}
          <div className="flex items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsSelectMode(!isSelectMode);
                  if (isSelectMode) setSelectedThreadIds([]);
                }}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isSelectMode
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {isSelectMode ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                <span>{isSelectMode ? 'Cancel Select' : 'Select'}</span>
              </button>

              {isSelectMode && (
                <button
                  onClick={toggleSelectAll}
                  className="text-slate-400 hover:text-white text-[11px] underline underline-offset-2"
                >
                  {selectedThreadIds.length === filteredConversations.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {isSelectMode && selectedThreadIds.length > 0 && (
                <button
                  onClick={() => setShowBatchDeleteModal(true)}
                  className="px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete ({selectedThreadIds.length})</span>
                </button>
              )}

              {!isSelectMode && conversations.length > 0 && (
                <button
                  onClick={() => setShowClearAllModal(true)}
                  className="text-slate-500 hover:text-red-400 text-[11px] p-1 rounded hover:bg-red-950/20 transition-colors"
                  title="Clear all conversations"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Threads Scroll List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 scrollbar-thin">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-500" />
              <p className="text-xs">No SMS conversations found.</p>
            </div>
          ) : (
            filteredConversations.map(thread => {
              const isSelected = thread.id === selectedThreadId;
              const isChecked = selectedThreadIds.includes(thread.id);
              return (
                <div
                  key={thread.id}
                  onClick={() => {
                    if (isSelectMode) {
                      toggleSelectThread(thread.id, {} as any);
                    } else {
                      onSelectThread(thread.id);
                    }
                  }}
                  className={`p-3.5 cursor-pointer transition-colors group relative ${
                    isSelected && !isSelectMode
                      ? 'bg-amber-500/10 border-l-2 border-amber-500'
                      : 'hover:bg-slate-800/50 border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {isSelectMode && (
                        <button
                          onClick={e => toggleSelectThread(thread.id, e)}
                          className="text-slate-400 hover:text-amber-400 p-0.5 shrink-0"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-amber-400 fill-amber-500/20" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      <span className="font-semibold text-xs text-white truncate">
                        {thread.contactName || thread.phoneNumber}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-amber-400 border border-slate-700">
                        {thread.simSlot}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-slate-500">
                        {new Date(thread.lastTimestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {/* Quick delete thread button on hover */}
                      {!isSelectMode && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setThreadToDelete(thread);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded transition-all cursor-pointer"
                          title="Futa Mazungumzo (Delete Thread)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {thread.contactName && (
                    <p className="text-[11px] font-mono text-slate-400 mb-1">{thread.phoneNumber}</p>
                  )}
                  <p className="text-xs text-slate-400 truncate">{thread.lastMessage}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Thread Messages View */}
      <div className="flex-1 flex flex-col bg-[#0A0A0B] h-full overflow-hidden">
        {selectedThread ? (
          <>
            {/* Thread Header */}
            <div className="px-5 py-3 border-b border-slate-800 bg-[#111114] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-amber-400 shrink-0">
                  {selectedThread.contactName ? selectedThread.contactName.charAt(0).toUpperCase() : '#'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white truncate">
                      {selectedThread.contactName || selectedThread.phoneNumber}
                    </h2>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 font-mono shrink-0">
                      {selectedThread.simSlot}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400">{selectedThread.phoneNumber}</p>
                </div>
              </div>

              {/* Thread Top Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() =>
                    onOpenInComposer(
                      selectedThread.phoneNumber,
                      selectedThread.contactName,
                      selectedThread.simSlot
                    )
                  }
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3 h-3 text-amber-400" />
                  <span>Open in Composer</span>
                </button>

                <button
                  onClick={() => setThreadToDelete(selectedThread)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-500/30 transition-colors flex items-center gap-1.5"
                  title="Delete entire thread"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete Thread</span>
                </button>
              </div>
            </div>

            {/* Message Bubbles */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 scrollbar-thin">
              {selectedThread.messages.map(msg => {
                const isOutgoing = msg.direction === 'outgoing';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col group ${isOutgoing ? 'items-end' : 'items-start'}`}
                  >
                    <div className="relative">
                      <div
                        className={`max-w-md md:max-w-lg p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isOutgoing
                            ? msg.isAutoReply
                              ? 'bg-amber-500/15 border border-amber-500/30 text-amber-100 rounded-br-none shadow-sm'
                              : 'bg-amber-500 text-black font-medium rounded-br-none shadow-sm'
                            : 'bg-[#16161a] border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                        }`}
                      >
                        {msg.isAutoReply && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1.5">
                            <Sparkles className="w-3 h-3" />
                            <span>MKUU SMS Auto Reply</span>
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>

                      {/* Delete individual message action button on hover */}
                      <button
                        onClick={() => setMessageToDelete({ threadId: selectedThread.id, messageId: msg.id })}
                        className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 bg-slate-900/90 text-slate-400 hover:text-red-400 border border-slate-700 rounded-full transition-all cursor-pointer shadow-md ${
                          isOutgoing ? '-left-8' : '-right-8'
                        }`}
                        title="Futa Ujumbe Huu (Delete Message)"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-[10px] text-slate-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">• {msg.simSlot}</span>
                      {isOutgoing && <span className="text-[10px] text-emerald-400 font-medium">✓ Sent</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Thread Reply Input */}
            <form onSubmit={handleSendThreadReply} className="p-4 border-t border-slate-800 bg-[#111114] shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={replyInput}
                  onChange={e => setReplyInput(e.target.value)}
                  placeholder={`Reply manually via ${selectedThread.simSlot}...`}
                  className="flex-1 bg-[#0D0D10] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
                <button
                  type="submit"
                  disabled={!replyInput.trim() || sendingReply}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-amber-500/10 shrink-0"
                >
                  {sendingReply ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Reply</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
            <Smartphone className="w-12 h-12 mb-3 opacity-30 text-amber-500" />
            <p className="text-sm font-semibold text-slate-400">Select an SMS conversation to read</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
              Review messages, check dual-SIM routing, and manage or delete conversations with full control.
            </p>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* DELETE SINGLE THREAD MODAL */}
      {/* ============================================================ */}
      {threadToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#141418] border border-red-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Futa Mazungumzo na {threadToDelete.contactName || threadToDelete.phoneNumber}?
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Ujumbe wote {threadToDelete.messages.length} kwenye thread hii utafutwa kabisa.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setThreadToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Ghairi
              </button>
              <button
                onClick={handleConfirmDeleteThread}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all shadow-md shadow-red-600/30 flex items-center gap-1.5"
              >
                {deleting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Ndio, Futa Thread</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DELETE SINGLE MESSAGE MODAL */}
      {/* ============================================================ */}
      {messageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#141418] border border-red-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Futa Ujumbe Huu?</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Ujumbe huu maalum utafutwa kwenye thread hii ya SMS.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setMessageToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Ghairi
              </button>
              <button
                onClick={handleConfirmDeleteMessage}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all shadow-md shadow-red-600/30 flex items-center gap-1.5"
              >
                {deleting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Ndio, Futa Ujumbe</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* BATCH DELETE CONFIRMATION MODAL */}
      {/* ============================================================ */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#141418] border border-red-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Futa Mazungumzo {selectedThreadIds.length} Uliyochagua?
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Mazungumzo yote {selectedThreadIds.length} uliyochagua yatafutwa kabisa kutoka kwenye inbox.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowBatchDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Ghairi
              </button>
              <button
                onClick={handleConfirmBatchDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all shadow-md shadow-red-600/30 flex items-center gap-1.5"
              >
                {deleting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Ndio, Futa Yote ({selectedThreadIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CLEAR ALL INBOX MODAL */}
      {/* ============================================================ */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#141418] border border-red-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Futa SMS Zote Kwenye Inbox?</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Hii itafuta mazungumzo yote yaliyopo kwenye inbox ya SMS. Hatua hii haiwezi kurudishwa nyuma.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearAllModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Ghairi
              </button>
              <button
                onClick={handleConfirmClearAll}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all shadow-md shadow-red-600/30 flex items-center gap-1.5"
              >
                {deleting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Ndio, Safisha Inbox Yote</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
