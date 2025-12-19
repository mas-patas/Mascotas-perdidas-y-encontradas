
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon } from '@/shared/components/icons';

const PrivacyPage: React.FC = () => {
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

                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Política de Privacidad</h1>
                    <p className="text-sm text-gray-500 mb-8">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}</p>

                    <div className="prose prose-purple max-w-none text-gray-700 space-y-6">
                        <section>
                            <h2 className="text-xl font-bold text-gray-900">1. Información que Recopilamos</h2>
                            <p>
                                En Mas Patas (Mascotas Perdidas y Encontradas), recopilamos la siguiente información para proporcionar nuestros servicios:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li><strong>Información de cuenta:</strong> Nombre, email, número de teléfono (opcional), y foto de perfil.</li>
                                <li><strong>Información de ubicación:</strong> Ubicación aproximada cuando publicas un reporte de mascota perdida o encontrada.</li>
                                <li><strong>Contenido generado:</strong> Fotos de mascotas, descripciones, y mensajes en chats.</li>
                                <li><strong>Datos de uso:</strong> Información sobre cómo utilizas la aplicación para mejorar nuestros servicios.</li>
                                <li><strong>Datos de autenticación:</strong> Cuando usas login social (Google, Facebook), recibimos información básica de tu perfil.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">2. Cómo Utilizamos tu Información</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Facilitar la comunicación entre usuarios para reencontrar mascotas.</li>
                                <li>Mostrar reportes de mascotas perdidas y encontradas en tu área.</li>
                                <li>Enviar notificaciones sobre posibles coincidencias o mensajes.</li>
                                <li>Mejorar nuestros servicios y experiencia de usuario.</li>
                                <li>Prevenir fraudes y mantener la seguridad de la plataforma.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">3. Compartir Información</h2>
                            <p>
                                <strong>No vendemos tus datos personales.</strong> Compartimos información únicamente en las siguientes situaciones:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li><strong>Con otros usuarios:</strong> Cuando publicas un reporte, cierta información (ubicación aproximada, fotos, descripción) es visible públicamente.</li>
                                <li><strong>Con proveedores de servicios:</strong> Utilizamos servicios como Supabase para almacenar datos y Google/Facebook para autenticación.</li>
                                <li><strong>Por requerimiento legal:</strong> Si la ley lo requiere, podemos compartir información con autoridades.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">4. Control de tu Información</h2>
                            <p>Tienes derecho a:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>Acceder a tus datos personales desde tu perfil.</li>
                                <li>Modificar o actualizar tu información en cualquier momento.</li>
                                <li>Eliminar tu cuenta y todos tus datos asociados (ver sección de Eliminación de Datos).</li>
                                <li>Elegir qué información hacer pública en tus reportes.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">5. Seguridad</h2>
                            <p>
                                Implementamos medidas de seguridad técnicas y organizativas para proteger tu información. Sin embargo, ningún sistema es 100% seguro. Te recomendamos:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>Usar contraseñas seguras.</li>
                                <li>No compartir tu información de cuenta con terceros.</li>
                                <li>Ser cauteloso al compartir información personal en chats.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">6. Cookies y Tecnologías Similares</h2>
                            <p>
                                Utilizamos cookies y tecnologías similares para mantener tu sesión activa y mejorar la funcionalidad de la aplicación. Puedes gestionar las preferencias de cookies desde tu navegador.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">7. Menores de Edad</h2>
                            <p>
                                Nuestros servicios están dirigidos a personas mayores de 18 años. Si eres menor de edad, necesitas el consentimiento de un padre o tutor para usar la aplicación.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">8. Cambios a esta Política</h2>
                            <p>
                                Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos de cambios significativos publicando la nueva política en esta página con una fecha de actualización.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">9. Eliminación de Datos</h2>
                            <p>
                                Si deseas eliminar tu cuenta y todos tus datos asociados, puedes hacerlo desde tu perfil o visitando nuestra página de <a href="/eliminacion-datos" className="text-brand-primary hover:underline font-medium">Eliminación de Datos</a>.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">10. Contacto</h2>
                            <p>
                                Si tienes preguntas sobre esta política de privacidad o sobre cómo manejamos tus datos, puedes contactarnos a través de la sección de Soporte en tu perfil.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPage;



