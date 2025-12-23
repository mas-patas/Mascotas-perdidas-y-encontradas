import React from 'react';
import type { User } from '@/types';
import { USER_ROLES } from '@/constants';

/**
 * Helper function to check if a user is admin or superadmin
 */
export const isVerifiedUser = (user?: User | null): boolean => {
    if (!user || !user.role) return false;
    return user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPERADMIN;
};

interface VerifiedBadgeProps {
    user?: User | null;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * VerifiedBadge component - displays a blue checkmark badge for admin/superadmin users
 * Similar to Instagram/Facebook verified badges
 */
export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ user, size = 'md', className = '' }) => {
    if (!isVerifiedUser(user)) return null;

    const sizeClasses = {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
    };

    return (
        <span 
            className={`inline-flex items-center justify-center rounded-full bg-blue-500 text-white ${sizeClasses[size]} ${className}`}
            title="Cuenta verificada"
            aria-label="Cuenta verificada"
        >
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor"
                className="w-full h-full p-0.5"
            >
                <path 
                    fillRule="evenodd" 
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                    clipRule="evenodd" 
                />
            </svg>
        </span>
    );
};

export default VerifiedBadge;

