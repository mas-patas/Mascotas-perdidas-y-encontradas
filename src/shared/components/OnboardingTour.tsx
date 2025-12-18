
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRightIcon, ChevronLeftIcon, XCircleIcon } from './icons';

export interface TourStep {
    target: string; // CSS Selector (e.g., '#report-btn')
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
    steps: TourStep[];
    tourId: string; // Unique ID to save in localStorage (e.g., 'home_v1')
    onComplete?: () => void;
    onOpenSidebar?: () => void;
    onCloseSidebar?: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ steps, tourId, onComplete, onOpenSidebar, onCloseSidebar }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ top: number, left: number }>({ top: 0, left: 0 });
    const [arrowPos, setArrowPos] = useState<string>('top'); // Where the arrow/caret should point relative to tooltip

    // Check localStorage on mount and verify elements are rendered
    useEffect(() => {
        const hasCompleted = localStorage.getItem(`tour_completed_${tourId}`);
        if (!hasCompleted) {
            // Intelligent timing: wait for elements to be rendered
            const checkElementsReady = () => {
                // Check if at least the first step's target element exists
                if (steps.length > 0) {
                    const firstElement = document.querySelector(steps[0].target);
                    if (firstElement) {
                        setIsVisible(true);
                    } else {
                        // Retry after a short delay if element not found
                        setTimeout(checkElementsReady, 200);
                    }
                } else {
                    setIsVisible(true);
                }
            };
            
            // Start checking after initial render
            const timer = setTimeout(checkElementsReady, 300);
            return () => clearTimeout(timer);
        }
    }, [tourId, steps]);

    const currentStep = steps[currentStepIndex];

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            finishTour();
        }
    };

    const handlePrev = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    const finishTour = () => {
        localStorage.setItem(`tour_completed_${tourId}`, 'true');
        setIsVisible(false);
        // Ensure sidebar is closed when tour finishes if it was opened
        if (onCloseSidebar) onCloseSidebar();
        if (onComplete) onComplete();
    };

    const handleSkip = () => {
        finishTour();
    };

    // Calculate position of the target element with Collision Detection
    const updatePosition = useCallback(() => {
        if (!isVisible || !currentStep) return;

        const element = document.querySelector(currentStep.target);
        if (element) {
            // Scroll element into view smoothly but less aggressively (since tour is non-blocking)
            const rect = element.getBoundingClientRect();
            
            // Only scroll if element is not visible in viewport
            const isElementVisible = rect.top >= 0 && rect.left >= 0 && 
                                    rect.bottom <= window.innerHeight && 
                                    rect.right <= window.innerWidth;
            
            if (!isElementVisible) {
                element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
            
            // Recalculate rect after potential scroll
            const updatedRect = element.getBoundingClientRect();
            setTargetRect(updatedRect);
            
            const spacing = 15; // Distance from target
            const tooltipWidth = 320; // Fixed width defined in CSS
            const tooltipHeightEstimate = 200; // Rough estimate for collision, actual is dynamic
            
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            let pos = currentStep.position || 'bottom';

            // --- FLIP LOGIC ---
            // Check if preferred position causes overflow, if so, flip it.
            
            if (pos === 'right' && (updatedRect.right + tooltipWidth + spacing > vw)) {
                pos = 'left'; // Flip to left
                // If left also overflows (on mobile), fallback to bottom
                if (updatedRect.left - tooltipWidth - spacing < 0) pos = 'bottom';
            }
            else if (pos === 'left' && (updatedRect.left - tooltipWidth - spacing < 0)) {
                pos = 'right';
                // If right also overflows, fallback to bottom
                if (updatedRect.right + tooltipWidth + spacing > vw) pos = 'bottom';
            }
            else if (pos === 'top' && (updatedRect.top - tooltipHeightEstimate - spacing < 0)) {
                pos = 'bottom';
            }
            else if (pos === 'bottom' && (updatedRect.bottom + tooltipHeightEstimate + spacing > vh)) {
                pos = 'top';
            }

            // --- CALCULATE COORDS BASED ON FINAL POS ---
            let t = 0, l = 0;
            
            if (pos === 'top') {
                t = updatedRect.top - spacing; 
                l = updatedRect.left + (updatedRect.width / 2) - (tooltipWidth / 2);
            } else if (pos === 'bottom') {
                t = updatedRect.bottom + spacing;
                l = updatedRect.left + (updatedRect.width / 2) - (tooltipWidth / 2);
            } else if (pos === 'left') {
                t = updatedRect.top + (updatedRect.height / 2); // Centered vertically, CSS will translateY(-50%)
                l = updatedRect.left - tooltipWidth - spacing;
            } else if (pos === 'right') {
                t = updatedRect.top + (updatedRect.height / 2);
                l = updatedRect.right + spacing;
            }

            // --- CLAMPING (Keep within Viewport) ---
            const padding = 10;
            
            // Clamp Horizontal
            if (l < padding) l = padding;
            if (l + tooltipWidth > vw - padding) l = vw - tooltipWidth - padding;

            // Clamp Vertical (Harder without exact height, but we can clamp top)
            if (t < padding) t = padding;
            
            setTooltipPos({ top: t, left: l });
            setArrowPos(pos);
        }
    }, [isVisible, currentStep]);

    // Handle Sidebar and Positioning logic when step changes
    useEffect(() => {
        if (!isVisible || !currentStep) return;

        // Identifiers for elements that live inside the sidebar
        const sidebarTargets = [
            '[data-tour="nav-map"]', 
            '[data-tour="nav-campaigns"]', 
            '[data-tour="nav-reunited"]', 
            '[data-tour="sidebar-filters"]',
            '[data-tour="sidebar-menu"]',
            '[data-tour="sidebar-navigation"]'
        ];
        
        const isSidebarStep = sidebarTargets.includes(currentStep.target);
        let timer: ReturnType<typeof setTimeout>;

        // Logic: Open sidebar if needed, close if not (to clear mobile backdrop), then calculate position
        if (isSidebarStep && onOpenSidebar) {
            onOpenSidebar();
            // Wait for CSS transition (approx 300ms) before calculating position
            timer = setTimeout(updatePosition, 350);
        } else if (!isSidebarStep && onCloseSidebar) {
            onCloseSidebar();
            timer = setTimeout(updatePosition, 350);
        } else {
            // Immediate update if no UI state change is triggered
            updatePosition();
        }

        // Recalculate on resize and scroll
        const handleResizeOrScroll = () => updatePosition();
        window.addEventListener('resize', handleResizeOrScroll);
        window.addEventListener('scroll', handleResizeOrScroll, true); 

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResizeOrScroll);
            window.removeEventListener('scroll', handleResizeOrScroll, true);
        };
    }, [currentStepIndex, isVisible, currentStep, onOpenSidebar, onCloseSidebar, updatePosition]);

    if (!isVisible || !currentStep || !targetRect) return null;

    // Helper to determine arrow styles based on 'pos'
    const getArrowStyle = () => {
        switch (arrowPos) {
            case 'bottom': return 'top-[-8px] left-1/2 -translate-x-1/2 border-b-white border-l-transparent border-r-transparent border-t-transparent border-[8px]';
            case 'top': return 'bottom-[-8px] left-1/2 -translate-x-1/2 border-t-white border-l-transparent border-r-transparent border-b-transparent border-[8px]'; 
            case 'right': return 'left-[-8px] top-1/2 -translate-y-1/2 border-r-white border-t-transparent border-b-transparent border-l-transparent border-[8px]';
            case 'left': return 'right-[-8px] top-1/2 -translate-y-1/2 border-l-white border-t-transparent border-b-transparent border-r-transparent border-[8px]';
            default: return '';
        }
    };

    // Calculate Transform based on position to center or offset correctly
    const getTransform = () => {
        if (arrowPos === 'left' || arrowPos === 'right') return 'translateY(-50%)'; 
        if (arrowPos === 'top') return 'translateY(-100%)'; 
        return ''; 
    };

    return createPortal(
        <>
            {/* Subtle highlight on target element (non-blocking) */}
            <div 
                className="fixed border-2 border-brand-primary rounded-lg shadow-lg pointer-events-none transition-all duration-300 ease-in-out z-50"
                style={{
                    top: targetRect.top - 2,
                    left: targetRect.left - 2,
                    width: targetRect.width + 4,
                    height: targetRect.height + 4,
                }}
            />

            {/* The Tooltip Card - Non-blocking, positioned absolutely */}
            <div 
                className="fixed bg-white rounded-xl shadow-2xl p-0 transition-all duration-300 ease-in-out flex flex-col border border-brand-light w-[300px] sm:w-[320px] z-50 animate-fade-in font-sans"
                style={{
                    top: tooltipPos.top,
                    left: tooltipPos.left,
                    transform: getTransform()
                }}
            >
                {/* CSS Arrow */}
                <div className={`absolute w-0 h-0 pointer-events-none ${getArrowStyle()}`}></div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 h-1.5 rounded-t-xl overflow-hidden">
                    <div 
                        className="bg-brand-primary h-full transition-all duration-300"
                        style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                    />
                </div>

                <div className="p-5 relative">
                    <button 
                        onClick={handleSkip} 
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Omitir tour"
                    >
                        <XCircleIcon className="h-5 w-5" />
                    </button>

                    <div className="mb-4 mt-2">
                        <h3 className="font-bold text-lg text-brand-dark leading-tight mb-2">{currentStep.title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {currentStep.content}
                        </p>
                    </div>

                    <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
                        <span className="text-[10px] text-gray-400 font-bold tracking-wide uppercase">
                            {currentStepIndex + 1} / {steps.length}
                        </span>
                        
                        <div className="flex gap-2">
                            {currentStepIndex > 0 && (
                                <button 
                                    onClick={handlePrev}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                                >
                                    Atrás
                                </button>
                            )}
                            <button 
                                onClick={handleNext}
                                className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold bg-brand-primary text-white hover:bg-brand-dark shadow-md transition-all transform hover:translate-x-1"
                            >
                                {currentStepIndex === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
                                {currentStepIndex < steps.length - 1 && <ChevronRightIcon className="h-3 w-3" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
};
