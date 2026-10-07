import React, { useState, useEffect } from 'react';
import { X, Save, PackagePlus, AlertCircle, Sparkles } from 'lucide-react';
import { Product, ProductImage } from '../types';
import { CATEGORIES } from '../data/initialProducts';
import { ImageUploader } from './ImageUploader';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => Promise<void>;
  initialProduct?: Product | null;
  onPreviewImage: (url: string) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProduct,
  onPreviewImage,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[1]);
  const [price, setPrice] = useState<number | ''>('');
  const [originalPrice, setOriginalPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>(10);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialProduct) {
      setTitle(initialProduct.title);
      setDescription(initialProduct.description || '');
      setCategory(initialProduct.category || CATEGORIES[1]);
      setPrice(initialProduct.price);
      setOriginalPrice(initialProduct.originalPrice || '');
      setStock(initialProduct.stock);
      setImages(initialProduct.images || []);
      setIsFeatured(Boolean(initialProduct.isFeatured));
    } else {
      setTitle('');
      setDescription('');
      setCategory(CATEGORIES[1]);
      setPrice('');
      setOriginalPrice('');
      setStock(10);
      setImages([]);
      setIsFeatured(false);
    }
    setFormError(null);
  }, [initialProduct, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('يرجى كتابة اسم المنتج');
      return;
    }
    if (price === '' || Number(price) <= 0) {
      setFormError('يرجى تحديد سعر صالح للمنتج');
      return;
    }
    if (images.length === 0) {
      setFormError('يرجى رفع صورة واحدة على الأقل للمنتج لكي يظهر بشكل جذاب في المتجر');
      return;
    }

    // Make sure at least one image is marked as cover
    const finalImages = [...images];
    if (!finalImages.some((img) => img.isCover)) {
      finalImages[0].isCover = true;
    }

    setIsSubmitting(true);
    setFormError(null);

    const productPayload: Product = {
      id: initialProduct?.id || `prod-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      stock: stock === '' ? 0 : Number(stock),
      images: finalImages,
      isFeatured,
      createdAt: initialProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await onSave(productPayload);
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ أثناء حفظ المنتج');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {initialProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
              </h2>
              <p className="text-xs text-slate-500">
                ارفع صور المنتج مباشرة من جهازك لتخزينها على Vercel Blob
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {formError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              اسم المنتج <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: ساعة ذكية رياضية مقاومة للماء"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Category & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                التصنيف
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {CATEGORIES.filter((c) => c !== 'الكل').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                كمية المخزون المتاحة
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="10"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Price & Original Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                سعر البيع (ر.س / د.إ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="199"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                السعر الأصلي قبل الخصم (اختياري)
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="249"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              وصف المنتج ومميزاته
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب مواصفات المنتج، المواد المصنوع منها، وطريقة الاستخدام..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Dedicated Image Uploader for Vercel Blob */}
          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200">
            <ImageUploader
              images={images}
              onChange={setImages}
              onPreviewImage={onPreviewImage}
            />
          </div>

          {/* Featured Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFeatured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="isFeatured" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>تمييز المنتج في الواجهة الرئيسية للمتجر (منتج مميز)</span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'جارٍ الحفظ...' : initialProduct ? 'حفظ التعديلات' : 'إضافة المنتج للمتجر'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
