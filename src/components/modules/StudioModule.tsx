import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Image as ImageIcon,
  Download,
  Wand2,
  RefreshCw,
  Crop,
  Palette,
  Maximize2,
  Upload,
  Trash2,
  Share2,
  Camera,
  Scissors,
  Shirt,
  ZoomIn,
  Eye,
  Sliders,
  CheckCircle2,
  ArrowRight,
  Sparkle,
} from 'lucide-react';
import { api } from '../../services/api';
import { StudioImage } from '../../types';
import { ImageLightboxModal } from '../common/ImageLightboxModal';
import { downloadImageFile, shareImageFile } from '../../utils/imageUtils';

export const StudioModule: React.FC = () => {
  const { showToast, navigateTo } = useApp();

  const [activeTab, setActiveTab] = useState<'create' | 'edit'>('create');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Photorealistic');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Uploaded Source Image State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageName, setUploadedImageName] = useState<string>('Picha Iliyopakiwa');
  const [editPrompt, setEditPrompt] = useState('');
  
  // Output Image State
  const [currentImage, setCurrentImage] = useState<StudioImage | null>(null);
  const [recentImages, setRecentImages] = useState<StudioImage[]>([]);
  
  // Lightbox Modal State
  const [lightboxData, setLightboxData] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    subtitle?: string;
    sourceType?: 'ai_generated' | 'user_upload' | 'edited' | 'gallery';
  }>({
    isOpen: false,
    url: '',
    title: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const stylePresets = [
    'Photorealistic',
    'Commercial Studio',
    'Cinematic 8K',
    '3D Render',
    'Digital Art',
    'Anime / Manga',
    'Minimalist Vector',
    'Watercolor',
  ];

  const aspectRatios = [
    { label: '1:1 Square (Instagram/Avatar)', value: '1:1' as const },
    { label: '16:9 Landscape (Banner/Video)', value: '16:9' as const },
    { label: '9:16 Portrait (Reels/Status)', value: '9:16' as const },
    { label: '4:3 Standard (Photo)', value: '4:3' as const },
  ];

  const samplePrompts = [
    'Picha ya kitaalamu ya vazi la kitenge la kisasa lenye rangi ya bluu na nyeupe kwenye mannequin ya duka',
    'Professional 3D isometric workstation with glowing blue neon holographic charts and sleek glass',
    'Modern African luxury fashion model wearing emerald silk kaftan in golden hour studio lighting',
    'Minimalist geometric logo of an intelligent eagle in matte black and gold with clean shadows',
  ];

  // Handle File Upload from device / camera
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast({ title: 'Aina batili', message: 'Tafadhali chagua faili la picha (JPEG/PNG/WebP)', type: 'warning' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setUploadedImage(base64);
      setUploadedImageName(file.name);
      setActiveTab('edit');
      showToast({ title: 'Picha Imepakiwa!', message: 'Sasa unaweza kuondoa background, kuweka kwenye mannequin, au kuhariri.', type: 'success' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Generate Image from Text
  const handleGenerate = async (promptOverride?: string) => {
    const textPrompt = promptOverride || prompt;
    if (!textPrompt.trim()) {
      showToast({ title: 'Andika Maelezo', message: 'Tafadhali andika maelezo ya picha unayotaka kuunda', type: 'warning' });
      return;
    }

    setIsGenerating(true);
    try {
      const generated = await api.generateStudioImage({
        prompt: `${textPrompt}, ${style} style, ultra high resolution, clean masterpiece`,
        aspectRatio,
        style,
      });

      setCurrentImage(generated);
      setRecentImages(prev => [generated, ...prev.filter(img => img.id !== generated.id)].slice(0, 10));
      showToast({ title: 'Picha Imekamilika!', message: 'Picha yako imetengenezwa tayari kwa kuangalia au kupakua.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Hitilafu ya Utengenezaji', message: err?.message || 'Haikuweza kutengeneza picha', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  // Edit or Transform Uploaded / Current Image
  const handleApplyEdit = async (action: 'variation' | 'edit' | 'remove_bg' | 'mannequin' | 'upscale', customInstruction?: string) => {
    const source = uploadedImage || currentImage?.url;
    if (!source) {
      showToast({ title: 'Hakuna Picha', message: 'Tafadhali pakia picha kwanza kabla ya kufanya editing', type: 'warning' });
      return;
    }

    setIsGenerating(true);
    try {
      const instruction = customInstruction || editPrompt || (
        action === 'remove_bg'
          ? 'Remove background and put product on neutral white studio backdrop'
          : action === 'mannequin'
          ? 'Professional product photograph on mannequin with solid clean background'
          : action === 'upscale'
          ? 'Enhance details, sharpen edges, 8K studio resolution'
          : 'Refined variation with enhanced lighting and clean details'
      );

      const edited = await api.editStudioImage({
        imageUrl: source,
        action: action as any,
        prompt: instruction,
        aspectRatio,
      });

      setCurrentImage(edited);
      setRecentImages(prev => [edited, ...prev.filter(img => img.id !== edited.id)].slice(0, 10));
      showToast({
        title: 'Mabadiliko Yamekamilika!',
        message: action === 'remove_bg'
          ? 'Background imeondolewa na picha imewekwa kwenye studio safi.'
          : action === 'mannequin'
          ? 'Picha imewekwa kwenye mannequin ya studio ya kitaalamu.'
          : 'Picha yako imehaririwa kikamilifu.',
        type: 'success',
      });
    } catch (err: any) {
      showToast({ title: 'Hitilafu ya Editing', message: err?.message || 'Haikuweza kuhariri picha', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = async (url: string, filename?: string) => {
    const name = filename || `mkuu-studio-${Date.now()}.png`;
    await downloadImageFile(url, name);
    showToast({ title: 'Imepakuliwa!', message: 'Picha imehifadhiwa kwenye simu yako.', type: 'info' });
  };

  const handleShareImage = async (url: string, title: string) => {
    await shareImageFile(url, title, `mkuu-studio-${Date.now()}.png`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" /> MKUU AI Studio & Image Creator
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Unda picha mpya, pakia picha zako uzihariri (ondoa background, weka kwenye mannequin, au boresha ubora), na pakua kwenye simu yako.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Pakia Picha (Add Image)</span>
          </button>

          <button
            onClick={() => navigateTo('gallery')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-all cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Gallery</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Studio 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Creator & Editing Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Mode Tabs */}
          <div className="p-1 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex gap-1">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Unda Picha (Prompt)</span>
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'edit'
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <Scissors className="w-3.5 h-3.5 text-amber-500" />
              <span>Hariri Picha (Edit / Upload)</span>
              {uploadedImage && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
            </button>
          </div>

          {/* TAB 1: CREATE FROM TEXT PROMPT */}
          {activeTab === 'create' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                  Maelezo ya Picha (Prompt)
                </label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Eleza picha unayotaka kwa Kiswahili au Kiingereza (mfano: 'Picha ya kiofisi ya gauni la bluu kwenye mannequin...')"
                  rows={3}
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 leading-relaxed"
                />
              </div>

              {/* Sample Prompts */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-gray-400">Mifano ya Kuanzia:</span>
                <div className="flex flex-col gap-1.5">
                  {samplePrompts.slice(0, 2).map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPrompt(s);
                        handleGenerate(s);
                      }}
                      className="p-2 text-left rounded-lg bg-gray-50 dark:bg-gray-800/60 hover:bg-amber-500/10 text-[11px] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700/60 transition-all truncate cursor-pointer"
                    >
                      "{s}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Presets */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2">
                  Mtindo (Style)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {stylePresets.map(st => (
                    <button
                      key={st}
                      onClick={() => setStyle(st)}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-medium text-left truncate transition-all cursor-pointer ${
                        style === st
                          ? 'bg-amber-500 text-white shadow-xs font-bold'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2">
                  Umbo la Picha (Aspect Ratio)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {aspectRatios.map(ar => (
                    <button
                      key={ar.value}
                      onClick={() => setAspectRatio(ar.value)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                        aspectRatio === ar.value
                          ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <span className="truncate">{ar.label.split(' ')[0]}</span>
                      <Crop className="w-3.5 h-3.5 opacity-70" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={() => handleGenerate()}
                disabled={isGenerating || !prompt.trim()}
                className="w-full mt-2 py-3.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Inatengeneza Picha...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Tengeneza Picha Sasa</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: EDIT & UPLOAD IMAGE */}
          {activeTab === 'edit' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              {/* Upload Dropzone / Preview */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                  Picha ya Kuanzia (Source Image)
                </label>

                {uploadedImage ? (
                  <div className="relative rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-800 group">
                    <img
                      src={uploadedImage}
                      alt={uploadedImageName}
                      onClick={() => setLightboxData({
                        isOpen: true,
                        url: uploadedImage,
                        title: uploadedImageName,
                        subtitle: 'Picha Uliyopakia (Uploaded Reference)',
                        sourceType: 'user_upload',
                      })}
                      className="w-full h-44 object-contain bg-gray-950/50 cursor-pointer"
                    />

                    {/* Overlay controls on uploaded image */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                      <button
                        type="button"
                        onClick={() => setLightboxData({
                          isOpen: true,
                          url: uploadedImage,
                          title: uploadedImageName,
                          subtitle: 'Picha Uliyopakia (Uploaded Reference)',
                          sourceType: 'user_upload',
                        })}
                        className="px-3 py-1.5 rounded-lg bg-black/70 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md cursor-pointer hover:bg-black/90"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Fungua Kubwa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold flex items-center gap-1.5 shadow-md cursor-pointer hover:bg-gray-100"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Badili Picha</span>
                      </button>
                    </div>

                    <div className="p-2.5 bg-gray-50 dark:bg-gray-800/90 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[180px]">
                          {uploadedImageName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedImage(null)}
                        className="p-1 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Ondoa Picha"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-amber-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-gray-50/50 dark:bg-gray-800/40 flex flex-col items-center justify-center space-y-2 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200 dark:border-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                        Bofya Kupakia Picha
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Chagua picha kutoka kwenye simu yako (Gallery au Camera)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick AI Editing Actions for Uploaded Image */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  Vitendo vya Haraka (Quick Studio Edits)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyEdit('remove_bg')}
                    disabled={isGenerating || !uploadedImage}
                    className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-amber-500 text-left transition-all disabled:opacity-40 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1 text-xs font-bold text-gray-900 dark:text-white group-hover:text-amber-600">
                      <Scissors className="w-4 h-4 text-amber-500" />
                      <span>Ondoa Background</span>
                    </div>
                    <p className="text-[10px] text-gray-500">Iweke kwenye studio safi nyeupe</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyEdit('mannequin')}
                    disabled={isGenerating || !uploadedImage}
                    className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-amber-500 text-left transition-all disabled:opacity-40 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1 text-xs font-bold text-gray-900 dark:text-white group-hover:text-amber-600">
                      <Shirt className="w-4 h-4 text-amber-500" />
                      <span>Weka Mannequin</span>
                    </div>
                    <p className="text-[10px] text-gray-500">Picha ya kitaalamu ya nguo/bidhaa</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyEdit('upscale')}
                    disabled={isGenerating || !uploadedImage}
                    className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-amber-500 text-left transition-all disabled:opacity-40 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1 text-xs font-bold text-gray-900 dark:text-white group-hover:text-amber-600">
                      <ZoomIn className="w-4 h-4 text-amber-500" />
                      <span>Ongeza Ubora (HD)</span>
                    </div>
                    <p className="text-[10px] text-gray-500">8K crisp details & sharpening</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyEdit('variation')}
                    disabled={isGenerating || !uploadedImage}
                    className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-amber-500 text-left transition-all disabled:opacity-40 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1 text-xs font-bold text-gray-900 dark:text-white group-hover:text-amber-600">
                      <RefreshCw className="w-4 h-4 text-amber-500" />
                      <span>Tengeneza Tofauti</span>
                    </div>
                    <p className="text-[10px] text-gray-500">Ubunifu mwingine unaofanana</p>
                  </button>
                </div>
              </div>

              {/* Custom Prompt Guided Edit */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  Au Hariri kwa Maelezo Maalum
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editPrompt}
                    onChange={e => setEditPrompt(e.target.value)}
                    placeholder="Mfano: 'Badili iwe rangi nyeupe na weka kwenye mannequin ya duka'..."
                    className="flex-1 p-2.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyEdit('edit')}
                    disabled={isGenerating || !uploadedImage || !editPrompt.trim()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0"
                  >
                    Tekeleza
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Active Canvas & Output Viewport (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm min-h-[500px] flex flex-col justify-between">
            {/* Viewport Top Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-200">
                  Matokeo ya Studio (Render Viewport)
                </span>
                {currentImage && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold">
                    {currentImage.style || 'AI Render'}
                  </span>
                )}
              </div>

              {currentImage && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLightboxData({
                      isOpen: true,
                      url: currentImage.url,
                      title: currentImage.prompt,
                      subtitle: 'Matokeo ya MKUU AI Studio',
                      sourceType: 'ai_generated',
                    })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold text-gray-800 dark:text-gray-200 transition-colors cursor-pointer"
                    title="Panua Picha Kubwa"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>Panua (Preview)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareImage(currentImage.url, currentImage.prompt)}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                    title="Shiriki / Share"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadImage(currentImage.url, `mkuu-studio-${Date.now()}.png`)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-black text-white dark:bg-white dark:text-black hover:opacity-90 text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Pakua kwenye Simu</span>
                  </button>
                </div>
              )}
            </div>

            {/* Canvas / Image Display Area */}
            <div className="flex-1 flex items-center justify-center p-2 min-h-[360px]">
              {isGenerating ? (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center animate-spin text-amber-500">
                      <RefreshCw className="w-8 h-8" />
                    </div>
                    <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      MKUU AI Inachakata na Kutoa Picha Harisi...
                    </p>
                    <p className="text-xs text-gray-500 max-w-sm">
                      Inarekebisha rangi, taa za studio, vivuli, na ubora wa 8K bila kupoteza maelezo.
                    </p>
                  </div>
                </div>
              ) : currentImage ? (
                <div className="relative group max-w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 bg-gray-950">
                  <img
                    src={currentImage.url}
                    alt={currentImage.prompt}
                    onClick={() => setLightboxData({
                      isOpen: true,
                      url: currentImage.url,
                      title: currentImage.prompt,
                      subtitle: 'Matokeo ya MKUU AI Studio',
                      sourceType: 'ai_generated',
                    })}
                    className="max-h-[420px] w-auto object-contain rounded-2xl cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
                  />

                  {/* Floating Action Overlay on Hover / Touch */}
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate max-w-md">{currentImage.prompt}</p>
                      <p className="text-[10px] text-gray-300 mt-0.5">
                        Bofya picha ili kuipanua kubwa au kutumia zoom
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setLightboxData({
                          isOpen: true,
                          url: currentImage.url,
                          title: currentImage.prompt,
                          subtitle: 'Matokeo ya MKUU AI Studio',
                          sourceType: 'ai_generated',
                        })}
                        className="p-2 rounded-xl bg-white/20 backdrop-blur-md hover:bg-white/30 text-white transition-colors cursor-pointer"
                        title="Fungua Kubwa"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadImage(currentImage.url)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-gray-100 shadow-lg transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4 stroke-[2.5]" />
                        <span>Pakua</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-gray-400 space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mx-auto">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-700 dark:text-gray-300">Studio Iko Tayari</p>
                    <p className="max-w-xs mx-auto text-gray-400 mt-1 text-xs">
                      Pakia picha upande wa kushoto au andika maelezo ya picha unayotaka ili kuanza.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Prompt details bar at bottom */}
            {currentImage && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
                <span className="truncate max-w-md italic">"{currentImage.prompt}"</span>
                <span className="font-mono text-[10px] shrink-0">
                  {new Date(currentImage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>

          {/* Recent Session Renders Carousel */}
          {recentImages.length > 0 && (
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Picha za Hivi Karibuni ({recentImages.length})
                </span>
                <span className="text-[11px] text-gray-400">Bofya kuangalia au kupakua</span>
              </div>

              <div className="flex gap-2.5 overflow-x-auto pb-1 pt-1 scrollbar-thin">
                {recentImages.map(img => (
                  <div
                    key={img.id}
                    onClick={() => {
                      setCurrentImage(img);
                      setLightboxData({
                        isOpen: true,
                        url: img.url,
                        title: img.prompt,
                        subtitle: 'Matokeo ya Studio',
                        sourceType: 'ai_generated',
                      });
                    }}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border shrink-0 cursor-pointer transition-all hover:scale-105 ${
                      currentImage?.id === img.id
                        ? 'border-amber-500 ring-2 ring-amber-500/40'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Lightbox Modal (Zoom, Pan, Download, Share) */}
      <ImageLightboxModal
        isOpen={lightboxData.isOpen}
        onClose={() => setLightboxData(prev => ({ ...prev, isOpen: false }))}
        imageUrl={lightboxData.url}
        title={lightboxData.title}
        subtitle={lightboxData.subtitle}
        sourceType={lightboxData.sourceType}
      />
    </div>
  );
};
