import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { put, del } from '@vercel/blob';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON parser with high limit for images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Set up Multer with in-memory storage for direct streaming/upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit per file
    files: 10, // up to 10 files at once
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('يُسمح فقط برفع ملفات الصور (PNG, JPG, WEBP, GIF, SVG)'));
    }
  },
});

// Products persistence file path
const DATA_DIR = path.resolve(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const INITIAL_SERVER_PRODUCTS = [
  {
    id: 'prod-1',
    title: 'ساعة ذكية فاخرة من التيتانيوم',
    description: 'ساعة ذكية متطورة بإطار من التيتانيوم وشاشة AMOLED فائقة الدقة. مقاومة للماء وتدعم تتبع نبضات القلب والنشاط الرياضي وبطارية تدوم حتى 14 يومًا.',
    price: 899,
    originalPrice: 1199,
    category: 'إلكترونيات',
    stock: 15,
    isFeatured: true,
    images: [
      {
        id: 'img-1-1',
        url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
        name: 'titanium_watch_front.jpg',
        isCover: true,
        provider: 'external_url',
        uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: 'img-1-2',
        url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80',
        name: 'titanium_watch_side.jpg',
        isCover: false,
        provider: 'external_url',
        uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'prod-2',
    title: 'سماعات رأس لاسلكية مانعة للضوضاء',
    description: 'سماعات صوتية نقية بتقنية عزل الضوضاء النشط (ANC)، وسائد أذن مريحة من الجلد الطبيعي وعمر بطارية مذهل يصل إلى 40 ساعة تشغيل متواصل.',
    price: 549,
    originalPrice: 699,
    category: 'إلكترونيات',
    stock: 22,
    isFeatured: true,
    images: [
      {
        id: 'img-2-1',
        url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        name: 'headphones_main.jpg',
        isCover: true,
        provider: 'external_url',
        uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  }
];

if (!fs.existsSync(PRODUCTS_FILE)) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(INITIAL_SERVER_PRODUCTS, null, 2), 'utf-8');
}

// Helper to sanitize filename
function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// In-memory or file-backed products store
function loadProducts() {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load products from disk:', err);
  }
  return null;
}

function saveProducts(products: any[]) {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save products to disk:', err);
  }
}

// -------------------------------------------------------------
// 1. API: Vercel Blob Status
// -------------------------------------------------------------
app.get('/api/blob/status', (req: Request, res: Response) => {
  const token = (req.headers['x-blob-token'] as string) || process.env.BLOB_READ_WRITE_TOKEN;
  const isConfigured = Boolean(token && token.trim().length > 0);
  let masked = '';
  if (isConfigured && token) {
    masked = `${token.substring(0, 8)}...${token.substring(token.length - 4)}`;
  }

  res.json({
    connected: isConfigured,
    tokenConfigured: isConfigured,
    maskedToken: masked,
    provider: isConfigured ? 'vercel_blob' : 'local_fallback',
    message: isConfigured
      ? 'Vercel Blob متصل وجاهز لتخزين الصور سحابياً بشكل دائم وبأعلى سرعة CDN.'
      : 'لم يتم العثور على BLOB_READ_WRITE_TOKEN. يعمل النظام حالياً بنظام التخزين المدمج المباشر حتى يتم ربطه بـ Vercel Blob.',
  });
});

// -------------------------------------------------------------
// 2. API: Upload Image(s) to Vercel Blob
// -------------------------------------------------------------
app.post('/api/upload', upload.array('images', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'لم يتم اختيار أي ملف للرفع' });
    }

    const token = (req.headers['x-blob-token'] as string) || process.env.BLOB_READ_WRITE_TOKEN;
    const uploadedImages = [];

    for (const file of files) {
      const timestamp = Date.now();
      const cleanOriginal = sanitizeFileName(file.originalname);
      const filename = `products/${timestamp}-${cleanOriginal}`;

      if (token && token.trim().length > 0) {
        // Real Vercel Blob Upload
        try {
          const blob = await put(filename, file.buffer, {
            access: 'public',
            token: token.trim(),
            contentType: file.mimetype,
          });

          uploadedImages.push({
            id: `img-${timestamp}-${Math.random().toString(36).substring(2, 7)}`,
            url: blob.url,
            pathname: blob.pathname,
            name: file.originalname,
            size: file.size,
            provider: 'vercel_blob',
            uploadedAt: new Date().toISOString(),
          });
        } catch (blobErr: any) {
          console.error('Vercel Blob put error:', blobErr);
          // If token fails, fallback to permanent data URL so user work isn't blocked
          const base64Data = file.buffer.toString('base64');
          const dataUrl = `data:${file.mimetype};base64,${base64Data}`;
          uploadedImages.push({
            id: `img-${timestamp}-${Math.random().toString(36).substring(2, 7)}`,
            url: dataUrl,
            name: file.originalname,
            size: file.size,
            provider: 'local_storage',
            uploadedAt: new Date().toISOString(),
            warning: 'فشل الاتصال بـ Vercel Blob (' + (blobErr.message || 'خطأ رمز') + ')، تم التخزين المباشر احتياطياً.',
          });
        }
      } else {
        // Local/Direct permanent data URL fallback
        const base64Data = file.buffer.toString('base64');
        const dataUrl = `data:${file.mimetype};base64,${base64Data}`;

        uploadedImages.push({
          id: `img-${timestamp}-${Math.random().toString(36).substring(2, 7)}`,
          url: dataUrl,
          name: file.originalname,
          size: file.size,
          provider: 'local_storage',
          uploadedAt: new Date().toISOString(),
          notice: 'تم الحفظ في المتجر. عند النشر على Vercel برمز BLOB_READ_WRITE_TOKEN سيتم الرفع تلقائياً على Vercel Blob CDN.',
        });
      }
    }

    return res.json({
      success: true,
      files: uploadedImages,
      provider: token ? 'vercel_blob' : 'local_storage',
    });
  } catch (error: any) {
    console.error('Upload handler error:', error);
    return res.status(500).json({
      error: 'حدث خطأ أثناء رفع الصورة: ' + (error.message || 'خطأ غير معروف'),
    });
  }
});

// -------------------------------------------------------------
// 3. API: Delete Image from Vercel Blob
// -------------------------------------------------------------
app.delete('/api/delete-image', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'رابط الصورة مطلوب للحذف' });
    }

    const token = (req.headers['x-blob-token'] as string) || process.env.BLOB_READ_WRITE_TOKEN;

    // Check if it's a Vercel Blob URL
    if (url.includes('blob.vercel-storage.com') && token) {
      try {
        await del(url, { token: token.trim() });
      } catch (delErr: any) {
        console.warn('Vercel Blob del warning:', delErr?.message);
      }
    }

    return res.json({
      success: true,
      message: 'تم حذف الصورة بنجاح',
      deletedUrl: url,
    });
  } catch (error: any) {
    console.error('Delete handler error:', error);
    return res.status(500).json({
      error: 'فشل حذف الصورة: ' + (error.message || 'خطأ غير معروف'),
    });
  }
});

// -------------------------------------------------------------
// 4. Products APIs
// -------------------------------------------------------------
app.get('/api/products', (_req: Request, res: Response) => {
  const products = loadProducts();
  res.json({ products });
});

app.post('/api/products', (req: Request, res: Response) => {
  try {
    const newProduct = req.body;
    if (!newProduct || !newProduct.title) {
      return res.status(400).json({ error: 'اسم المنتج مطلوب' });
    }
    const current = loadProducts() || [];
    current.unshift(newProduct);
    saveProducts(current);
    res.json({ success: true, product: newProduct });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = req.body;
    let current = loadProducts() || [];
    current = current.map((p: any) => (p.id === id ? { ...p, ...updated, updatedAt: new Date().toISOString() } : p));
    saveProducts(current);
    res.json({ success: true, product: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let current = loadProducts() || [];
    const productToDelete = current.find((p: any) => p.id === id);

    // If product has Vercel Blob images, delete them from Vercel Blob as well
    const token = (req.headers['x-blob-token'] as string) || process.env.BLOB_READ_WRITE_TOKEN;
    if (productToDelete?.images?.length && token) {
      for (const img of productToDelete.images) {
        if (img.url?.includes('blob.vercel-storage.com')) {
          try {
            await del(img.url, { token: token.trim() });
          } catch (e) {
            console.warn('Failed to delete blob during product deletion:', e);
          }
        }
      }
    }

    current = current.filter((p: any) => p.id !== id);
    saveProducts(current);
    res.json({ success: true, message: 'تم حذف المنتج بنجاح' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products/save-all', (req: Request, res: Response) => {
  try {
    const { products } = req.body;
    if (Array.isArray(products)) {
      saveProducts(products);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'البيانات غير صالحة' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Dev & Production Server integration
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
