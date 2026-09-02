import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  ArrowDown,
  RefreshCw,
  Crown,
} from 'lucide-react';
import { ChatMessage, Attachment } from '../../types';
import { api } from '../../services/api';
import { EmptyChatState } from '../mkuu/EmptyChatState';
import { UserMessage } from '../mkuu/UserMessage';
import { AiMessage } from '../mkuu/AiMessage';
import { MessageComposer } from '../mkuu/MessageComposer';
import { ImageGenerationCard } from '../mkuu/ImageGenerationCard';

interface ChatModuleProps {
  onOpenVoiceModal?: () => void;
}

export const ChatModule: React.FC<ChatModuleProps> = ({ onOpenVoiceModal }) => {
  const {
    activeConversation,
    createConversation,
    addMessageToActiveConversation,
    updateMessageInActiveConversation,
    deleteMessageFromActiveConversation,
    settings,
    memories,
    profile,
    showToast,
  } = useApp();

  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [isImageMode, setIsImageMode] = useState(false);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isNearBottomRef = useRef(true);

  // Track scroll position to prevent forced scrolling if user scrolled up
  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNear = distanceFromBottom < 90;
    isNearBottomRef.current = isNear;
    setShowScrollBottomBtn(!isNear);
  };

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  const activeMemoriesList = settings.memoryEnabled
    ? memories.filter(m => m.active).map(m => `${m.title}: ${m.content}`)
    : [];

  const handleSendMessage = async (textToSend?: string, attachedFiles?: Attachment[]) => {
    const messageContent = (textToSend !== undefined ? textToSend : input).trim();
    const currentAttachments = attachedFiles || attachments;

    if (!messageContent && currentAttachments.length === 0) return;
    if (isGenerating) return;

    if (!activeConversation) {
      createConversation(messageContent.slice(0, 32));
    }

    const userMessageId = 'msg_usr_' + Date.now();
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: messageContent,
      attachments: [...currentAttachments],
      timestamp: new Date().toISOString(),
      status: 'complete',
    };

    addMessageToActiveConversation(userMessage);
    setInput('');
    setAttachments([]);

    // Check if this is an image generation request
    const isExplicitImageReq = isImageMode || /^(tengeneza picha|chora picha|unda picha|\/image|generate image)/i.test(messageContent);

    // Model message placeholder in 'streaming' state
    const modelMessageId = 'msg_model_' + (Date.now() + 1);
    const modelMessage: ChatMessage = {
      id: modelMessageId,
      role: 'model',
      content: '',
      timestamp: new Date().toISOString(),
      status: 'streaming',
    };
    addMessageToActiveConversation(modelMessage);

    // Auto-scroll on user send
    isNearBottomRef.current = true;
    setShowScrollBottomBtn(false);
    setTimeout(() => scrollToBottom('smooth'), 50);

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    let accumulatedResponse = '';

    try {
      // Build conversation history payload
      const historyPayload = (activeConversation ? activeConversation.messages : []).map(m => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments,
      }));

      // Add latest user message
      historyPayload.push({
        role: 'user',
        content: userMessage.content,
        attachments: userMessage.attachments,
      });

      const res = await api.sendChat({
        messages: historyPayload,
        systemInstruction: settings.defaultSystemPrompt,
        temperature: settings.temperature,
        activeMemories: activeMemoriesList,
        userProfile: profile,
        stream: settings.streaming,
        signal: abortControllerRef.current.signal,
        onChunk: (chunk: string) => {
          accumulatedResponse += chunk;
          updateMessageInActiveConversation(modelMessageId, {
            content: accumulatedResponse,
            status: 'streaming',
          });

          if (isNearBottomRef.current) {
            scrollToBottom('auto');
          }
        },
      });

      const finalContent = (accumulatedResponse || res?.text || '').trim();

      if (!finalContent) {
        updateMessageInActiveConversation(modelMessageId, {
          content: '',
          status: 'error',
          error: 'MKUU AI haikupokea jibu kutoka kwa AI engine. Tafadhali jaribu tena.',
        });
      } else {
        updateMessageInActiveConversation(modelMessageId, {
          content: finalContent,
          status: 'complete',
        });
      }

      if (isNearBottomRef.current) {
        scrollToBottom('smooth');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const partial = accumulatedResponse.trim();
        updateMessageInActiveConversation(modelMessageId, {
          content: partial,
          status: partial ? 'complete' : 'error',
          error: partial ? undefined : 'Uzalishaji ulisitishwa na mtumiaji.',
        });
      } else {
        const partial = (accumulatedResponse || err.partialText || '').trim();
        updateMessageInActiveConversation(modelMessageId, {
          content: partial,
          status: 'error',
          error: err?.message || 'Imeshindwa kupokea jibu kutoka kwa seva ya AI.',
        });
        showToast({ title: 'Hitilafu ya Mazungumzo', message: err?.message || 'Ombi halikukamilika', type: 'error' });
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      showToast({ title: 'Imesitishwa', message: 'Uzalishaji wa jibu umesimamishwa', type: 'info' });
    }
  };

  const handleRegenerate = async (targetModelMsgId?: string) => {
    if (!activeConversation || activeConversation.messages.length === 0 || isGenerating) return;

    const messages = activeConversation.messages;
    let lastUserIndex = -1;

    if (targetModelMsgId) {
      const targetIdx = messages.findIndex(m => m.id === targetModelMsgId);
      if (targetIdx !== -1) {
        for (let i = targetIdx - 1; i >= 0; i--) {
          if (messages[i].role === 'user') {
            lastUserIndex = i;
            break;
          }
        }
      }
    }

    if (lastUserIndex === -1) {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          lastUserIndex = i;
          break;
        }
      }
    }

    if (lastUserIndex === -1) return;

    const modelMessageId = targetModelMsgId || ('msg_model_' + Date.now());
    if (!targetModelMsgId) {
      const modelMessage: ChatMessage = {
        id: modelMessageId,
        role: 'model',
        content: '',
        timestamp: new Date().toISOString(),
        status: 'streaming',
      };
      addMessageToActiveConversation(modelMessage);
    } else {
      updateMessageInActiveConversation(modelMessageId, {
        content: '',
        status: 'streaming',
        error: undefined,
      });
    }

    isNearBottomRef.current = true;
    setShowScrollBottomBtn(false);
    setTimeout(() => scrollToBottom('smooth'), 50);

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    let accumulated = '';

    try {
      const historyPayload = messages.slice(0, lastUserIndex + 1).map(m => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments,
      }));

      const res = await api.sendChat({
        messages: historyPayload,
        systemInstruction: settings.defaultSystemPrompt,
        temperature: settings.temperature,
        activeMemories: activeMemoriesList,
        userProfile: profile,
        stream: settings.streaming,
        signal: abortControllerRef.current.signal,
        onChunk: (chunk: string) => {
          accumulated += chunk;
          updateMessageInActiveConversation(modelMessageId, {
            content: accumulated,
            status: 'streaming',
          });

          if (isNearBottomRef.current) {
            scrollToBottom('auto');
          }
        },
      });

      const finalContent = (accumulated || res?.text || '').trim();

      if (!finalContent) {
        updateMessageInActiveConversation(modelMessageId, {
          content: '',
          status: 'error',
          error: 'MKUU AI haikupokea jibu. Tafadhali jaribu tena.',
        });
      } else {
        updateMessageInActiveConversation(modelMessageId, {
          content: finalContent,
          status: 'complete',
        });
      }

      if (isNearBottomRef.current) {
        scrollToBottom('smooth');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const partial = accumulated.trim();
        updateMessageInActiveConversation(modelMessageId, {
          content: partial,
          status: partial ? 'complete' : 'error',
          error: partial ? undefined : 'Uzalishaji ulisitishwa na mtumiaji.',
        });
      } else {
        const partial = (accumulated || err.partialText || '').trim();
        updateMessageInActiveConversation(modelMessageId, {
          content: partial,
          status: 'error',
          error: err?.message || 'Imeshindwa kurudia jibu.',
        });
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleEditUserMessage = (msgId: string, newContent: string) => {
    if (!activeConversation) return;

    updateMessageInActiveConversation(msgId, { content: newContent });

    const msgIdx = activeConversation.messages.findIndex(m => m.id === msgId);
    if (msgIdx === -1) return;

    const historyPayload = activeConversation.messages.slice(0, msgIdx + 1).map((m, idx) => ({
      role: m.role,
      content: idx === msgIdx ? newContent.trim() : m.content,
      attachments: m.attachments,
    }));

    const modelMessageId = 'msg_model_' + Date.now();
    const modelMessage: ChatMessage = {
      id: modelMessageId,
      role: 'model',
      content: '',
      timestamp: new Date().toISOString(),
      status: 'streaming',
    };
    addMessageToActiveConversation(modelMessage);

    isNearBottomRef.current = true;
    setShowScrollBottomBtn(false);
    setTimeout(() => scrollToBottom('smooth'), 50);

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    let accumulated = '';

    api.sendChat({
      messages: historyPayload,
      systemInstruction: settings.defaultSystemPrompt,
      temperature: settings.temperature,
      activeMemories: activeMemoriesList,
      userProfile: profile,
      stream: settings.streaming,
      signal: abortControllerRef.current.signal,
      onChunk: (chunk: string) => {
        accumulated += chunk;
        updateMessageInActiveConversation(modelMessageId, {
          content: accumulated,
          status: 'streaming',
        });

        if (isNearBottomRef.current) {
          scrollToBottom('auto');
        }
      },
    }).then(res => {
      const finalContent = (accumulated || res?.text || '').trim();
      updateMessageInActiveConversation(modelMessageId, {
        content: finalContent || 'Jibu limekamilika.',
        status: 'complete',
      });
    }).catch(err => {
      if (err.name !== 'AbortError') {
        updateMessageInActiveConversation(modelMessageId, {
          content: accumulated.trim(),
          status: 'error',
          error: err?.message || 'Hitilafu wakati wa kuchakata ujumbe uliohaririwa.',
        });
      }
    }).finally(() => {
      setIsGenerating(false);
      abortControllerRef.current = null;
    });
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast({ title: 'Imenakiliwa', message: 'Ujumbe umenakiliwa kwenye clipboard', type: 'success' });
  };

  const handleAddAttachment = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (file.size > 25 * 1024 * 1024) {
        showToast({ title: 'Faili ni Kubwa', message: 'Kiwango cha juu ni 25MB', type: 'warning' });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setAttachments(prev => [
          ...prev,
          {
            id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            name: file.name,
            size: file.size,
            type: file.type,
            data: result,
          },
        ]);
      };

      if (file.type && file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleVoiceInputToggle = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showToast({
        title: 'Sauti haipatikani',
        message: 'Kivinjari hiki hakitumii unukuzi wa sauti. Tafadhali tumia Chrome au Edge.',
        type: 'warning',
      });
      return;
    }

    if (isVoiceRecording) {
      setIsVoiceRecording(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'sw-TZ';

      recognition.onstart = () => {
        setIsVoiceRecording(true);
        showToast({ title: 'Inasikiliza...', message: 'Ongea wazi kupitia maikrofoni yako', type: 'info' });
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsVoiceRecording(false);
        showToast({ title: 'Maikrofoni', message: 'Haikuweza kupokea sauti au ruhusa imekataliwa', type: 'warning' });
      };

      recognition.onend = () => {
        setIsVoiceRecording(false);
      };

      recognition.start();
    } catch {
      setIsVoiceRecording(false);
    }
  };

  const messages = activeConversation?.messages || [];

  return (
    <div className="relative flex flex-col h-full w-full bg-white text-gray-900 font-sans overflow-hidden">
      {/* Messages Scroll Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-4 scrollbar-thin bg-white"
      >
        <div className="max-w-3xl mx-auto w-full min-h-full flex flex-col justify-between">
          {messages.length === 0 ? (
            <div className="my-auto">
              <EmptyChatState
                onSelectPrompt={(prompt, options) => {
                  if (options?.enableSearch) setWebSearchEnabled(true);
                  if (options?.isImageMode) setIsImageMode(true);
                  handleSendMessage(prompt);
                }}
              />
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {messages.map(msg => (
                <React.Fragment key={msg.id}>
                  {msg.role === 'user' ? (
                    <UserMessage
                      message={msg}
                      userName={profile?.name || 'Max'}
                      onEditSave={newContent => handleEditUserMessage(msg.id, newContent)}
                      onCopy={() => handleCopyMessage(msg.id, msg.content)}
                      onDelete={() => deleteMessageFromActiveConversation(msg.id)}
                      isCopied={copiedId === msg.id}
                    />
                  ) : (
                    <AiMessage
                      message={msg}
                      onRegenerate={() => handleRegenerate(msg.id)}
                      onCopy={() => handleCopyMessage(msg.id, msg.content)}
                      onDelete={() => deleteMessageFromActiveConversation(msg.id)}
                      isCopied={copiedId === msg.id}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Scroll To Bottom Button */}
      {showScrollBottomBtn && (
        <div className="absolute bottom-24 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-8 z-30 animate-in fade-in duration-150">
          <button
            type="button"
            onClick={() => {
              isNearBottomRef.current = true;
              setShowScrollBottomBtn(false);
              scrollToBottom('smooth');
            }}
            className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-700 hover:text-black shadow-lg flex items-center justify-center transition-all cursor-pointer hover:bg-gray-50"
            title="Scroll to bottom"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ChatGPT Style Composer */}
      <MessageComposer
        input={input}
        setInput={setInput}
        onSend={handleSendMessage}
        onStop={handleStopGeneration}
        isGenerating={isGenerating}
        attachments={attachments}
        onAddAttachment={handleAddAttachment}
        onRemoveAttachment={handleRemoveAttachment}
        webSearchEnabled={webSearchEnabled}
        setWebSearchEnabled={setWebSearchEnabled}
        isImageMode={isImageMode}
        setIsImageMode={setIsImageMode}
        isVoiceRecording={isVoiceRecording}
        onToggleVoice={handleVoiceInputToggle}
        onOpenVoiceModal={onOpenVoiceModal}
      />
    </div>
  );
};
