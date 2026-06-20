import React from 'react';

export default function DeliveryPartners() {
  const partners = [
    { name: 'Blinkit', color: '#f8cb46', textColor: '#000000', label: 'blinkit' },
    { name: 'Swiggy Instamart', color: '#fc8019', textColor: '#ffffff', label: 'Swiggy Instamart' },
    { name: 'Zepto', color: '#ff1e56', textColor: '#ffffff', label: 'zepto' },
    { name: 'BigBasket', color: '#84c225', textColor: '#ffffff', label: 'bigbasket' }
  ];

  return (
    <section className="w-full py-20 bg-black flex flex-col items-center justify-center border-t border-b border-white/10 overflow-hidden">
      <div className="container mx-auto px-6">
        
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-center mb-16 text-white">
          COMING <span className="text-brand-red">SOON</span>
        </h2>
        
        <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
          
          {/* Blinkit */}
          <div className="flex items-center text-4xl font-bold tracking-tighter text-[#149541]">
            blink<span className="text-[#f8cb46]">it</span>
          </div>

          {/* Swiggy Instamart */}
          <div className="flex flex-col items-center justify-center text-[#fc8019] font-bold text-xl leading-tight">
            <span>Swiggy</span>
            <span>Instamart</span>
          </div>

          {/* Zepto */}
          <div className="text-5xl font-black tracking-tighter text-[#3e135c]">
            zepto
          </div>

          {/* BigBasket */}
          <div className="flex items-center space-x-2 text-[#84c225] font-bold text-3xl tracking-tight">
            <span className="bg-[#84c225] text-white p-1 rounded-md text-xs font-black">bb</span>
            <span>bigbasket</span>
          </div>

        </div>

      </div>
    </section>
  );
}
