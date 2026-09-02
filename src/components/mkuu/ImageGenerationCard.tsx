import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Maximize2,
  Copy,
  Check,
  RefreshCw,
  X,
  AlertCircle,
  ImageIcon,
  Share2,
} from 'lucide-react';
import { ImageLightboxModal } from '../common/ImageLightboxModal';
import { downloadImageFile, shareImageFile } from '../../utils/imageUtils';

interface ImageGenerationCardProps {
  prompt: string;
  imageUrl?: string;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  aspectRatio?: string;
}

export const ImageGenerationCard: React.FC<ImageGenerationCardProps> = ({
  prompt,
  imageUrl,
  isLoading,
  error,
  onRetry,
  aspectRatio = '1:1',
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    const cleanPrompt = prompt.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 24);
    await downloadImageFile(imageUrl, `mkuu-${cleanPrompt}-${Date.now()}.png`);
  };

  const handleShare = async () => {
    if (!imageUrl) return;
    await shareImageFile(imageUrl, prompt, `mkuu-${Date.now()}.png`);
  };

  return (
    <>
      <div className="my-3 rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-md max-w-lg">
        {/* Card Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50 border-b border-gray-200 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Sparkles className="w-3 h-3" />
            </div>
            <span className="font-bold text-gray-900 truncate">MKUU AI Studio Render</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 font-mono">
              {aspectRatio}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyPrompt}
              className="p-1 rounded text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              title="Copy prompt"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Media Content */}
        <div className="relative bg-gray-100 min-h-[240px] flex items-center justify-center overflow-hidden group">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center animate-spin text-amber-600">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div className="absolute inset-0 bg-amber-500/10 blur-xl rounded-full animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-900">MKUU AI Inatengeneza Picha...</p>
                <p className="text-[11px] text-gray-600 max-w-xs">
                  Inachakata rangi, maumbo na maelezo ya 3D kwa usahihi wa hali ya juu.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-rose-800">Haikuweza kukamilisha picha</p>
                <p className="text-[11px] text-gray-600 max-w-xs">{error}</p>
              </div>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-3 py-1.5 rounded-lg bg-black text-white text-xs font-bold hover:bg-gray-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Jaribu Tena</span>
                </button>
              )}
            </div>
          ) : imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={prompt}
                referrerPolicy="no-referrer"
                onClick={() => setModalOpen(true)}
                className="w-full h-auto max-h-[400px] object-cover transition-transform duration-300 group-hover:scale-[1.01] cursor-pointer"
              />

              {/* Overlay Actions on Hover / Touch */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-white text-xs font-semibold hover:bg-black/90 transition-all cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Panua (Preview)</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="p-1.5 rounded-lg bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all cursor-pointer"
                    title="Shiriki / Share"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-gray-100 shadow-md transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Pakua</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-400">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <span className="text-xs">Hakuna picha</span>
            </div>
          )}
        </div>

        {/* Prompt Caption */}
        <div className="p-3 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-700 italic line-clamp-2 leading-relaxed">
            "{prompt}"
          </p>
        </div>
      </div>

      {/* Full Size Modal */}
      {modalOpen && imageUrl && (
        <ImageLightboxModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          imageUrl={imageUrl}
          title={prompt}
          subtitle="MKUU AI Studio Full Resolution"
          sourceType="ai_generated"
        />
      )}
    </>
  );
};
