'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function MerchComingSoon() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    // Parallax and fade for the main text
    if (textRef.current) {
      gsap.fromTo(textRef.current, 
        { y: 100, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 1.5, 
          ease: "power4.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          }
        }
      );
    }

    // Infinite Marquee Animation
    if (marqueeRef.current) {
      gsap.to(marqueeRef.current, {
        xPercent: -50,
        ease: "none",
        duration: 20,
        repeat: -1,
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <section 
      id="merch" 
      ref={sectionRef}
      aria-label="Restless Merchandise Coming Soon"
      className="w-full relative py-40 overflow-hidden bg-brand-dark flex flex-col items-center justify-center min-h-screen border-t border-white/10"
    >
      {/* Infinite Marquee Background */}
      <div className="absolute top-20 left-0 w-[200%] whitespace-nowrap opacity-5 select-none pointer-events-none flex" aria-hidden="true">
        <div ref={marqueeRef} className="text-[15vw] font-black uppercase tracking-tighter text-white flex">
          <span>MERCHANDISE OUT SOON! // </span>
          <span>MERCHANDISE OUT SOON! // </span>
          <span>MERCHANDISE OUT SOON! // </span>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Column: Bold Typography & Manifesto */}
        <div className="flex flex-col items-start space-y-8">
          <div className="inline-flex items-center space-x-3 border border-brand-red px-5 py-2 rounded-full backdrop-blur-md bg-brand-red/10">
            <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse" />
            <span className="text-brand-red font-bold uppercase tracking-widest text-xs">Drop 01 Status: Locked</span>
          </div>
          
          <h2 ref={textRef} className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white leading-[0.85] drop-shadow-2xl">
            Trends Fade.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-orange-600">
              Wear Action.
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-white/70 max-w-xl font-medium leading-relaxed">
            The official Restless Merchandise line is dropping soon. Premium streetwear engineered for those who never stop moving.
          </p>
        </div>

        {/* Right Column: Early Access Form */}
        <div className="w-full relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-red to-brand-purple rounded-2xl blur opacity-30"></div>
          <div className="relative bg-zinc-950 border border-white/10 p-10 md:p-14 rounded-2xl shadow-2xl backdrop-blur-xl">
            <h3 className="text-3xl font-black uppercase tracking-widest text-white mb-2">Claim Early Access</h3>
            <p className="text-white/50 text-sm uppercase tracking-wider mb-10 font-bold">Join the waitlist to secure your drop before the public.</p>
            
            <form className="flex flex-col space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Added to waitlist!'); }}>
              <div className="relative group">
                <label htmlFor="email" className="sr-only">Email Address</label>
                <input 
                  id="email"
                  name="email"
                  type="email" 
                  placeholder="ENTER YOUR EMAIL" 
                  className="w-full bg-black/50 border-b-2 border-white/20 px-4 py-6 text-white placeholder-white/30 focus:outline-none focus:border-brand-red transition-all duration-300 uppercase tracking-widest text-sm font-bold"
                  required
                />
                <div className="absolute bottom-0 left-0 h-[2px] bg-brand-red w-0 group-focus-within:w-full transition-all duration-500" />
              </div>

              <button 
                type="submit" 
                className="group relative w-full inline-flex items-center justify-center px-8 py-6 font-black text-white uppercase tracking-widest bg-brand-red overflow-hidden mt-4"
              >
                <span className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-20 bg-black transition-opacity duration-300"></span>
                <span className="relative flex items-center space-x-3">
                  <span>Notify Me</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </span>
              </button>
            </form>
          </div>
        </div>

      </div>
    </section>
  );
}
