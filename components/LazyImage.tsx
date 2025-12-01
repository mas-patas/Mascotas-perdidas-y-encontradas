
import React, { useState, useEffect } from 'react';
import { PetIcon } from './icons';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    className?: string;
    aspectRatio?: string; // e.g., 'aspect-square', 'aspect-video'
}

export const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className = '', aspectRatio, ...props }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(src);

    useEffect(() => {
        setHasError(false);
        setIsLoaded(false);
        setCurrentSrc(src);
    }, [src]);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const handleError = () => {
        setHasError(true);
        setIsLoaded(true); // Stop loading animation
    };

    return (
        <div className={`relative overflow-hidden bg-gray-100 ${className} ${aspectRatio || ''}`}>
            {/* Placeholder / Skeleton */}
            {!isLoaded && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse z-10">
                    <PetIcon className="w-8 h-8 text-gray-300 opacity-50" />
                </div>
            )}

            {/* Error State */}
            {hasError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400 z-10">
                    <PetIcon className="w-10 h-10 mb-1" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Sin Imagen</span>
                </div>
            )}

            {/* Actual Image */}
            <img
                src={currentSrc}
                alt={alt}
                onLoad={handleLoad}
                onError={handleError}
                className={`
                    w-full h-full object-cover transition-all duration-700 ease-out
                    ${isLoaded && !hasError ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
                `}
                loading="lazy"
                {...props}
            />
        </div>
    );
};
