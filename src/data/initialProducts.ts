import { Product } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-f1',
    name: 'Nordic Oak Lounge Chair',
    description: 'Handcrafted solid oak armchair upholstered with premium textured linen. Features ergonomic curved backrest and tapered wooden legs.',
    price: 480,
    category: 'Living Room',
    isPublished: true,
    isFeatured: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1000&auto=format&fit=crop&q=80',
    images: [
      {
        id: 'img-f1-1',
        url: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1000&auto=format&fit=crop&q=80',
        name: 'nordic_oak_chair.jpg',
        isCover: true,
        uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'img-f1-2',
        url: 'https://images.unsplash.com/photo-1580481077195-c3a821a506cb?w=1000&auto=format&fit=crop&q=80',
        name: 'nordic_chair_detail.jpg',
        isCover: false,
        uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'prod-f2',
    name: 'Minimalist Walnut Dining Table',
    description: 'Six-seater contemporary dining table crafted from sustainable American walnut with matte protective finish. Elegant bevelled edges and solid joinery.',
    price: 920,
    category: 'Dining Room',
    isPublished: true,
    isFeatured: false,
    coverImageUrl: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=1000&auto=format&fit=crop&q=80',
    images: [
      {
        id: 'img-f2-1',
        url: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=1000&auto=format&fit=crop&q=80',
        name: 'walnut_dining_table.jpg',
        isCover: true,
        uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'prod-f3',
    name: 'Bouclé Cloud Modular Sofa',
    description: 'Deep-seat modular 3-piece sectional sofa covered in ivory bouclé fabric. High-density foam core with feather blend topper for ultimate comfort.',
    price: 1650,
    category: 'Living Room',
    isPublished: true,
    isFeatured: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1000&auto=format&fit=crop&q=80',
    images: [
      {
        id: 'img-f3-1',
        url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1000&auto=format&fit=crop&q=80',
        name: 'boucle_sofa.jpg',
        isCover: true,
        uploadedAt: new Date(Date.now() - 86400000).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'prod-f4',
    name: 'Architect Ergonomic Desk',
    description: 'Sleek workspace desk made of solid ash wood with integrated wire management channel, subtle brass accents, and dual soft-close drawers.',
    price: 680,
    category: 'Office',
    isPublished: true,
    isFeatured: false,
    coverImageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1000&auto=format&fit=crop&q=80',
    images: [
      {
        id: 'img-f4-1',
        url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1000&auto=format&fit=crop&q=80',
        name: 'architect_desk.jpg',
        isCover: true,
        uploadedAt: new Date(Date.now() - 86400000).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  }
];

export const FURNITURE_CATEGORIES = [
  'All',
  'Living Room',
  'Dining Room',
  'Bedroom',
  'Office',
  'Lighting'
];
