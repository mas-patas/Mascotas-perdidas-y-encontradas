import React, { useState, useEffect, useRef } from 'react';
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
    const [isVisible, setIsVisible] = useState(false);
    const placeholderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Reset state when src changes
        setIsLoaded(false);
        setHasError(false);
        // Do not reset isVisible here, let the observer handle it
    }, [src]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    // When the component is visible in the viewport, set isVisible to true
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        // We can unobserve after it becomes visible, no need to keep watching
                        if (placeholderRef.current) {
                            observer.unobserve(placeholderRef.current);
                        }
                    }
                });
            },
            {
                // Start loading the image when it's 200px away from the viewport
                rootMargin: '200px',
            }
        );

        if (placeholderRef.current) {
            observer.observe(placeholderRef.current);
        }

        return () => {
            // Clean up the observer when the component unmounts
            if (placeholderRef.current) {
                observer.unobserve(placeholderRef.current);
            }
        };
    }, []); // Empty dependency array ensures this runs only once on mount

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const handleError = () => {
        // Only set error if a src was provided
        if (src) {
            setHasError(true);
        }
        setIsLoaded(true); // Stop loading animation even on error
    };

    // Determine the source for the img tag. Only use the real src if the component is visible.
    const imageSrc = isVisible ? src : '';

    return (
        <div ref={placeholderRef} className={`relative overflow-hidden bg-gray-100 ${className} ${aspectRatio || ''}`}>
            {/* Placeholder / Skeleton: Show if not loaded OR if it's not visible yet and there's no error */}
            {(!isLoaded || !isVisible) && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse z-0">
                    <PetIcon className="w-8 h-8 text-gray-300 opacity-50" />
                </div>
            )}

            {/* Error State: Show only if an error occurred and a src was provided */}
            {hasError && src && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400 z-10">
                    <PetIcon className="w-10 h-10 mb-1" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Sin Imagen</span>
                </div>
            )}

            {/* Actual Image: Mount the img tag only when it should be visible */}
            {isVisible && (
                <img
                    src={imageSrc}
                    alt={alt}
                    onLoad={handleLoad}
                    onError={handleError}
                    className={`
                        w-full h-full object-cover transition-all duration-500 ease-out
                        ${isLoaded && !hasError ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
                    `}
                    // loading="lazy" is kept as a fallback for browsers that might not support IntersectionObserver well
                    // but our logic primarily drives the loading.
                    loading="lazy" 
                    {...props}
                />
            )}
        </div>
    );
};