
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon } from '@/shared/components/icons';

const TermsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6 md:p-10">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="mb-6 flex items-center text-gray-500 hover:text-brand-primary transition-colors font-medium text-sm"
                    >
                        <ChevronLeftIcon className="h-4 w-4 mr-1" /> Volver
                    </button>

                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Términos y Condiciones</h1>
                    <p className="text-sm text-gray-500 mb-8">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}</p>

                    <div className="prose prose-purple max-w-none text-gray-700 space-y-6">
                        <section>
                            <h2 className="text-xl font-bold text-gray-900">1. Aceptación de los Términos</h2>
                            <p>
                                Al acceder y utilizar la plataforma "Pets" (Mascotas Perdidas y Encontradas), aceptas cumplir con los siguientes términos y condiciones. Si no estás de acuerdo con alguna parte de estos términos, te recomendamos no utilizar nuestros servicios.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">2. Propósito de la Plataforma</h2>
                            <p>
                                Pets es una herramienta comunitaria diseñada para facilitar el reencuentro de mascotas perdidas con sus dueños, promover la adopción responsable y difundir campañas de bienestar animal. No somos una agencia de seguridad, ni garantizamos la recuperación de ninguna mascota.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">3. Responsabilidades del Usuario</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Veracidad:</strong> Te comprometes a proporcionar información real y precisa en tus reportes y perfil.</li>
                                <li><strong>Seguridad:</strong> Eres responsable de mantener la confidencialidad de tu cuenta y contraseña.</li>
                                <li><strong>Uso Ético:</strong> Queda prohibido el uso de la plataforma para fraudes, estafas, venta de animales, spam o cualquier actividad ilegal.</li>
                                <li><strong>Contenido:</strong> No debes subir imágenes ofensivas, violentas o que no estén relacionadas con el propósito de la app.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">4. Privacidad y Datos Personales</h2>
                            <p>
                                Recopilamos datos mínimos necesarios (nombre, contacto, ubicación) para facilitar la comunicación entre usuarios.
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>Al publicar un reporte, aceptas que cierta información (como la ubicación aproximada y fotos de la mascota) sea pública.</li>
                                <li>Tienes la opción de mostrar u ocultar tu número de teléfono públicamente.</li>
                                <li>No vendemos tus datos a terceros.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">5. Limitación de Responsabilidad</h2>
                            <p>
                                Pets actúa como intermediario tecnológico. No nos hacemos responsables por:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>La veracidad de la información publicada por otros usuarios.</li>
                                <li>Interacciones fuera de la plataforma (encuentros presenciales, transacciones monetarias).</li>
                                <li>El comportamiento de las mascotas o personas contactadas a través de la app.</li>
                            </ul>
                            <p className="mt-2 font-bold text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">
                                Recomendamos encarecidamente realizar cualquier encuentro en lugares públicos y seguros, y nunca realizar pagos por adelantado para "recuperar" una mascota.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">6. Modificaciones</h2>
                            <p>
                                Nos reservamos el derecho de modificar estos términos en cualquier momento. Las actualizaciones serán efectivas inmediatamente después de su publicación en esta página.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">7. Contacto</h2>
                            <p>
                                Si tienes dudas sobre estos términos o necesitas reportar un problema grave, puedes contactarnos a través de la sección de Soporte en tu perfil.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsPage;
