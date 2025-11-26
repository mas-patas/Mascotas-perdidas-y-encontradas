
import React from 'react';

interface BadgeProps {
    className?: string;
}

export const ChihuahuaIcon: React.FC<BadgeProps> = ({ className }) => (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#FDE68A" stroke="#F59E0B" strokeWidth="2"/>
        <path d="M20 24L16 14L26 18" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M44 24L48 14L38 18" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 24C22 24 20 44 32 48C44 44 42 24 42 24C42 24 38 20 32 20C26 20 22 24 22 24Z" fill="#FCD34D"/>
        <circle cx="27" cy="30" r="2" fill="#1F2937"/>
        <circle cx="37" cy="30" r="2" fill="#1F2937"/>
        <path d="M30 36L32 38L34 36" stroke="#92400E" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

export const PugIcon: React.FC<BadgeProps> = ({ className }) => (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#FED7AA" stroke="#EA580C" strokeWidth="2"/>
        <path d="M18 22C18 22 14 28 18 34" stroke="#7C2D12" strokeWidth="3" strokeLinecap="round"/>
        <path d="M46 22C46 22 50 28 46 34" stroke="#7C2D12" strokeWidth="3" strokeLinecap="round"/>
        <path d="M20 24C20 24 20 46 32 48C44 46 44 24 44 24C44 24 38 18 32 18C26 18 20 24 20 24Z" fill="#FDBA74"/>
        <path d="M24 30C24 30 28 28 32 28C36 28 40 30 40 30" stroke="#7C2D12" strokeWidth="2"/>
        <circle cx="26" cy="34" r="3" fill="#1F2937"/>
        <circle cx="38" cy="34" r="3" fill="#1F2937"/>
        <ellipse cx="32" cy="40" rx="6" ry="4" fill="#1F2937"/>
    </svg>
);

export const BeagleIcon: React.FC<BadgeProps> = ({ className }) => (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#E5E7EB" stroke="#4B5563" strokeWidth="2"/>
        <path d="M16 20L18 30" stroke="#4B5563" strokeWidth="3" strokeLinecap="round"/>
        <path d="M48 20L46 30" stroke="#4B5563" strokeWidth="3" strokeLinecap="round"/>
        <path d="M20 24C20 24 18 44 32 48C46 44 44 24 44 24C44 24 38 16 32 16C26 16 20 24 20 24Z" fill="#D1D5DB"/>
        <path d="M20 24L32 16L44 24V32C44 32 40 36 32 36C24 36 20 32 20 32V24Z" fill="#9CA3AF"/>
        <path d="M30 42L32 40L34 42" stroke="#1F2937" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="27" cy="28" r="2" fill="#1F2937"/>
        <circle cx="37" cy="28" r="2" fill="#1F2937"/>
    </svg>
);

export const BorderCollieIcon: React.FC<BadgeProps> = ({ className }) => (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#1F2937" stroke="#111827" strokeWidth="2"/>
        <path d="M22 26C22 26 20 46 32 50C44 46 42 26 42 26C42 26 38 18 32 18C26 18 22 26 22 26Z" fill="white"/>
        <path d="M32 18V28" stroke="#1F2937" strokeWidth="2"/>
        <path d="M22 26L26 14" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        <path d="M42 26L38 14" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="28" cy="30" r="2" fill="#1F2937"/>
        <circle cx="36" cy="30" r="2" fill="#1F2937"/>
        <path d="M30 38C30 38 31 40 32 40C33 40 34 38 34 38" stroke="#1F2937" strokeWidth="2"/>
    </svg>
);

export const GoldenIcon: React.FC<BadgeProps> = ({ className }) => (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#FBBF24" stroke="#D97706" strokeWidth="2"/>
        <path d="M14 26C14 26 16 40 20 44" stroke="#B45309" strokeWidth="3" strokeLinecap="round"/>
        <path d="M50 26C50 26 48 40 44 44" stroke="#B45309" strokeWidth="3" strokeLinecap="round"/>
        <path d="M20 24C20 24 20 48 32 50C44 48 44 24 44 24C44 24 38 16 32 16C26 16 20 24 20 24Z" fill="#FCD34D"/>
        <circle cx="27" cy="30" r="2" fill="#1F2937"/>
        <circle cx="37" cy="30" r="2" fill="#1F2937"/>
        <path d="M28 40Q32 44 36 40" stroke="#1F2937" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

export const GreatDaneIcon: React.FC<BadgeProps> = ({ className }) => (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#374151" stroke="#1F2937" strokeWidth="2"/>
        <path d="M22 12L24 24" stroke="#D1D5DB" strokeWidth="3" strokeLinecap="round"/>
        <path d="M42 12L40 24" stroke="#D1D5DB" strokeWidth="3" strokeLinecap="round"/>
        <path d="M22 24C22 24 20 48 32 52C44 48 42 24 42 24C42 24 38 16 32 16C26 16 22 24 22 24Z" fill="#9CA3AF"/>
        <circle cx="28" cy="30" r="2" fill="#1F2937"/>
        <circle cx="36" cy="30" r="2" fill="#1F2937"/>
        <path d="M28 42H36" stroke="#1F2937" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);
