'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function HeroAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const frameCount = 240;
    const currentFrame = (index: number) =>
      `/images/hero/ezgif-frame-${(index + 1).toString().padStart(3, '0')}.jpg`;

    const images: HTMLImageElement[] = [];
    const animationState = { frame: 0 };

    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = currentFrame(i);
      images.push(img);
    }

    images[0].onload = render;

    function render() {
      if (!canvas || !context) return;
      
      // Use logical dimensions (CSS size) because the context is scaled by devicePixelRatio
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      
      context.clearRect(0, 0, width, height);
      
      const img = images[animationState.frame];
      if (!img || !img.width) return;
      
      // Calculate scale to "contain" the image inside the viewport without stretching it and ruining quality
      const scale = Math.min(width / img.width, height / img.height);
      const x = (width / 2) - (img.width / 2) * scale;
      const y = (height / 2) - (img.height / 2) * scale;
      
      // Enforce highest quality smoothing
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      
      context.drawImage(img, x, y, img.width * scale, img.height * scale);
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: '+=150%', // Significantly reduced from 400% so the animation finishes in fewer scrolls
        scrub: 0.5, // Faster scrub for a more responsive and smoother feel
        pin: true,
      }
    });

    tl.to(animationState, {
      frame: frameCount - 1,
      snap: 'frame',
      ease: 'none',
      onUpdate: render
    });

    const handleResize = () => {
      const ratio = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Set the ACTUAL internal resolution of the canvas
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      
      // Set the CSS display size
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      // Scale the context to ensure drawing operations match the new resolution
      context.scale(ratio, ratio);
      
      render();
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-brand-dark overflow-hidden">
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full object-cover z-0" />
      
      {/* Overlay Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 pointer-events-none bg-black/30">
        <h1 className="text-[10vw] font-black text-white uppercase tracking-tighter mix-blend-overlay leading-none drop-shadow-2xl">
          Restless
        </h1>
        <div className="mt-8 px-6 py-3 bg-brand-red/90 backdrop-blur-sm transform -skew-x-12">
          <p className="text-xl md:text-3xl text-white font-bold tracking-widest uppercase transform skew-x-12">
            Energy Fades. Actions Leave a Mark.
          </p>
        </div>
      </div>
      

    </div>
  );
}
