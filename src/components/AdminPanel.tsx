import React, { useState } from 'react';
import { 
  PackagePlus, 
  LogOut, 
  Cloud, 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  Eye, 
  Key, 
  RotateCcw,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Product, BlobStatus } from '../types';
import { AdminProductModal } from './AdminProductModal';
import { getCustomBlobToken, setCustomBlobToken, getBlobStatus } from '../services/api';

interface AdminPanelProps {
  products: Product[];
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
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onResetProducts,
  onLogout,
  blobStatus,
  onRefreshBlobStatus,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isTokenSettingsOpen, setIsTokenSettingsOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState(getCustomBlobToken());

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    if (data.id) {
      await onUpdateProduct(data.id, data);
    } else {
      await onAddProduct(data);
    }
  };

  const handleTogglePublish = async (product: Product) => {
    await onUpdateProduct(product.id, { isPublished: !product.isPublished });
  };

  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomBlobToken(tokenInput);
    await onRefreshBlobStatus();
    setIsTokenSettingsOpen(false);
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-200">
      
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 text-stone-100 p-6 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-bold text-stone-400">
              Admin Portal
            </span>
            <span className="text-stone-600">•</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              test23-blob connected
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white">
            Product & Storage Management
          </h1>
          <p className="text-xs text-stone-400">
            Uploads stream directly to Vercel Blob and metadata is stored in the persistent database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Blob Token Config button */}
          <button
            onClick={() => setIsTokenSettingsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-medium text-stone-200 border border-stone-700 transition-colors cursor-pointer"
            title="Inspect or configure BLOB_READ_WRITE_TOKEN"
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Blob Config</span>
          </button>

          {/* Add Product Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-950 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Add Product</span>
          </button>

          {/* Logout button */}
          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-stone-800 hover:bg-red-950/80 hover:text-red-400 text-stone-400 transition-colors cursor-pointer"
            title="Log out of Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Blob Status Notification Banner */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-xs ${
          blobStatus?.connected
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-3">
          {blobStatus?.connected ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <div>
            <span className="font-bold block">
              Vercel Blob Store: {blobStatus?.storeName || 'test23-blob'}
            </span>
            <span className="text-stone-600">
              {blobStatus?.message}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsTokenSettingsOpen(true)}
          className="text-xs font-bold underline shrink-0 cursor-pointer"
        >
          {blobStatus?.connected ? 'View Token' : 'Configure Token'}
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-800">
            Catalog Products ({products.length})
          </h2>

          <button
            onClick={onResetProducts}
            className="text-xs font-medium text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
            title="Reset to sample furniture products"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Products</span>
          </button>
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
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {products.map((prod) => {
                  const coverImg = prod.images.find((i) => i.isCover) || prod.images[0];
                  return (
                    <tr key={prod.id} className="hover:bg-stone-50/60 transition-colors">
                      
                      {/* Image Thumbnail */}
                      <td className="py-3 px-6">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                          <img
                            src={coverImg?.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>

                      {/* Name */}
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

                      {/* Published status with fast toggle */}
                      <td className="py-3 px-6">
                        <button
                          onClick={() => handleTogglePublish(prod)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            prod.isPublished !== false
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-stone-100 text-stone-600 border border-stone-300 hover:bg-stone-200'
                          }`}
                          title="Click to toggle published / draft state"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${prod.isPublished !== false ? 'bg-emerald-600' : 'bg-stone-400'}`} />
                          <span>{prod.isPublished !== false ? 'Published' : 'Draft'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(prod)}
                            className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Product & Upload Images"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete product "${prod.name}" and remove from database?`)) {
                                onDeleteProduct(prod.id);
                              }
                            }}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Product"
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
              onClick={handleOpenAdd}
              className="mt-3 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Add your first product</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal: Add / Edit Product */}
      <AdminProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialProduct={editingProduct}
      />

      {/* Modal: Token / Vercel Blob Settings */}
      {isTokenSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-600" />
                <span>Vercel Blob Configuration (test23-blob)</span>
              </h3>
              <button
                onClick={() => setIsTokenSettingsOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              When deployed to Vercel, attaching <strong>test23-blob</strong> automatically injects <code>BLOB_READ_WRITE_TOKEN</code> into the server environment. If you want to test with a specific token right here, you can set it below:
            </p>

            <form onSubmit={handleSaveToken} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                  BLOB_READ_WRITE_TOKEN
                </label>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="vercel_blob_rw_xxxxxxxxxxxxxxxx"
                  className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
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
                  Clear Token
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Save & Validate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
