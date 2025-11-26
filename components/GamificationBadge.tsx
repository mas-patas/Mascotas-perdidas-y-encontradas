
import React from 'react';
import { ChihuahuaIcon, PugIcon, BeagleIcon, BorderCollieIcon, GoldenIcon, GreatDaneIcon } from './BreedBadges';

interface GamificationBadgeProps {
    points: number;
    size?: 'sm' | 'md' | 'lg';
    showProgress?: boolean;
    vertical?: boolean; // Kept for compatibility but defaults to true behavior visually
}

// Updated design configs: Solid colors and Gradients
export const LEVELS = [
    { 
        min: 0, max: 99, 
        name: 'Chihuahua', title: 'Novato', 
        icon: ChihuahuaIcon, 
        solidBg: 'bg-yellow-500',
        gradient: 'from-yellow-500 to-yellow-600',
        textColor: 'text-yellow-900',
        ring: 'ring-yellow-300' 
    },
    { 
        min: 100, max: 299, 
        name: 'Pug', title: 'Activo', 
        icon: PugIcon, 
        solidBg: 'bg-orange-500', 
        gradient: 'from-orange-500 to-orange-700',
        textColor: 'text-orange-900',
        ring: 'ring-orange-300' 
    },
    { 
        min: 300, max: 599, 
        name: 'Beagle', title: 'Rastreador', 
        icon: BeagleIcon, 
        solidBg: 'bg-slate-600', 
        gradient: 'from-slate-600 to-slate-800',
        textColor: 'text-slate-900',
        ring: 'ring-slate-400' 
    },
    { 
        min: 600, max: 999, 
        name: 'Border Collie', title: 'Guardián', 
        icon: BorderCollieIcon, 
        solidBg: 'bg-gray-900', 
        gradient: 'from-gray-800 to-black',
        textColor: 'text-gray-900',
        ring: 'ring-gray-500' 
    },
    { 
        min: 1000, max: 1999, 
        name: 'Golden Retriever', title: 'Héroe', 
        icon: GoldenIcon, 
        solidBg: 'bg-amber-500', 
        gradient: 'from-amber-500 to-amber-700',
        textColor: 'text-amber-900',
        ring: 'ring-amber-300' 
    },
    { 
        min: 2000, max: Infinity, 
        name: 'Gran Danés', title: 'Leyenda', 
        icon: GreatDaneIcon, 
        solidBg: 'bg-indigo-600', 
        gradient: 'from-indigo-600 to-indigo-900',
        textColor: 'text-indigo-900',
        ring: 'ring-indigo-400' 
    },
];

export const getLevelFromPoints = (points: number) => {
    return LEVELS.find(l => points >= l.min && points <= l.max) || LEVELS[LEVELS.length - 1];
};

const GamificationBadge: React.FC<GamificationBadgeProps> = ({ points, size = 'md', showProgress = false }) => {
    const currentLevel = getLevelFromPoints(points);
    const nextLevel = LEVELS.find(l => l.min > currentLevel.max);
    
    const Icon = currentLevel.icon;

    // Increased sizes for better impact
    const containerSizeClasses = {
        sm: 'w-16 h-16 p-2',
        md: 'w-24 h-24 p-4',
        lg: 'w-32 h-32 p-5',
    };

    const textSizeClasses = {
        sm: 'text-xs',
        md: 'text-base',
        lg: 'text-xl',
    };

    // Calculate progress percentage to next level
    let progress = 100;
    if (nextLevel) {
        const range = currentLevel.max - currentLevel.min;
        const progressPoints = points - currentLevel.min;
        progress = Math.min(100, Math.max(0, (progressPoints / range) * 100));
    }

    return (
        <div className="flex flex-col items-center justify-center">
            {/* Circular Badge Container - Solid Color with White Icon */}
            <div className={`relative rounded-full flex items-center justify-center ${currentLevel.solidBg} ring-4 ring-white/80 shadow-lg ${containerSizeClasses[size]} transition-transform transform hover:scale-105 mb-2`}>
                <Icon className="w-full h-full drop-shadow-md text-white filter brightness-125" />
            </div>
            
            {/* Text Underneath */}
            <div className="text-center">
                <p className={`font-black uppercase tracking-wide leading-none ${textSizeClasses[size]} ${size === 'sm' ? 'text-white/90' : 'text-gray-800'}`}>
                    {currentLevel.name}
                </p>
                <p className={`font-bold text-xs uppercase mt-1 ${size === 'sm' ? 'text-white/70' : 'text-brand-primary'}`}>
                    {currentLevel.title}
                </p>
            </div>

            {showProgress && nextLevel && (
                <div className="w-full max-w-[120px] mt-2 space-y-1">
                    <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                        <span>{points} pts</span>
                        <span>{nextLevel.min}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${currentLevel.solidBg}`} 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GamificationBadge;
