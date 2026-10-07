import React, { useState } from 'react';
import { X, ShoppingCart, Check, Star, ZoomIn, ChevronRight, ChevronLeft, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { Product } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onPreviewImage: (url: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onPreviewImage,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  if (!isOpen || !product) return null;

  const currentImage = product.images[selectedImageIndex] || product.images[0];
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 p-2.5 rounded-full bg-white/80 hover:bg-white text-slate-700 shadow-md backdrop-blur-xs transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* Images Gallery Column */}
          <div className="p-6 bg-slate-50 border-b md:border-b-0 md:border-l border-slate-200 flex flex-col justify-between">
            <div>
              {/* Main Display Image */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-sm group">
                <img
                  src={currentImage?.url}
                  alt={product.title}
                  className="w-full h-full object-cover transition-all duration-300"
                />

                {/* Storage Provider Badge */}
                {currentImage?.url.includes('blob.vercel-storage.com') && (
                  <span className="absolute top-3 right-3 bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    مخزن على Vercel Blob
                  </span>
                )}

                {/* Zoom button */}
                <button
                  onClick={() => onPreviewImage(currentImage.url)}
                  className="absolute bottom-3 left-3 bg-white/90 hover:bg-white text-slate-800 p-2 rounded-xl shadow-md transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs font-semibold"
                >
                  <ZoomIn className="w-4 h-4 text-emerald-600" />
                  <span>تكبير الصورة</span>
                </button>

                {/* Left/Right navigation if multiple images */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails Picker */}
              {product.images.length > 1 && (
                <div className="flex items-center gap-2.5 mt-3 overflow-x-auto pb-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                        selectedImageIndex === idx
                          ? 'border-emerald-600 ring-2 ring-emerald-600/20 scale-105'
                          : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={`صورة ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {img.isCover && (
                        <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-200/80 text-center text-[11px] text-slate-600 font-medium">
              <div className="flex flex-col items-center gap-1">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>توصيل سريع</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>ضمان أصلي 100%</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RefreshCw className="w-4 h-4 text-emerald-600" />
                <span>استرجاع ميسر</span>
              </div>
            </div>
          </div>

          {/* Details Column */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Category & Badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                  {product.category}
                </span>
                {discountPercent && (
                  <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-0.5 rounded-md border border-red-200">
                    وفر {discountPercent}%
                  </span>
                )}
                {product.isFeatured && (
                  <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    منتج مختار
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                {product.title}
              </h1>

              {/* Price Section */}
              <div className="mt-4 flex items-baseline gap-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">
                    {product.price.toLocaleString('ar-SA')}
                  </span>
                  <span className="text-sm font-bold text-slate-500">ر.س</span>
                </div>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-base text-slate-400 line-through">
                    {product.originalPrice.toLocaleString('ar-SA')} ر.س
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="mt-5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  عن المنتج
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {product.description || 'لا يوجد وصف مفصل لهذا المنتج.'}
                </p>
              </div>

              {/* Stock status */}
              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="font-semibold text-slate-700">
                  {product.stock > 0 ? `متوفر في المستودع (${product.stock} قطعة)` : 'نفد من المستودع'}
                </span>
              </div>
            </div>

            {/* Actions (Quantity + Add to Cart) */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-4">
                {/* Quantity selector */}
                <div className="flex items-center border border-slate-300 rounded-xl bg-white shadow-xs">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 text-slate-600 hover:text-slate-900 font-bold"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 font-black text-sm text-slate-800">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    className="px-3 py-2 text-slate-600 hover:text-slate-900 font-bold disabled:text-slate-300"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-black text-sm text-white shadow-lg transition-all ${
                    addedAnimation
                      ? 'bg-emerald-700 scale-98 shadow-none'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25 active:scale-98'
                  } disabled:bg-slate-300 disabled:shadow-none`}
                >
                  {addedAnimation ? (
                    <>
                      <Check className="w-5 h-5 text-white" />
                      <span>تمت الإضافة للسلة!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      <span>إضافة للسلة ({(product.price * quantity).toLocaleString('ar-SA')} ر.س)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
