'use client';

import React from 'react';
import HeroAnimation from '@/components/HeroAnimation';
import MerchComingSoon from '@/components/MerchComingSoon';
import DeliveryPartners from '@/components/DeliveryPartners';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';

export default function HomePage() {
  const { toggleCart, items } = useCartStore();
  
  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <main className="w-full min-h-screen bg-brand-dark text-brand-light font-sans selection:bg-brand-red selection:text-white">
      {/* Navigation Overlay */}
      <nav className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-50 mix-blend-difference pointer-events-none">
        <div className="font-black text-2xl tracking-tighter uppercase text-white">Restless</div>
        <div className="space-x-8 text-sm font-bold uppercase tracking-widest text-white pointer-events-auto flex items-center">
          <Link href="/shop" className="hover:text-brand-red transition-colors">Shop</Link>
          <a href="#merch" className="hover:text-brand-red transition-colors">Merch</a>
          {/* Cart Icon */}
          <button onClick={toggleCart} className="flex items-center space-x-2">
            <span className="uppercase">CART</span>
            {cartItemCount > 0 && (
              <span className="bg-brand-red text-white text-xs px-2 py-0.5 rounded-full">{cartItemCount}</span>
            )}
          </button>
        </div>
      </nav>

      {/* Hero Section with Scroll Canvas Animation */}
      <HeroAnimation />


      {/* Intro / Philosophy Section */}
      <section className="w-full py-32 px-6 flex flex-col items-center justify-center text-center bg-gradient-to-b from-brand-dark to-black border-t border-white/5">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-orange-500">
            Fuel for the Underdog
          </h2>
          <p className="text-xl md:text-2xl text-white/70 font-medium max-w-2xl mx-auto leading-relaxed">
            When the world sleeps, the restless grind. We don't just provide energy; we provide the spark that ignites the storm inside you.
          </p>
          <div className="pt-8">
            <Link 
              href="/shop" 
              className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white uppercase tracking-widest bg-brand-red overflow-hidden transform -skew-x-12 hover:scale-105 transition-transform duration-300"
            >
              <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
              <span className="relative transform skew-x-12">Shop The Collection</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Merch Coming Soon Section */}
      <MerchComingSoon />

      {/* Delivery Partners Section */}
      <DeliveryPartners />

      {/* Footer */}
      <footer className="w-full py-12 border-t border-white/10 bg-black text-center">
        <p className="text-white/40 text-sm font-bold tracking-widest uppercase">
          &copy; {new Date().getFullYear()} Restless Action Drink. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
