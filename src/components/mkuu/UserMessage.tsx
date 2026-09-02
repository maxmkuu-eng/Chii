import React, { useState } from 'react';
import { Edit2, Copy, Check, FileText, Trash2, Maximize2, ExternalLink } from 'lucide-react';
import { ChatMessage, Attachment } from '../../types';
import { ImageLightboxModal } from '../common/ImageLightboxModal';

interface UserMessageProps {
  message: ChatMessage;
  userName?: string;
  onEditSave: (newContent: string) => void;
  onCopy: () => void;
  onDelete?: () => void;
  isCopied: boolean;
}

export const UserMessage: React.FC<UserMessageProps> = ({
  message,
  userName = 'Max',
  onEditSave,
  onCopy,
  onDelete,
  isCopied,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);

  const handleSave = () => {
    if (!editText.trim()) return;
    onEditSave(editText.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(message.content);
    setIsEditing(false);
  };

  return (
    <>
      <div className="flex flex-col items-end group animate-in fade-in duration-150 py-2">
        {/* Attachments Preview */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 justify-end">
            {message.attachments.map((att: Attachment) => {
              const isImg = (att.type || (att as any).mimeType || '')?.startsWith('image/') || att.data?.startsWith('data:image/');
              return (
                <div
                  key={att.id}
                  onClick={() => {
                    if (isImg && att.data) {
                      setSelectedImage({ url: att.data, name: att.name || 'Picha Uliyotuma' });
                    }
                  }}
                  className={`flex items-center gap-2 p-1.5 px-3 rounded-2xl bg-gray-100 border border-gray-200 text-xs text-gray-800 shadow-2xs transition-all ${
                    isImg
                      ? 'cursor-pointer hover:bg-gray-200 hover:border-gray-300 hover:scale-[1.02] active:scale-95'
                      : ''
                  }`}
                  title={isImg ? 'Bofya kufungua picha hii kubwa' : att.name}
                >
                  {isImg ? (
                    <div className="relative group/thumb w-8 h-8 rounded-xl overflow-hidden shrink-0">
                      <img src={att.data} alt={att.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                        <Maximize2 className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  ) : (
                    <FileText className="w-4 h-4 text-blue-600" />
                  )}
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="truncate max-w-[140px] font-medium text-gray-800">
                      {att.name}
                    </span>
                    {isImg && (
                      <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                        Bofya kufungua
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Message Content Bubble (ChatGPT Light Style: bg-[#f4f4f4], rounded-[22px]) */}
        <div className="max-w-[85%] sm:max-w-[70%]">
          {isEditing ? (
            <div className="space-y-2 p-3 rounded-2xl bg-gray-50 border border-gray-200 min-w-[260px] sm:min-w-[360px]">
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                className="w-full p-2.5 text-sm rounded-xl bg-white text-gray-900 border border-gray-300 focus:outline-none focus:border-gray-500 resize-y min-h-[80px]"
                rows={3}
                autoFocus
              />
              <div className="flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1.5 rounded-full hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3.5 py-1.5 rounded-full bg-black text-white font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="px-4 py-2.5 rounded-[22px] bg-[#f4f4f4] text-gray-900 text-sm sm:text-base leading-relaxed whitespace-pre-wrap select-text">
              {message.content}
            </div>
          )}
        </div>

        {/* Subtle Actions on hover (ChatGPT style) */}
        {!isEditing && (
          <div className="flex items-center gap-1.5 mt-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onCopy}
              className="p-1 rounded-md hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
              title="Copy"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 rounded-md hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
              title="Edit message"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1 rounded-md hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                title="Delete message"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {selectedImage && (
        <ImageLightboxModal
          isOpen={Boolean(selectedImage)}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.url}
          title={selectedImage.name}
          subtitle="Picha uliyotuma (Your uploaded image)"
          sourceType="user_upload"
        />
      )}
    </>
  );
};

