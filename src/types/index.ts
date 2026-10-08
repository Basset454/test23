export interface ProductImage {
  id: string;
  url: string;
  pathname?: string;
  isCover: boolean;
  name?: string;
  size?: number;
  uploadedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: ProductImage[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlobStatus {
  connected: boolean;
  tokenConfigured: boolean;
  maskedToken?: string;
  message: string;
  storeName?: string;
}
