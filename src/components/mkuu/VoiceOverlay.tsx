import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Mic,
  MicOff,
  Volume2,
  X,
  Sparkles,
  Crown,
  Radio,
} from 'lucide-react';
import { api } from '../../services/api';

interface VoiceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceOverlay: React.FC<VoiceOverlayProps> = ({ isOpen, onClose }) => {
  const { profile, settings, memories, addMessageToActiveConversation } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponseText, setAiResponseText] = useState('');
  const [statusText, setStatusText] = useState('Bonyeza maikrofoni kuanza kuongea na MKUU AI');

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      handleStopVoice();
    }
  }, [isOpen]);

  const handleStopVoice = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsListening(false);
    setIsSpeaking(false);
  };

  const startListening = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setStatusText('Kivinjari hiki hakitumii unukuzi wa sauti moja kwa moja. Tafadhali tumia Chrome au Edge.');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'sw-TZ';

      recognition.onstart = () => {
        setIsListening(true);
        setStatusText('MKUU AI inasikiliza sauti yako...');
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setTranscript(text);
      };

      recognition.onerror = (e: any) => {
        setIsListening(false);
        setStatusText('Haikuweza kupata sauti vizuri. Tafadhali jaribu tena.');
      };

      recognition.onend = () => {
        setIsListening(false);
        if (transcript.trim()) {
          processVoiceQuery(transcript.trim());
        } else {
          setStatusText('Bonyeza maikrofoni kuanza kuongea');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setStatusText('Kulitokea tatizo kuanzisha maikrofoni.');
    }
  };

  const processVoiceQuery = async (query: string) => {
    setStatusText('MKUU AI inatafuta na kuandaa jibu la sauti...');
    
    // Also save to active chat
    const userMsgId = 'msg_usr_v_' + Date.now();
    addMessageToActiveConversation({
      id: userMsgId,
      role: 'user',
      content: `🎙️ ${query}`,
      timestamp: new Date().toISOString(),
      status: 'complete',
    });

    try {
      const activeMemoriesList = settings.memoryEnabled
        ? memories.filter(m => m.active).map(m => `${m.title}: ${m.content}`)
        : [];

      const res = await api.sendChat({
        messages: [{ role: 'user', content: query }],
        systemInstruction: settings.defaultSystemPrompt + '\n\nToa jibu fupi, rasmi na la kueleweka moja kwa moja kwa njia ya sauti.',
        temperature: 0.7,
        activeMemories: activeMemoriesList,
        userProfile: profile,
        stream: false,
      });

      const responseText = res?.text || 'Sawa Boss Max, nimepokea maelekezo yako.';
      setAiResponseText(responseText);
      
      // Save AI reply to chat thread
      addMessageToActiveConversation({
        id: 'msg_model_v_' + Date.now(),
        role: 'model',
        content: responseText,
        timestamp: new Date().toISOString(),
        status: 'complete',
      });

      speakResponse(responseText);
    } catch {
      setStatusText('Imeshindwa kupata jibu kwa sasa. Tafadhali jaribu tena.');
    }
  };

  const speakResponse = (text: string) => {
    if (!synthRef.current) return;

    synthRef.current.cancel();

    const cleanText = text
      .replace(/#+\s/g, '')
      .replace(/[*_`~[\]]/g, '')
      .replace(/\(http[^)]+\)/g, '')
      .slice(0, 600);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = settings.voiceRate || 1.0;
    utterance.pitch = settings.voicePitch || 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setStatusText('MKUU AI inaongea...');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setStatusText('Bonyeza maikrofoni kuendelea na mazungumzo');
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setStatusText('Bonyeza maikrofoni kuongea');
    };

    synthRef.current.speak(utterance);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-200 select-none">
      {/* Top Controls */}
      <div className="absolute top-5 right-5 z-20">
        <button
          onClick={() => {
            handleStopVoice();
            onClose();
          }}
          className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
          aria-label="Funga Voice Mode"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center max-w-lg w-full text-center space-y-8">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-amber-500/40 bg-white shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="MKUU AI"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-sm font-extrabold tracking-tight text-white uppercase">
            MKUU AI • Sauti Moja kwa Moja
          </span>
        </div>

        {/* Dynamic Glowing Sphere / Audio Wave Rings */}
        <div className="relative flex items-center justify-center my-4">
          {/* Outer Pulsing Waves */}
          {isSpeaking && (
            <>
              <div className="absolute w-56 h-56 rounded-full bg-amber-500/10 animate-ping" />
              <div className="absolute w-44 h-44 rounded-full bg-amber-500/20 animate-pulse" />
            </>
          )}
          {isListening && (
            <>
              <div className="absolute w-56 h-56 rounded-full bg-rose-500/15 animate-ping" />
              <div className="absolute w-44 h-44 rounded-full bg-rose-500/25 animate-pulse" />
            </>
          )}

          {/* Central Orb / Trigger */}
          <button
            onClick={isListening ? handleStopVoice : startListening}
            className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 cursor-pointer ${
              isListening
                ? 'bg-gradient-to-tr from-rose-600 to-rose-400 text-white scale-110 shadow-rose-600/50'
                : isSpeaking
                ? 'bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 text-black scale-105 shadow-amber-500/50'
                : 'bg-[#15151C] hover:bg-[#1E1E28] border-2 border-amber-500/40 text-amber-400 hover:scale-105 shadow-amber-500/20'
            }`}
            title={isListening ? 'Acha kusikiliza' : 'Anza kuongea'}
          >
            {isListening ? (
              <Mic className="w-12 h-12 animate-pulse" />
            ) : isSpeaking ? (
              <Volume2 className="w-12 h-12 animate-bounce" />
            ) : (
              <Mic className="w-12 h-12" />
            )}
          </button>
        </div>

        {/* Live Status and Transcript Display */}
        <div className="space-y-3 w-full px-4 min-h-[100px] flex flex-col items-center justify-center">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400/90 flex items-center gap-1.5">
            <Radio className={`w-3.5 h-3.5 ${isListening || isSpeaking ? 'animate-pulse text-amber-400' : 'text-slate-500'}`} />
            {statusText}
          </p>

          {transcript && (
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-200 text-sm max-w-md w-full shadow-inner animate-in fade-in">
              <span className="text-[11px] text-slate-400 font-bold block mb-1">Ulichosema:</span>
              <p className="italic font-medium">"{transcript}"</p>
            </div>
          )}

          {aiResponseText && !isListening && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm max-w-md w-full text-left leading-relaxed shadow-sm">
              <span className="text-[11px] text-amber-400 font-bold block mb-1">MKUU AI:</span>
              <p>{aiResponseText}</p>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={isListening ? handleStopVoice : startListening}
            className={`px-6 py-2.5 rounded-full font-bold text-xs shadow-lg transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-amber-500/20'
            }`}
          >
            {isListening ? 'Sitisha Maikrofoni' : 'Ongea Sasa'}
          </button>
          <button
            onClick={() => {
              handleStopVoice();
              onClose();
            }}
            className="px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
          >
            Rudi kwenye Chat
          </button>
        </div>
      </div>
    </div>
  );
};
