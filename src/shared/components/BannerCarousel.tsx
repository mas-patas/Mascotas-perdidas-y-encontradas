import React, { useState, useEffect, useCallback } from 'react';
import type { Banner } from '@/api/banners/banners.types';

interface BannerCarouselProps {
  banners: Banner[];
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Reset currentIndex if it exceeds array bounds when banners array changes
  useEffect(() => {
    if (banners.length > 0 && currentIndex >= banners.length) {
      setCurrentIndex(0);
    }
  }, [banners.length, currentIndex]);

  // Auto-advance every 3 seconds
  useEffect(() => {
    if (banners.length === 0 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [banners.length, isPaused]);

  const goToSlide = useCallback((index: number) => {
    // Ensure index is within bounds
    const safeIndex = Math.max(0, Math.min(index, banners.length - 1));
    setCurrentIndex(safeIndex);
    setIsPaused(true);
    // Resume after 5 seconds of manual navigation
    setTimeout(() => setIsPaused(false), 5000);
  }, [banners.length]);

  if (banners.length === 0) {
    return null;
  }

  // Ensure currentIndex is always within bounds
  const safeIndex = Math.max(0, Math.min(currentIndex, banners.length - 1));
  const currentBanner = banners[safeIndex];

  // If for some reason currentBanner is still undefined, return null
  if (!currentBanner) {
    return null;
  }

  return (
    <div 
      className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-md h-[120px] sm:h-[150px] md:h-[180px] lg:h-[220px] flex items-center bg-gray-900 group animate-fade-in"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Image */}
      <img 
        src={currentBanner.imageUrl} 
        alt={currentBanner.title || 'Banner'} 
        className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
        loading="lazy"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-sky-500/80 to-blue-600/40"></div>

      {/* Dots Navigation */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2 sm:gap-2.5">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? 'bg-white w-8 sm:w-10 h-2 sm:h-2.5'
                  : 'bg-white/50 hover:bg-white/75 w-2 sm:w-2.5 h-2 sm:h-2.5'
              }`}
              aria-label={`Ir a slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};



