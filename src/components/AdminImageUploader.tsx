import React, { useState, useRef } from 'react';
import { Upload, X, Star, AlertCircle, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import { ProductImage } from '../types';
import { uploadImageFiles, deleteImageFile } from '../services/api';

interface AdminImageUploaderProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
}

export const AdminImageUploader: React.FC<AdminImageUploaderProps> = ({
  images,
  onChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastUploadedUrl, setLastUploadedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    const filesArray = Array.from(filesList);

    const validFiles = filesArray.filter((file) => file.type.startsWith('image/'));
    if (validFiles.length === 0) {
      setUploadError('Please select valid image files (PNG, JPG, WEBP, GIF, AVIF).');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Calls real Vercel Blob upload (NO FAKE / LOCAL FALLBACK)
      const uploaded = await uploadImageFiles(validFiles, (progress) => {
        setUploadProgress(progress);
      });

      if (uploaded && uploaded.length > 0) {
        const hasExistingCover = images.some((img) => img.isCover);
        const processedNew = uploaded.map((img, index) => ({
          ...img,
          isCover: !hasExistingCover && index === 0,
        }));

        onChange([...images, ...processedNew]);
        setLastUploadedUrl(uploaded[0].url);
      }
    } catch (err: any) {
      // DO NOT HIDE OR SWALLOW BLOB ERRORS!
      console.error('Vercel Blob upload failure:', err);
      setUploadError(
        err.message ||
          'Failed to upload image to Vercel Blob store (test23-blob). Please verify that BLOB_READ_WRITE_TOKEN is configured in Vercel project settings.'
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleSetCover = (id: string) => {
    const updated = images.map((img) => ({
      ...img,
      isCover: img.id === id,
    }));
    onChange(updated);
  };

  const handleRemoveImage = async (id: string, url: string) => {
    if (url.includes('blob.vercel-storage.com')) {
      deleteImageFile(url).catch((err) => console.warn('Blob del warn:', err));
    }

    const remaining = images.filter((img) => img.id !== id);
    if (remaining.length > 0 && !remaining.some((img) => img.isCover)) {
      remaining[0].isCover = true;
    }
    onChange(remaining);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
          Product Images ({images.length})
        </label>
        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          Vercel Blob (test23-blob)
        </span>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-stone-900 bg-stone-100 scale-[1.01]'
            : 'border-stone-300 hover:border-stone-500 hover:bg-stone-50/60 bg-white'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center">
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-stone-900" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
          </div>

          <div>
            <p className="text-xs sm:text-sm font-bold text-stone-900">
              {isUploading ? 'Uploading to Vercel Blob...' : 'Click to browse or drag & drop images from your device'}
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Images are uploaded directly to the connected Vercel Blob store (test23-blob)
            </p>
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-4 max-w-xs mx-auto">
            <div className="flex justify-between text-[11px] text-stone-600 font-medium mb-1">
              <span>Streaming to Vercel Blob...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-stone-900 h-1.5 rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Real Upload Success Notification */}
      {lastUploadedUrl && !uploadError && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Image successfully stored in Vercel Blob:</span>
          </div>
          <div className="font-mono text-[11px] text-emerald-900 break-all bg-emerald-100/60 p-1.5 rounded border border-emerald-200/80">
            {lastUploadedUrl}
          </div>
        </div>
      )}

      {/* Real Error Alert (NO HIDING / SWALLOWING) */}
      {uploadError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Vercel Blob Upload Error:</span>
          </div>
          <p className="text-red-700 leading-relaxed font-mono text-[11px] bg-red-100/60 p-2 rounded">
            {uploadError}
          </p>
          <p className="text-[11px] text-stone-600">
            Note: The system refused to fall back to fake localStorage so you can identify the exact issue in test23-blob.
          </p>
        </div>
      )}

      {/* Image Thumbnails & Cover Selection */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          {images.map((img, idx) => (
            <div
              key={img.id || idx}
              className={`group relative rounded-xl overflow-hidden border-2 bg-stone-100 transition-all ${
                img.isCover
                  ? 'border-stone-900 ring-2 ring-stone-900/20'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="aspect-square relative overflow-hidden bg-stone-50">
                <img
                  src={img.url}
                  alt={img.name || `Image ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {img.isCover && (
                  <div className="absolute top-2 right-2 bg-stone-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                    <Star className="w-3 h-3 fill-white" />
                    <span>Cover</span>
                  </div>
                )}

                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                  {img.url.includes('blob.vercel-storage.com') ? 'Vercel Blob' : 'External'}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-2 bg-white flex items-center justify-between text-xs border-t border-stone-100">
                {!img.isCover ? (
                  <button
                    type="button"
                    onClick={() => handleSetCover(img.id)}
                    className="text-[11px] font-medium text-stone-600 hover:text-stone-950 flex items-center gap-1"
                  >
                    <Star className="w-3 h-3" />
                    <span>Set Cover</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-bold text-stone-900">Main Cover</span>
                )}

                <div className="flex items-center gap-1">
                  <a
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open full Blob URL"
                    className="p-1 text-stone-400 hover:text-stone-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id, img.url)}
                    title="Remove Image"
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
