import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Share2,
  Download,
  FileText,
  Code,
  Link2,
  Copy,
  Check,
  Globe,
  Trash2,
  ExternalLink,
  Shield,
  Layers,
  FileJson,
  Printer,
} from 'lucide-react';
import { api } from '../../services/api';
import { SharedItem } from '../../types';

export const ShareExportModule: React.FC = () => {
  const { conversations, activeConversationId, showToast } = useApp();

  const [selectedConvId, setSelectedConvId] = useState<string>(activeConversationId || conversations[0]?.id || '');
  const [sharedLinks, setSharedLinks] = useState<SharedItem[]>([]);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currentConv = conversations.find(c => c.id === selectedConvId) || conversations[0];

  const refreshSharedLinks = async () => {
    try {
      const list = await api.getSharedItems();
      setSharedLinks(list);
    } catch {}
  };

  useEffect(() => {
    refreshSharedLinks();
  }, []);

  const handleDownloadFile = (format: 'markdown' | 'text' | 'json' | 'html') => {
    if (!currentConv) {
      showToast({ title: 'No Conversation', message: 'Please select a conversation to export', type: 'warning' });
      return;
    }

    let content = '';
    let mimeType = 'text/plain';
    let extension = 'txt';

    const safeTitle = currentConv.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    if (format === 'markdown') {
      mimeType = 'text/markdown';
      extension = 'md';
      content = `# ${currentConv.title}\n*Exported from MKUU AI on ${new Date().toLocaleString()}*\n\n---\n\n`;
      currentConv.messages.forEach(m => {
        const sender = m.role === 'user' ? '👤 **User**' : '🤖 **MKUU AI**';
        content += `### ${sender} (${new Date(m.timestamp).toLocaleTimeString()})\n\n${m.content}\n\n---\n\n`;
      });
    } else if (format === 'text') {
      mimeType = 'text/plain';
      extension = 'txt';
      content = `CONVERSATION: ${currentConv.title}\nDATE: ${new Date().toLocaleString()}\n\n`;
      currentConv.messages.forEach(m => {
        const sender = m.role === 'user' ? 'USER' : 'MKUU AI';
        content += `[${sender} - ${new Date(m.timestamp).toLocaleTimeString()}]:\n${m.content}\n\n`;
      });
    } else if (format === 'json') {
      mimeType = 'application/json';
      extension = 'json';
      content = JSON.stringify(
        {
          appName: 'MKUU AI',
          exportedAt: new Date().toISOString(),
          conversation: currentConv,
        },
        null,
        2
      );
    } else if (format === 'html') {
      mimeType = 'text/html';
      extension = 'html';
      const messagesHtml = currentConv.messages
        .map(
          m =>
            `<div style="margin-bottom:20px;padding:15px;border-radius:10px;background:${
              m.role === 'user' ? '#f1f5f9' : '#fef3c7'
            };font-family:sans-serif;">
              <strong>${m.role === 'user' ? 'User' : 'MKUU AI'}</strong>
              <p style="margin-top:5px;white-space:pre-wrap;">${m.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
            </div>`
        )
        .join('');

      content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${currentConv.title} - MKUU AI Export</title>
  <style>body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #1e293b; }</style>
</head>
<body>
  <h1>${currentConv.title}</h1>
  <p style="color:#64748b;">Exported from MKUU AI on ${new Date().toLocaleString()}</p>
  <hr style="margin:20px 0; border:none; border-top:1px solid #e2e8f0;">
  ${messagesHtml}
</body>
</html>`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mkuu_${safeTitle}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast({ title: 'Export Successful', message: `Exported as .${extension}`, type: 'success' });
  };

  const handleGenerateShareLink = async () => {
    if (!currentConv) return;
    setIsCreatingLink(true);
    try {
      const shareData = {
        title: currentConv.title,
        createdAt: currentConv.createdAt,
        messages: currentConv.messages,
      };

      const res = await api.createShareLink({
        title: currentConv.title,
        type: 'conversation',
        data: shareData,
      });

      await refreshSharedLinks();
      showToast({ title: 'Public Link Created', message: 'Ready to share with anyone', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Share Error', message: err?.message, type: 'error' });
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleCopyLink = (item: SharedItem) => {
    const fullUrl = `${window.location.origin}/#share=${item.shareId}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast({ title: 'Link Copied', message: 'Share URL copied to clipboard', type: 'success' });
  };

  const handleRevokeShare = async (id: string) => {
    try {
      await api.deleteSharedItem(id);
      await refreshSharedLinks();
      showToast({ title: 'Share Revoked', message: 'Public link removed', type: 'info' });
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
            <Share2 className="w-6 h-6 text-amber-500" /> Share & Export
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Export conversations to Markdown, PDF, JSON, and create secure public share links.
          </p>
        </div>
      </div>

      {/* Select Conversation */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Selected Conversation
            </h3>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {currentConv?.title || 'No conversation'}
            </p>
          </div>
        </div>

        <select
          value={selectedConvId}
          onChange={e => setSelectedConvId(e.target.value)}
          className="text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none max-w-xs"
        >
          {conversations.map(c => (
            <option key={c.id} value={c.id}>
              {c.title} ({c.messages.length} msgs)
            </option>
          ))}
        </select>
      </div>

      {/* 2-Column Grid: Formats on left, Public Links on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Direct File Exports (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Download className="w-4 h-4 text-amber-500" /> Export Document Formats
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => handleDownloadFile('markdown')}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 bg-slate-50 dark:bg-slate-800/60 cursor-pointer flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="p-2 w-fit rounded-lg bg-amber-500/10 text-amber-500 mb-2">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-500">
                    Markdown (.md)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Formatted text with code syntax & tables
                  </p>
                </div>
                <span className="mt-3 text-[11px] font-semibold text-amber-500 flex items-center gap-1">
                  Download .md →
                </span>
              </div>

              <div
                onClick={() => handleDownloadFile('json')}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 bg-slate-50 dark:bg-slate-800/60 cursor-pointer flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="p-2 w-fit rounded-lg bg-blue-500/10 text-blue-500 mb-2">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-500">
                    Structured JSON (.json)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Machine-readable full conversation schema
                  </p>
                </div>
                <span className="mt-3 text-[11px] font-semibold text-blue-500 flex items-center gap-1">
                  Download .json →
                </span>
              </div>

              <div
                onClick={() => handleDownloadFile('html')}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 bg-slate-50 dark:bg-slate-800/60 cursor-pointer flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="p-2 w-fit rounded-lg bg-purple-500/10 text-purple-500 mb-2">
                    <Printer className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-500">
                    HTML / Print Document
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ready for browser printing or saving as PDF
                  </p>
                </div>
                <span className="mt-3 text-[11px] font-semibold text-purple-500 flex items-center gap-1">
                  Download .html →
                </span>
              </div>

              <div
                onClick={() => handleDownloadFile('text')}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 bg-slate-50 dark:bg-slate-800/60 cursor-pointer flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="p-2 w-fit rounded-lg bg-emerald-500/10 text-emerald-500 mb-2">
                    <Code className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-500">
                    Plain Text (.txt)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Universal unformatted text export
                  </p>
                </div>
                <span className="mt-3 text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
                  Download .txt →
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Public Share Links (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-500" /> Public Share Links
              </h3>
              <button
                onClick={handleGenerateShareLink}
                disabled={isCreatingLink || !currentConv}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>{isCreatingLink ? 'Creating...' : 'Create Share Link'}</span>
              </button>
            </div>

            {sharedLinks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No active shared links. Click "Create Share Link" to generate a secure shareable link.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {sharedLinks.map(link => (
                  <div
                    key={link.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{link.title}</p>
                      <p className="text-[10px] text-slate-400">
                        {link.views} views • Created {new Date(link.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleCopyLink(link)}
                        className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors"
                      >
                        {copiedId === link.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === link.id ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={() => handleRevokeShare(link.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                        title="Revoke Share Link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
