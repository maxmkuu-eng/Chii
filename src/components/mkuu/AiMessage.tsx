import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Volume2,
  VolumeX,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Trash2,
} from 'lucide-react';
import { ChatMessage } from '../../types';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { SourceList, WebSourceItem } from './SourceCard';

interface AiMessageProps {
  message: ChatMessage;
  onRegenerate: () => void;
  onCopy: () => void;
  onDelete?: () => void;
  isCopied: boolean;
}

export const AiMessage: React.FC<AiMessageProps> = ({
  message,
  onRegenerate,
  onCopy,
  onDelete,
  isCopied,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [feedback, setFeedback] = useState<'liked' | 'disliked' | null>(null);

  // Extract sources if citation block exists in content
  const extractSources = (text: string): { cleanContent: string; sources: WebSourceItem[] } => {
    if (!text) return { cleanContent: '', sources: [] };

    const sourcesMarker = /📌\s*\*\*Vyanzo[\s\S]*$/i;
    const markerMatch = text.match(sourcesMarker);

    if (!markerMatch) return { cleanContent: text, sources: [] };

    const sourcesBlock = markerMatch[0];
    const cleanContent = text.replace(sourcesMarker, '').trim();

    // Parse source links from markdown [Title](URL) - Date
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)(?:\s*-\s*([^\n\r]+))?/g;
    const sources: WebSourceItem[] = [];
    let match;

    while ((match = linkRegex.exec(sourcesBlock)) !== null) {
      const fullTitle = match[1];
      const url = match[2];
      const date = match[3]?.trim();

      let domain = '';
      try {
        domain = new URL(url).hostname.replace(/^www\./, '');
      } catch {}

      sources.push({
        title: fullTitle,
        url,
        domain,
        date,
      });
    }

    return { cleanContent, sources };
  };

  const { cleanContent, sources } = extractSources(message.content);

  // Speech TTS Handler
  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    // Strip markdown formatting for cleaner speech
    const plainText = (cleanContent || message.content)
      .replace(/#+\s/g, '')
      .replace(/[*_`~[\]]/g, '')
      .replace(/\(http[^)]+\)/g, '')
      .slice(0, 800);

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex gap-3 sm:gap-4 justify-start group animate-in fade-in duration-150 text-left py-3 w-full">
      {/* MKUU AI Avatar Icon */}
      <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
        <img
          src="/logo.png"
          alt="MKUU AI"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>

      {/* Main Message Flow */}
      <div className="flex-1 min-w-0">
        {/* 1. Initial typing / thinking pulse */}
        {message.status === 'streaming' && !message.content && (
          <div className="flex items-center gap-1.5 text-gray-500 py-1">
            <span className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
            <span className="text-xs text-gray-500">Thinking...</span>
          </div>
        )}

        {/* 2. Streamed or completed content */}
        {message.content && (
          <div className="space-y-3 text-gray-900">
            <MarkdownRenderer content={cleanContent || message.content} />

            {message.status === 'streaming' && (
              <span
                className="inline-block w-2 h-4 ml-1 bg-gray-900 animate-pulse rounded-xs align-middle"
                title="Streaming..."
              />
            )}

            {/* Verified Sources UI Section */}
            {sources.length > 0 && <SourceList sources={sources} />}
          </div>
        )}

        {/* 3. Error state with retry action */}
        {message.status === 'error' && (
          <div className="mt-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 w-full">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="font-semibold text-rose-900">
                {message.error || 'Something went wrong while generating the response.'}
              </p>
              <button
                type="button"
                onClick={onRegenerate}
                className="mt-2 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        )}

        {/* ChatGPT Style Bottom Action Toolbar */}
        {message.content && (
          <div className="flex items-center gap-1 mt-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Copy Button */}
            <button
              onClick={onCopy}
              className="p-1 rounded-md hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
              title="Copy"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Read aloud TTS */}
            <button
              onClick={handleSpeak}
              className={`p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer ${
                isPlayingAudio ? 'text-gray-900 bg-gray-100' : 'hover:text-gray-700'
              }`}
              title={isPlayingAudio ? 'Stop voice' : 'Read aloud'}
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Thumbs up (Good response) */}
            <button
              onClick={() => setFeedback(feedback === 'liked' ? null : 'liked')}
              className={`p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer ${
                feedback === 'liked' ? 'text-gray-900 bg-gray-100' : 'hover:text-gray-700'
              }`}
              title="Good response"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>

            {/* Thumbs down (Bad response) */}
            <button
              onClick={() => setFeedback(feedback === 'disliked' ? null : 'disliked')}
              className={`p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer ${
                feedback === 'disliked' ? 'text-gray-900 bg-gray-100' : 'hover:text-gray-700'
              }`}
              title="Bad response"
            >
              <ThumbsDown className="w-4 h-4" />
            </button>

            {/* Regenerate Button */}
            {message.status !== 'streaming' && (
              <button
                onClick={onRegenerate}
                className="p-1 rounded-md hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                title="Regenerate response"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            {/* Delete Message Button */}
            {onDelete && message.status !== 'streaming' && (
              <button
                onClick={onDelete}
                className="p-1 rounded-md hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                title="Delete message"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

