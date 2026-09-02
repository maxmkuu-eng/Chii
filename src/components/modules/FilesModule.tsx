import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FolderSearch,
  Upload,
  FileText,
  Trash2,
  Sparkles,
  CheckSquare,
  Square,
  Eye,
  GitCompare,
  ListOrdered,
  Layers,
  Table,
  HelpCircle,
  Copy,
  Check,
  X,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react';
import { StoredFile } from '../../types';
import { api } from '../../services/api';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';

export const FilesModule: React.FC = () => {
  const { showToast } = useApp();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [activePreviewFile, setActivePreviewFile] = useState<StoredFile | null>(null);
  const [userQuery, setUserQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisAction, setAnalysisAction] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshFiles = async () => {
    try {
      const list = await api.getFiles();
      setFiles(list);
      // Select all by default if there are files and none selected
      if (list.length > 0 && selectedFileIds.length === 0) {
        setSelectedFileIds(list.map(f => f.id));
      }
    } catch {}
  };

  useEffect(() => {
    refreshFiles();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setIsProcessing(true);
    try {
      for (const file of Array.from(uploadedFiles)) {
        if (file.size > 30 * 1024 * 1024) {
          showToast({ title: 'File Too Large', message: `${file.name} exceeds 30MB`, type: 'warning' });
          continue;
        }

        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onload = async () => {
            const content = reader.result as string;
            await api.uploadFile({
              id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              name: file.name,
              size: file.size,
              type: file.type || 'text/plain',
              content: content,
              uploadedAt: new Date().toISOString(),
            });
            resolve();
          };

          if (file.type && file.type.startsWith('image/')) {
            reader.readAsDataURL(file);
          } else {
            reader.readAsText(file);
          }
        });
      }

      await refreshFiles();
      showToast({ title: 'Upload Successful', message: 'Documents indexed into MKUU Files', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Upload Failed', message: err?.message, type: 'error' });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedFileIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedFileIds.length === files.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(files.map(f => f.id));
    }
  };

  const handleDeleteFile = async (id: string) => {
    try {
      await api.deleteFile(id);
      await refreshFiles();
      setSelectedFileIds(prev => prev.filter(item => item !== id));
      showToast({ title: 'Deleted', message: 'File removed', type: 'info' });
    } catch (err: any) {
      showToast({ title: 'Error', message: err?.message, type: 'error' });
    }
  };

  const handleClearAllFiles = async () => {
    try {
      await api.clearAllFiles();
      await refreshFiles();
      setSelectedFileIds([]);
      setAnalysisResult(null);
      showToast({ title: 'Cleared', message: 'All files removed', type: 'info' });
    } catch (err: any) {
      showToast({ title: 'Error', message: err?.message, type: 'error' });
    }
  };

  const handleRunAnalysis = async (action: 'qa' | 'compare' | 'summarize' | 'extract', promptOverride?: string) => {
    if (selectedFileIds.length === 0) {
      showToast({ title: 'No Files Selected', message: 'Please check at least one document to analyze', type: 'warning' });
      return;
    }

    const queryToUse = promptOverride || userQuery;
    if (action === 'qa' && !queryToUse.trim()) {
      showToast({ title: 'Query Required', message: 'Please enter your question about the selected documents', type: 'warning' });
      return;
    }

    setIsProcessing(true);
    setAnalysisAction(action);
    setAnalysisResult(null);

    try {
      const mode = action === 'summarize' ? 'summary' : action === 'compare' ? 'compare' : action === 'extract' ? 'extract' : 'qa';
      const res = await api.analyzeFiles({
        fileIds: selectedFileIds,
        mode: mode as any,
        prompt: queryToUse || 'Analyze the selected documents and summarize insights.',
      });
      setAnalysisResult(res.result || res.analysis || '');
      showToast({ title: 'Analysis Complete', message: 'MKUU Files synthesized the results', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Analysis Failed', message: err?.message, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyAnalysis = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast({ title: 'Copied', message: 'Analysis output copied', type: 'success' });
  };

  const getFileIcon = (file: StoredFile) => {
    if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    if (file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.py') || file.name.endsWith('.json')) return <FileCode className="w-5 h-5 text-blue-500" />;
    return <FileText className="w-5 h-5 text-amber-500" />;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderSearch className="w-6 h-6 text-blue-500" /> MKUU Files
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Multi-document repository with comparative reasoning, extraction, and synthesis.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept=".pdf,.txt,.md,.doc,.docx,.json,.csv,.js,.ts,.py,image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Documents</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: File Repository List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  title="Toggle Select All"
                >
                  {selectedFileIds.length === files.length && files.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-blue-500" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Uploaded Files ({files.length})
                </h3>
              </div>

              {files.length > 0 && (
                <button
                  onClick={handleClearAllFiles}
                  className="text-xs text-rose-500 hover:underline font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {files.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No files uploaded yet. Click "Upload Documents" to begin.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[420px] overflow-y-auto mt-2">
                {files.map(file => {
                  const isSelected = selectedFileIds.includes(file.id);
                  return (
                    <div
                      key={file.id}
                      className={`py-3 px-2 flex items-center justify-between gap-3 rounded-xl transition-colors ${
                        isSelected ? 'bg-blue-50/50 dark:bg-blue-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button onClick={() => handleToggleSelect(file.id)}>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-500 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>
                        {getFileIcon(file)}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {(file.size / 1024).toFixed(1)} KB • {new Date(file.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setActivePreviewFile(file)}
                          className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg transition-colors"
                          title="Preview content"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                          title="Delete file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Multi-Document Actions ({selectedFileIds.length} selected)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleRunAnalysis('compare')}
                disabled={isProcessing || selectedFileIds.length < 2}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500/40 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 flex flex-col items-center justify-center gap-1.5 transition-all disabled:opacity-40"
              >
                <GitCompare className="w-4 h-4 text-blue-500" />
                <span>Compare Docs</span>
              </button>

              <button
                onClick={() => handleRunAnalysis('summarize')}
                disabled={isProcessing || selectedFileIds.length === 0}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500/40 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 flex flex-col items-center justify-center gap-1.5 transition-all disabled:opacity-40"
              >
                <ListOrdered className="w-4 h-4 text-emerald-500" />
                <span>Summarize</span>
              </button>

              <button
                onClick={() => handleRunAnalysis('extract')}
                disabled={isProcessing || selectedFileIds.length === 0}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500/40 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 flex flex-col items-center justify-center gap-1.5 transition-all disabled:opacity-40"
              >
                <Table className="w-4 h-4 text-amber-500" />
                <span>Extract Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Q&A Input & Intelligence Output (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Ask Question Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" /> Ask Questions About Selected Files
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={userQuery}
                onChange={e => setUserQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRunAnalysis('qa');
                }}
                placeholder="e.g., 'What are the termination clauses in Contract A vs Contract B?'"
                className="flex-1 p-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <button
                onClick={() => handleRunAnalysis('qa')}
                disabled={isProcessing || !userQuery.trim() || selectedFileIds.length === 0}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs shrink-0 transition-all"
              >
                {isProcessing ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>

          {/* Analysis Results Display */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm min-h-[380px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Document Intelligence Output {analysisAction ? `(${analysisAction.toUpperCase()})` : ''}
                  </h3>
                </div>

                {analysisResult && (
                  <button
                    onClick={handleCopyAnalysis}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-500"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>

              {isProcessing ? (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Extracting context and synthesizing document reasoning...
                  </p>
                </div>
              ) : analysisResult ? (
                <div className="max-h-[500px] overflow-y-auto pr-1">
                  <MarkdownRenderer content={analysisResult} />
                </div>
              ) : (
                <EmptyState
                  icon={FolderSearch}
                  title="No analysis generated yet"
                  description="Select one or more documents from your repository and ask a question or click Compare / Summarize."
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* File Content Preview Modal */}
      <Modal
        isOpen={Boolean(activePreviewFile)}
        onClose={() => setActivePreviewFile(null)}
        title={activePreviewFile?.name || 'File Preview'}
        maxWidth="lg"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800">
            <span>Size: {activePreviewFile ? (activePreviewFile.size / 1024).toFixed(1) : 0} KB</span>
            <span>Type: {activePreviewFile?.type}</span>
          </div>

          {activePreviewFile?.type?.startsWith('image/') ? (
            <div className="flex justify-center p-4 bg-slate-950 rounded-xl">
              <img
                src={activePreviewFile.content}
                alt={activePreviewFile.name}
                className="max-h-96 rounded object-contain"
              />
            </div>
          ) : (
            <pre className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-mono text-xs max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {activePreviewFile?.content}
            </pre>
          )}
        </div>
      </Modal>
    </div>
  );
};
