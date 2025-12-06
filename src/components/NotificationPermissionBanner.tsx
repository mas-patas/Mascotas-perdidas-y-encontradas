
import React, { useState, useEffect } from 'react';
import { BellIcon, XCircleIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';

// Helper to convert VAPID key for the browser
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// TODO: Generate VAPID keys using `npx web-push generate-vapid-keys` and paste the Public Key here.
const PUBLIC_VAPID_KEY = ''; 

const NotificationPermissionBanner: React.FC = () => {
    const [showBanner, setShowBanner] = useState(false);
    const { currentUser } = useAuth();

    useEffect(() => {
        // Only show if supported, permission is default (not granted/denied), and user is logged in
        if ('Notification' in window && Notification.permission === 'default' && currentUser) {
            const timer = setTimeout(() => setShowBanner(true), 3000);
            return () => clearTimeout(timer);
        }
    }, [currentUser]);

    const handleRequestPermission = async () => {
        if (!currentUser) return;

        try {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                // 1. Get Service Worker Registration
                if ('serviceWorker' in navigator) {
                    const registration = await navigator.serviceWorker.ready;
                    
                    try {
                        let subscription = await registration.pushManager.getSubscription();

                        // 2. Subscribe if not already subscribed
                        if (!subscription) {
                            if (PUBLIC_VAPID_KEY) {
                                const convertedVapidKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY);
                                subscription = await registration.pushManager.subscribe({
                                    userVisibleOnly: true,
                                    applicationServerKey: convertedVapidKey
                                });
                            } else {
                                console.warn("Falta PUBLIC_VAPID_KEY en NotificationPermissionBanner.tsx. La suscripción remota no se creará, pero las notificaciones locales funcionarán.");
                            }
                        }

                        // 3. Save Subscription to Supabase
                        if (subscription) {
                            // Serialize subscription to get keys
                            const subData = JSON.parse(JSON.stringify(subscription));
                            
                            const { error } = await supabase.from('push_subscriptions').upsert({
                                user_id: currentUser.id,
                                endpoint: subData.endpoint,
                                p256dh: subData.keys.p256dh,
                                auth: subData.keys.auth,
                            }, { onConflict: 'endpoint' });

                            if (error) {
                                console.error("Error guardando suscripción en BD:", error);
                            } else {
                                console.log("Suscripción Web Push guardada exitosamente.");
                            }
                        }
                    } catch (subError) {
                        console.error("Error durante la suscripción al PushManager:", subError);
                    }
                }

                // 4. Show confirmation (Local Notification)
                // This works even without VAPID keys to give user feedback
                new Notification("¡Notificaciones activadas!", {
                    body: "Te avisaremos cuando haya novedades importantes sobre mascotas.",
                    icon: "https://placehold.co/192x192/1D4ED8/ffffff?text=Pets"
                });
            }
            
            setShowBanner(false);
        } catch (error) {
            console.error("Error requesting notification permission", error);
        }
    };

    if (!showBanner || !currentUser) return null;

    return (
        <div className="bg-brand-dark text-white p-4 shadow-lg relative animate-slide-in-right z-50">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-full">
                        <BellIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <p className="font-bold">¿Quieres recibir alertas en tiempo real?</p>
                        <p className="text-sm text-blue-200">Activa las notificaciones para saber si alguien comenta tu publicación o reporta una mascota similar.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowBanner(false)}
                        className="text-sm text-blue-200 hover:text-white underline"
                    >
                        Ahora no
                    </button>
                    <button 
                        onClick={handleRequestPermission}
                        className="bg-brand-secondary text-brand-dark px-4 py-2 rounded-full font-bold hover:bg-amber-400 transition-colors shadow-md text-sm"
                    >
                        Activar Notificaciones
                    </button>
                </div>
            </div>
            <button 
                onClick={() => setShowBanner(false)}
                className="absolute top-2 right-2 text-white/50 hover:text-white"
            >
                <XCircleIcon className="h-5 w-5" />
            </button>
        </div>
    );
};

export default NotificationPermissionBanner;
