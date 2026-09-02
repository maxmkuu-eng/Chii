import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Eye,
  Upload,
  Sparkles,
  FileSearch,
  ScanText,
  Layout,
  BarChart,
  Copy,
  Check,
  RotateCcw,
  Image as ImageIcon,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { EmptyState } from '../common/EmptyState';

export const VisionModule: React.FC = () => {
  const { showToast } = useApp();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [imageMime, setImageMime] = useState<string>('image/png');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visionResult, setVisionResult] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<string>('general');
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample Images to test instantly
  const sampleImages = [
    {
      name: 'System Architecture Diagram',
      desc: 'Flowchart with API gateways, microservices & queues',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230f172a"/><text x="300" y="50" fill="%23f59e0b" font-size="20" font-family="sans-serif" text-anchor="middle" font-weight="bold">MICROSERVICE ARCHITECTURE</text><rect x="50" y="100" width="140" height="70" rx="8" fill="%231e293b" stroke="%2338bdf8" stroke-width="2"/><text x="120" y="140" fill="%23ffffff" font-size="14" text-anchor="middle">Client App (Web)</text><rect x="230" y="100" width="140" height="70" rx="8" fill="%231e293b" stroke="%2310b981" stroke-width="2"/><text x="300" y="140" fill="%23ffffff" font-size="14" text-anchor="middle">API Gateway</text><rect x="410" y="100" width="140" height="70" rx="8" fill="%231e293b" stroke="%23f43f5e" stroke-width="2"/><text x="480" y="140" fill="%23ffffff" font-size="14" text-anchor="middle">Auth Service</text><rect x="230" y="240" width="140" height="70" rx="8" fill="%231e293b" stroke="%23a855f7" stroke-width="2"/><text x="300" y="280" fill="%23ffffff" font-size="14" text-anchor="middle">Worker Cluster</text><path d="M 190 135 L 230 135" stroke="%2394a3b8" stroke-width="2" marker-end="url(%23arrow)"/><path d="M 370 135 L 410 135" stroke="%2394a3b8" stroke-width="2"/><path d="M 300 170 L 300 240" stroke="%2394a3b8" stroke-width="2"/></svg>`,
    },
    {
      name: 'Invoice Receipt Sample',
      desc: 'Billed to Tech Corp with line items & totals',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23ffffff"/><text x="50" y="60" fill="%230f172a" font-size="22" font-family="sans-serif" font-weight="bold">INVOICE #INV-2026-88</text><text x="50" y="90" fill="%2364748b" font-size="12">Date: Oct 24, 2026</text><text x="50" y="110" fill="%2364748b" font-size="12">Billed to: Acme Systems Inc.</text><line x1="50" y1="140" x2="550" y2="140" stroke="%23cbd5e1" stroke-width="1"/><text x="50" y="170" fill="%23334155" font-size="14">1. Cloud Compute Cluster (GPU x 8)</text><text x="480" y="170" fill="%23334155" font-size="14" font-weight="bold">$1,240.00</text><text x="50" y="210" fill="%23334155" font-size="14">2. Database Storage (5 TB SSD)</text><text x="480" y="210" fill="%23334155" font-size="14" font-weight="bold">$350.00</text><line x1="50" y1="260" x2="550" y2="260" stroke="%23cbd5e1" stroke-width="1"/><text x="350" y="300" fill="%230f172a" font-size="16" font-weight="bold">TOTAL AMOUNT:</text><text x="480" y="300" fill="%2316a34a" font-size="18" font-weight="bold">$1,590.00</text></svg>`,
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      showToast({ title: 'File Too Large', message: 'Image must be under 20MB', type: 'warning' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setImageName(file.name);
      setImageMime(file.type || 'image/png');
      setVisionResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: typeof sampleImages[0]) => {
    setImagePreview(sample.svg);
    setImageName(sample.name);
    setImageMime('image/svg+xml');
    setVisionResult(null);
  };

  const handleAnalyze = async (task: 'general' | 'ocr' | 'diagram' | 'ui' | 'chart', promptText?: string) => {
    if (!imagePreview) {
      showToast({ title: 'Image Required', message: 'Please upload or select an image to inspect', type: 'warning' });
      return;
    }

    setIsAnalyzing(true);
    setActiveTask(task);
    setVisionResult(null);

    let promptToUse = promptText || customPrompt;
    if (task === 'ocr' && !promptToUse) promptToUse = 'Extract all textual information and table numbers from this image accurately.';
    if (task === 'diagram' && !promptToUse) promptToUse = 'Explain this diagram or architecture step-by-step. Describe entities, directional dataflows, and key components.';
    if (task === 'ui' && !promptToUse) promptToUse = 'Provide a comprehensive UI/UX critique of this layout. Evaluate visual hierarchy, accessibility contrast, and layout structure.';
    if (task === 'chart' && !promptToUse) promptToUse = 'Extract the data points, metrics, axes, and takeaways from this chart or data visualization.';

    try {
      const res = await api.analyzeVision({
        image: {
          data: imagePreview,
          mimeType: imageMime,
          name: imageName || 'uploaded_image.png',
        },
        prompt: promptToUse || 'Describe this image in detail and highlight key insights.',
        taskType: (task === 'ocr' ? 'ocr' : task === 'diagram' ? 'diagram' : 'general') as any,
      });

      setVisionResult(res.analysis);
      showToast({ title: 'Vision Complete', message: 'Visual reasoning analysis completed', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Vision Error', message: err?.message, type: 'error' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyResult = () => {
    if (!visionResult) return;
    navigator.clipboard.writeText(visionResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast({ title: 'Copied', message: 'Analysis output copied', type: 'success' });
  };

  const handleReset = () => {
    setImagePreview(null);
    setImageName('');
    setVisionResult(null);
    setCustomPrompt('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="w-6 h-6 text-emerald-500" /> BONGO Vision
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Multimodal visual intelligence for diagrams, OCR text extraction, UI wireframes, and chart analysis.
          </p>
        </div>

        {imagePreview && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all self-start sm:self-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Image</span>
          </button>
        )}
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Upload & Previews (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-emerald-500/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-white dark:bg-slate-900/40 group min-h-[300px]"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Upload className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                Upload or Drop an Image
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-4">
                Supports PNG, JPG, WebP, SVG screenshots, wireframes, and scanned documents.
              </p>
              <span className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors">
                Browse Files
              </span>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="truncate max-w-[200px]">{imageName}</span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-emerald-500 hover:underline"
                >
                  Change Image
                </button>
              </div>
              <div className="rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-[320px] p-2">
                <img
                  src={imagePreview}
                  alt={imageName}
                  className="max-h-[300px] w-auto object-contain rounded"
                />
              </div>
            </div>
          )}

          {/* Preset Sample Gallery */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Instant Sample Images
            </h4>
            <div className="space-y-2">
              {sampleImages.map((sample, i) => (
                <div
                  key={i}
                  onClick={() => handleSelectSample(sample)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 bg-slate-50 dark:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-500 transition-colors">
                        {sample.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{sample.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Multimodal Output (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Quick Vision Action Buttons */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Visual Reasoning Modes
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleAnalyze('ocr')}
                disabled={isAnalyzing || !imagePreview}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-emerald-500/40 text-xs font-medium text-slate-700 dark:text-slate-200 flex flex-col items-center gap-1.5 transition-all disabled:opacity-40"
              >
                <ScanText className="w-4 h-4 text-emerald-500" />
                <span>Extract OCR</span>
              </button>

              <button
                onClick={() => handleAnalyze('diagram')}
                disabled={isAnalyzing || !imagePreview}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-emerald-500/40 text-xs font-medium text-slate-700 dark:text-slate-200 flex flex-col items-center gap-1.5 transition-all disabled:opacity-40"
              >
                <FileSearch className="w-4 h-4 text-blue-500" />
                <span>Explain Diagram</span>
              </button>

              <button
                onClick={() => handleAnalyze('ui')}
                disabled={isAnalyzing || !imagePreview}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-emerald-500/40 text-xs font-medium text-slate-700 dark:text-slate-200 flex flex-col items-center gap-1.5 transition-all disabled:opacity-40"
              >
                <Layout className="w-4 h-4 text-purple-500" />
                <span>UI Critique</span>
              </button>

              <button
                onClick={() => handleAnalyze('chart')}
                disabled={isAnalyzing || !imagePreview}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-emerald-500/40 text-xs font-medium text-slate-700 dark:text-slate-200 flex flex-col items-center gap-1.5 transition-all disabled:opacity-40"
              >
                <BarChart className="w-4 h-4 text-amber-500" />
                <span>Inspect Chart</span>
              </button>
            </div>

            {/* Custom Question Prompt */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAnalyze('general');
                }}
                placeholder="Or ask a custom question about this visual..."
                className="flex-1 p-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <button
                onClick={() => handleAnalyze('general')}
                disabled={isAnalyzing || !imagePreview}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs shrink-0 transition-all shadow-sm"
              >
                {isAnalyzing ? 'Inspecting...' : 'Ask Vision'}
              </button>
            </div>
          </div>

          {/* Results Box */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm min-h-[360px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Vision Insights Output
                  </h3>
                </div>

                {visionResult && (
                  <button
                    onClick={handleCopyResult}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-500"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>

              {isAnalyzing ? (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Processing visual tensors and extracting structural comprehension...
                  </p>
                </div>
              ) : visionResult ? (
                <div className="max-h-[500px] overflow-y-auto pr-1">
                  <MarkdownRenderer content={visionResult} />
                </div>
              ) : (
                <EmptyState
                  icon={Eye}
                  title="No vision analysis yet"
                  description="Upload an image or pick a preset sample on the left, then trigger one of the visual reasoning tools above."
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
