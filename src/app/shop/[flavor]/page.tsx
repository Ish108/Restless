'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';

const flavorsData: Record<string, {
  name: string;
  color: string;
  gradient: string;
  textColor: string;
  description: string;
  price: number;
  image: string;
}> = {
  'blood-rush': {
    name: 'Blood Rush',
    color: 'bg-brand-red',
    gradient: 'from-brand-red/20 to-black',
    textColor: 'text-brand-red',
    description: 'The original adrenaline shot. Pure, aggressive, unfiltered energy.',
    price: 399,
    image: '/images/products/blood-rush.png'
  },
  'mojito': {
    name: 'Mojito',
    color: 'bg-green-500',
    gradient: 'from-green-500/20 to-black',
    textColor: 'text-green-500',
    description: 'A toxic sour-apple bite that jolts your senses instantly.',
    price: 399,
    image: '/images/products/venom-strike.png'
  }
};

export default function FlavorPage({ params }: { params: Promise<{ flavor: string }> }) {
  const { flavor: flavorSlug } = use(params);
  const flavor = flavorsData[flavorSlug];
  const addItem = useCartStore(state => state.addItem);

  if (!flavor) {
    notFound();
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${flavor.gradient} text-white pt-32 px-6`}>
      {/* Back Nav */}
      <div className="max-w-6xl mx-auto mb-8">
        <Link href="/shop" className="text-white/40 hover:text-white uppercase tracking-widest text-sm font-bold transition-colors">
          &larr; Back to Shop
        </Link>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
        
        {/* Product Image */}
        <div className="w-full md:w-1/2 aspect-square flex items-center justify-center relative overflow-hidden group">
          <div className={`absolute inset-0 opacity-20 blur-3xl rounded-full scale-150 group-hover:scale-110 transition-transform duration-700 ${flavor.color}`} />
          <div className="relative z-10 text-center w-full h-full p-8 transition-transform duration-500 hover:scale-105">
            <img 
              src={flavor.image} 
              alt={flavor.name} 
              className="w-full h-full object-contain filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" 
            />
          </div>
        </div>

        {/* Product Details */}
        <div className="w-full md:w-1/2 space-y-8">
          <h1 className={`text-5xl md:text-7xl font-black uppercase tracking-tighter ${flavor.textColor} drop-shadow-lg`}>
            {flavor.name}
          </h1>
          
          <p className="text-xl text-white/70 font-medium leading-relaxed">
            {flavor.description}
          </p>

          <div className="text-3xl font-black">
            ₹{flavor.price}
          </div>

          <button 
            onClick={() => addItem({
              id: flavorSlug,
              name: flavor.name,
              price: flavor.price,
              quantity: 1,
              color: flavor.color
            })}
            className={`w-full py-5 font-black uppercase tracking-widest text-lg text-white ${flavor.color} hover:opacity-80 transition-opacity cursor-pointer`}
          >
            Add to Cart
          </button>

          <div className="border-t border-white/10 pt-8 mt-8 grid grid-cols-2 gap-4">
            <div>
              <h3 className="uppercase font-bold text-white/40 text-xs mb-2">Ingredients</h3>
              <p className="text-sm">Carbonated Water, Caffeine (150mg), Taurine, B-Vitamins, Sucralose.</p>
            </div>
            <div>
              <h3 className="uppercase font-bold text-white/40 text-xs mb-2">Volume</h3>
              <p className="text-sm">250ml per can.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
