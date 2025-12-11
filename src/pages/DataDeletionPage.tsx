
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon } from '@/shared/components/icons';

const DataDeletionPage: React.FC = () => {
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

                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Eliminación de Datos de Usuario</h1>
                    <p className="text-sm text-gray-500 mb-8">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}</p>

                    <div className="prose prose-purple max-w-none text-gray-700 space-y-6">
                        <section>
                            <h2 className="text-xl font-bold text-gray-900">Derecho a Eliminar tus Datos</h2>
                            <p>
                                Tienes derecho a solicitar la eliminación de todos tus datos personales de nuestra plataforma. Esta página explica cómo puedes hacerlo.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">Cómo Eliminar tu Cuenta y Datos</h2>
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                                <h3 className="font-bold text-blue-900 mb-2">Opción 1: Desde tu Perfil</h3>
                                <ol className="list-decimal pl-5 space-y-2 text-blue-800">
                                    <li>Inicia sesión en tu cuenta.</li>
                                    <li>Ve a tu Perfil (haz clic en tu foto de perfil).</li>
                                    <li>Busca la opción "Eliminar Cuenta" o "Eliminar Datos".</li>
                                    <li>Confirma la eliminación siguiendo las instrucciones.</li>
                                </ol>
                            </div>

                            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                                <h3 className="font-bold text-green-900 mb-2">Opción 2: Contacto Directo</h3>
                                <p className="text-green-800">
                                    Si no puedes acceder a tu cuenta o prefieres hacerlo manualmente, puedes contactarnos a través de la sección de Soporte en la aplicación. Incluye en tu solicitud:
                                </p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-green-800">
                                    <li>Tu email asociado a la cuenta</li>
                                    <li>Tu nombre de usuario (si lo recuerdas)</li>
                                    <li>La solicitud explícita de eliminación de datos</li>
                                </ul>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">¿Qué Datos se Eliminan?</h2>
                            <p>Cuando eliminas tu cuenta, se eliminará permanentemente:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li><strong>Datos de perfil:</strong> Nombre, email, teléfono, foto de perfil, y otra información personal.</li>
                                <li><strong>Reportes de mascotas:</strong> Todos los reportes que hayas creado (perdidas, encontradas, en adopción).</li>
                                <li><strong>Mensajes y chats:</strong> Todas las conversaciones que hayas tenido con otros usuarios.</li>
                                <li><strong>Comentarios y likes:</strong> Todos los comentarios y reacciones que hayas hecho.</li>
                                <li><strong>Búsquedas guardadas:</strong> Cualquier búsqueda guardada que hayas configurado.</li>
                                <li><strong>Notificaciones:</strong> Historial de notificaciones.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">Datos que Pueden Permanecer</h2>
                            <p>
                                Algunos datos pueden permanecer por razones legales o técnicas:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li><strong>Backups:</strong> Los datos pueden existir en copias de seguridad por hasta 30 días antes de ser eliminados permanentemente.</li>
                                <li><strong>Registros de actividad:</strong> Información anónima sobre actividad general (sin datos personales) puede mantenerse para análisis.</li>
                                <li><strong>Información requerida por ley:</strong> Si la ley lo requiere, podemos mantener cierta información por períodos específicos.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">Tiempo de Procesamiento</h2>
                            <p>
                                Las solicitudes de eliminación de datos se procesan dentro de <strong>30 días hábiles</strong> desde la fecha de solicitud. Recibirás una confirmación por email una vez completado el proceso.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">Eliminación de Datos de Terceros</h2>
                            <p>
                                Si te registraste usando Google o Facebook, también puedes eliminar los permisos de acceso desde:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li><strong>Google:</strong> <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">myaccount.google.com/permissions</a></li>
                                <li><strong>Facebook:</strong> <a href="https://www.facebook.com/settings?tab=applications" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">facebook.com/settings?tab=applications</a></li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">Importante</h2>
                            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                                <p className="text-yellow-800 font-medium">
                                    <strong>⚠️ Advertencia:</strong> La eliminación de tu cuenta es <strong>permanente e irreversible</strong>. Una vez eliminada, no podrás recuperar tus datos ni tu cuenta. Asegúrate de descargar cualquier información importante antes de proceder.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900">Contacto</h2>
                            <p>
                                Si tienes preguntas sobre la eliminación de datos o necesitas ayuda con el proceso, puedes contactarnos a través de la sección de Soporte en la aplicación.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataDeletionPage;

