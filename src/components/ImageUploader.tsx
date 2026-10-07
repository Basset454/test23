import React, { useState, useRef } from 'react';
import { Upload, X, Star, Eye, Image as ImageIcon, Link as LinkIcon, AlertCircle, Loader2 } from 'lucide-react';
import { ProductImage } from '../types';
import { uploadImageFiles, deleteImageFile } from '../services/api';

interface ImageUploaderProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  onPreviewImage?: (url: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  onPreviewImage,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState<'device' | 'url'>('device');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle files selection from local device
  const handleFiles = async (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    const filesArray = Array.from(filesList);

    // Validate images
    const validImageFiles = filesArray.filter((file) => file.type.startsWith('image/'));
    if (validImageFiles.length === 0) {
      setUploadError('يرجى اختيار ملفات صور صالحة فقط (PNG, JPG, WEBP, GIF).');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(15);

    try {
      const uploaded = await uploadImageFiles(validImageFiles, (progress) => {
        setUploadProgress(progress);
      });

      if (uploaded && uploaded.length > 0) {
        // If no images exist yet, make the first uploaded image the cover
        const hasExistingCover = images.some((img) => img.isCover);
        const processedNew = uploaded.map((img, index) => ({
          ...img,
          isCover: !hasExistingCover && index === 0,
        }));

        onChange([...images, ...processedNew]);
      }
    } catch (err: any) {
      setUploadError(err.message || 'حدث خطأ أثناء رفع الصور، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Drag and drop handlers
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

  // Set primary cover photo
  const handleSetCover = (id: string) => {
    const updated = images.map((img) => ({
      ...img,
      isCover: img.id === id,
    }));
    onChange(updated);
  };

  // Remove photo
  const handleRemoveImage = async (id: string, url: string) => {
    // Delete file through backend if it's stored on Vercel Blob
    if (url.includes('blob.vercel-storage.com')) {
      deleteImageFile(url).catch((err) => console.warn('Blob delete warn:', err));
    }

    const remaining = images.filter((img) => img.id !== id);
    // If the removed image was cover, assign cover to first remaining image
    if (remaining.length > 0 && !remaining.some((img) => img.isCover)) {
      remaining[0].isCover = true;
    }
    onChange(remaining);
  };

  // Add by direct URL
  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const newImg: ProductImage = {
      id: `img-url-${Date.now()}`,
      url: urlInput.trim(),
      name: 'صورة من رابط خارجي',
      isCover: images.length === 0,
      provider: 'external_url',
      uploadedAt: new Date().toISOString(),
    };

    onChange([...images, newImg]);
    setUrlInput('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <label className="block text-sm font-bold text-slate-800">
          صور المنتج ({images.length})
        </label>
        
        {/* Switch between device upload and URL */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('device')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
              activeTab === 'device' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            من جهازك
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
              activeTab === 'url' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            رابط مباشر
          </button>
        </div>
      </div>

      {/* Device Upload Drag-and-Drop Area */}
      {activeTab === 'device' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
              : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50/80 bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="flex flex-col items-center justify-center gap-2.5">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">
                انقر لاختيار صورة أو اسحب الصور وأفلتها هنا
              </p>
              <p className="text-xs text-slate-500 mt-1">
                يدعم رفع عدة صور معاً (PNG, JPG, WEBP) وتُحفظ مباشرة على Vercel Blob
              </p>
            </div>

            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              رفع فوري من الجهاز بدون GitHub
            </span>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="mt-4 max-w-xs mx-auto">
              <div className="flex justify-between text-xs text-slate-600 font-medium mb-1">
                <span>جارٍ الرفع والمعالجة...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add by Direct URL */}
      {activeTab === 'url' && (
        <form onSubmit={handleAddUrl} className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/product-image.jpg"
            className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
          >
            إضافة الصورة
          </button>
        </form>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Previews Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          {images.map((img, idx) => (
            <div
              key={img.id || idx}
              className={`group relative rounded-xl overflow-hidden border-2 bg-slate-100 transition-all shadow-xs ${
                img.isCover
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Image Thumbnail */}
              <div className="aspect-square w-full overflow-hidden bg-slate-50 flex items-center justify-center relative">
                <img
                  src={img.url}
                  alt={img.name || `صورة ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    // Fallback placeholder on broken link
                    (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500');
                  }}
                />

                {/* Cover Tag */}
                {img.isCover && (
                  <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                    <Star className="w-3 h-3 fill-white" />
                    <span>الرئيسية</span>
                  </div>
                )}

                {/* Storage Provider Badge */}
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                  {img.url.includes('blob.vercel-storage.com') ? 'Vercel Blob' : 'مرفوع'}
                </div>
              </div>

              {/* Action Buttons Overlay */}
              <div className="p-2 bg-white flex items-center justify-between gap-1 border-t border-slate-100">
                {!img.isCover && (
                  <button
                    type="button"
                    onClick={() => handleSetCover(img.id)}
                    title="تعيين كصورة رئيسية للمنتج"
                    className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span className="text-[10px]">اجعلها رئيسية</span>
                  </button>
                )}

                {img.isCover && (
                  <span className="text-[10px] font-bold text-emerald-600">
                    الصورة الأساسية
                  </span>
                )}

                <div className="flex items-center gap-1 mr-auto">
                  {onPreviewImage && (
                    <button
                      type="button"
                      onClick={() => onPreviewImage(img.url)}
                      title="معاينة بالحجم الكامل"
                      className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id, img.url)}
                    title="حذف هذه الصورة"
                    className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-slate-50 rounded-xl text-center border border-slate-200 text-xs text-slate-500 flex items-center justify-center gap-2">
          <ImageIcon className="w-4 h-4 text-slate-400" />
          <span>لم تقم بإضافة صور لهذا المنتج بعد. أضف صورة واحدة على الأقل.</span>
        </div>
      )}
    </div>
  );
};
