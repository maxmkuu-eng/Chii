import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Radio,
  Sliders,
  Settings,
  Bot,
  User,
  Activity,
  AudioLines,
} from 'lucide-react';
import { api } from '../../services/api';

export const VoiceModule: React.FC = () => {
  const { settings, updateSettings, showToast, memories } = useApp();

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [spokenHistory, setSpokenHistory] = useState<Array<{ role: 'user' | 'model'; text: string; time: string }>>([
    {
      role: 'model',
      text: 'MKUU AI Voice is ready. Tap the microphone to speak naturally.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [autoLoop, setAutoLoop] = useState(false);

  const recognitionRef = useRef<any>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [spokenHistory, isThinking]);

  // Voice synthesis helper
  const speakText = (text: string, onComplete?: () => void) => {
    if (!('speechSynthesis' in window) || !settings.voiceOutput) {
      if (onComplete) onComplete();
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_\[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);

    utterance.rate = settings.voiceRate || 1.0;
    utterance.pitch = settings.voicePitch || 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferred = voices.find(v => v.lang?.startsWith('en'));
      if (preferred) utterance.voice = preferred;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onComplete) onComplete();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (onComplete) onComplete();
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleProcessUserSpeech = async (spokenText: string) => {
    if (!spokenText.trim()) return;

    const userEntry = {
      role: 'user' as const,
      text: spokenText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const modelEntry = {
      role: 'model' as const,
      text: '',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setSpokenHistory(prev => [...prev, userEntry, modelEntry]);
    setTranscript('');
    setIsThinking(true);

    try {
      const activeMemoriesList = settings.memoryEnabled
        ? memories.filter(m => m.active).map(m => `${m.title}: ${m.content}`)
        : [];

      let fullAccumulated = '';

      await api.sendChat({
        messages: [
          ...spokenHistory.map(h => ({ role: h.role, content: h.text })),
          { role: 'user', content: spokenText },
        ],
        systemInstruction: 'You are MKUU AI Voice, an interactive spoken assistant. Provide concise, friendly, high-density conversational responses without verbose markdown.',
        activeMemories: activeMemoriesList,
        userProfile: null,
        stream: true,
        onChunk: (chunk: string) => {
          fullAccumulated += chunk;
          setSpokenHistory(prev => {
            const next = [...prev];
            if (next.length > 0 && next[next.length - 1].role === 'model') {
              next[next.length - 1] = {
                ...next[next.length - 1],
                text: fullAccumulated,
              };
            }
            return next;
          });
        },
      });

      const aiResponse = fullAccumulated || 'I heard your request.';

      speakText(aiResponse, () => {
        if (autoLoop) {
          startListening();
        }
      });
    } catch (err: any) {
      showToast({ title: 'Voice Error', message: err?.message, type: 'error' });
      setSpokenHistory(prev => {
        const next = [...prev];
        if (next.length > 0 && next[next.length - 1].role === 'model' && !next[next.length - 1].text) {
          next[next.length - 1].text = 'Voice response failed. Please try again.';
        }
        return next;
      });
    } finally {
      setIsThinking(false);
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showToast({
        title: 'Microphone API Unavailable',
        message: 'Speech recognition requires a supported browser (Chrome, Edge, Safari).',
        type: 'warning',
      });
      return;
    }

    try {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const currentTranscript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setTranscript(currentTranscript);
      };

      recognition.onend = () => {
        setIsListening(false);
        setTranscript(current => {
          if (current.trim()) {
            handleProcessUserSpeech(current);
          }
          return '';
        });
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleClearTranscript = () => {
    setSpokenHistory([]);
    setTranscript('');
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    showToast({ title: 'Cleared', message: 'Voice transcript cleared', type: 'info' });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Radio className="w-6 h-6 text-cyan-500" /> MKUU AI Voice
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time conversational speech intelligence with synthesis and continuous audio dialogue.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => updateSettings({ voiceOutput: !settings.voiceOutput })}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              settings.voiceOutput
                ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            {settings.voiceOutput ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>Voice Audio: {settings.voiceOutput ? 'On' : 'Muted'}</span>
          </button>

          <button
            onClick={handleClearTranscript}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Clear conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Interactive Visual Stage */}
      <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-10 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
        {/* Animated Glow Halo */}
        <div
          className={`absolute w-72 h-72 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
            isListening
              ? 'bg-rose-500/20 scale-125'
              : isSpeaking
              ? 'bg-cyan-500/25 scale-110'
              : isThinking
              ? 'bg-amber-500/20 scale-100'
              : 'bg-cyan-500/5 scale-90'
          }`}
        />

        {/* Central Orb / Voice Trigger */}
        <div className="relative z-10 my-4 flex flex-col items-center">
          <button
            id="voice-mic-trigger"
            onClick={toggleListening}
            className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
              isListening
                ? 'bg-gradient-to-tr from-rose-600 to-red-500 text-white ring-8 ring-rose-500/30 scale-105 animate-pulse'
                : isSpeaking
                ? 'bg-gradient-to-tr from-cyan-600 to-teal-400 text-slate-950 ring-8 ring-cyan-500/30'
                : isThinking
                ? 'bg-gradient-to-tr from-amber-600 to-orange-500 text-slate-950 ring-8 ring-amber-500/30'
                : 'bg-gradient-to-tr from-slate-800 to-slate-700 hover:from-cyan-600 hover:to-cyan-500 text-cyan-400 hover:text-white border-2 border-slate-700'
            }`}
          >
            {isListening ? (
              <Mic className="w-12 h-12" />
            ) : isSpeaking ? (
              <Volume2 className="w-12 h-12 animate-bounce" />
            ) : isThinking ? (
              <Sparkles className="w-12 h-12 animate-spin" />
            ) : (
              <Mic className="w-12 h-12" />
            )}
          </button>

          {/* Status Label */}
          <div className="mt-5 space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
              {isListening
                ? 'Listening to your voice...'
                : isSpeaking
                ? 'MKUU AI Voice is speaking...'
                : isThinking
                ? 'Synthesizing response...'
                : 'Tap Microphone to Speak'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm">
              {isListening
                ? transcript || 'Say your question or command...'
                : 'Natural conversational mode with voice synthesis.'}
            </p>
          </div>
        </div>

        {/* Audio Visualizer Wave Simulation */}
        <div className="flex items-center gap-1.5 h-8 mt-4">
          {[40, 70, 90, 60, 30, 80, 100, 50, 85, 65, 45, 95, 30].map((h, i) => (
            <div
              key={i}
              style={{
                height: isListening || isSpeaking ? `${h}%` : '15%',
              }}
              className={`w-1 rounded-full transition-all duration-150 ${
                isListening
                  ? 'bg-rose-500'
                  : isSpeaking
                  ? 'bg-cyan-400'
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Spoken Transcript Log & Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Spoken Transcript (8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-500" /> Voice Conversation Transcript
            </h3>
            <span className="text-[11px] text-slate-400">{spokenHistory.length} exchanges</span>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-3.5 pr-1">
            {spokenHistory.map((item, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  item.role === 'user'
                    ? 'bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/20 text-slate-800 dark:text-cyan-100 ml-6'
                    : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 mr-6'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    {item.role === 'user' ? <User className="w-3 h-3 text-cyan-500" /> : <Bot className="w-3 h-3 text-amber-500" />}
                    {item.role === 'user' ? 'You (Voice)' : 'MKUU AI Voice'}
                  </span>
                  <span>{item.time}</span>
                </div>
                <p>{item.text}</p>
              </div>
            ))}
            {isThinking && (
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-400 flex items-center gap-2 animate-pulse mr-6">
                <Sparkles className="w-4 h-4 text-amber-500" /> MKUU AI is processing your speech...
              </div>
            )}
            <div ref={historyEndRef} />
          </div>
        </div>

        {/* Voice Parameters & Options (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-500" /> Voice Controls
          </h3>

          {/* Speech Rate Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
              <span>Speech Speed</span>
              <span>{settings.voiceRate || 1.0}x</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.5"
              step="0.05"
              value={settings.voiceRate || 1.0}
              onChange={e => updateSettings({ voiceRate: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Speech Pitch Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
              <span>Voice Pitch</span>
              <span>{settings.voicePitch || 1.0}</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.05"
              value={settings.voicePitch || 1.0}
              onChange={e => updateSettings({ voicePitch: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Continuous Loop Mode */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Auto-Listen Loop</p>
              <p className="text-[10px] text-slate-400">Re-listen after speaking answer</p>
            </div>
            <input
              type="checkbox"
              checked={autoLoop}
              onChange={e => setAutoLoop(e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
