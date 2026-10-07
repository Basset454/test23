import React, { useState } from 'react';
import { ShoppingCart, Eye, Sparkles, Layers } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onAddToCart,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Determine cover image and secondary hover image
  const coverImage = product.images.find((img) => img.isCover) || product.images[0];
  const secondImage = product.images.length > 1 ? product.images.find((img) => img !== coverImage) : null;
  const activeImage = isHovered && secondImage ? secondImage : coverImage;

  // Calculate discount percentage
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between"
    >
      {/* Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100 cursor-pointer" onClick={() => onSelect(product)}>
        <img
          src={activeImage?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLElement).setAttribute(
              'src',
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'
            );
          }}
        />

        {/* Top Badges */}
        <div className="absolute top-3 right-3 left-3 flex items-center justify-between pointer-events-none">
          {discountPercent ? (
            <span className="bg-red-500 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-md">
              خصم {discountPercent}%
            </span>
          ) : product.isFeatured ? (
            <span className="bg-amber-500 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              مميز
            </span>
          ) : <span />}

          {/* Number of images available */}
          {product.images.length > 1 && (
            <span className="bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {product.images.length} صور
            </span>
          )}
        </div>

        {/* Quick View Button on Hover */}
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="bg-white/95 text-slate-800 hover:text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-all hover:scale-105"
          >
            <Eye className="w-4 h-4" />
            معاينة التفاصيل
          </button>
        </div>
      </div>

      {/* Content Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md">
              {product.category}
            </span>
            <span className={`text-[11px] font-medium ${product.stock > 0 ? 'text-slate-500' : 'text-red-500'}`}>
              {product.stock > 0 ? `متوفر (${product.stock})` : 'نفد المخزون'}
            </span>
          </div>

          <h3
            onClick={() => onSelect(product)}
            className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1 cursor-pointer"
            title={product.title}
          >
            {product.title}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Add to Cart */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-slate-900">
                {product.price.toLocaleString('ar-SA')}
              </span>
              <span className="text-xs text-slate-500 font-semibold">ر.س</span>
            </div>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-slate-400 line-through block">
                {product.originalPrice.toLocaleString('ar-SA')} ر.س
              </span>
            )}
          </div>

          <button
            onClick={() => onAddToCart(product)}
            disabled={product.stock <= 0}
            className="p-2.5 sm:px-3 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
            title="إضافة للسلة"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">أضف للسلة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
