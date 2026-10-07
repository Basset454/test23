import { Product } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
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
      },
      {
        id: 'img-1-3',
        url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80',
        name: 'titanium_watch_wrist.jpg',
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
      },
      {
        id: 'img-2-2',
        url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80',
        name: 'headphones_lifestyle.jpg',
        isCover: false,
        provider: 'external_url',
        uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'prod-3',
    title: 'نظارات شمسية كلاسيكية مستقطبة',
    description: 'نظارات شمسية أنيقة بإطار خفيف وقوي من الأسيتات، عدسات مستقطبة تحمي بنسبة 100% من الأشعة فوق البنفسجية UV400.',
    price: 249,
    originalPrice: 320,
    category: 'إكسسوارات',
    stock: 30,
    isFeatured: false,
    images: [
      {
        id: 'img-3-1',
        url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80',
        name: 'sunglasses_front.jpg',
        isCover: true,
        provider: 'external_url',
        uploadedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        id: 'img-3-2',
        url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80',
        name: 'sunglasses_angle.jpg',
        isCover: false,
        provider: 'external_url',
        uploadedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'prod-4',
    title: 'حقيبة ظهر جلدية للمصممين ورجال الأعمال',
    description: 'حقيبة ظهر مصنوعة يدوياً من الجلد الطبيعي عالي الجودة، تحتوي على قسم مخصص للحاسوب المحمول حتى 16 بوصة وجيوب منظمة متعددة.',
    price: 420,
    originalPrice: 550,
    category: 'حقائب',
    stock: 8,
    isFeatured: true,
    images: [
      {
        id: 'img-4-1',
        url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
        name: 'leather_bag_1.jpg',
        isCover: true,
        provider: 'external_url',
        uploadedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'img-4-2',
        url: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&auto=format&fit=crop&q=80',
        name: 'leather_bag_2.jpg',
        isCover: false,
        provider: 'external_url',
        uploadedAt: new Date(Date.now() - 86400000).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  }
];

export const CATEGORIES = [
  'الكل',
  'إلكترونيات',
  'إكسسوارات',
  'حقائب',
  'أزياء',
  'عطور',
  'المنزل'
];
