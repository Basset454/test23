import React, { useState } from 'react';
import { Search, Sparkles, Filter, ShoppingBag, ShieldCheck, Truck, Headphones } from 'lucide-react';
import { Product } from '../types';
import { CATEGORIES } from '../data/initialProducts';
import { ProductCard } from './ProductCard';

interface StorefrontProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onGoToAdmin: () => void;
}

export const Storefront: React.FC<StorefrontProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  onGoToAdmin,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'الكل' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-8 sm:p-12 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_50%)] pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>منتجات مختارة بأعلى جودة وصور حقيقية</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            تسوق بكل ثقة مع صور منتجات فائقة الوضوح
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            جميع صور المنتجات تُرفع مباشرة وتُحفظ عبر شبكة Vercel Blob الدائمة لضمان سرعة تحميل فائقة وتجربة تسوق سلسة من أي جهاز.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                const el = document.getElementById('products-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              استكشف التشكيلة
            </button>
            <button
              onClick={onGoToAdmin}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-xs transition-colors border border-white/10 cursor-pointer"
            >
              لوحة تحكم المتجر (إضافة صور)
            </button>
          </div>
        </div>

        {/* Feature Icons at bottom of hero */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <Truck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>شحن سريع لجميع المدن والمناطق</span>
          </div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>منتجات أصلية مع ضمان استرجاع 14 يوم</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Headphones className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>دعم فني مباشر على مدار الساعة</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div id="products-section" className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px] sm:w-72">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في المتجر..."
              className="w-full pr-10 pl-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
            />
          </div>

        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>عرض {filteredProducts.length} من أصل {products.length} منتج</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-emerald-600 font-bold hover:underline"
            >
              مسح البحث
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-3">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">لا توجد منتجات تطابق بحثك</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            لم نجد منتجات في تصنيف "{selectedCategory}" بالاسم المدخل. جرب البحث عن كلمة أخرى.
          </p>
        </div>
      )}

    </div>
  );
};
