import React, { useState, useEffect } from 'react';
import { Product, BlobStatus, CartItem } from './types';
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getBlobStatus, 
  resetProductsToDefault 
} from './services/api';
import { Navbar } from './components/Navbar';
import { Storefront } from './components/Storefront';
import { AdminDashboard } from './components/AdminDashboard';
import { ProductFormModal } from './components/ProductFormModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { VercelBlobGuideModal } from './components/VercelBlobGuideModal';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'store' | 'admin'>('store');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [blobStatus, setBlobStatus] = useState<BlobStatus | null>(null);

  // Modals & Drawers state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isBlobGuideOpen, setIsBlobGuideOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('store_cart_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Sync /admin URL path or hash
  useEffect(() => {
    if (window.location.pathname.includes('/admin') || window.location.hash === '#admin') {
      setCurrentView('admin');
    }

    const handlePopState = () => {
      if (window.location.pathname.includes('/admin') || window.location.hash === '#admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('store');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update URL history when switching views
  const handleViewChange = (view: 'store' | 'admin') => {
    setCurrentView(view);
    if (view === 'admin') {
      window.history.pushState({}, '', '#admin');
    } else {
      window.history.pushState({}, '', window.location.pathname.replace('/admin', '') || '/');
    }
  };

  // Save cart to local storage
  useEffect(() => {
    localStorage.setItem('store_cart_v1', JSON.stringify(cartItems));
  }, [cartItems]);

  // Initial load
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [loadedProducts, status] = await Promise.all([
          getProducts(),
          getBlobStatus(),
        ]);
        setProducts(loadedProducts);
        setBlobStatus(status);
      } catch (err) {
        console.error('Failed to initialize app data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Product CRUD Handlers
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsFormModalOpen(true);
  };

  const handleSaveProduct = async (productData: Product) => {
    if (editingProduct) {
      // Update existing
      const updated = await updateProduct(productData);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      showToast('تم تحديث بيانات المنتج وصوره بنجاح!');
    } else {
      // Create new
      const created = await createProduct(productData);
      setProducts((prev) => [created, ...prev]);
      showToast('تمت إضافة المنتج الجديد وحفظ صوره الدائمة بنجاح!');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const toDelete = products.find((p) => p.id === productId);
    await deleteProduct(productId, toDelete?.images);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    showToast('تم حذف المنتج وصوره من التخزين بنجاح', 'info');
  };

  const handleResetProducts = async () => {
    if (window.confirm('هل تريد إعادة تعيين المنتجات إلى القائمة النموذجية الافتراضية؟')) {
      const resetList = await resetProductsToDefault();
      setProducts(resetList);
      showToast('تمت استعادة المنتجات الافتراضية بنجاح!');
    }
  };

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(`تمت إضافة "${product.title}" إلى السلة`);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-300">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-bold border ${
              toast.type === 'error'
                ? 'bg-red-900 text-white border-red-700'
                : toast.type === 'info'
                ? 'bg-slate-900 text-white border-slate-700'
                : 'bg-emerald-600 text-white border-emerald-500'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-300" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={handleViewChange}
        cartCount={totalCartCount}
        openCart={() => setIsCartOpen(true)}
        blobStatus={blobStatus}
        openBlobModal={() => setIsBlobGuideOpen(true)}
      />

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <span className="text-xs font-bold text-slate-500">
              جارٍ تحميل بيانات المتجر وإعداد التخزين...
            </span>
          </div>
        ) : currentView === 'admin' ? (
          <AdminDashboard
            products={products}
            onAddProduct={handleOpenAddProduct}
            onEditProduct={handleOpenEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onResetProducts={handleResetProducts}
            onViewProductInStore={(prod) => {
              setSelectedProduct(prod);
              setCurrentView('store');
            }}
            blobStatus={blobStatus}
            openBlobModal={() => setIsBlobGuideOpen(true)}
            onPreviewImage={(url) => setPreviewImageUrl(url)}
          />
        ) : (
          <Storefront
            products={products}
            onSelectProduct={(prod) => setSelectedProduct(prod)}
            onAddToCart={(prod) => handleAddToCart(prod, 1)}
            onGoToAdmin={() => handleViewChange('admin')}
          />
        )}
      </main>

      {/* Modals */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveProduct}
        initialProduct={editingProduct}
        onPreviewImage={(url) => setPreviewImageUrl(url)}
      />

      <ProductDetailModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onPreviewImage={(url) => setPreviewImageUrl(url)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
      />

      <VercelBlobGuideModal
        isOpen={isBlobGuideOpen}
        onClose={() => setIsBlobGuideOpen(false)}
        blobStatus={blobStatus}
        onStatusUpdate={(newStatus) => setBlobStatus(newStatus)}
      />

      <ImagePreviewModal
        url={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />

      {/* Clean Footer */}
      <footer className="mt-16 bg-white border-t border-slate-200 py-8 text-slate-500 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} متجر بلوب - نظام رفع وتخزين صور المنتجات لبيئة Vercel Blob الدائمة.</p>
          <div className="flex items-center gap-4 text-slate-600">
            <button
              onClick={() => handleViewChange(currentView === 'admin' ? 'store' : 'admin')}
              className="hover:text-emerald-600 font-bold underline"
            >
              {currentView === 'admin' ? 'الانتقال إلى المتجر للزبائن' : 'الانتقال إلى لوحة الإدارة /admin'}
            </button>
            <span>•</span>
            <button
              onClick={() => setIsBlobGuideOpen(true)}
              className="hover:text-emerald-600 font-bold"
            >
              دليل Vercel Blob
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
