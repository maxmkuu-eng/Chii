import React from 'react';
import {
  Sparkles,
  Search,
  Image as ImageIcon,
  PenTool,
  Code2,
  BrainCircuit,
  MessageSquare,
  Globe,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface EmptyChatStateProps {
  onSelectPrompt: (prompt: string, options?: { enableSearch?: boolean; isImageMode?: boolean }) => void;
}

export const EmptyChatState: React.FC<EmptyChatStateProps> = ({ onSelectPrompt }) => {
  const { profile } = useApp();

  const suggestionCards = [
    {
      id: 'create-image',
      title: 'Tengeneza picha (Create image)',
      subtitle: 'Mandhari ya usiku ya jiji la Dar es Salaam yenye taa za kisasa',
      icon: ImageIcon,
      prompt: 'Tengeneza picha ya kuvutia ya jiji la kisasa la Dar es Salaam wakati wa usiku, 8k render, photorealistic.',
      options: { isImageMode: true },
    },
    {
      id: 'web-search',
      title: 'Tafuta mtandaoni (Live Search)',
      subtitle: 'Habari na matukio ya hivi punde na vyanzo halisi',
      icon: Globe,
      prompt: 'Nipe muhtasari wa mechi za hivi karibuni na msimamo wa NBC Premier League pamoja na vyanzo rasmi vya habari.',
      options: { enableSearch: true },
    },
    {
      id: 'write-code',
      title: 'Andika au kagua code',
      subtitle: 'Tengeneza script au utatue hitilafu za programu',
      icon: Code2,
      prompt: 'Nisaidie kuandika React custom hook ya kusikiliza mabadiliko ya mtandao (online/offline status) kwa kutumia TypeScript.',
    },
    {
      id: 'writing-help',
      title: 'Msaada wa kuandika (Writing)',
      subtitle: 'Barua rasmi, ripoti, au makala kwa Kiswahili fasaha',
      icon: PenTool,
      prompt: 'Nisaidie kuandika barua rasmi ya kiofisi ya kuomba nafasi ya kazi ya Project Manager kwa lugha ya Kiswahili fasaha na yenye ushawishi.',
    },
  ];

  const quickPills = [
    { label: '🎨 Create image', prompt: 'Tengeneza picha ya simba kwenye mbuga ya Serengeti wakati wa machweo.', isImage: true },
    { label: '🌐 Search web', prompt: 'Nipe taarifa na habari mpya za kiteknolojia za wiki hii.', search: true },
    { label: '✍️ Help me write', prompt: 'Nisaidie kuandika email fupi na ya heshima kwa mteja kuhusu mabadiliko ya ratiba.' },
    { label: '💡 Brainstorm ideas', prompt: 'Nipe mawazo 5 ya biashara ndogo za kidijitali zenye fursa kubwa Tanzania kwa sasa.' },
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8 max-w-2xl mx-auto select-none animate-in fade-in duration-200">
      {/* MKUU AI Brand Icon */}
      <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 overflow-hidden flex items-center justify-center mb-5 shadow-sm">
        <img
          src="/logo.png"
          alt="MKUU AI"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>

      {/* Main Welcoming Title */}
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight mb-8">
        Habari {profile?.name || 'Max'}, nikusaidie nini leo?
      </h1>

      {/* 2x2 Suggestion Cards Grid (ChatGPT style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full mb-6 text-left">
        {suggestionCards.map(card => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => onSelectPrompt(card.prompt, card.options)}
              className="p-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100/90 border border-gray-200 hover:border-gray-300 transition-all duration-150 cursor-pointer text-left group"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-900 mb-1">
                <Icon className="w-4 h-4 text-gray-500 group-hover:text-black shrink-0" />
                <span className="truncate">{card.title}</span>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {card.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      {/* Quick Action Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {quickPills.map((pill, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(pill.prompt, { isImageMode: pill.isImage, enableSearch: pill.search })}
            className="px-3.5 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs text-gray-700 hover:text-black transition-colors cursor-pointer shadow-xs"
          >
            {pill.label}
          </button>
        ))}
      </div>
    </div>
  );
};

