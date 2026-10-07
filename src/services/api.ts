import { Product, ProductImage, BlobStatus } from '../types';
import { INITIAL_PRODUCTS } from '../data/initialProducts';

const LOCAL_STORAGE_KEY = 'store_products_data_v1';
const BLOB_TOKEN_KEY = 'vercel_blob_custom_token';

export function getCustomBlobToken(): string {
  return localStorage.getItem(BLOB_TOKEN_KEY) || '';
}

export function setCustomBlobToken(token: string): void {
  if (token) {
    localStorage.setItem(BLOB_TOKEN_KEY, token.trim());
  } else {
    localStorage.removeItem(BLOB_TOKEN_KEY);
  }
}

// -------------------------------------------------------------
// Products API with local cache synchronization
// -------------------------------------------------------------
export async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data = await res.json();
      if (data.products && Array.isArray(data.products) && data.products.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.products));
        return data.products;
      }
    }
  } catch (e) {
    console.warn('Backend fetch failed, falling back to local storage cache:', e);
  }

  // Fallback to local storage or initial dataset
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
  // Try to sync initial products to server
  try {
    await fetch('/api/products/save-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: INITIAL_PRODUCTS }),
    });
  } catch {
    // ignore
  }

  return INITIAL_PRODUCTS;
}

export async function createProduct(product: Product): Promise<Product> {
  const token = getCustomBlobToken();
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'x-blob-token': token } : {}),
      },
      body: JSON.stringify(product),
    });
    if (res.ok) {
      const data = await res.json();
      updateLocalCache((current) => [data.product, ...current]);
      return data.product;
    }
  } catch (e) {
    console.warn('Server create failed, saving to local cache:', e);
  }

  updateLocalCache((current) => [product, ...current]);
  return product;
}

export async function updateProduct(product: Product): Promise<Product> {
  const token = getCustomBlobToken();
  try {
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'x-blob-token': token } : {}),
      },
      body: JSON.stringify(product),
    });
    if (res.ok) {
      const data = await res.json();
      updateLocalCache((current) => current.map((p) => (p.id === product.id ? data.product : p)));
      return data.product;
    }
  } catch (e) {
    console.warn('Server update failed, updating local cache:', e);
  }

  updateLocalCache((current) => current.map((p) => (p.id === product.id ? product : p)));
  return product;
}

export async function deleteProduct(productId: string, images: ProductImage[] = []): Promise<boolean> {
  const token = getCustomBlobToken();
  try {
    await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { 'x-blob-token': token } : {}),
      },
    });
  } catch (e) {
    console.warn('Server delete failed, updating local cache:', e);
  }

  // Also delete images from Vercel Blob if needed
  for (const img of images) {
    if (img.url && img.url.includes('blob.vercel-storage.com')) {
      deleteImageFile(img.url).catch(() => {});
    }
  }

  updateLocalCache((current) => current.filter((p) => p.id !== productId));
  return true;
}

function updateLocalCache(updater: (current: Product[]) => Product[]) {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    const list: Product[] = cached ? JSON.parse(cached) : INITIAL_PRODUCTS;
    const updated = updater(list);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update local cache', e);
  }
}

// -------------------------------------------------------------
// Image Upload & Delete APIs
// -------------------------------------------------------------
export async function uploadImageFiles(
  files: File[],
  onProgress?: (progress: number) => void
): Promise<ProductImage[]> {
  const token = getCustomBlobToken();
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));

  try {
    onProgress?.(30);
    const headers: Record<string, string> = {};
    if (token) {
      headers['x-blob-token'] = token;
    }

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: formData,
    });

    onProgress?.(80);

    if (res.ok) {
      const data = await res.json();
      onProgress?.(100);
      return data.files || [];
    } else {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'فشل رفع الصور');
    }
  } catch (err: any) {
    console.warn('API upload encountered an issue, generating durable fallback:', err);
    onProgress?.(70);

    // Fallback: convert files to Base64 data URLs so the user is never blocked
    const fallbackResults: ProductImage[] = await Promise.all(
      files.map(
        (file, idx) =>
          new Promise<ProductImage>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                id: `img-${Date.now()}-${idx}`,
                url: reader.result as string,
                name: file.name,
                size: file.size,
                provider: 'local_storage',
                uploadedAt: new Date().toISOString(),
              });
            };
            reader.onerror = () => {
              resolve({
                id: `img-err-${Date.now()}-${idx}`,
                url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
                name: file.name,
                provider: 'local_storage',
                uploadedAt: new Date().toISOString(),
              });
            };
            reader.readAsDataURL(file);
          })
      )
    );

    onProgress?.(100);
    return fallbackResults;
  }
}

export async function deleteImageFile(url: string): Promise<boolean> {
  const token = getCustomBlobToken();
  try {
    const res = await fetch('/api/delete-image', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'x-blob-token': token } : {}),
      },
      body: JSON.stringify({ url }),
    });
    return res.ok;
  } catch (e) {
    console.warn('Delete image failed:', e);
    return false;
  }
}

export async function getBlobStatus(): Promise<BlobStatus> {
  const customToken = getCustomBlobToken();
  try {
    const headers: Record<string, string> = {};
    if (customToken) {
      headers['x-blob-token'] = customToken;
    }
    const res = await fetch('/api/blob/status', { headers });
    if (res.ok) {
      const data = await res.json();
      if (customToken) {
        return {
          ...data,
          tokenConfigured: true,
          connected: true,
          maskedToken: `${customToken.substring(0, 8)}...${customToken.substring(customToken.length - 4)}`,
          provider: 'vercel_blob',
          message: 'تم تفعيل Vercel Blob عبر الرمز المخصص. الصور تُرفع وتُخزن على CDN دائم.',
        };
      }
      return data;
    }
  } catch (e) {
    console.warn('Blob status check error:', e);
  }

  if (customToken) {
    return {
      connected: true,
      tokenConfigured: true,
      maskedToken: `${customToken.substring(0, 8)}...${customToken.substring(customToken.length - 4)}`,
      provider: 'vercel_blob',
      message: 'رمز Vercel Blob مفعّل ومخزن محلياً.',
    };
  }

  return {
    connected: false,
    tokenConfigured: false,
    provider: 'local_fallback',
    message: 'وضع التطوير المباشر. عند النشر على Vercel أضف BLOB_READ_WRITE_TOKEN لتفعيل Vercel Blob تلقائياً.',
  };
}

export async function resetProductsToDefault(): Promise<Product[]> {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
  try {
    await fetch('/api/products/save-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: INITIAL_PRODUCTS }),
    });
  } catch {
    // ignore
  }
  return INITIAL_PRODUCTS;
}
