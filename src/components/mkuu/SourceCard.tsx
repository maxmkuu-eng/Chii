import React from 'react';
import { ExternalLink, Globe, ShieldCheck, Calendar } from 'lucide-react';

export interface WebSourceItem {
  id?: string;
  title: string;
  url: string;
  domain?: string;
  publisher?: string;
  date?: string;
  snippet?: string;
}

interface SourceCardProps {
  source: WebSourceItem;
  index: number;
}

export const SourceCard: React.FC<SourceCardProps> = ({ source, index }) => {
  // Extract clean domain name if not provided
  const extractDomain = (url: string): string => {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return source.domain || 'Tovuti Rasmi';
    }
  };

  const domain = source.domain || extractDomain(source.url);

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      id={`source-card-${index}`}
      className="group flex flex-col justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all duration-200 shadow-2xs max-w-sm"
    >
      <div className="flex items-start gap-2 min-w-0">
        <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
          <Globe className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <h5 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-2 transition-colors leading-snug">
            {source.title}
          </h5>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-200 text-[10px] text-gray-500 font-mono">
        <span className="flex items-center gap-1 text-gray-700 font-medium truncate">
          <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
          <span className="truncate">{domain}</span>
        </span>

        {source.date && (
          <span className="flex items-center gap-1 text-gray-500 shrink-0">
            <Calendar className="w-2.5 h-2.5" />
            <span className="truncate max-w-[80px]">{source.date}</span>
          </span>
        )}

        <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-auto" />
      </div>
    </a>
  );
};

export const SourceList: React.FC<{ sources: WebSourceItem[] }> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Vyanzo Vilivyothibitishwa (Verified Sources)</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sources.map((s, idx) => (
          <SourceCard key={idx} source={s} index={idx} />
        ))}
      </div>
    </div>
  );
};
