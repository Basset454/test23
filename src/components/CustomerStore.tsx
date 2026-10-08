import React, { useState } from 'react';
import { Product } from '../types';
import { FURNITURE_CATEGORIES } from '../data/initialProducts';
import { Eye, X, Check, ShieldCheck, Truck, Sparkles, Layers } from 'lucide-react';

interface CustomerStoreProps {
  products: Product[];
}

export const CustomerStore: React.FC<CustomerStoreProps> = ({ products }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Filter only published products
  const publishedProducts = products.filter((p) => p.isPublished !== false);
  const filteredProducts = publishedProducts.filter(
    (p) => selectedCategory === 'All' || p.category === selectedCategory
  );

  const openProductModal = (product: Product) => {
    setActiveProduct(product);
    setActiveImageIndex(0);
  };

  const closeProductModal = () => {
    setActiveProduct(null);
  };

  return (
    <div className="space-y-12 pb-16">
      
      {/* Editorial Hero Banner */}
      <section className="relative rounded-3xl overflow-hidden bg-stone-900 text-stone-100 p-8 sm:p-14 shadow-xl">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-800 text-stone-300 text-xs font-medium tracking-wide border border-stone-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Handmade Contemporary Furniture</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-normal tracking-tight text-white leading-tight">
            Designed for stillness, crafted for longevity.
          </h1>

          <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-xl">
            Explore our curated catalog of Scandinavian and minimalist furniture. Each piece is constructed from sustainably harvested timber and artisanal upholstery.
          </p>
        </div>
      </section>

      {/* Categories & Filter Bar */}
      <section id="collection" className="space-y-6">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            {FURNITURE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70 hover:text-stone-950'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <span className="text-xs text-stone-500 font-medium hidden sm:block">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => {
              const coverImage = product.images.find((img) => img.isCover) || product.images[0];
              return (
                <div
                  key={product.id}
                  onClick={() => openProductModal(product)}
                  className="group cursor-pointer bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-stone-400 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Image Display */}
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-stone-100">
                    <img
                      src={coverImage?.url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Multiple images indicator */}
                    {product.images.length > 1 && (
                      <span className="absolute bottom-3 right-3 bg-stone-900/70 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {product.images.length} photos
                      </span>
                    )}

                    <div className="absolute inset-0 bg-stone-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-white/95 text-stone-900 text-xs font-semibold px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        <Eye className="w-4 h-4" />
                        View Details
                      </span>
                    </div>
                  </div>

                  {/* Information */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-500 block mb-1">
                        {product.category}
                      </span>
                      <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-1 font-serif">
                        {product.name}
                      </h3>
                      <p className="text-xs text-stone-500 line-clamp-2 mt-1.5 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-lg font-bold text-stone-900">
                        ${product.price.toLocaleString()}
                      </span>
                      <span className="text-xs font-medium text-stone-600 hover:text-stone-900 underline">
                        Details & specs
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-stone-50 rounded-3xl border border-stone-200">
            <p className="text-base font-serif font-bold text-stone-700">No furniture pieces in this category yet.</p>
            <p className="text-xs text-stone-400 mt-1">Please select another category or check back soon.</p>
          </div>
        )}
      </section>

      {/* Product Details Modal */}
      {activeProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm overflow-y-auto"
          onClick={closeProductModal}
        >
          <div
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8 animate-in fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeProductModal}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-stone-700 shadow-md backdrop-blur-xs transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              
              {/* Image Column */}
              <div className="p-6 bg-stone-50 border-b md:border-b-0 md:border-r border-stone-200 flex flex-col justify-between">
                <div>
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white border border-stone-200 shadow-sm">
                    <img
                      src={activeProduct.images[activeImageIndex]?.url || activeProduct.images[0]?.url}
                      alt={activeProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Thumbnail Row */}
                  {activeProduct.images.length > 1 && (
                    <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                      {activeProduct.images.map((img, idx) => (
                        <button
                          key={img.id || idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                            activeImageIndex === idx
                              ? 'border-stone-900 ring-2 ring-stone-900/20'
                              : 'border-stone-200 hover:border-stone-300 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-stone-200 text-xs text-stone-500 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-stone-700 shrink-0" />
                    <span>Complimentary white-glove delivery available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-stone-700 shrink-0" />
                    <span>10-year structural warranty on solid hardwood</span>
                  </div>
                </div>
              </div>

              {/* Details Column */}
              <div className="p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-stone-500 block mb-1">
                    {activeProduct.category}
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-stone-900">
                    {activeProduct.name}
                  </h2>
                  <div className="mt-3 text-2xl font-bold text-stone-900">
                    ${activeProduct.price.toLocaleString()}
                  </div>

                  <div className="mt-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                      Description & Materials
                    </h4>
                    <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line bg-stone-50 p-4 rounded-xl border border-stone-100">
                      {activeProduct.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-stone-200">
                  <button
                    onClick={closeProductModal}
                    className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-medium text-sm rounded-xl transition-colors"
                  >
                    Close Preview
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
