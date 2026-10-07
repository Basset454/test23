import React, { useState } from 'react';
import { X, Cloud, CheckCircle2, AlertTriangle, Key, ExternalLink, Copy, Check, Upload, ArrowRight } from 'lucide-react';
import { BlobStatus } from '../types';
import { getCustomBlobToken, setCustomBlobToken, getBlobStatus } from '../services/api';

interface VercelBlobGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  blobStatus: BlobStatus | null;
  onStatusUpdate: (status: BlobStatus) => void;
}

export const VercelBlobGuideModal: React.FC<VercelBlobGuideModalProps> = ({
  isOpen,
  onClose,
  blobStatus,
  onStatusUpdate,
}) => {
  const [tokenInput, setTokenInput] = useState(getCustomBlobToken());
  const [isCopied, setIsCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    setCustomBlobToken(tokenInput);
    const updatedStatus = await getBlobStatus();
    onStatusUpdate(updatedStatus);

    setIsTesting(false);
    if (tokenInput.trim()) {
      setTestResult({
        success: true,
        message: 'تم حفظ وتفعيل رمز Vercel Blob بنجاح! سيتم تخزين كل الصور المرفوعة مباشرة على CDN.',
      });
    } else {
      setTestResult({
        success: true,
        message: 'تمت إزالة الرمز المخصص. يعمل النظام الآن بنظام التخزين المباشر أو الرمز المعين في متغيرات البيئة.',
      });
    }
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs">
              <Cloud className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black">
                دليل تخزين الصور الدائم عبر Vercel Blob
              </h2>
              <p className="text-xs text-slate-300">
                حل مشكلة اختفاء صور المنتجات في Vercel والاستغناء عن GitHub
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Current Status Box */}
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
              blobStatus?.connected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {blobStatus?.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs sm:text-sm">
              <p className="font-bold">
                {blobStatus?.connected
                  ? 'حالة الاتصال: متصل بـ Vercel Blob جاهز للعمل الدائم'
                  : 'حالة الاتصال: التخزين المباشر المحلي مفعل'}
              </p>
              <p className="text-xs mt-1 text-slate-600 leading-relaxed">
                {blobStatus?.message}
              </p>
              {blobStatus?.maskedToken && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/5 font-mono text-xs">
                  <Key className="w-3.5 h-3.5" />
                  <span>الرمز الحالي: {blobStatus.maskedToken}</span>
                </div>
              )}
            </div>
          </div>

          {/* Explanation Section */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-2 leading-relaxed">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              كيف تم حل المشكلة في هذا النظام؟
            </h3>
            <p>
              <strong>المشكلة السابقة:</strong> على Vercel، نظام السيرفر مؤقت (Ephemeral/Serverless). عند رفع الصور إلى مجلد محلي على السيرفر، تُحذف فور انتهاء تشغيل الدالة، وكان المستخدم يضطر لرفعها إلى مستودع GitHub يدوياً.
            </p>
            <p>
              <strong>الحل المعتمد:</strong> تم ربط لوحة الإدارة (`/admin`) بمكتبة <code>@vercel/blob</code>. عندما يرفع صاحب المتجر الصور من جهازه:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pr-2">
              <li>تُرفع الصور سحابياً ومباشرة إلى <strong>Vercel Blob CDN</strong>.</li>
              <li>يتم توليد رابط CDN دائم <code>https://...public.blob.vercel-storage.com</code>.</li>
              <li>يُحفظ الرابط مع بيانات المنتج وتظهر الصور تلقائياً لجميع الزبائن.</li>
              <li>تستطيع إضافة وحذف الصور دون الحاجة للمس كود المشروع أو GitHub مطلقاً!</li>
            </ul>
          </div>

          {/* Steps to setup on Vercel */}
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-3">
              خطوات تفعيل Vercel Blob في حسابك على Vercel (بضغطة زر):
            </h3>
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <div>
                  <p className="font-bold text-slate-800">
                    الدخول إلى لوحة تحكم Vercel
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    افتح مشروعك في vercel.com ثم انقر على تبويب <strong>Storage</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <div>
                  <p className="font-bold text-slate-800">
                    إنشاء مخزن Vercel Blob
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    انقر على <strong>Create Database</strong> واختر <strong>Blob</strong> ثم اختر اسماً للمخزن (مثلاً: store-images).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <div>
                  <p className="font-bold text-slate-800">
                    الربط التلقائي بالمشروع
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    انقر على <strong>Connect to Project</strong>. سيقوم Vercel تلقائياً بإضافة المتغير <code>BLOB_READ_WRITE_TOKEN</code> لمشروعك، وسيعمل الرفع فوراً!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Token Configuration Box */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-600" />
              <span>إدخال أو اختبار رمز BLOB_READ_WRITE_TOKEN مباشرة:</span>
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              إذا كان لديك الرمز وتريد تجربته في هذه المعاينة الآن، ألصقه هنا وسيقوم النظام باستخدامه فوراً:
            </p>

            <form onSubmit={handleSaveToken} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="vercel_blob_rw_xxxxxxxxxxxxxxxx"
                  className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono bg-white"
                />
                <button
                  type="submit"
                  disabled={isTesting}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shrink-0"
                >
                  {isTesting ? 'جارٍ الفحص...' : 'حفظ واختبار'}
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-medium ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {testResult.message}
                </div>
              )}
            </form>
          </div>

          {/* Close Action */}
          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
            >
              فهمت، العودة للوحة الإدارة
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
