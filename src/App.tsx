import React, { useState, useEffect } from 'react';
import { Product, BlobStatus } from './types';
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getBlobStatus, 
  resetProductsToInitial,
  isAdminAuthenticated,
  adminLogout
} from './services/api';
import { CustomerNavbar } from './components/CustomerNavbar';
import { CustomerStore } from './components/CustomerStore';
import { AdminLogin } from './components/AdminLogin';
import { AdminPanel } from './components/AdminPanel';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [adminSubpath, setAdminSubpath] = useState('/admin/products');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [blobStatus, setBlobStatus] = useState<BlobStatus | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Synchronize route from browser location
  const syncRoute = () => {
    const path = window.location.pathname;
    const hash = window.location.hash;

    const isAdmin = path.startsWith('/admin') || hash.startsWith('#admin');
    setIsAdminRoute(isAdmin);

    if (isAdmin) {
      let sub = path.startsWith('/admin') ? path : hash.replace('#', '/');
      if (sub === '/admin' || sub === '/admin/') {
        sub = '/admin/products';
      }
      setAdminSubpath(sub);
      setIsAuthenticated(isAdminAuthenticated());
    }
  };

  useEffect(() => {
    syncRoute();
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  const navigateAdmin = (path: string) => {
    window.history.pushState({}, '', path);
    setAdminSubpath(path);
  };

  // Fetch products from server database
  const refreshProducts = async (forAdmin?: boolean) => {
    try {
      const data = await getProducts(forAdmin ?? isAdminRoute);
      setProducts(data);
    } catch (err: any) {
      console.error('Failed to load products from server database:', err);
      showToast(err.message || 'Error fetching products from server', 'error');
    }
  };

  const refreshBlobStatus = async () => {
    try {
      const status = await getBlobStatus();
      setBlobStatus(status);
    } catch (e) {
      console.warn('Could not refresh blob status:', e);
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([refreshProducts(isAdminRoute), refreshBlobStatus()]);
      setLoading(false);
    }
    init();
  }, [isAdminRoute]);

  // Admin Actions
  const handleAddProduct = async (newProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await createProduct(newProduct);
    setProducts((prev) => [created, ...prev]);
    showToast(`Product "${created.name}" created and saved to database.`);
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    const updated = await updateProduct(id, updates);
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    showToast('Product updated successfully.');
  };

  const handleDeleteProduct = async (id: string) => {
    await deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('Product deleted from database.', 'success');
  };

  const handleResetProducts = async () => {
    if (window.confirm('Reset catalog items to sample furniture products?')) {
      const resetList = await resetProductsToInitial();
      setProducts(resetList);
      showToast('Catalog restored to default furniture collection.');
    }
  };

  const handleAdminLogout = () => {
    adminLogout();
    setIsAuthenticated(false);
    window.history.pushState({}, '', '/');
    setIsAdminRoute(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans antialiased flex flex-col justify-between selection:bg-stone-900 selection:text-white">
      
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-medium border ${
              toast.type === 'error'
                ? 'bg-red-950 text-red-100 border-red-800'
                : 'bg-stone-900 text-stone-100 border-stone-800'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main View Router */}
      <div>
        {isAdminRoute ? (
          // ==================== INDEPENDENT ADMIN PORTAL (/admin) ====================
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {!isAuthenticated ? (
              <AdminLogin
                onLoginSuccess={() => {
                  setIsAuthenticated(true);
                  refreshProducts(true);
                  navigateAdmin('/admin/products');
                }}
              />
            ) : (
              <AdminPanel
                products={products}
                currentAdminSubpath={adminSubpath}
                navigateAdmin={navigateAdmin}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onResetProducts={handleResetProducts}
                onLogout={handleAdminLogout}
                blobStatus={blobStatus}
                onRefreshBlobStatus={refreshBlobStatus}
              />
            )}
          </div>
        ) : (
          // ==================== CUSTOMER STOREFRONT (/) ====================
          // STRICT RULE: No admin link/button anywhere in customer UI
          <>
            <CustomerNavbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-28 gap-3">
                  <Loader2 className="w-7 h-7 text-stone-900 animate-spin" />
                  <span className="text-xs font-medium text-stone-500">
                    Loading collection...
                  </span>
                </div>
              ) : (
                <CustomerStore products={products} />
              )}
            </main>
          </>
        )}
      </div>

      {/* Customer Footer (NO ADMIN LINK) */}
      {!isAdminRoute && (
        <footer id="about" className="bg-white border-t border-stone-200 py-12 mt-16 text-xs text-stone-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <p className="font-serif font-bold text-stone-900 text-sm">
                TRUST FURNITURE STUDIO
              </p>
              <p className="text-stone-400">
                Architectural furniture handcrafted with sustainable timber and natural textiles.
              </p>
            </div>
            <p className="text-stone-400">
              © {new Date().getFullYear()} Trust Furniture. All rights reserved.
            </p>
          </div>
        </footer>
      )}

    </div>
  );
}
