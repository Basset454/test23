import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, AlertCircle, Sparkles, Package } from 'lucide-react';
import { Product, ProductImage } from '../types';
import { FURNITURE_CATEGORIES } from '../data/initialProducts';
import { AdminImageUploader } from './AdminImageUploader';

interface AdminProductFormProps {
  initialProduct?: Product | null;
  onSave: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  onCancel: () => void;
}

export const AdminProductForm: React.FC<AdminProductFormProps> = ({
  initialProduct,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(FURNITURE_CATEGORIES[1]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name);
      setPrice(initialProduct.price);
      setDescription(initialProduct.description || '');
      setCategory(initialProduct.category || FURNITURE_CATEGORIES[1]);
      setImages(initialProduct.images || []);
      setIsPublished(initialProduct.isPublished !== false);
      setIsFeatured(Boolean(initialProduct.isFeatured));
    } else {
      setName('');
      setPrice('');
      setDescription('');
      setCategory(FURNITURE_CATEGORIES[1]);
      setImages([]);
      setIsPublished(true);
      setIsFeatured(false);
    }
  }, [initialProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter a product name.');
      return;
    }
    if (price === '' || Number(price) <= 0) {
      setFormError('Please enter a valid price.');
      return;
    }
    if (images.length === 0) {
      setFormError('Please upload at least one image to Vercel Blob.');
      return;
    }

    // Ensure cover image is chosen
    const finalImages = [...images];
    if (!finalImages.some((img) => img.isCover)) {
      finalImages[0].isCover = true;
    }
    const coverObj = finalImages.find((img) => img.isCover) || finalImages[0];

    setIsSubmitting(true);
    setFormError(null);

    try {
      await onSave({
        id: initialProduct?.id,
        name: name.trim(),
        price: Number(price),
        description: description.trim(),
        category,
        images: finalImages,
        coverImageUrl: coverObj.url,
        isPublished,
        isFeatured,
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product to persistent database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
      
      {/* Form Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-stone-500 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors"
            title="Back to products list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-serif font-bold text-stone-900">
              {initialProduct ? `Edit Product: ${initialProduct.name}` : 'Create New Furniture Product'}
            </h1>
            <p className="text-xs text-stone-500">
              Upload images directly to Vercel Blob (test23-blob) and save metadata to persistent database
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium text-stone-500 hover:text-stone-900"
        >
          Cancel
        </button>
      </div>

      {formError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
            Product Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Nordic Oak Lounge Chair"
            className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
          />
        </div>

        {/* Price & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Price (USD) *
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="480"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
            >
              {FURNITURE_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
            Description & Materials
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe craftsmanship, dimensions, wood type..."
            className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 leading-relaxed"
          />
        </div>

        {/* Real Vercel Blob Image Uploader */}
        <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200">
          <AdminImageUploader
            images={images}
            onChange={setImages}
          />
        </div>

        {/* Toggles: Published & Featured */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <label className="flex items-center gap-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-100/70 transition-colors">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 text-stone-900 rounded border-stone-300 focus:ring-stone-900"
            />
            <div>
              <span className="text-xs font-bold text-stone-900 block">Published in catalog</span>
              <span className="text-[11px] text-stone-500 block">Visible to customer storefront</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-100/70 transition-colors">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 text-stone-900 rounded border-stone-300 focus:ring-stone-900"
            />
            <div>
              <span className="text-xs font-bold text-stone-900 block flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Featured product
              </span>
              <span className="text-[11px] text-stone-500 block">Highlight this item in the collection</span>
            </div>
          </label>
        </div>

        {/* Footer Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving to Database...' : initialProduct ? 'Update Product' : 'Create Product'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
