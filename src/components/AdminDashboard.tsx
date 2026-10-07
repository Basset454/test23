import React, { useState } from 'react';
import { 
  PackagePlus, 
  Search, 
  Edit3, 
  Trash2, 
  Cloud, 
  Image as ImageIcon, 
  ExternalLink, 
  RotateCcw, 
  CheckCircle2, 
  Layers, 
  AlertCircle,
  Eye,
  Plus,
  Upload,
  HardDrive
} from 'lucide-react';
import { Product, BlobStatus, ProductImage } from '../types';
import { ImageUploader } from './ImageUploader';

interface AdminDashboardProps {
  products: Product[];
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onResetProducts: () => void;
  onViewProductInStore: (product: Product) => void;
  blobStatus: BlobStatus | null;
  openBlobModal: () => void;
  onPreviewImage: (url: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onResetProducts,
  onViewProductInStore,
  blobStatus,
  openBlobModal,
  onPreviewImage,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'storage'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Standalone test images for Storage Inspector
  const [testImages, setTestImages] = useState<ProductImage[]>([]);

  // Collect all images across all products
  const allProductImages = products.flatMap((p) =>
    p.images.map((img) => ({
      ...img,
      productTitle: p.title,
      productId: p.id,
    }))
  );

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'الكل' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDeleteConfirm = (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا المنتج وجميع صوره؟')) {
      onDeleteProduct(id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner / Welcome & Stats */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-3 border border-emerald-500/30">
              <Cloud className="w-3.5 h-3.5" />
              <span>نظام رفع الصور المتوافق مع Vercel Blob</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              لوحة تحكم صاحب المتجر
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              أضف منتجاتك وارفع الصور من جهازك مباشرة. تُحفظ الصور بروابط دائمة مناسبة لبيئة Vercel Serverless بدون الحاجة لـ GitHub.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onAddProduct}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/30 transition-all active:scale-95 cursor-pointer"
            >
              <PackagePlus className="w-5 h-5" />
              <span>إضافة منتج جديد</span>
            </button>
            <button
              onClick={openBlobModal}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-xs transition-colors border border-white/10 cursor-pointer"
            >
              <Cloud className="w-4 h-4 text-emerald-400" />
              <span>إعدادات Vercel Blob</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
            <span className="text-xs text-slate-400 block font-medium">إجمالي المنتجات</span>
            <span className="text-2xl font-black text-white mt-1 block">
              {products.length}
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
            <span className="text-xs text-slate-400 block font-medium">الصور المرفوعة</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">
              {allProductImages.length}
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
            <span className="text-xs text-slate-400 block font-medium">حالة التخزين</span>
            <span className="text-xs sm:text-sm font-bold text-white mt-2 flex items-center gap-1.5">
              {blobStatus?.connected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Vercel Blob دائم</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  <span>تخزين مباشر</span>
                </>
              )}
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-4 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">بيانات تجريبية</span>
              <button
                onClick={onResetProducts}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold mt-2 flex items-center gap-1 transition-colors"
                title="إعادة ضبط المنتجات الافتراضية"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة النماذج</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 pb-3.5 px-3 text-sm font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'products'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>إدارة المنتجات ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`flex items-center gap-2 pb-3.5 px-3 text-sm font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'storage'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>مستكشف الصور والتخزين السحابي ({allProductImages.length})</span>
        </button>
      </div>

      {/* ---------------- Tab 1: Products Table & Management ---------------- */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن منتج بالاسم أو الوصف..."
                className="w-full pr-10 pl-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="الكل">جميع التصنيفات</option>
                {Array.from(new Set(products.map((p) => p.category))).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <button
                onClick={onAddProduct}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة منتج</span>
              </button>
            </div>
          </div>

          {/* Products List Table */}
          {filteredProducts.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="py-3.5 px-4">صورة المنتج</th>
                      <th className="py-3.5 px-4">اسم المنتج</th>
                      <th className="py-3.5 px-4">التصنيف</th>
                      <th className="py-3.5 px-4">السعر</th>
                      <th className="py-3.5 px-4">المخزون</th>
                      <th className="py-3.5 px-4">عدد الصور</th>
                      <th className="py-3.5 px-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((prod) => {
                      const coverImg = prod.images.find((i) => i.isCover) || prod.images[0];
                      return (
                        <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                          
                          {/* Image Thumbnail */}
                          <td className="py-3 px-4">
                            <div
                              onClick={() => coverImg && onPreviewImage(coverImg.url)}
                              className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 cursor-pointer group"
                            >
                              <img
                                src={coverImg?.url}
                                alt={prod.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                onError={(e) => {
                                  (e.target as HTMLElement).setAttribute(
                                    'src',
                                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'
                                  );
                                }}
                              />
                            </div>
                          </td>

                          {/* Title */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block line-clamp-1">
                              {prod.title}
                            </span>
                            <span className="text-[11px] text-slate-400 block line-clamp-1">
                              {prod.description}
                            </span>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold text-xs">
                              {prod.category}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="py-3 px-4">
                            <span className="font-black text-slate-900">
                              {prod.price.toLocaleString('ar-SA')} ر.س
                            </span>
                          </td>

                          {/* Stock */}
                          <td className="py-3 px-4">
                            <span
                              className={`font-semibold ${
                                prod.stock > 0 ? 'text-slate-700' : 'text-red-500 font-bold'
                              }`}
                            >
                              {prod.stock > 0 ? `${prod.stock} قطعة` : 'نفد المخزون'}
                            </span>
                          </td>

                          {/* Image count */}
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{prod.images.length} صور</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => onViewProductInStore(prod)}
                                title="عرض في المتجر"
                                className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onEditProduct(prod)}
                                title="تعديل المنتج ورفع/حذف الصور"
                                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteConfirm(prod.id)}
                                title="حذف المنتج"
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <PackagePlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">لا توجد منتجات مطابقة</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                جرّب البحث باسم آخر أو أضف منتجاً جديداً الآن
              </p>
              <button
                onClick={onAddProduct}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة منتج جديد</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---------------- Tab 2: Storage & Image Inspector ---------------- */}
      {activeTab === 'storage' && (
        <div className="space-y-6">
          
          {/* Quick Upload Test Area */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-600" />
                  <span>أداة فحص واختبار رفع الصور لـ Vercel Blob</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ارفع أي صورة من حاسوبك فوراً لاختبار سرعة الاستجابة والتخزين الدائم
                </p>
              </div>

              <button
                onClick={openBlobModal}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                فحص رمز Vercel Token
              </button>
            </div>

            <ImageUploader
              images={testImages}
              onChange={setTestImages}
              onPreviewImage={onPreviewImage}
            />

            {testImages.length > 0 && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                <span>تم رفع {testImages.length} صورة بنجاح في أداة الفحص! يمكنك استخدامها أو نسخ روابطها.</span>
                <button
                  onClick={() => setTestImages([])}
                  className="text-xs font-bold text-emerald-700 underline cursor-pointer"
                >
                  مسح قائمة الاختبار
                </button>
              </div>
            )}
          </div>

          {/* All Existing Images Gallery */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-600" />
              <span>جميع صور المنتجات المخزنة حالياً في المتجر ({allProductImages.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              يمكنك معاينة كل صورة بالحجم الكامل أو نسخ رابط CDN الخاص بها
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {allProductImages.map((img, i) => (
                <div
                  key={img.id || i}
                  className="group relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-md transition-all"
                >
                  <div className="aspect-square relative overflow-hidden bg-slate-100 flex items-center justify-center">
                    <img
                      src={img.url}
                      alt={img.name || `صورة ${i + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).setAttribute(
                          'src',
                          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'
                        );
                      }}
                    />

                    {/* Vercel Blob Badge */}
                    <div className="absolute top-2 right-2 bg-slate-900/75 backdrop-blur-xs text-white text-[9px] font-mono px-2 py-0.5 rounded-full">
                      {img.url.includes('blob.vercel-storage.com') ? 'Vercel Blob' : 'تخزين مباشر'}
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => onPreviewImage(img.url)}
                        title="معاينة الصورة"
                        className="p-2 bg-white rounded-xl text-slate-900 hover:text-emerald-600 shadow-md cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(img.url);
                          alert('تم نسخ رابط الصورة إلى الحافظة!');
                        }}
                        title="نسخ رابط الصورة"
                        className="p-2 bg-white rounded-xl text-slate-900 hover:text-emerald-600 shadow-md cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white">
                    <p className="text-[11px] font-bold text-slate-800 truncate" title={img.productTitle}>
                      {img.productTitle}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5" title={img.name || img.url}>
                      {img.name || 'ملف صورة'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
