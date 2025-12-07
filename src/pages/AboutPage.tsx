
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartIcon, UsersIcon, SearchIcon, HomeIcon, SparklesIcon } from '@/shared/components/icons';

// Component for Scroll Animation
const FadeInWhenVisible: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
    const [isVisible, setIsVisible] = useState(false);
    const domRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    // Unobserve after triggering to only animate once
                    if (domRef.current) observer.unobserve(domRef.current);
                }
            });
        }, { threshold: 0.1 }); // Trigger when 10% is visible

        const currentElement = domRef.current;
        if (currentElement) {
            observer.observe(currentElement);
        }

        return () => {
            if (currentElement) observer.unobserve(currentElement);
        };
    }, []);

    return (
        <div
            ref={domRef}
            className={`transition-all duration-1000 ease-out transform ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
            }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

const AboutPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-white font-sans">
            {/* Hero Section */}
            <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
                <img 
                    src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80" 
                    alt="Happy dog running" 
                    className="w-full h-full object-cover animate-fade-in"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="max-w-5xl mx-auto px-6 w-full text-center">
                        <div className="text-white">
                            {/* Slogan Updated Typography to match Heading (Extrabold, Sans, Tight) */}
                            <FadeInWhenVisible>
                                <p className="text-xl md:text-3xl font-extrabold tracking-tight uppercase mb-4 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                    "POR LOS QUE NUNCA VOLVIERON, POR LOS QUE NECESITAN VOLVER Y POR LOS QUE NUNCA DEBERIAN IRSE"
                                </p>
                            </FadeInWhenVisible>
                            
                            <FadeInWhenVisible delay={200}>
                                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                    Amor que <span className="text-purple-200">Reúne Familias.</span>
                                </h1>
                            </FadeInWhenVisible>
                            
                            <FadeInWhenVisible delay={400}>
                                <button 
                                    onClick={() => navigate('/login')}
                                    className="bg-white text-purple-900 font-bold py-4 px-10 rounded-full shadow-xl hover:bg-purple-50 transition-all transform hover:scale-105 text-lg"
                                >
                                    Únete a la Causa
                                </button>
                            </FadeInWhenVisible>
                        </div>
                    </div>
                </div>
            </div>

            {/* Impact Stats Strip */}
            <div className="bg-purple-200 py-12 text-purple-900 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white opacity-20 rounded-full translate-x-1/3 translate-y-1/3"></div>
                
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center relative z-10">
                    <FadeInWhenVisible delay={100}>
                        <div className="flex flex-col items-center space-y-2">
                            <div className="bg-white/40 p-3 rounded-full mb-2 text-purple-800">
                                <HeartIcon className="h-8 w-8" filled />
                            </div>
                            <span className="text-4xl font-black tracking-tighter text-purple-800">100%</span>
                            <span className="text-sm font-bold uppercase tracking-widest opacity-80">Compromiso</span>
                        </div>
                    </FadeInWhenVisible>
                    <FadeInWhenVisible delay={200}>
                        <div className="flex flex-col items-center space-y-2 border-l-0 md:border-l border-r-0 md:border-r border-purple-300/50">
                            <div className="bg-white/40 p-3 rounded-full mb-2 text-purple-800">
                                <UsersIcon className="h-8 w-8" />
                            </div>
                            <span className="text-4xl font-black tracking-tighter text-purple-800">+5,000</span>
                            <span className="text-sm font-bold uppercase tracking-widest opacity-80">Comunidad Activa</span>
                        </div>
                    </FadeInWhenVisible>
                    <FadeInWhenVisible delay={300}>
                        <div className="flex flex-col items-center space-y-2">
                            <div className="bg-white/40 p-3 rounded-full mb-2 text-purple-800">
                                <HomeIcon className="h-8 w-8" />
                            </div>
                            <span className="text-4xl font-black tracking-tighter text-purple-800">24/7</span>
                            <span className="text-sm font-bold uppercase tracking-widest opacity-80">Plataforma Disponible</span>
                        </div>
                    </FadeInWhenVisible>
                </div>
            </div>

            {/* Mission Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2 space-y-6">
                            <FadeInWhenVisible>
                                <div className="inline-block bg-purple-100 text-purple-700 font-bold px-4 py-1 rounded-full text-sm uppercase tracking-wide mb-2">
                                    Quiénes Somos
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                                    Más que una App, <br/>somos esperanza.
                                </h2>
                                <p className="text-lg text-gray-600 leading-relaxed">
                                    En <strong>Mas Patas</strong>, entendemos que una mascota no es solo un animal, es un miembro amado de la familia. La angustia de perder a un compañero es abrumadora, y las herramientas tradicionales ya no son suficientes.
                                </p>
                                <p className="text-lg text-gray-600 leading-relaxed">
                                    Nacimos en Perú con una misión clara: <strong>centralizar, agilizar y potenciar</strong> la búsqueda de mascotas perdidas utilizando Inteligencia Artificial y geolocalización.
                                </p>
                                <div className="pt-4">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="bg-purple-50 p-2 rounded-full text-purple-600"><SearchIcon /></div>
                                        <span className="font-semibold text-gray-800 text-lg">Búsqueda Inteligente con IA</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="bg-purple-50 p-2 rounded-full text-purple-600"><SparklesIcon /></div>
                                        <span className="font-semibold text-gray-800 text-lg">Alertas Comunitarias Inmediatas</span>
                                    </div>
                                </div>
                            </FadeInWhenVisible>
                        </div>
                        <div className="lg:w-1/2 relative">
                            <FadeInWhenVisible delay={200}>
                                <div className="absolute -top-4 -left-4 w-24 h-24 bg-purple-200 rounded-full z-0"></div>
                                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-purple-100 opacity-50 rounded-full z-0"></div>
                                <img 
                                    src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1469&q=80" 
                                    alt="Owner hugging dog" 
                                    className="rounded-3xl shadow-2xl relative z-10 w-full h-auto object-cover"
                                />
                            </FadeInWhenVisible>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-20 bg-purple-50">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeInWhenVisible>
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-purple-900 mb-4">Nuestro Estándar de Oro</h2>
                            <p className="text-xl text-gray-600">
                                Nos inspira el amor incondicional de las mascotas. Por eso, construimos una plataforma basada en tres pilares fundamentales.
                            </p>
                        </div>
                    </FadeInWhenVisible>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FadeInWhenVisible delay={100}>
                            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-purple-400 h-full">
                                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 text-purple-600">
                                    <SparklesIcon className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">Innovación</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    No solo publicamos fotos. Usamos algoritmos de reconocimiento visual (Gemini AI) para sugerir coincidencias automáticamente.
                                </p>
                            </div>
                        </FadeInWhenVisible>

                        <FadeInWhenVisible delay={200}>
                            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-fuchsia-400 h-full">
                                <div className="w-16 h-16 bg-fuchsia-100 rounded-2xl flex items-center justify-center mb-6 text-fuchsia-600">
                                    <UsersIcon className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">Comunidad</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    La tecnología no busca mascotas, las personas sí. Fomentamos una red de vecinos y veterinarias listos para actuar.
                                </p>
                            </div>
                        </FadeInWhenVisible>

                        <FadeInWhenVisible delay={300}>
                            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-pink-400 h-full">
                                <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mb-6 text-pink-500">
                                    <HeartIcon className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">Empatía</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Sabemos lo que se siente. Diseñamos cada función pensando en reducir la ansiedad del dueño y proteger el bienestar animal.
                                </p>
                            </div>
                        </FadeInWhenVisible>
                    </div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="relative py-24 bg-gray-900 text-white overflow-hidden">
                <img 
                    src="https://images.unsplash.com/photo-1518717758536-85ae29035b6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
                    alt="Dog looking up" 
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60"></div>
                
                <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                    <FadeInWhenVisible>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">¿Listo para hacer la diferencia?</h2>
                        <p className="text-xl text-gray-200 mb-10 max-w-2xl mx-auto">
                            Ya sea que hayas perdido una mascota, encontrado una, o simplemente quieras ayudar a tus vecinos. Tu participación cuenta.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button 
                                onClick={() => navigate('/login')}
                                className="bg-white text-purple-900 font-bold py-4 px-10 rounded-full text-lg shadow-lg hover:bg-purple-50 transition-colors"
                            >
                                Crear Cuenta Gratis
                            </button>
                            <button 
                                onClick={() => navigate('/')}
                                className="bg-transparent border-2 border-white text-white font-bold py-4 px-10 rounded-full text-lg hover:bg-white/10 transition-colors"
                            >
                                Ver Mascotas Perdidas
                            </button>
                        </div>
                    </FadeInWhenVisible>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;
