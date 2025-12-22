
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
                                Al acceder y utilizar la plataforma "Más Patas" (Mascotas Perdidas y Encontradas), aceptas cumplir con los siguientes términos y condiciones. Si no estás de acuerdo con alguna parte de estos términos, te recomendamos no utilizar nuestros servicios.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">2. Propósito de la Plataforma</h2>
                            <p>
                                Más Patas es una herramienta comunitaria diseñada para facilitar el reencuentro de mascotas perdidas con sus dueños, promover la adopción responsable y difundir campañas de bienestar animal. No somos una agencia de seguridad, ni garantizamos la recuperación de ninguna mascota.
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
                                Más Patas actúa como intermediario tecnológico que conecta a usuarios que publican mascotas perdidas, encontradas, avistadas y en adopción con quienes interactúan con estas publicaciones. <strong>No nos responsabilizamos por:</strong>
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>La veracidad de la información publicada por otros usuarios.</li>
                                <li>Interacciones fuera de la plataforma (encuentros presenciales, transacciones monetarias).</li>
                                <li>El comportamiento de las mascotas o personas contactadas a través de la app.</li>
                                <li>Estafas, fraudes o actividades ilegales realizadas por usuarios.</li>
                                <li>Pérdidas económicas o daños derivados del uso de la plataforma.</li>
                            </ul>
                            <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r">
                                <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                                    ⚠️ Advertencia Importante sobre Estafas
                                </h3>
                                <ul className="list-disc pl-5 space-y-2 text-yellow-800">
                                    <li><strong>Nunca pagues por adelantado</strong> para recuperar una mascota. Esta es una estafa común.</li>
                                    <li><strong>Realiza encuentros en lugares públicos y seguros.</strong> Evita encuentros en lugares privados o aislados.</li>
                                    <li><strong>Verifica la identidad</strong> de las personas antes de compartir información personal o realizar transacciones.</li>
                                    <li><strong>Desconfía de ofertas demasiado buenas</strong> o que requieran pagos inmediatos.</li>
                                    <li>Si sospechas de una estafa, <strong>reporta inmediatamente</strong> a través de nuestro Centro de Soporte.</li>
                                </ul>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">6. Sistema de Reportes</h2>
                            <p>
                                Más Patas cuenta con un sistema de reportes para mantener la seguridad y calidad de la plataforma. Puedes reportar:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li><strong>Publicaciones:</strong> Contenido inapropiado, información falsa, o publicaciones que violen nuestros términos.</li>
                                <li><strong>Comentarios:</strong> Comentarios ofensivos, spam, o que no cumplan con nuestras normas de comunidad.</li>
                                <li><strong>Usuarios:</strong> Comportamiento sospechoso, acoso, o actividad fraudulenta.</li>
                            </ul>
                            <p className="mt-3">
                                Todos los reportes son revisados por nuestro equipo de moderación. Si encuentras contenido o comportamiento inapropiado, utiliza la función de reporte disponible en cada publicación, comentario o perfil de usuario. También puedes contactarnos a través del <a href="/soporte" className="text-brand-primary hover:underline font-medium">Centro de Soporte</a>.
                            </p>
                            <p className="mt-2 text-sm text-gray-600 italic">
                                El proceso de revisión puede tomar entre 24-48 horas. Te notificaremos sobre el resultado de tu reporte.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">7. Modificaciones</h2>
                            <p>
                                Nos reservamos el derecho de modificar estos términos en cualquier momento. Las actualizaciones serán efectivas inmediatamente después de su publicación en esta página.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">8. Contacto y Soporte</h2>
                            <p>
                                Si tienes dudas sobre estos términos, necesitas reportar un problema, o requieres asistencia, puedes contactarnos a través de:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li><strong>Centro de Soporte:</strong> Accede desde tu perfil o visita <a href="/soporte" className="text-brand-primary hover:underline font-medium">/soporte</a></li>
                                <li><strong>Sistema de Reportes:</strong> Utiliza la función de reporte disponible en publicaciones, comentarios y perfiles de usuario.</li>
                            </ul>
                            <p className="mt-3">
                                Estamos comprometidos a mantener una plataforma segura y confiable. Tu colaboración reportando contenido inapropiado es fundamental para la comunidad.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsPage;
