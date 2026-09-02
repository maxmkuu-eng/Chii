import React, { useRef, useEffect, useState } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Mic,
  Image as ImageIcon,
  Globe,
  X,
  FileText,
  Plus,
} from 'lucide-react';
import { Attachment } from '../../types';

interface MessageComposerProps {
  input: string;
  setInput: (value: string) => void;
  onSend: (text?: string, attachments?: Attachment[]) => void;
  onStop: () => void;
  isGenerating: boolean;
  attachments: Attachment[];
  onAddAttachment: (files: FileList) => void;
  onRemoveAttachment: (id: string) => void;
  webSearchEnabled: boolean;
  setWebSearchEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void;
  isImageMode: boolean;
  setIsImageMode: (enabled: boolean | ((prev: boolean) => boolean)) => void;
  isVoiceRecording: boolean;
  onToggleVoice: () => void;
  onOpenVoiceModal?: () => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  input,
  setInput,
  onSend,
  onStop,
  isGenerating,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  webSearchEnabled,
  setWebSearchEnabled,
  isImageMode,
  setIsImageMode,
  isVoiceRecording,
  onToggleVoice,
  onOpenVoiceModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);

  // Close tools popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setToolsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto expand textarea height up to 180px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 24), 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && (input.trim() || attachments.length > 0)) {
        onSend();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddAttachment(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setToolsMenuOpen(false);
  };

  const hasContent = Boolean(input.trim() || attachments.length > 0);

  return (
    <div className="w-full shrink-0 px-3 sm:px-4 pb-3 sm:pb-4 pt-1 z-20 pointer-events-none">
      <div className="max-w-3xl mx-auto w-full pointer-events-auto">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/*,.pdf,.txt,.doc,.docx,.json,.js,.ts,.py,.md,.csv"
          className="hidden"
        />

        {/* Active Tool / Attachment Chips */}
        {(attachments.length > 0 || webSearchEnabled || isImageMode) && (
          <div className="flex flex-wrap items-center gap-1.5 mb-2 px-1 animate-in fade-in duration-150">
            {/* Web Search Pill */}
            {webSearchEnabled && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>Search</span>
                <button
                  type="button"
                  onClick={() => setWebSearchEnabled(false)}
                  className="hover:text-blue-900 ml-0.5 cursor-pointer text-blue-400"
                  title="Disable web search"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Image Mode Pill */}
            {isImageMode && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Create image</span>
                <button
                  type="button"
                  onClick={() => setIsImageMode(false)}
                  className="hover:text-emerald-900 ml-0.5 cursor-pointer text-emerald-400"
                  title="Disable image mode"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Attached Files */}
            {attachments.map(att => (
              <div
                key={att.id}
                className="flex items-center gap-1.5 p-1 pl-2.5 pr-2 rounded-full bg-gray-100 border border-gray-200 text-xs text-gray-800 shadow-2xs"
              >
                {(att.type || (att as any).mimeType || '')?.startsWith('image/') ? (
                  <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span className="font-medium max-w-[120px] truncate">{att.name}</span>
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(att.id)}
                  className="text-gray-400 hover:text-gray-700 p-0.5 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ChatGPT Style Capsule Box */}
        <div
          id="chatgpt-pill-composer"
          className="relative rounded-[28px] bg-[#f4f4f4] border border-gray-200/80 focus-within:border-gray-400 focus-within:bg-white transition-all p-3 shadow-md"
        >
          {/* Tools Menu Popover */}
          {toolsMenuOpen && (
            <div
              ref={toolsMenuRef}
              className="absolute bottom-full left-2 mb-2 w-64 rounded-2xl bg-white border border-gray-200 shadow-xl z-40 p-1.5 text-left animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100 mb-1">
                Tools & Uploads
              </div>

              {/* Upload Document/Image */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-800 hover:bg-gray-100 transition-colors text-left cursor-pointer"
              >
                <Paperclip className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="font-semibold text-gray-900">Add photos & files</div>
                  <div className="text-[10px] text-gray-500">PDF, images, spreadsheets, text</div>
                </div>
              </button>

              {/* Web Search Grounding */}
              <button
                type="button"
                onClick={() => {
                  setWebSearchEnabled(prev => !prev);
                  setToolsMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-gray-800 hover:bg-gray-100 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Search the web</div>
                    <div className="text-[10px] text-gray-500">Ground answers with real-time links</div>
                  </div>
                </div>
                <span
                  className={`w-2 h-2 rounded-full ${
                    webSearchEnabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              </button>

              {/* Image Gen Studio */}
              <button
                type="button"
                onClick={() => {
                  setIsImageMode(prev => !prev);
                  setToolsMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-gray-800 hover:bg-gray-100 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Create image (DALL·E)</div>
                    <div className="text-[10px] text-gray-500">Generate realistic art & graphics</div>
                  </div>
                </div>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isImageMode ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            id="chatgpt-composer-textarea"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isImageMode
                ? 'Describe the image you want MKUU AI to create...'
                : webSearchEnabled
                ? 'Search anything on the web with live sources...'
                : 'Message MKUU AI...'
            }
            rows={1}
            className="w-full bg-transparent border-0 text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none resize-none px-3 pt-1 pb-2 max-h-48 leading-relaxed font-sans"
          />

          {/* Bottom Action Bar inside Pill Composer */}
          <div className="flex items-center justify-between pt-1 px-1">
            {/* Left Controls: Plus Attach Button & Quick Search toggle */}
            <div className="flex items-center gap-1.5">
              {/* Plus Button */}
              <button
                type="button"
                id="composer-tools-plus-button"
                onClick={() => setToolsMenuOpen(prev => !prev)}
                className={`p-1.5 rounded-full transition-colors cursor-pointer flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-200/70 ${
                  toolsMenuOpen ? 'bg-gray-200 text-black rotate-45' : ''
                }`}
                title="Attach files or tools"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Quick Search Toggle Pill */}
              <button
                type="button"
                id="composer-quick-search-toggle"
                onClick={() => setWebSearchEnabled(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  webSearchEnabled
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'text-gray-600 hover:text-black hover:bg-gray-200/60'
                }`}
                title="Search the web"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>

            {/* Right Controls: Dictation & Send/Stop button */}
            <div className="flex items-center gap-2">
              {/* Voice Dictation Button */}
              <button
                type="button"
                id="composer-voice-dictation-btn"
                onClick={onToggleVoice}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  isVoiceRecording
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'text-gray-500 hover:text-black hover:bg-gray-200/70'
                }`}
                title={isVoiceRecording ? 'Stop voice recording' : 'Dictate message'}
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Dynamic Send / Stop Button (ChatGPT Signature Circle) */}
              {isGenerating ? (
                <button
                  type="button"
                  id="composer-stop-action-btn"
                  onClick={onStop}
                  className="w-8 h-8 rounded-full bg-black text-white hover:bg-gray-800 shadow-md transition-all active:scale-95 cursor-pointer shrink-0 flex items-center justify-center"
                  title="Stop generating"
                >
                  <Square className="w-3 h-3 fill-current text-white" />
                </button>
              ) : (
                <button
                  type="button"
                  id="composer-send-action-btn"
                  onClick={() => onSend()}
                  disabled={!hasContent}
                  className={`w-8 h-8 rounded-full transition-all shrink-0 flex items-center justify-center ${
                    hasContent
                      ? 'bg-black text-white hover:bg-gray-800 cursor-pointer shadow-md active:scale-95'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  title="Send message"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ChatGPT Style Bottom Disclaimer */}
        <p className="text-[11px] text-gray-400 text-center mt-2 select-none">
          MKUU AI can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
};

