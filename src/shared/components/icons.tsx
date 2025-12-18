
import React from 'react';

interface IconProps {
    className?: string;
    filled?: boolean;
}

export const PlusIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

export const LocationMarkerIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 text-gray-400"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 text-gray-500"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

export const PhoneIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
);

export const LockIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm6 0a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0V6h-1a1 1 0 010-2h1V3a1 1 0 011-1zM3 13a1 1 0 011-1h1v-1a1 1 0 112 0v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 01-1-1zm12-2a1 1 0 011-1h1v-1a1 1 0 112 0v1h1a1 1 0 110 2H6v1a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);

export const LogoutIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

export const MapIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

export const FilterIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
);

export const GoogleIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className || "h-5 w-5"} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.804 12.18C34.553 8.243 29.627 6 24 6C12.955 6 4 14.955 4 26s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
        <path fill="#FF3D00" d="M6.306 14.691c-1.321 2.21-2.11 4.79-2.11 7.518s.789 5.308 2.11 7.518l-5.385 4.18C.951 30.68 0 27.456 0 24s.951-6.68 2.521-9.389l3.785 1.08z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-4.752-3.696C30.432 37.245 27.352 38 24 38c-5.202 0-9.619-3.317-11.283-7.946l-4.92 3.935C10.395 39.508 16.719 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l4.752 3.696c3.153-2.934 5.025-7.131 5.025-11.767c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
);

export const AppleIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className || "h-6 w-6"} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.228 6.93838C15.201 6.95338 15.175 6.97038 15.147 6.98538C14.596 7.28438 14.21 7.92538 14.21 8.65338C14.21 9.53138 14.793 10.2744 15.54 10.5974C15.54 10.5974 15.54 10.5974 15.541 10.5974C16.113 10.8444 16.732 10.5574 17.11 10.0514C17.134 10.0214 17.159 9.99138 17.183 9.96038C18.01 8.87138 17.653 7.35138 16.533 6.64238C16.138 6.38838 15.656 6.47138 15.228 6.93838ZM14.6212 6.16641C15.1692 5.58441 15.9922 5.23941 16.8552 5.37841C17.2032 5.43441 17.5142 5.63241 17.7282 5.91841C17.7492 5.94641 17.7682 5.97641 17.7872 6.00441C17.8042 6.02941 17.8222 6.05441 17.8382 6.08041C18.4112 7.01441 18.9182 7.37541 19.5882 7.37541C20.4012 7.37541 21.0562 6.82841 21.1272 6.75741C20.1982 5.51841 18.7992 4.77141 17.2922 4.77141C15.9392 4.77141 14.8642 5.36141 14.1232 6.16641L14.6212 6.16641ZM12.0002 4.49941C10.0382 4.49941 8.35318 5.93241 8.01918 7.84641C6.07918 8.13641 4.75018 9.77341 4.75018 11.7584C4.75018 13.5684 6.01218 15.0274 7.66618 15.3584C7.71218 17.3684 9.12418 19.4994 11.3262 19.4994C11.9792 19.5014 12.6302 19.3404 13.2102 19.0324C13.9112 18.6654 14.5022 18.1404 14.9082 17.5114C15.9392 16.7444 16.9292 14.6894 16.9292 12.4414C16.9292 9.82441 15.3132 8.43241 15.2012 8.38141C13.9012 7.80541 13.1092 6.69141 12.8712 5.53641C12.5992 5.56841 12.3022 5.58641 12.0002 5.58641L12.0002 4.49941Z" />
    </svg>
);

export const CrosshairIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v.01M12 20v-.01M4 12h.01M20 12h-.01M7 7l.01.01M17 17l-.01-.01M7 17l.01-.01M17 7l-.01.01" />
    </svg>
);

export const XCircleIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
);

export const HomeIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

export const UserIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

export const DogIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a2 2 0 012 2v2a2 2 0 01-2 2 2 2 0 01-2-2V4a2 2 0 012-2zM8 14s1.5 2 4 2 4-2 4-2M9 10h6"/>
        <path d="M12 14v6a2 2 0 002 2h2a2 2 0 00-2-2v-2a2 2 0 00-2-2h-2M12 14v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-2a2 2 0 012-2h2"/>
        <path d="M5 8a3 3 0 016 0c0 1.5-3 4-3 4s-3-2.5-3-4zM19 8a3 3 0 00-6 0c0 1.5 3 4 3 4s3-2.5 3-4z"/>
    </svg>
);

export const CatIcon: React.FC<IconProps> = ({ className }) => (
     <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a2 2 0 012 2v1a2 2 0 01-2 2 2 2 0 01-2-2V4a2 2 0 012-2zM9 12s1.5 2 3 2 3-2 3-2M9 9h6"/>
        <path d="M20 12c0 4-4 8-8 8s-8-4-8-8 4-8 8-8 8 4 8 8zM5 8l-2 2M19 8l2 2"/>
    </svg>
);

export const EditIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
    </svg>
);

export const SendIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
);


export const TrashIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);


export const ChatBubbleIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

export const AdminIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m12 0a2 2 0 100-4m0 4a2 2 0 110-4M6 6v2m6 10v2m6-12v2" />
    </svg>
);


export const MenuIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

export const TagIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 text-gray-400"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 2H9a2 2 0 00-2 2v5a2 2 0 002 2h5a2 2 0 002-2V4a2 2 0 00-2-2zM7 7h.01" />
    </svg>
);

export const FacebookIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
    </svg>
);

export const InstagramIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
);

export const TwitterIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616v.064c0 2.298 1.638 4.218 3.82 4.654-.73.198-1.496.228-2.253.085.61 1.913 2.378 3.3 4.48 3.329-1.789 1.407-4.039 2.248-6.49 2.248-.423 0-.84-.023-1.254-.074 2.315 1.488 5.068 2.358 7.994 2.358 9.588 0 14.837-7.944 14.837-14.837 0-.226-.005-.452-.015-.678.968-.698 1.81-1.572 2.478-2.558z" />
    </svg>
);

export const WhatsAppIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="currentColor" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.902-.539-5.587-1.52l-6.19 1.669zm4.779-6.463l.272.162c1.619.97 3.482 1.475 5.418 1.475 5.478 0 9.961-4.483 9.961-9.961s-4.483-9.961-9.961-9.961-9.961 4.483-9.961 9.961c0 2.006.602 3.918 1.667 5.586l.164.272-1.037 3.787 3.879-1.04z" />
    </svg>
);

export const PrinterIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
);

export const HeartIcon: React.FC<IconProps> = ({ className, filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
    </svg>
);

export const ThumbUpIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
    </svg>
);


export const CheckCircleIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

export const BookmarkIcon: React.FC<IconProps> = ({ className, filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
  </svg>
);

export const InfoIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4 text-gray-400"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


export const WarningIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className || "h-6 w-6 text-red-600"} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

export const FlagIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H12.5l-1-1H5a2 2 0 00-2 2zm0 0h18" />
    </svg>
);

export const UsersIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm6-6a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
);

export const PetIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4a4 4 0 100 8 4 4 0 000-8zm-8 8c0 4.418 3.582 8 8 8s8-3.582 8-8-3.582-8-8-8-8 3.582-8 8zm0 0h16" />
    </svg>
);

export const ChartBarIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0h6" />
    </svg>
);

export const SupportIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 0a5 5 0 10-7.07 7.071 5 5 0 007.07-7.071zm-9.192 9.192a5 5 0 117.07-7.071 5 5 0 01-7.07 7.071z" />
    </svg>
);

export const BellIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

export const MegaphoneIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.136A1.76 1.76 0 015.882 11H3a1 1 0 01-1-1V8a1 1 0 011-1h2.882a1.76 1.76 0 011.649.931l2.147 6.136-1.09-3.115A1.76 1.76 0 0110.232 5h1.232c1.026 0 1.943.684 2.247 1.647L15 12l-1.09-3.115" />
    </svg>
);

export const ExternalLinkIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);

export const DirectionIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const GoogleMapsIcon: React.FC<IconProps> = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className || "h-5 w-5"} fill="currentColor">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
);

export const WazeIcon: React.FC<IconProps> = ({ className }) => (
     <svg viewBox="0 0 24 24" className={className || "h-5 w-5"} fill="currentColor">
        <path d="M18.26 4.91c-1.88-1.61-4.3-2.5-6.85-2.5C7.16 2.41 3.35 5.47 2.14 9.57c-1.3 4.42.38 8.98 4.03 11.35 1.36.88 2.93 1.35 4.53 1.35.84 0 1.69-.13 2.52-.4 1.43.89 2.44 1.3 4.32 1.3 1.81 0 3.72-.77 4.42-2.54.34-.85.2-1.56-.36-2.13 2.1-1.68 3.02-4.58 2.31-7.28-.54-2.07-2.08-4.27-5.65-6.31zM13.7 17.4c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5-1.5-.67 1.5-1.5 1.5zm-6.8 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5-1.5-.67 1.5-1.5 1.5z"/>
    </svg>
);

export const EyeIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

export const EyeOffIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
);

export const StarIcon: React.FC<IconProps> = ({ className, filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
);

export const VerticalDotsIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
);

export const DownloadIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

export const TrophyIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

export const CoinIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5v2h2v-2zm8 0h-2v2h2v-2zM9 9h2v2H9V9z" clipRule="evenodd" />
    </svg>
);

export const TargetIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

export const ShoppingBagIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
);

export const HistoryIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

export const CrownIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.177a1 1 0 111.794.99l-1.369 2.559a1 1 0 01-.9.537h-7.356a1 1 0 01-.9-.537l-1.37-2.56a1 1 0 111.794-.99l1.699 3.177L10 4.323V3a1 1 0 011-1zm0 6a2 2 0 100 4 2 2 0 000-4z" clipRule="evenodd" />
        <path d="M10 12a2 2 0 100 4 2 2 0 000-4z" />
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0 2a10 10 0 100-20 10 10 0 000 20z" clipRule="evenodd" />
    </svg>
);

export const PodiumIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v9m0-9l-9 9M3 17V7m0 10h8m-8 0l9-9" />
    </svg>
);

export const StoreIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

export const BriefcaseIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

export const MedicalIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6 text-red-600"} fill="currentColor" viewBox="0 0 24 24" stroke="none">
        <path d="M18 10h-4V6a2 2 0 00-4 0v4H6a2 2 0 000 4h4v4a2 2 0 004 0v-4h4a2 2 0 000-4z" />
    </svg>
);

export const ScissorsIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
    </svg>
);

export const ArrowDownIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
);

export const CameraIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const LightbulbIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

export const DocumentIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

export const PawIcon: React.FC<IconProps> = ({ className }) => (
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="currentColor" viewBox="0 0 2200 2200" stroke="currentColor" strokeWidth="80">
        <g>
            <path d="M1340.367,371.261c-0.676,0.015-1.328,0.048-1.426,0.071c0.12,0.063,2.73,0.034,2.861-0.053
                c-0.078-0.023-0.574-0.034-1.196-0.023L1340.367,371.261z"/>
            <path d="M1304.154,379.709c0.162-0.116-2.568,1.066-2.718,1.213c0.84-0.328,1.843-0.792,2.668-1.185
                L1304.154,379.709z"/>
            <path d="M1502.619,651.631c-0.035,0.232-0.235,1.931-0.294,2.473c-0.037,0.342-0.036,0.385,0.003,0.092
                c0.035-0.22,0.29-2.399,0.3-2.604L1502.619,651.631z"/>
            <path d="M1165.274,931.641c56.544,66.572,162.352,64.49,230.255,16.623
                c51.308-34.426,87.568-87.565,110.718-144.176c40.666-101.242,54.389-230.411,27.913-336.698
                c-12.694-50.268-36.987-99.88-82.668-127.756c-75.133-46.413-169.906-20.327-220.913,49.253
                c-19.414,25.579-35.007,53.929-49.059,82.748c-32.232,65.682-52.551,137.05-61.71,209.622
                c-8.975,82.189-11.211,183.824,45.335,250.234L1165.274,931.641z M1419.477,877.406c0.335-0.349,0.429-0.457,0.636-0.658
                c-0.079,0.091-0.56,0.586-0.63,0.654L1419.477,877.406z M1462.45,813.704c-0.028,0.078-0.62,1.315-0.714,1.491
                c-0.016-0.009,0.581-1.218,0.716-1.499L1462.45,813.704z M1484.311,755.217c0.223-0.82,0.66-2.409,0.905-3.245
                c0.05-0.144-0.923,3.364-0.915,3.288L1484.311,755.217z M1159.52,696.77c5.391-76.876,25.613-153.196,60.506-222.007
                c16.671-31.052,33.431-64.525,63.837-84.223c13.392-8.901,28.162-14.565,43.859-17.47c52.18-10.235,108.138,15.888,136.364,60.57
                c7.937,11.873,13.259,22.881,18.157,36.557c8.135,22.04,13.973,45.219,17.674,68.307c11.813,81.335,0.859,181.165-29.795,257.538
                c-7.537,18.598-17.508,38.305-28.768,54.66c-11.453,15.799-26.489,32.963-42.53,45.099
                c-54.935,43.032-143.357,46.081-193.331-6.346c-47.465-50.982-49.714-126.675-45.987-192.488L1159.52,696.77z"/>
            <path d="M1844.036,985.914c-0.021,0.329,0.514-3.315,0.442-3.076c-0.292,0.803-0.401,2.177-0.443,3.004
                L1844.036,985.914z"/>
            <path d="M1867.249,734.091c-41.748-54.498-117.834-71.322-178.997-40.479
                c-51.4,24.429-101.753,86.681-133.613,133.504c-64.208,95.221-147.589,292.807-61.447,393.213
                c57.054,63.626,154.72,63.389,223.163,18.049c79.274-51.296,127.587-137.656,158.213-224.79
                c28.274-82.338,49.457-205.275-7.196-279.341L1867.249,734.091z M1511.892,1147.442c-0.086-0.189-0.458-1.036-0.46-1.051
                c-0.012-0.033,0.057,0.12,0.175,0.39c0.188,0.426,0.372,0.858,0.294,0.677L1511.892,1147.442z M1859.128,899.792
                c-4.046,76.508-38.651,171.297-84.719,232.547c-31.61,42.079-77.322,77.697-131.091,82.762
                c-42.084,3.498-87.651-10.245-115.429-43.298c-56.686-67.376-16.125-183.991,16.561-254.952
                c27.551-56.575,65.151-110.323,112.181-152.57c18.454-16.833,42.445-27.917,67.353-30.721
                c52.263-4.977,103.438,26.52,123.179,75.108c11.734,28.478,13.05,60.328,11.975,90.927L1859.128,899.792z"/>
            <path d="M1684.602,1205.202c0.126-0.01,0.503-0.244,0.746-0.364c1.021-0.544,2.136-1.224,1.9-1.212
                c-0.918,0.326-1.823,1.014-2.616,1.547L1684.602,1205.202z"/>
            <path d="M1671.891,752.182c-0.586,0.337-2.522,1.64-2.664,1.789c0.043,0.087,2.081-1.297,2.539-1.616
                c0.441-0.312,0.541-0.412,0.235-0.237L1671.891,752.182z"/>
            <path d="M1585.066,846.754c-0.189,0.273-0.235,0.351-0.134,0.222c0.718-0.956,1.794-2.432,2.499-3.472
                c0.099-0.176-1.551,2.079-2.278,3.124L1585.066,846.754z"/>
            <path d="M662.797,718.458c12.955,72.424,39.365,145.381,90.484,199.634
                c63.389,70.717,176.946,89.831,252.586,27.408c93.437-77.89,87.324-226.928,66.469-336.022
                c-14.471-72.374-41.45-142.766-80.414-205.616c-33.188-55.535-87.149-91.906-153.504-87.466
                c-10.029,0.692-19.997,2.335-29.73,4.863c-159.169,44.979-171.171,261.142-145.926,397.003L662.797,718.458z M818.023,371.404
                c-0.055,0.004-0.449,0.021-0.404,0.018c-0.032,0.001,0.358-0.016,0.407-0.019L818.023,371.404z M819.338,371.29
                c0.12-0.016,0.967-0.114,0.881-0.103c0.136-0.015,0.189-0.019,0.103-0.008c-0.012,0.005-1.039,0.121-0.935,0.108L819.338,371.29z
                 M745.094,405.124c0.508-0.534,0.672-0.701,0.929-0.954c0.129-0.124,0.175-0.156,0.123-0.083c-0.283,0.403-2.377,2.62-2.775,2.99
                c-0.321,0.313-0.281,0.232,0.048-0.141c0.421-0.478,1.022-1.12,1.497-1.623L745.094,405.124z M695.497,571.527
                c1.217-48.222,8.713-97.765,31.098-140.981c19.232-35.897,58.721-58.08,98.975-59.452c47.278-2.42,92.756,23.495,118.773,62.416
                c19.182,27.525,34.84,57.384,48.195,88.107c26.288,61.268,43.043,127.405,47.59,194.1c2.989,45.747,3.204,92.934-11.752,136.735
                c-14.879,45.863-51.93,71.07-99.031,75.753c-82.515,5.918-146.365-47.56-183.284-117.29
                c-37.378-72.145-51.245-158.56-50.569-239.188L695.497,571.527z"/>
            <path d="M1011.805,885.367c0.468-0.616,1.498-1.952,1.93-2.715c-0.028,0.028-0.084,0.084-0.112,0.112
                c-0.324,0.372-1.63,2.126-2.048,2.763c-0.286,0.429-0.233,0.422,0.129-0.033L1011.805,885.367z"/>
            <path d="M1022.908,866.464c0.262-0.578,0.528-1.176,0.751-1.698c0.183-0.428,0.192-0.471-0.034,0.02
                c-0.303,0.659-0.858,1.886-1.198,2.679c-0.103,0.256-0.022,0.079,0.057-0.081c0.075-0.158,0.187-0.4,0.32-0.692L1022.908,866.464z
                "/>
            <path d="M683.45,1174.515c0.278-0.401,0.82-1.082,0.956-1.381c-0.509,0.602-2.031,2.671-2.283,3.102
                c0.137-0.146,0.216-0.256,0.421-0.517c0.2-0.258,0.459-0.6,0.739-0.978L683.45,1174.515z"/>
            <path d="M662.958,1194.383c0.479-0.224,3.243-2.431,2.669-2.059c-0.88,0.612-1.868,1.368-2.649,2.034
                L662.958,1194.383z"/>
            <path d="M346.8,803.914c0.041-0.11,0.511-1.607,0.661-2.099c0.115-0.374,0.144-0.483,0.059-0.226
                c-0.052,0.143-0.677,2.15-0.715,2.298L346.8,803.914z"/>
            <path d="M695.276,1217.541c66.991-70.666,53.094-178.08,23.555-262.675
                c-30.62-88.292-81.229-170.342-150.092-233.883c-8.903-7.973-18.284-15.292-28.473-21.446
                c-82.507-50.123-182.858-7.105-221.866,76.972c-10.088,20.469-15.642,42.79-18.431,65.359
                c-11.832,95.379,17.675,191.912,62.164,275.561c38.401,69.763,97.572,137.917,180.153,150.927
                c55.476,9.158,114.292-9.513,152.852-50.67L695.276,1217.541z M341.572,834.902c-0.003-0.06,0.003-0.128-0.001-0.186
                C341.574,834.758,341.574,834.822,341.572,834.902z M341.479,835.737c0.095-0.908,0.124-0.915-0.015,0.53
                c-0.093,0.975-0.197,1.871-0.199,1.77c0.037-0.633,0.117-1.327,0.19-2.063L341.479,835.737z M613.803,1213.55
                c-107.948,17.642-189.065-80.686-228.653-169.467c-23.109-52.288-40.874-107.969-44.137-165.34
                c-1.07-32.244-1.254-67.6,15.134-96.56c22.962-40.716,75.523-57.163,119.652-45.329c41.81,10.821,72.445,43.892,99.834,75.397
                c57.326,67.736,98.383,149.006,117.788,235.606c4.369,19.766,7.076,39.872,7.018,60.115c-0.169,21.927-4,48.923-17.309,66.708
                c-16.178,21.937-42.714,34.275-69.134,38.837L613.803,1213.55z"/>
            <path d="M1428.922,1782.206c2.346-1.456-2.082,0.934-2.352,1.238c-0.001,0.064,1.147-0.517,2.149-1.117
                L1428.922,1782.206z"/>
            <path d="M1540.178,1484.813c-0.04-0.54-0.05-1.218-0.217-1.612c-0.214,0.655-0.219,1.703-0.034,2.331
                c0.118,0.267,0.261,0.032,0.254-0.511L1540.178,1484.813z"/>
            <path d="M726.76,1342.32c-1.645,2.376,1.582-2.199,1.503-2.12c-0.422,0.571-0.91,1.275-1.349,1.899
                L726.76,1342.32z"/>
            <path d="M1584.53,1469.614c-11.774-122.069-80.171-234.556-179.269-305.793
                c-71.629-51.501-157.917-85.234-246.589-87.527c-52.478-0.921-105.698,2.591-156.491,16.408
                c-159.398,46.627-292.612,172.824-356.482,325.194c-20.414,50.333-32.663,104.626-32.355,159.096
                c1.162,87.426,35.893,176.082,99.961,236.515c70.214,68.211,174.989,85.38,267.081,57.987
                c30.373-8.451,58.557-22.288,86.121-37.057c5.748-2.754,11.641-5.139,17.752-6.723c28.059-7.404,51.082,2.505,75.717,14.962
                c78.517,38.117,173.582,43.944,251.266,0.464c126.969-73.358,187.819-231.24,173.308-373.326L1584.53,1469.614z M948.376,1161.607
                c0.376-0.194,1.556-0.656,1.991-0.829c0.638-0.249,0.581-0.194-0.147,0.116c-0.72,0.307-1.799,0.724-1.843,0.719L948.376,1161.607
                z M657.783,1521.49c0,0.018-0.001,0.048-0.002,0.082C657.78,1521.544,657.783,1521.517,657.783,1521.49z M659.403,1590.83
                c0.008,0.064,0.015,0.114,0.017,0.142C659.416,1590.924,659.408,1590.877,659.403,1590.83z M685.398,1678.327
                c-0.174-0.336-0.629-1.309-0.912-1.919c-0.1-0.218-0.097-0.225,0.011-0.006c0.212,0.423,0.848,1.784,0.894,1.904L685.398,1678.327
                z M1543.042,1552.629c-4.36,93.993-47.878,192.979-132.27,240.797c-69.076,39.275-156.705,29.524-225.681-5.081
                c-32.128-17.009-63.495-23.732-98.825-12.179c-15.974,5.066-30.471,13.874-45.227,21.561
                c-74.432,38.009-168.814,44.075-243.409,3.313c-86.927-46.865-137.727-145.976-140.874-242.861
                c-1.252-41.17,6.364-82.486,20.537-121.214c44.899-121.933,154.669-228.742,274.521-276.711
                c31.616-12.609,64.96-21.385,98.834-25.18c43.94-4.781,88.74-6.241,132.755-0.091c43.564,5.891,85.489,20.677,124.783,40.118
                c141.952,69.011,243.8,216.687,234.862,377.331L1543.042,1552.629z"/>
            <path d="M669.367,1461.031c-0.14,0.368-0.826,3.093-0.937,3.685c0.291-0.962,0.707-2.683,0.929-3.639
                L669.367,1461.031z"/>
            <path d="M1461.681,1754.008c-0.846,0.732-1.896,1.764-2.718,2.586c-0.18,0.19,0.056-0.01,0.552-0.471
                c0.601-0.564,1.552-1.458,2.153-2.095L1461.681,1754.008z"/>
            <path d="M1487.31,1722.829c0.323-0.449,1.378-1.933,1.557-2.215c0.027-0.044-0.323,0.444-0.364,0.502
                c-0.197,0.271-2.133,3.004-1.299,1.86L1487.31,1722.829z"/>
        </g>
    </svg>
);