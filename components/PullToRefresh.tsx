
import React, { useState, useEffect, useRef } from 'react';
import { ArrowDownIcon } from './icons';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
    const [startY, setStartY] = useState(0);
    const [currentY, setCurrentY] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [pulling, setPulling] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    
    // Threshold to trigger refresh (pixels)
    const PULL_THRESHOLD = 80; 
    // Max visual pull distance
    const MAX_PULL = 120;

    const handleTouchStart = (e: React.TouchEvent) => {
        // Only enable if we are at the top of the scroll container
        if (window.scrollY <= 10 && !refreshing) {
            setStartY(e.touches[0].clientY);
            setPulling(true);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!pulling || refreshing) return;
        
        const y = e.touches[0].clientY;
        const diff = y - startY;

        // Only allow pulling down if content is at top
        if (diff > 0 && window.scrollY <= 0) {
            // Add resistance to the pull
            const newY = Math.min(diff * 0.5, MAX_PULL);
            setCurrentY(newY);
            
            // Prevent native browser reload behavior if we are handling it
            if (e.cancelable && diff < 200) {
               // e.preventDefault(); // Optional: careful with blocking scroll
            }
        }
    };

    const handleTouchEnd = async () => {
        if (!pulling || refreshing) return;
        
        setPulling(false);
        
        if (currentY > PULL_THRESHOLD) {
            setRefreshing(true);
            setCurrentY(60); // Snap to loading position
            
            try {
                await onRefresh();
            } finally {
                // Wait a bit to show success state or smooth close
                setTimeout(() => {
                    setRefreshing(false);
                    setCurrentY(0);
                }, 500);
            }
        } else {
            setCurrentY(0);
        }
    };

    return (
        <div 
            ref={contentRef}
            className="min-h-screen relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Loading Indicator */}
            <div 
                className="absolute left-0 right-0 flex justify-center pointer-events-none z-20 transition-all duration-200"
                style={{ 
                    top: `${currentY - 50}px`,
                    opacity: currentY > 0 ? 1 : 0 
                }}
            >
                <div className={`bg-white rounded-full p-2 shadow-md border border-gray-200 flex items-center justify-center transition-transform ${refreshing ? 'scale-110' : ''}`}>
                    {refreshing ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>
                    ) : (
                        <ArrowDownIcon 
                            className={`h-6 w-6 text-brand-primary transition-transform duration-200 ${currentY > PULL_THRESHOLD ? 'rotate-180' : ''}`} 
                        />
                    )}
                </div>
            </div>

            {/* Content with transform */}
            <div 
                style={{ 
                    transform: `translateY(${currentY}px)`,
                    transition: pulling ? 'none' : 'transform 0.3s cubic-bezier(0,0,0.2,1)'
                }}
            >
                {children}
            </div>
        </div>
    );
};
