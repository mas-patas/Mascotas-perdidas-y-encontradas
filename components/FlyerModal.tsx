
import React from 'react';
import type { Pet } from '../types';
import { LocationMarkerIcon, CalendarIcon, PrinterIcon } from './icons';

interface FlyerModalProps {
    pet: Pet;
    onClose: () => void;
}

export const FlyerModal: React.FC<FlyerModalProps> = ({ pet, onClose }) => {
    
    const handlePrint = () => {
        window.print();
    };
    
    // A simplified URL for the QR code, as we don't have unique pet pages
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(window.location.href)}`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-100 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 bg-white flex justify-between items-center rounded-t-lg no-print">
                    <h3 className="text-lg font-bold text-brand-dark">Generador de Afiche</h3>
                    <div className="flex items-center">
                         <button onClick={handlePrint} className="flex items-center gap-2 py-2 px-4 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors mr-2">
                            <PrinterIcon />
                            Imprimir
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl leading-none">&times;</button>
                    </div>
                </div>
                
                <div id="flyer-modal" className="p-8 bg-white overflow-y-auto">
                    <div className="text-center border-b-4 border-black pb-4">
                        <h1 className="text-7xl font-extrabold tracking-widest text-black uppercase">SE BUSCA</h1>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6 my-6">
                        <div className="col-span-2">
                             <h2 className="text-6xl font-bold text-brand-dark">{pet.name}</h2>
                             <ul className="mt-4 space-y-2 text-lg text-gray-800">
                                <li><strong>Raza:</strong> {pet.breed}</li>
                                <li><strong>Color:</strong> {pet.color}</li>
                                <li><strong>Tamaño:</strong> {pet.size}</li>
                             </ul>
                        </div>
                        <div className="col-span-1 flex justify-center items-center">
                            <img src={pet.imageUrls[0]} alt={pet.name} className="w-full h-auto object-cover rounded-lg border-4 border-black"/>
                        </div>
                    </div>
                    
                    <div className="bg-gray-100 p-4 rounded-lg mb-6">
                        <p className="text-xl font-medium text-gray-800"><strong>Señas particulares:</strong> {pet.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 items-start">
                        <div className="space-y-3 text-lg">
                             <div className="flex items-start gap-2">
                                <LocationMarkerIcon />
                                <div><strong>Visto por última vez en:</strong><br/>{pet.location}</div>
                            </div>
                            <div className="flex items-start gap-2">
                                <CalendarIcon />
                                <div><strong>Fecha:</strong><br/>{new Date(pet.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                            </div>
                        </div>
                        <div className="text-center">
                             <h3 className="text-2xl font-bold mb-2">CONTACTO</h3>
                             <p className="text-3xl font-mono p-2 bg-yellow-200 border border-black">{pet.contact}</p>
                             <div className="mt-4 flex flex-col items-center">
                                <img src={qrCodeUrl} alt="QR Code" className="w-[120px] h-[120px]" />
                                <p className="text-xs text-gray-600 mt-1">Escanear para ver publicación</p>
                             </div>
                        </div>
                    </div>

                    <div className="border-t-2 border-dashed border-gray-400 mt-6 flex justify-around text-center overflow-hidden pt-2">
                        {Array(8).fill(0).map((_, i) => (
                            <div key={i} className="px-2 border-l-2 border-dashed border-gray-400 first:border-l-0" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                                <p className="font-bold text-lg">{pet.name}</p>
                                <p className="font-mono text-base">{pet.contact}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
