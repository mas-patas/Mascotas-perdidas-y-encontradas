
declare global {
    interface Window {
        gtag: (...args: any[]) => void;
    }
}

export const sendPageView = (path: string) => {
    if (typeof window.gtag === 'function') {
        window.gtag('event', 'page_view', {
            page_path: path,
        });
    }
};

export const sendEvent = (eventName: string, params?: Record<string, any>) => {
    if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, params);
    }
};

// Specific Business Events
export const trackReportPet = (status: string, animalType: string, department: string) => {
    sendEvent('generate_lead', {
        event_category: 'Report',
        pet_status: status,
        animal_type: animalType,
        location_dept: department
    });
};

export const trackPetReunited = (petId: string) => {
    sendEvent('complete_reunion', {
        event_category: 'Success',
        pet_id: petId
    });
};

export const trackContactOwner = (petId: string, method: 'chat' | 'phone_reveal') => {
    sendEvent('contact_owner', {
        event_category: 'Interaction',
        pet_id: petId,
        method: method
    });
};

export const trackShare = (method: string, contentType: 'pet' | 'campaign') => {
    sendEvent('share', {
        method: method,
        content_type: contentType,
        item_id: window.location.href
    });
};

export const trackSearch = (filters: any) => {
    // Only track if there is a meaningful filter change
    if (filters.status !== 'Todos' || filters.type !== 'Todos' || filters.department !== 'Todos') {
        sendEvent('search', {
            search_term: `${filters.status} - ${filters.type}`,
            location: filters.department
        });
    }
};
