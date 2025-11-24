
import React from 'react';
import { StarIcon } from './icons';

interface StarRatingProps {
    rating: number; // 0 to 5
    maxRating?: number;
    size?: 'sm' | 'md' | 'lg';
    interactive?: boolean;
    onRate?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({ 
    rating, 
    maxRating = 5, 
    size = 'md', 
    interactive = false, 
    onRate 
}) => {
    const [hoverRating, setHoverRating] = React.useState(0);

    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-8 w-8',
    };

    const handleMouseEnter = (index: number) => {
        if (interactive) setHoverRating(index);
    };

    const handleMouseLeave = () => {
        if (interactive) setHoverRating(0);
    };

    const handleClick = (index: number) => {
        if (interactive && onRate) {
            onRate(index);
        }
    };

    const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

    return (
        <div className="flex items-center gap-1" onMouseLeave={handleMouseLeave}>
            {Array.from({ length: maxRating }, (_, i) => i + 1).map((starIndex) => {
                const isFilled = starIndex <= displayRating;
                const isHalf = starIndex - 0.5 === displayRating; // Simple half star logic if needed later

                return (
                    <button
                        key={starIndex}
                        type="button"
                        className={`transition-colors ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} ${
                            isFilled ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        onMouseEnter={() => handleMouseEnter(starIndex)}
                        onClick={() => handleClick(starIndex)}
                        disabled={!interactive}
                    >
                        <StarIcon className={sizeClasses[size]} filled={isFilled} />
                    </button>
                );
            })}
        </div>
    );
};

export default StarRating;
