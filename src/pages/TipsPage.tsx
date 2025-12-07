import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LightbulbIcon, SearchIcon, CameraIcon, HeartIcon, WarningIcon, PhoneIcon } from '@/shared/components/icons';

interface TipCardProps {
    title: string;
    icon: React.ReactNode;
    color: string;
    steps: string[];
}

const TipCard: React.FC<TipCardProps> = ({ title, icon, color, steps }) => (
    <div className={`bg-white rounded-xl shadow-lg border-t-4 ${color} p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
        <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-full bg-opacity-20 ${color.replace('border-', 'bg-').replace('-500', '-100')}`}>
                {React.cloneElement(icon as React.ReactElement<any>, { className: `h-6 w-6 ${color.replace('border-', 'text-')}` })}
            </div>
            <h3 className="font-bold text-xl text-gray-800">{title}</h3>
        </div>
        <ul className="space-y-3">
            {steps.map((step, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-600 text-sm">
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5 ${color.replace('border-', 'bg-')}`}>
                        {index + 1}
                    </span>
                    <span>{step}</span>
                </li>
            ))}
        </ul>
    </div>
);

export const TipsPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'lost' | 'found' | 'prevention'>('lost');

    const lostTips = [
        "Busca en un radio cercano inmediatamente. Las mascotas asustadas suelen esconderse cerca.",
        "Deja ropa con tu olor o su cama afuera de casa para guiarlo de regreso.",
        "Publica en esta App y comparte el afiche generado en redes sociales vecinales.",
        "Visita veterinarias y refugios cercanos físicamente, no solo llames."
    ];

    const foundTips = [
        "Verifica si tiene placa de identificación o collar.",
        "Llévalo a una veterinaria para escanear si tiene microchip (es gratuito).",
        "Publica una foto clara en la App, pero no des detalles muy específicos para evitar estafadores.",
        "Si lo llevas a casa, mantenlo separado de tus otras mascotas al principio."
    ];

    const preventionTips = [
        "Usa siempre collar con placa de identificación actualizada.",
        "Considera el uso de GPS o AirTags para rastreo en tiempo real.",
        "Esteriliza a tu mascota; esto reduce el instinto de escapar para buscar pareja.",
        "Enséñale comandos básicos como 'ven' o 'quieto' para evitar huidas."
    ];

    return (
        <div className="bg-gray-50 min-h-screen pb-10">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 py-16 px-6 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative z-10 max-w-4xl mx-auto">
                    <div className="inline-block p-3 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
                        <LightbulbIcon className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4">Tips y Consejos</h1>
                    <p className="text-lg md:text-xl font-medium opacity-90 max-w-2xl mx-auto">
                        Información vital para actuar rápido ante una pérdida, saber qué hacer si encuentras una mascota y cómo prevenir accidentes.
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="max-w-5xl mx-auto px-4 -mt-8 relative z-20">
                <div className="bg-white rounded-xl shadow-md p-2 flex flex-wrap sm:flex-nowrap gap-2">
                    <button 
                        onClick={() => setActiveTab('lost')}
                        className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'lost' ? 'bg-red-100 text-red-700 shadow-sm' : 'hover:bg-gray-50 text-gray-500'}`}
                    >
                        <SearchIcon className="h-5 w-5" /> Si perdiste tu mascota
                    </button>
                    <button 
                        onClick={() => setActiveTab('found')}
                        className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'found' ? 'bg-green-100 text-green-700 shadow-sm' : 'hover:bg-gray-50 text-gray-500'}`}
                    >
                        <HeartIcon className="h-5 w-5" filled={activeTab === 'found'} /> Si encontraste una
                    </button>
                    <button 
                        onClick={() => setActiveTab('prevention')}
                        className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'prevention' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'hover:bg-gray-50 text-gray-500'}`}
                    >
                        <WarningIcon className="h-5 w-5" /> Prevención y Seguridad
                    </button>
                </div>
            </div>

            {/* Content Content */}
            <div className="max-w-5xl mx-auto px-6 mt-10 grid gap-8 animate-fade-in-up">
                
                {activeTab === 'lost' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TipCard 
                            title="Pasos Inmediatos" 
                            icon={<SearchIcon />} 
                            color="border-red-500" 
                            steps={lostTips} 
                        />
                        <div className="bg-white rounded-xl shadow-lg border-t-4 border-orange-500 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 rounded-full bg-orange-100">
                                    <PhoneIcon className="h-6 w-6 text-orange-500" />
                                </div>
                                <h3 className="font-bold text-xl text-gray-800">Cuidado con las Estafas</h3>
                            </div>
                            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                                Lamentablemente, hay personas que se aprovechan de la desesperación. 
                            </p>
                            <ul className="space-y-2 text-sm text-gray-700 font-medium">
                                <li className="flex gap-2">❌ Nunca deposites dinero por adelantado para "recuperar" a tu mascota.</li>
                                <li className="flex gap-2">❌ Desconfía si te piden códigos de verificación de WhatsApp.</li>
                                <li className="flex gap-2">✅ Pide una prueba de vida actual (foto o video específico).</li>
                                <li className="flex gap-2">✅ Encuéntrate siempre en lugares públicos y seguros.</li>
                            </ul>
                        </div>
                    </div>
                )}

                {activeTab === 'found' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TipCard 
                            title="Cómo Ayudar Correctamente" 
                            icon={<HeartIcon />} 
                            color="border-green-500" 
                            steps={foundTips} 
                        />
                        <div className="bg-white rounded-xl shadow-lg border-t-4 border-teal-500 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 rounded-full bg-teal-100">
                                    <CameraIcon className="h-6 w-6 text-teal-500" />
                                </div>
                                <h3 className="font-bold text-xl text-gray-800">La Foto Perfecta</h3>
                            </div>
                            <p className="text-gray-600 text-sm mb-4">
                                Una buena foto aumenta drásticamente las posibilidades de reencuentro.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-100 rounded-lg p-3 text-center">
                                    <span className="block text-2xl mb-1">🌤️</span>
                                    <span className="text-xs font-bold text-gray-600">Luz Natural</span>
                                </div>
                                <div className="bg-gray-100 rounded-lg p-3 text-center">
                                    <span className="block text-2xl mb-1">👀</span>
                                    <span className="text-xs font-bold text-gray-600">A nivel de ojos</span>
                                </div>
                                <div className="bg-gray-100 rounded-lg p-3 text-center">
                                    <span className="block text-2xl mb-1">🎨</span>
                                    <span className="text-xs font-bold text-gray-600">Destaca colores</span>
                                </div>
                                <div className="bg-gray-100 rounded-lg p-3 text-center">
                                    <span className="block text-2xl mb-1">🏷️</span>
                                    <span className="text-xs font-bold text-gray-600">Muestra marcas</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'prevention' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TipCard 
                            title="Seguridad Diaria" 
                            icon={<WarningIcon />} 
                            color="border-blue-500" 
                            steps={preventionTips} 
                        />
                        <div className="bg-blue-600 rounded-xl shadow-lg p-6 text-white flex flex-col justify-center items-center text-center">
                            <LightbulbIcon className="h-12 w-12 mb-4 text-yellow-300 animate-pulse" />
                            <h3 className="font-bold text-2xl mb-2">¡La prevención es clave!</h3>
                            <p className="text-blue-100 text-sm mb-6">
                                El 90% de las mascotas perdidas con placa de identificación regresan a casa en las primeras 24 horas.
                            </p>
                            <button 
                                onClick={() => navigate('/perfil')}
                                className="bg-white text-blue-600 font-bold py-3 px-6 rounded-full hover:bg-blue-50 transition-colors shadow-lg"
                            >
                                Actualizar Datos de mi Mascota
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};