import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Download, Maximize2, Sparkles } from 'lucide-react';
import { ImageLightboxModal } from './ImageLightboxModal';
import { downloadImageFile } from '../../utils/imageUtils';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);

  return (
    <>
      <div className="prose max-w-none break-words text-sm sm:text-base leading-7 text-gray-900">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            img({ src, alt }: any) {
              if (!src) return null;
              return (
                <div className="my-3 relative group inline-block max-w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shadow-md">
                  <img
                    src={src}
                    alt={alt || 'Picha ya MKUU AI'}
                    referrerPolicy="no-referrer"
                    className="max-h-[360px] w-auto object-cover cursor-pointer transition-transform duration-200 group-hover:scale-[1.01]"
                    onClick={() => setSelectedImage({ url: src, alt: alt || 'Picha' })}
                  />

                  {/* Overlay buttons on hover/touch */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedImage({ url: src, alt: alt || 'Picha' })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/75 backdrop-blur-md text-white text-xs font-semibold hover:bg-black transition-all cursor-pointer shadow"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-purple-300" />
                      <span>Panua (Preview)</span>
                    </button>

                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await downloadImageFile(src, `mkuu-${Date.now()}.png`);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-gray-900 text-xs font-bold hover:bg-gray-100 shadow transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Pakua</span>
                    </button>
                  </div>
                  {alt && (
                    <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-200 text-[11px] text-gray-600 truncate">
                      {alt}
                    </div>
                  )}
                </div>
              );
            },
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              const codeString = String(children).replace(/\n$/, '');

              if (!inline && (match || codeString.includes('\n'))) {
                return <CodeBlock language={match ? match[1] : 'code'} code={codeString} />;
              }

              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-900 font-mono text-xs sm:text-[13px] font-medium"
                  {...props}
                >
                  {children}
                </code>
              );
            },
            table({ children }) {
              return (
                <div className="overflow-x-auto my-4 rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-left text-xs sm:text-sm">
                    {children}
                  </table>
                </div>
              );
            },
            th({ children }) {
              return (
                <th className="bg-gray-50 px-3.5 py-2.5 font-semibold text-gray-900">
                  {children}
                </th>
              );
            },
            td({ children }) {
              return (
                <td className="px-3.5 py-2.5 border-t border-gray-100 text-gray-800">
                  {children}
                </td>
              );
            },
            blockquote({ children }) {
              return (
                <blockquote className="border-l-2 border-gray-300 pl-4 py-1 my-3 text-gray-600 italic">
                  {children}
                </blockquote>
              );
            },
            a({ href, children }) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-blue-600 hover:text-blue-800 underline underline-offset-2 font-medium inline-flex items-center gap-1"
                >
                  {children}
                </a>
              );
            },
            p({ children }) {
              return <p className="mb-3 last:mb-0 leading-relaxed text-gray-900">{children}</p>;
            },
            ul({ children }) {
              return <ul className="list-disc pl-5 my-2 space-y-1 text-gray-900">{children}</ul>;
            },
            ol({ children }) {
              return <ol className="list-decimal pl-5 my-2 space-y-1 text-gray-900">{children}</ol>;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {selectedImage && (
        <ImageLightboxModal
          isOpen={Boolean(selectedImage)}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.url}
          title={selectedImage.alt || 'Picha ya MKUU AI'}
          sourceType="ai_generated"
        />
      )}
    </>
  );
};

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-gray-200 bg-[#2f2f2f] font-mono text-xs sm:text-[13px] shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-[#212121] text-gray-300 text-xs">
        <span className="font-sans font-medium text-xs text-gray-300 lowercase">{language}</span>
        <button
          id={`copy-code-${language}`}
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/10 text-xs cursor-pointer font-sans"
          title="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy code'}</span>
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-[#f1f1f1] bg-[#1e1e1e]">
        <pre className="!m-0 !p-0 bg-transparent leading-relaxed">{code}</pre>
      </div>
    </div>
  );
};

