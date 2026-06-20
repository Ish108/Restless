import React from 'react';
import Link from 'next/link';

const flavors = [
  {
    id: 'blood-rush',
    name: 'Blood Rush',
    color: 'bg-brand-red',
    textColor: 'text-brand-red',
    description: 'The original adrenaline shot. Pure, aggressive, unfiltered energy.',
    image: '/images/products/blood-rush.png'
  },
  {
    id: 'storm-surge',
    name: 'Storm Surge',
    color: 'bg-brand-blue',
    textColor: 'text-brand-blue',
    description: 'A dark, electrifying blue raspberry blend to power the grind.',
    image: '/images/products/storm-surge.png'
  },
  {
    id: 'venom-strike',
    name: 'Venom Strike',
    color: 'bg-green-500',
    textColor: 'text-green-500',
    description: 'A toxic sour-apple bite that jolts your senses instantly.',
    image: '/images/products/venom-strike.png'
  }
];

export default function ShopIndexPage() {
  return (
    <div className="min-h-screen bg-brand-dark text-brand-light pt-32 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-16 text-center">
          Choose Your <span className="text-brand-red">Action</span>
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {flavors.map(flavor => (
            <Link 
              key={flavor.id} 
              href={`/shop/${flavor.id}`}
              className="group relative h-[500px] flex flex-col justify-end p-8 border border-white/10 hover:border-white/30 transition-colors overflow-hidden bg-black"
            >
              {/* Image Placeholder */}
              <div className="absolute inset-0 w-full h-full p-8 pb-32 transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-4">
                <img 
                  src={flavor.image} 
                  alt={flavor.name} 
                  className="w-full h-full object-contain filter drop-shadow-2xl"
                />
              </div>

              {/* Background gradient on hover for text readability */}
              <div className={`absolute inset-0 opacity-80 bg-gradient-to-t from-black via-black/80 to-transparent transition-opacity duration-500`} />
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500 bg-gradient-to-t from-transparent to-current ${flavor.textColor}`} />
              
              <div className="relative z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <h2 className={`text-3xl font-black uppercase tracking-tighter mb-2 ${flavor.textColor} drop-shadow-lg`}>
                  {flavor.name}
                </h2>
                <p className="text-white/80 font-medium mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                  {flavor.description}
                </p>
                <span className="inline-block px-4 py-2 border border-current text-xs font-bold uppercase tracking-widest text-white hover:bg-white hover:text-black transition-colors backdrop-blur-sm">
                  Shop Now
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
