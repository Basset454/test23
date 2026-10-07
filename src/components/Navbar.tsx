import React from 'react';
import { ShoppingBag, LayoutDashboard, Store, Cloud, CheckCircle2, AlertCircle, ShoppingCart } from 'lucide-react';
import { BlobStatus } from '../types';

interface NavbarProps {
  currentView: 'store' | 'admin';
  setCurrentView: (view: 'store' | 'admin') => void;
  cartCount: number;
  openCart: () => void;
  blobStatus: BlobStatus | null;
  openBlobModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  cartCount,
  openCart,
  blobStatus,
  openBlobModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('store')}
              className="flex items-center gap-2.5 text-right group focus:outline-none"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 block leading-tight">
                  متجر بلوب
                </span>
                <span className="text-xs text-slate-500 font-medium hidden sm:block">
                  تخزين سحابي دائم لصور المنتجات
                </span>
              </div>
            </button>
          </div>

          {/* Navigation Tabs (Store vs Admin) */}
          <nav className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setCurrentView('store')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentView === 'store'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>المتجر للزبائن</span>
            </button>
            <button
              onClick={() => setCurrentView('admin')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentView === 'admin'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>لوحة الإدارة /admin</span>
            </button>
          </nav>

          {/* Right Actions: Vercel Blob Status & Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Blob Status Badge */}
            <button
              onClick={openBlobModal}
              title="انقر لفحص إعدادات وتوصيل Vercel Blob"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                blobStatus?.connected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {blobStatus?.connected ? 'Vercel Blob مفعّل' : 'تخزين الصور'}
              </span>
              {blobStatus?.connected ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3 h-3 text-amber-600" />
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={openCart}
              className="relative p-2.5 sm:p-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-colors focus:outline-none"
              aria-label="عرض سلة التسوق"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
