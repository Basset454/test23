import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  if (!isOpen) return null;

  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setOrderComplete(true);
      onClearCart();
    }, 1200);
  };

  const handleCloseAndReset = () => {
    setOrderComplete(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-200">
        
        {/* Cart Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">سلة المشتريات</h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              {items.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </div>

          <button
            onClick={handleCloseAndReset}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {orderComplete ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-black text-slate-900">تم تأكيد الطلب بنجاح!</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                شكراً لتسوقك معنا. تم استلام طلبك وربطه ببيانات المنتج وصوره المخزنة على Vercel Blob.
              </p>
              <button
                onClick={handleCloseAndReset}
                className="mt-4 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
              >
                متابعة التسوق
              </button>
            </div>
          ) : items.length > 0 ? (
            <div className="space-y-4">
              {items.map(({ product, quantity }) => {
                const coverImg = product.images.find((i) => i.isCover) || product.images[0];
                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0 border border-slate-200">
                      <img
                        src={coverImg?.url}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {product.title}
                      </h4>
                      <p className="text-xs font-black text-emerald-700 mt-0.5">
                        {product.price.toLocaleString('ar-SA')} ر.س
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => onUpdateQuantity(product.id, Math.max(1, quantity - 1))}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-300 text-xs font-bold hover:bg-slate-100 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold">{quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-300 text-xs font-bold hover:bg-slate-100 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveItem(product.id)}
                      className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">سلتك فارغة حالياً</p>
              <p className="text-xs text-slate-400">
                تصفح المنتجات في المتجر وأضف ما يعجبك!
              </p>
            </div>
          )}
        </div>

        {/* Cart Footer */}
        {items.length > 0 && !orderComplete && (
          <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-slate-600">المجموع الكلي:</span>
              <span className="text-xl font-black text-slate-900">
                {totalAmount.toLocaleString('ar-SA')} ر.س
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300"
            >
              <span>{isCheckingOut ? 'جارٍ إتمام الطلب...' : 'إتمام الشراء الآن'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>دفع آمن 100% ومشفر</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
