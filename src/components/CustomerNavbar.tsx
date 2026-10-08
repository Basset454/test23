import React from 'react';
import { Armchair, ShoppingBag } from 'lucide-react';

interface CustomerNavbarProps {
  onCategorySelect?: (cat: string) => void;
  selectedCategory?: string;
}

export const CustomerNavbar: React.FC<CustomerNavbarProps> = () => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center shadow-md">
              <Armchair className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-stone-900 block leading-tight font-serif">
                TRUST FURNITURE
              </span>
              <span className="text-[10px] uppercase tracking-widest text-stone-500 font-medium">
                Modern Living Collection
              </span>
            </div>
          </div>

          {/* Simple Navigation Links (Customer only - NO ADMIN LINK) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
            <a href="#collection" className="hover:text-stone-900 transition-colors">
              Collection
            </a>
            <a href="#about" className="hover:text-stone-900 transition-colors">
              Craftsmanship
            </a>
            <a href="#contact" className="hover:text-stone-900 transition-colors">
              Showroom
            </a>
          </nav>

          {/* Customer action button */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-500 font-medium bg-stone-100 px-3 py-1.5 rounded-full border border-stone-200">
              Free Nationwide Delivery
            </span>
          </div>

        </div>
      </div>
    </header>
  );
};
