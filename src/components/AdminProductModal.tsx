import React, { useState, useEffect } from 'react';
import { X, Save, PackagePlus, AlertCircle } from 'lucide-react';
import { Product, ProductImage } from '../types';
import { FURNITURE_CATEGORIES } from '../data/initialProducts';
import { AdminImageUploader } from './AdminImageUploader';

interface AdminProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  initialProduct?: Product | null;
}

export const AdminProductModal: React.FC<AdminProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProduct,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(FURNITURE_CATEGORIES[1]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isPublished, setIsPublished] = useState(true);
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
    } else {
      setName('');
      setPrice('');
      setDescription('');
      setCategory(FURNITURE_CATEGORIES[1]);
      setImages([]);
      setIsPublished(true);
    }
    setFormError(null);
  }, [initialProduct, isOpen]);

  if (!isOpen) return null;

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
      setFormError('Please upload at least one product image to Vercel Blob.');
      return;
    }

    // Ensure one image is cover
    const finalImages = [...images];
    if (!finalImages.some((img) => img.isCover)) {
      finalImages[0].isCover = true;
    }

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
        isPublished,
      });
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900">
                {initialProduct ? 'Edit Furniture Piece' : 'Add New Furniture Product'}
              </h2>
              <p className="text-xs text-stone-500">
                Images are uploaded directly to Vercel Blob and metadata is saved in the database
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
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
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
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
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
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
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Description & Specifications
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Materials, dimensions, care instructions..."
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
            />
          </div>

          {/* Real Vercel Blob Image Uploader */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <AdminImageUploader
              images={images}
              onChange={setImages}
            />
          </div>

          {/* Publish / Unpublish Toggle */}
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
            <input
              type="checkbox"
              id="isPublished"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 text-stone-900 rounded border-stone-300 focus:ring-stone-900 cursor-pointer"
            />
            <label htmlFor="isPublished" className="text-xs font-bold text-stone-800 cursor-pointer">
              Published on customer website (uncheck to save as draft)
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving to Database...' : initialProduct ? 'Update Product' : 'Add Product'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
