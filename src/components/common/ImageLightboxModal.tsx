import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Check,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { downloadImageFile, shareImageFile } from '../../utils/imageUtils';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  sourceType?: 'user_upload' | 'ai_generated' | 'gallery' | 'edited';
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title = 'Picha',
  subtitle,
  sourceType = 'ai_generated',
}) => {
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    const cleanTitle = (title || 'picha')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .slice(0, 30);
    const filename = `mkuu-${cleanTitle}-${Date.now()}.png`;
    await downloadImageFile(imageUrl, filename);
    setIsDownloading(false);
  };

  const handleShare = async () => {
    setIsSharing(true);
    const filename = `mkuu-picha-${Date.now()}.png`;
    await shareImageFile(imageUrl, title, filename);
    setIsSharing(false);
  };

  const handleCopyLink = () => {
    if (!imageUrl.startsWith('data:')) {
      navigator.clipboard.writeText(imageUrl);
    } else {
      navigator.clipboard.writeText(title || 'MKUU AI Image');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-md flex flex-col justify-between animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Top Bar Header */}
      <div
        className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-b from-black/80 to-transparent z-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              sourceType === 'user_upload'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate">{title}</h3>
            <p className="text-[11px] text-gray-400 truncate">
              {subtitle || (sourceType === 'user_upload' ? 'Picha Uliyotuma Wewe' : 'Picha ya MKUU AI')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom In / Out */}
          <div className="hidden sm:flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/10">
            <button
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
              className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-gray-300 px-1.5">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
              className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {zoom !== 1 && (
              <button
                onClick={() => setZoom(1)}
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/10"
            title="Funga"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Canvas Viewport */}
      <div
        className="flex-1 w-full flex items-center justify-center p-2 sm:p-6 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative max-w-full max-h-full flex items-center justify-center overflow-auto p-2">
          <img
            src={imageUrl}
            alt={title}
            referrerPolicy="no-referrer"
            style={{
              transform: `scale(${zoom})`,
              transition: 'transform 0.15s ease-out',
            }}
            className="max-h-[72vh] sm:max-h-[78vh] w-auto max-w-full object-contain rounded-xl shadow-2xl drop-shadow-2xl cursor-grab active:cursor-grabbing"
            onClick={e => {
              e.stopPropagation();
              setZoom(prev => (prev === 1 ? 1.75 : 1));
            }}
          />
        </div>
      </div>

      {/* Bottom Floating Bar */}
      <div
        className="w-full px-4 sm:px-6 py-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-xs text-gray-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Ubora Kamili (Full Resolution) • Tayari kwa Simu yako</span>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto w-full sm:w-auto justify-end">
          {/* Share on Mobile */}
          <button
            type="button"
            onClick={handleShare}
            disabled={isSharing}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-md transition-all border border-white/15 cursor-pointer active:scale-95"
          >
            <Share2 className="w-4 h-4 text-purple-300" />
            <span>Shiriki / Share</span>
          </button>

          {/* Download to phone / APK */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-gray-100 text-xs font-bold shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>{isDownloading ? 'Inapakua...' : 'Pakua kwenye Simu'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
