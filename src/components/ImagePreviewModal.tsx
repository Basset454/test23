import React from 'react';
import { X, ExternalLink, Download } from 'lucide-react';

interface ImagePreviewModalProps {
  url: string | null;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ url, onClose }) => {
  if (!url) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl max-h-[90vh] bg-transparent flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between pb-3 text-white">
          <div className="flex items-center gap-2 text-xs font-mono bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
            <span>{url.includes('blob.vercel-storage.com') ? 'Vercel Blob CDN' : 'صورة مرفوعة'}</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="فتح في تبويب جديد"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-red-500 text-white transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Image */}
        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/40">
          <img
            src={url}
            alt="معاينة الصورة بالحجم الكامل"
            className="max-w-full max-h-[80vh] object-contain"
          />
        </div>
      </div>
    </div>
  );
};
