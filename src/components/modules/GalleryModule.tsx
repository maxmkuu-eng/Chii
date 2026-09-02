import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Image as ImageIcon,
  Search,
  Download,
  Trash2,
  Copy,
  Check,
  Wand2,
  Share2,
  Maximize2,
} from 'lucide-react';
import { StudioImage } from '../../types';
import { api } from '../../services/api';
import { EmptyState } from '../common/EmptyState';
import { ImageLightboxModal } from '../common/ImageLightboxModal';
import { downloadImageFile, shareImageFile } from '../../utils/imageUtils';

export const GalleryModule: React.FC = () => {
  const { navigateTo, showToast } = useApp();
  const [images, setImages] = useState<StudioImage[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [activeLightboxImage, setActiveLightboxImage] = useState<StudioImage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refreshGallery = async () => {
    try {
      const list = await api.getGallery();
      setImages(list);
    } catch {}
  };

  useEffect(() => {
    refreshGallery();
  }, []);

  const filteredImages = images.filter(img => {
    const matchesSearch = img.prompt.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedStyle !== 'all' && img.style !== selectedStyle) return false;
    return true;
  });

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await api.deleteGalleryImage(id);
      await refreshGallery();
      if (activeLightboxImage?.id === id) setActiveLightboxImage(null);
      showToast({ title: 'Imefutwa', message: 'Picha imeondolewa kwenye gallery', type: 'info' });
    } catch (err: any) {
      showToast({ title: 'Hitilafu', message: err?.message, type: 'error' });
    }
  };

  const handleCopyPrompt = (id: string, text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast({ title: 'Imenakiliwa', message: 'Maelezo ya picha yamenakiliwa', type: 'success' });
  };

  const handleDownload = async (img: StudioImage, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const clean = img.prompt.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 24);
    await downloadImageFile(img.url, `mkuu-gallery-${clean}-${img.id}.png`);
    showToast({ title: 'Imepakuliwa', message: 'Picha imehifadhiwa kwenye simu yako', type: 'info' });
  };

  const handleShare = async (img: StudioImage, e?: React.MouseEvent) => {
    e?.stopPropagation();
    await shareImageFile(img.url, img.prompt, `mkuu-gallery-${img.id}.png`);
  };

  const stylesList = Array.from(new Set(images.map(i => i.style).filter(Boolean)));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-amber-500" /> MKUU Gallery
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Angalia, panua (preview), pakua (download kwenye simu), na ushiriki picha zote zilizotengenezwa na kuhaririwa.
          </p>
        </div>

        <button
          onClick={() => navigateTo('studio')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Wand2 className="w-4 h-4" />
          <span>Fungua Studio / Hariri Picha</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tafuta picha kwa maelezo au maneno..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>

        {stylesList.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedStyle('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedStyle === 'all'
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Zote ({images.length})
            </button>
            {stylesList.map(st => (
              <button
                key={st}
                onClick={() => setSelectedStyle(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedStyle === st
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Gallery Grid */}
      {filteredImages.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Hakuna Picha Katika Gallery"
          description={search ? 'Hakuna picha inayolingana na utafutaji wako.' : 'Bado hujaweka au kutengeneza picha yoyote katika Studio.'}
          actionLabel="Unda Picha Sasa"
          onAction={() => navigateTo('studio')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredImages.map(img => (
            <div
              key={img.id}
              className="group relative rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
            >
              {/* Image Container */}
              <div
                onClick={() => setActiveLightboxImage(img)}
                className="relative bg-gray-950 flex items-center justify-center cursor-pointer aspect-video overflow-hidden group/img"
              >
                <img
                  src={img.url}
                  alt={img.prompt}
                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-white/95 text-xs font-bold text-gray-900 flex items-center gap-1.5 shadow-lg">
                    <Maximize2 className="w-3.5 h-3.5 text-amber-600" /> Bofya Kupanua
                  </span>
                </div>
              </div>

              {/* Card Meta & Controls */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                    {img.style}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {new Date(img.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-gray-700 dark:text-gray-300 font-medium line-clamp-2 leading-relaxed">
                  {img.prompt}
                </p>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                  <button
                    onClick={e => handleCopyPrompt(img.id, img.prompt, e)}
                    className="flex items-center gap-1 text-gray-500 hover:text-amber-600 transition-colors cursor-pointer"
                    title="Copy Prompt"
                  >
                    {copiedId === img.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === img.id ? 'Imenakiliwa' : 'Copy'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={e => handleShare(img, e)}
                      className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
                      title="Shiriki / Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={e => handleDownload(img, e)}
                      className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
                      title="Pakua kwenye Simu"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={e => handleDelete(img.id, e)}
                      className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                      title="Futa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {activeLightboxImage && (
        <ImageLightboxModal
          isOpen={Boolean(activeLightboxImage)}
          onClose={() => setActiveLightboxImage(null)}
          imageUrl={activeLightboxImage.url}
          title={activeLightboxImage.prompt}
          subtitle={`Mtindo: ${activeLightboxImage.style} • ${new Date(activeLightboxImage.createdAt).toLocaleDateString()}`}
          sourceType="ai_generated"
        />
      )}
    </div>
  );
};
