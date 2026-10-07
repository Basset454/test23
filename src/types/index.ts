export interface ProductImage {
  id: string;
  url: string;
  pathname?: string;
  isCover?: boolean;
  name?: string;
  size?: number;
  provider?: 'vercel_blob' | 'local_storage' | 'external_url';
  uploadedAt: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  stock: number;
  images: ProductImage[];
  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlobStatus {
  connected: boolean;
  tokenConfigured: boolean;
  maskedToken?: string;
  message: string;
  provider: 'vercel_blob' | 'local_fallback';
}

export interface CartItem {
  product: Product;
  quantity: number;
}
