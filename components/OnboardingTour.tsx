
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
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ steps, tourId, onComplete }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ top: number, left: number }>({ top: 0, left: 0 });
    const [arrowPos, setArrowPos] = useState<string>('top'); // Where the arrow/caret should point relative to tooltip

    // Check localStorage on mount
    useEffect(() => {
        const hasCompleted = localStorage.getItem(`tour_completed_${tourId}`);
        if (!hasCompleted) {
            // Small delay to ensure UI is fully rendered before calculating positions
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [tourId]);

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
            // Scroll element into view smoothly
            element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            
            const rect = element.getBoundingClientRect();
            setTargetRect(rect);
            
            const spacing = 15; // Distance from target
            const tooltipWidth = 320; // Fixed width defined in CSS
            const tooltipHeightEstimate = 200; // Rough estimate for collision, actual is dynamic
            
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            let pos = currentStep.position || 'bottom';

            // --- FLIP LOGIC ---
            // Check if preferred position causes overflow, if so, flip it.
            
            if (pos === 'right' && (rect.right + tooltipWidth + spacing > vw)) {
                pos = 'left'; // Flip to left
                // If left also overflows (on mobile), fallback to bottom
                if (rect.left - tooltipWidth - spacing < 0) pos = 'bottom';
            }
            else if (pos === 'left' && (rect.left - tooltipWidth - spacing < 0)) {
                pos = 'right';
                // If right also overflows, fallback to bottom
                if (rect.right + tooltipWidth + spacing > vw) pos = 'bottom';
            }
            else if (pos === 'top' && (rect.top - tooltipHeightEstimate - spacing < 0)) {
                pos = 'bottom';
            }
            else if (pos === 'bottom' && (rect.bottom + tooltipHeightEstimate + spacing > vh)) {
                pos = 'top';
            }

            // --- CALCULATE COORDS BASED ON FINAL POS ---
            let t = 0, l = 0;
            
            if (pos === 'top') {
                t = rect.top - spacing; // Will subtract height via CSS transform translateY(-100%) later or adjust here
                // Note: To position strictly above, we need actual height. 
                // Alternatively, we use bottom-aligned positioning logic or CSS.
                // Let's use standard top/left calculation assuming we can adjust via CSS or estimation.
                // Better approach for React Portal without ref to tooltip dimensions yet: 
                // Position at target's top, and CSS `transform: translateY(-100%)` handles the height.
                t = rect.top - spacing;
                l = rect.left + (rect.width / 2) - (tooltipWidth / 2);
            } else if (pos === 'bottom') {
                t = rect.bottom + spacing;
                l = rect.left + (rect.width / 2) - (tooltipWidth / 2);
            } else if (pos === 'left') {
                t = rect.top + (rect.height / 2); // Centered vertically, CSS will translateY(-50%)
                l = rect.left - tooltipWidth - spacing;
            } else if (pos === 'right') {
                t = rect.top + (rect.height / 2);
                l = rect.right + spacing;
            }

            // --- CLAMPING (Keep within Viewport) ---
            const padding = 10;
            
            // Clamp Horizontal
            if (l < padding) l = padding;
            if (l + tooltipWidth > vw - padding) l = vw - tooltipWidth - padding;

            // Clamp Vertical (Harder without exact height, but we can clamp top)
            if (t < padding) t = padding;
            // (Bottom clamping omitted to allow scrolling if needed, ensuring top is visible is prioritized)

            setTooltipPos({ top: t, left: l });
            
            // Set arrow direction based on final position
            // e.g., if tooltip is on 'right', arrow points 'left'
            setArrowPos(pos);

        }
    }, [isVisible, currentStep]);

    useEffect(() => {
        updatePosition();
        // Recalculate on resize and scroll to keep it attached
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true); // true for capture to catch sub-scrollers
        
        // Double check position after a small delay to allow UI transitions
        const timer = setTimeout(updatePosition, 500);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
            clearTimeout(timer);
        };
    }, [currentStepIndex, isVisible, updatePosition]);

    if (!isVisible || !currentStep || !targetRect) return null;

    // Helper to determine arrow styles based on 'pos'
    const getArrowStyle = () => {
        // arrowPos matches the tooltip position relative to target
        // e.g. 'bottom' means tooltip is BELOW target, so arrow should be at TOP of tooltip pointing UP
        switch (arrowPos) {
            case 'bottom': return 'top-[-8px] left-1/2 -translate-x-1/2 border-b-white border-l-transparent border-r-transparent border-t-transparent border-[8px]';
            case 'top': return 'bottom-[-8px] left-1/2 -translate-x-1/2 border-t-white border-l-transparent border-r-transparent border-b-transparent border-[8px]'; // Tooltip is top, arrow at bottom
            case 'right': return 'left-[-8px] top-1/2 -translate-y-1/2 border-r-white border-t-transparent border-b-transparent border-l-transparent border-[8px]';
            case 'left': return 'right-[-8px] top-1/2 -translate-y-1/2 border-l-white border-t-transparent border-b-transparent border-r-transparent border-[8px]';
            default: return '';
        }
    };

    // Calculate Transform based on position to center or offset correctly
    const getTransform = () => {
        if (arrowPos === 'left' || arrowPos === 'right') return 'translateY(-50%)'; // Center vertically relative to t
        if (arrowPos === 'top') return 'translateY(-100%)'; // Move up by its own height (positioned at target top)
        return ''; // Bottom doesn't need transform if t = rect.bottom
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] animate-fade-in font-sans touch-none">
            {/* Backdrop with SVG Mask for Spotlight Effect */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <mask id="tour-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {/* The hole around target */}
                        <rect 
                            x={targetRect.left - 5} 
                            y={targetRect.top - 5} 
                            width={targetRect.width + 10} 
                            height={targetRect.height + 10} 
                            rx="8" 
                            fill="black" 
                        />
                    </mask>
                </defs>
                <rect 
                    x="0" 
                    y="0" 
                    width="100%" 
                    height="100%" 
                    fill="rgba(0, 0, 0, 0.7)" 
                    mask="url(#tour-mask)" 
                />
            </svg>

            {/* Glowing Border around target (Visual indicator) */}
            <div 
                className="absolute border-4 border-brand-secondary rounded-lg shadow-[0_0_30px_rgba(251,191,36,0.6)] pointer-events-none transition-all duration-300 ease-in-out box-content"
                style={{
                    top: targetRect.top - 5,
                    left: targetRect.left - 5,
                    width: targetRect.width,
                    height: targetRect.height,
                    padding: '5px'
                }}
            />

            {/* The Tooltip Card */}
            <div 
                className="absolute bg-white rounded-xl shadow-2xl p-0 transition-all duration-300 ease-in-out flex flex-col border border-brand-light w-[300px] sm:w-[320px]"
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
        </div>,
        document.body
    );
};
