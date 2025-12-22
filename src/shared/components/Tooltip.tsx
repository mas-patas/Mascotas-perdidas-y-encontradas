import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
    text: string;
    children: React.ReactElement;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
}

export const Tooltip = ({ 
    text, 
    children, 
    position = 'top',
    delay = 300 
}: TooltipProps): JSX.Element => {
    const [isVisible, setIsVisible] = useState(false);
    const [calculatedPosition, setCalculatedPosition] = useState(position);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleMouseEnter = (e: React.MouseEvent) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
        }, delay);
    };

    const handleMouseLeave = (e: React.MouseEvent) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    const handleFocus = (e: React.FocusEvent) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
        }, delay);
    };

    const handleBlur = (e: React.FocusEvent) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    useEffect(() => {
        if (isVisible) {
            // Calculate position after tooltip is visible
            const timer = setTimeout(() => {
                calculatePosition();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    const calculatePosition = () => {
        if (!wrapperRef.current || !tooltipRef.current) return;

        const wrapperRect = wrapperRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let newPosition = position;

        // Check if tooltip would overflow viewport and adjust position
        if (position === 'top' && wrapperRect.top - tooltipRect.height < 0) {
            newPosition = 'bottom';
        } else if (position === 'bottom' && wrapperRect.bottom + tooltipRect.height > viewportHeight) {
            newPosition = 'top';
        } else if (position === 'left' && wrapperRect.left - tooltipRect.width < 0) {
            newPosition = 'right';
        } else if (position === 'right' && wrapperRect.right + tooltipRect.width > viewportWidth) {
            newPosition = 'left';
        }

        setCalculatedPosition(newPosition);
    };

    const getPositionClasses = () => {
        switch (calculatedPosition) {
            case 'top':
                return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
            case 'bottom':
                return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
            case 'left':
                return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
            case 'right':
                return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
            default:
                return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
        }
    };

    const getArrowClasses = () => {
        switch (calculatedPosition) {
            case 'top':
                return 'top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800';
            case 'bottom':
                return 'bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-800';
            case 'left':
                return 'left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-800';
            case 'right':
                return 'right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-800';
            default:
                return 'top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800';
        }
    };

    const clonedChild = React.cloneElement(children, {
        onMouseEnter: (e: React.MouseEvent) => {
            handleMouseEnter(e);
            if (children.props.onMouseEnter) {
                children.props.onMouseEnter(e);
            }
        },
        onMouseLeave: (e: React.MouseEvent) => {
            handleMouseLeave(e);
            if (children.props.onMouseLeave) {
                children.props.onMouseLeave(e);
            }
        },
        onFocus: (e: React.FocusEvent) => {
            handleFocus(e);
            if (children.props.onFocus) {
                children.props.onFocus(e);
            }
        },
        onBlur: (e: React.FocusEvent) => {
            handleBlur(e);
            if (children.props.onBlur) {
                children.props.onBlur(e);
            }
        },
    });

    return (
        <div ref={wrapperRef} className="relative inline-block">
            {clonedChild}
            {isVisible && (
                <div
                    ref={tooltipRef}
                    className={`absolute ${getPositionClasses()} z-50 pointer-events-none animate-fade-in`}
                    role="tooltip"
                >
                    <div className="bg-gray-800 text-white text-xs font-medium px-2 py-1.5 rounded-md shadow-lg whitespace-nowrap">
                        {text}
                        <div className={`absolute ${getArrowClasses()}`}></div>
                    </div>
                </div>
            )}
        </div>
    );
};

