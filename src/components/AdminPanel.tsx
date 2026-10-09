import React, { useState } from 'react';
import { 
  PackagePlus, 
  LogOut, 
  Cloud, 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Product, BlobStatus } from '../types';
import { AdminProductForm } from './AdminProductForm';
import { getCustomBlobToken, setCustomBlobToken } from '../services/api';

interface AdminPanelProps {
  products: Product[];
  currentAdminSubpath: string; // e.g. '/admin/products', '/admin/products/new', '/admin/products/:id/edit'
  navigateAdmin: (path: string) => void;
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onResetProducts: () => Promise<void>;
  onLogout: () => void;
  blobStatus: BlobStatus | null;
  onRefreshBlobStatus: () => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  currentAdminSubpath,
  navigateAdmin,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onResetProducts,
  onLogout,
  blobStatus,
  onRefreshBlobStatus,
}) => {
  const [isTokenSettingsOpen, setIsTokenSettingsOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState(getCustomBlobToken());
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Determine current view
  const isNewView = currentAdminSubpath === '/admin/products/new';
  const isEditView = currentAdminSubpath.includes('/edit');
  const editingId = isEditView ? currentAdminSubpath.split('/')[3] : null;
  const productToEdit = editingId ? products.find((p) => p.id === editingId) || null : null;

  const handleTogglePublish = async (product: Product) => {
    await onUpdateProduct(product.id, { isPublished: !product.isPublished });
  };

  const handleToggleFeatured = async (product: Product) => {
    await onUpdateProduct(product.id, { isFeatured: !product.isFeatured });
  };

  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tokenInput.trim();
    if (trimmed.startsWith('postgres://') || trimmed.startsWith('postgresql://')) {
      setTokenError(
        'Warning: You entered a PostgreSQL database connection string. Vercel Blob tokens must start with "vercel_blob_rw_".'
      );
      return;
    }
    if (trimmed.length > 0 && !trimmed.startsWith('vercel_blob_rw_')) {
      setTokenError('Invalid token format: Vercel Blob read/write tokens start with "vercel_blob_rw_".');
      return;
    }
    setTokenError(null);
    setCustomBlobToken(trimmed);
    await onRefreshBlobStatus();
    setIsTokenSettingsOpen(false);
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-200">
      
      {/* Top Admin Navigation Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 text-stone-100 p-6 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-widest font-bold text-stone-400">
              Admin Portal
            </span>
            <span className="text-stone-600">•</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              test23-blob (_database/products.json)
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white">
            Trust Furniture Admin
          </h1>
          <p className="text-xs text-stone-400">
            Authoritative product data & image storage powered by connected Vercel Blob (test23-blob).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Products List Link */}
          <button
            onClick={() => navigateAdmin('/admin/products')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              !isNewView && !isEditView
                ? 'bg-white text-stone-950 shadow-sm'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            All Products ({products.length})
          </button>

          {/* Add Product Link */}
          <button
            onClick={() => navigateAdmin('/admin/products/new')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              isNewView
                ? 'bg-white text-stone-950 shadow-sm'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <PackagePlus className="w-4 h-4" />
            <span>Add Product</span>
          </button>

          {/* Blob Settings */}
          <button
            onClick={() => setIsTokenSettingsOpen(true)}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
            title="Inspect Vercel Blob Configuration"
          >
            <Cloud className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-stone-800 hover:bg-red-950/80 hover:text-red-400 text-stone-400 transition-colors cursor-pointer"
            title="Log out of Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Vercel Blob Store Status Chip */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-xs ${
          blobStatus?.connected
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-stone-100 border-stone-300 text-stone-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold block">
              Vercel Blob Storage: test23-blob
            </span>
            <span className="text-stone-600">
              {blobStatus?.message || 'Ready for direct image uploads to Vercel Blob CDN.'}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsTokenSettingsOpen(true)}
          className="text-xs font-bold underline shrink-0 cursor-pointer"
        >
          Blob Info
        </button>
      </div>

      {/* ================= VIEW 1: ADD PRODUCT (/admin/products/new) ================= */}
      {isNewView && (
        <AdminProductForm
          initialProduct={null}
          onSave={async (data) => {
            await onAddProduct(data);
            navigateAdmin('/admin/products');
          }}
          onCancel={() => navigateAdmin('/admin/products')}
        />
      )}

      {/* ================= VIEW 2: EDIT PRODUCT (/admin/products/:id/edit) ================= */}
      {isEditView && (
        <AdminProductForm
          initialProduct={productToEdit}
          onSave={async (data) => {
            if (editingId) {
              await onUpdateProduct(editingId, data);
            }
            navigateAdmin('/admin/products');
          }}
          onCancel={() => navigateAdmin('/admin/products')}
        />
      )}

      {/* ================= VIEW 3: PRODUCT LIST (/admin/products) ================= */}
      {!isNewView && !isEditView && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-800">
              Catalog Items ({products.length})
            </h2>

            <div className="flex items-center gap-3">
              <button
                onClick={onResetProducts}
                className="text-xs font-medium text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                title="Restore default sample furniture pieces"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Data</span>
              </button>

              <button
                onClick={() => navigateAdmin('/admin/products/new')}
                className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <PackagePlus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-6">Image</th>
                    <th className="py-3 px-6">Product Name</th>
                    <th className="py-3 px-6">Category</th>
                    <th className="py-3 px-6">Price</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Featured</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products.map((prod) => {
                    const coverImg = prod.images.find((i) => i.isCover) || prod.images[0];
                    return (
                      <tr key={prod.id} className="hover:bg-stone-50/60 transition-colors">
                        
                        {/* Cover Image Thumbnail */}
                        <td className="py-3 px-6">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 relative">
                            <img
                              src={coverImg?.url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            {prod.images.length > 1 && (
                              <span className="absolute bottom-0.5 right-0.5 bg-stone-900/80 text-white text-[9px] px-1 rounded">
                                +{prod.images.length - 1}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Name & Description */}
                        <td className="py-3 px-6 font-medium text-stone-900">
                          <span className="block font-serif font-bold text-sm">
                            {prod.name}
                          </span>
                          <span className="text-[11px] text-stone-500 line-clamp-1">
                            {prod.description}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-6 text-stone-600">
                          <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 text-xs font-medium">
                            {prod.category}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3 px-6 font-bold text-stone-900">
                          ${prod.price.toLocaleString()}
                        </td>

                        {/* Published Toggle */}
                        <td className="py-3 px-6">
                          <button
                            onClick={() => handleTogglePublish(prod)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              prod.isPublished !== false
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-stone-100 text-stone-600 border border-stone-300 hover:bg-stone-200'
                            }`}
                            title="Click to toggle Published / Draft"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${prod.isPublished !== false ? 'bg-emerald-600' : 'bg-stone-400'}`} />
                            <span>{prod.isPublished !== false ? 'Published' : 'Draft'}</span>
                          </button>
                        </td>

                        {/* Featured Toggle */}
                        <td className="py-3 px-6">
                          <button
                            onClick={() => handleToggleFeatured(prod)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              prod.isFeatured
                                ? 'text-amber-500 bg-amber-50'
                                : 'text-stone-300 hover:text-stone-500'
                            }`}
                            title="Toggle Featured product"
                          >
                            <Sparkles className="w-4 h-4 fill-current" />
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => navigateAdmin(`/admin/products/${prod.id}/edit`)}
                              className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit product details & images"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete product "${prod.name}" and remove from persistent database?`)) {
                                  onDeleteProduct(prod.id);
                                }
                              }}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete product"
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
          ) : (
            <div className="p-12 text-center text-stone-500">
              <p className="text-sm font-medium">No products in the database yet.</p>
              <button
                onClick={() => navigateAdmin('/admin/products/new')}
                className="mt-3 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <PackagePlus className="w-4 h-4" />
                <span>Add first product</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Blob Configuration Modal */}
      {isTokenSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-600" />
                <span>Vercel Blob Store (test23-blob)</span>
              </h3>
              <button
                onClick={() => setIsTokenSettingsOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Vercel Blob store <strong>test23-blob</strong> is active. Vercel automatically authenticates via OIDC / environment variables when deployed. You can also specify an override token below if needed:
            </p>

            <form onSubmit={handleSaveToken} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                  BLOB_READ_WRITE_TOKEN (Optional override)
                </label>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value);
                    if (tokenError) setTokenError(null);
                  }}
                  placeholder="vercel_blob_rw_xxxxxxxxxxxxxxxx"
                  className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
                {tokenError && (
                  <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <span>{tokenError}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTokenInput('');
                    setCustomBlobToken('');
                    onRefreshBlobStatus();
                    setIsTokenSettingsOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Save & Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
