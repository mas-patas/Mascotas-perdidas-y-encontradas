

import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { PetList } from './components/PetList';
import { ReportPetForm } from './components/ReportPetForm';
import { PetDetailModal } from './components/PetDetailModal';
import type { Pet, PetStatus, AnimalType, PetSize, Chat, Message, User, UserRole, PotentialMatch, UserStatus, OwnedPet, Report, ReportReason, ReportType, ReportStatus as ReportStatusType, ReportPostSnapshot, SupportTicket, SupportTicketStatus, SupportTicketCategory, Notification } from './types';
import { PET_STATUS, ANIMAL_TYPES, SIZES, USER_ROLES, USER_STATUS, REPORT_STATUS, SUPPORT_TICKET_STATUS } from './constants';
import { useAuth } from './contexts/AuthContext';
import ProfilePage from './components/ProfilePage';
import { FilterControls } from './components/FilterControls';
import MessagesPage from './components/MessagesPage';
import ChatPage from './components/ChatPage';
import AdminDashboard from './components/AdminDashboard';
import { findMatchingPets } from './services/geminiService';
import { PotentialMatchesModal } from './components/PotentialMatchesModal';
import { FlyerModal } from './components/FlyerModal';
import { ReportAdoptionForm } from './components/ReportAdoptionForm';
import { initialUsersForDemo } from './data/users';
import AdminUserDetailModal from './components/AdminUserDetailModal';
import SupportPage from './components/SupportPage';

const initialPets: Pet[] = [
    // 10 Mascotas Perdidas
    {
        id: '1',
        status: PET_STATUS.PERDIDO,
        name: 'Buddy',
        animalType: ANIMAL_TYPES.PERRO,
        breed: 'Golden Retriever',
        color: 'Dorado',
        size: SIZES.GRANDE,
        location: 'Parque Central, Lima',
        date: '2024-07-15T10:00:00Z',
        contact: '555-1234',
        description: 'Muy amigable, llevaba un collar rojo. Se asusta con los ruidos fuertes.',
        imageUrls: ['https://picsum.photos/seed/buddy/400/400', 'https://picsum.photos/seed/buddy2/400/400'],
        userEmail: 'user1@example.com'
    },
    {
        id: '4',
        status: PET_STATUS.PERDIDO,
        name: 'Luna',
        animalType: ANIMAL_TYPES.GATO,
        breed: 'Siamés',
        color: 'Crema',
        size: SIZES.PEQUENO,
        location: 'Miraflores, Lima',
        date: '2024-07-20T18:00:00Z',
        contact: '555-1111',
        description: 'Tiene ojos azules y es muy vocal. Se escapó por la ventana.',
        imageUrls: ['https://picsum.photos/seed/luna_lost/400/400'],
        userEmail: 'user4@example.com'
    },
    {
        id: '5',
        status: PET_STATUS.PERDIDO,
        name: 'Max',
        animalType: ANIMAL_TYPES.PERRO,
        breed: 'Pastor Alemán',
        color: 'Negro y Fuego',
        size: SIZES.GRANDE,
        location: 'San Borja, Lima',
        date: '2024-07-21T08:00:00Z',
        contact: '555-2222',
        description: 'Entrenado y obediente, pero puede ser tímido con extraños. Tiene una pequeña cicatriz en la oreja derecha.',
        imageUrls: ['https://picsum.photos/seed/max_lost/400/400'],
        userEmail: 'user5@example.com'
    },
    {
        id: '6',
        status: PET_STATUS.PERDIDO,
        name: 'Rocky',
        animalType: ANIMAL_TYPES.PERRO,
        breed: 'Bulldog',
        color: 'Atigrado',
        size: SIZES.MEDIANO,
        location: 'Barranco, Lima',
        date: '2024-07-19T22:00:00Z',
        contact: '555-3333',
        description: 'Juguetón y le encanta la gente. Llevaba un arnés azul.',
        imageUrls: ['https://picsum.photos/seed/rocky_lost/400/400'],
        userEmail: 'user6@example.com'
    },
    {
        id: '7',
        status: PET_STATUS.PERDIDO,
        name: 'Milo',
        animalType: ANIMAL_TYPES.GATO,
        breed: 'Mestizo',
        color: 'Naranja',
        size: SIZES.MEDIANO,
        location: 'Yanahuara, Arequipa',
        date: '2024-07-18T14:00:00Z',
        contact: '555-4444',
        description: 'Gato muy cariñoso, tiene la punta de la cola blanca.',
        imageUrls: ['https://picsum.photos/seed/milo_lost/400/400'],
        userEmail: 'user7@example.com'
    },
    {
        id: '8',
        status: PET_STATUS.PERDIDO,
        name: 'Thor',
        animalType: ANIMAL_TYPES.PERRO,
        breed: 'Husky Siberiano',
        color: 'Blanco y Negro',
        size: SIZES.GRANDE,
        location: 'Cusco (Cercado)',
        date: '2024-07-22T11:00:00Z',
        contact: '555-5555',
        description: 'Tiene un ojo azul y uno marrón. Es muy activo y fuerte.',
        imageUrls: ['https://picsum.photos/seed/thor_lost/400/400'],
        userEmail: 'user8@example.com'
    },
    {
        id: '9',
        status: PET_STATUS.PERDIDO,
        name: 'Nina',
        animalType: ANIMAL_TYPES.PERRO,
        breed: 'Chihuahua',
        color: 'Canela',
        size: SIZES.PEQUENO,
        location: 'Trujillo (Centro)',
        date: '2024-07-20T09:30:00Z',
        contact: '555-6666',
        description: 'Muy pequeña y temblorosa. Se asusta fácilmente. Llevaba un vestido rosa.',
        imageUrls: ['https://picsum.photos/seed/nina_lost/400/400'],
        userEmail: 'user9@example.com'
    },
    {
        id: '10',
        status: PET_STATUS.PERDIDO,
        name: 'Simba',
        animalType: ANIMAL_TYPES.GATO,
        breed: 'Maine Coon',
        color: 'Marrón Atigrado',
        size: SIZES.GRANDE,
        location: 'Chiclayo (Cercado)',
        date: '2024-07-17T17:00:00Z',
        contact: '555-7777',
        description: 'Gato grande y peludo con una cola muy frondosa. Es amigable.',
        imageUrls: ['https://picsum.photos/seed/simba_lost/400/400'],
        userEmail: 'user10@example.com'
    },
    {
        id: '11',
        status: PET_STATUS.PERDIDO,
        name: 'Coco',
        animalType: ANIMAL_TYPES.PERRO,
        breed: 'Poodle',
        color: 'Blanco',
        size: SIZES.PEQUENO,
        location: 'Piura (Cercado)',
        date: '2024-07-21T13:00:00Z',
        contact: '555-8888',
        description: 'Recién peluqueado. Llevaba un collar con un cascabel.',
        imageUrls: ['https://picsum.photos/seed/coco_lost/400/400'],
        userEmail: 'user11@example.com'
    },
    {
        id: '12',
        status: PET_STATUS.PERDIDO,
        name: 'Zoe',
        animalType: ANIMAL_TYPES.GATO,
        breed: 'Angora Turco',
        color: 'Blanco',
        size: SIZES.MEDIANO,
        location: 'San Isidro, Lima',
        date: '2024-07-22T06:00:00Z',
        contact: '555-9999',
        description: 'Pelaje largo y sedoso. Ojos de diferente color (uno verde, uno azul).',
        imageUrls: ['https://picsum.photos/seed/zoe_lost/400/400'],
        userEmail: 'user12@example.com'
    },

    // 10 Mascotas Encontradas
    {
        id: '2',
        status: PET_STATUS.ENCONTRADO,
        name: 'Desconocido',
        animalType: ANIMAL_TYPES.GATO,
        breed: 'Siamés',
        color: 'Crema con puntos oscuros',
        size: SIZES.PEQUENO,
        location: 'Calle Falsa 123, Miraflores, Lima',
        date: '2024-07-16T15:30:00Z',
        contact: '555-5678',
        description: 'Gato joven encontrado, parece asustado pero es dócil. Tiene ojos azules.',
        imageUrls: ['https://picsum.photos/seed/luna/400/400'],
        userEmail: 'user2@example.com'
    },
    {
        id: '13',
        status: PET_STATUS.ENCONTRADO,
        name: 'Desconocido',
        animalType: ANIMAL_TYPES.PERRO,
        breed: 'Labrador Retriever',
        color: 'Negro',
        size: SIZES.GRANDE,
        location: 'La Molina, Lima',
        date: '2024-07-22T19:00:00Z',
        contact: '555-1313',
        description: 'Perro adulto, bien cuidado. Llevaba un collar de cuero pero sin placa. Muy enérgico.',
        imageUrls: ['https://picsum.photos/seed/found_dog1/400/400'],
        userEmail: 'user13@example.com'
    },
    {
        id: '14',
        status: PET_STATUS.ENCONTRADO,
        name: 'Desconocido',
        animalType: ANIMAL_TYPES.GATO,
        breed: 'Mestizo',
        color: 'Tricolor',
        size: SIZES.PEQUENO,
        location: 'Cercado, Arequipa',
        date: '2024-07-21T12:00:00Z',
        contact: '555-1414',
        description: 'Gatita muy cariñosa, parece haber sido mascota de casa. Está limpia y bien alimentada.',
        imageUrls: ['https://picsum.photos/seed/found_cat1/400/400'],
        userEmail: 'user14@example.com'
    },
    {
        id: '15',
        status: PET_STATUS.ENCONTRADO,
        name: 'Desconocido',
        animalType: ANIMAL_TYPES.PERRO,
        breed: 'Schnauzer',
        color: 'Gris',
        size: SIZES.PEQUENO,
        location: 'Wanchaq, Cusco',
        date: '2024-07-20T16:45:00Z',
        contact: '555-1515',
        description: 'Parece mayor, camina lento. No tiene collar. Muy tranquilo.',
        imageUrls: ['https://picsum.photos/seed/found_dog2/400/400'],
        userEmail: 'user15@example.com'
    },
    {
        id: '16',
        status: PET_STATUS.ENCONTRADO,
        name: 'Desconocido',
        animalType: ANIMAL_TYPES.GATO,
        breed: 'British Shorthair',
        color: 'Gris',
        size: SIZES.MEDIANO,
        location: 'Huanchaco, Trujillo',
        date: '2024-07-19T10:00:00Z',
        contact: '555-1616',
        description: 'Gato robusto, cara redonda. Un poco desconfiado al principio.',
        imageUrls: ['https://picsum.photos/seed/found_cat2/400/400'],
        userEmail: 'user16@example.com'
    },
    {
        id: '17',
        status: PET_STATUS.ENCONTRADO,
        name: 'Desconocido',
        animalType: ANIMAL_TYPES.PERRO,
        breed: 'Beagle',
        color: 'Tricolor',
        size: SIZES.MEDIANO,
        location: 'Pimentel, Chiclayo',
        date: '2024-07-22T14:20:00Z',
        contact: '555-1717',
        description: 'Cachorro, muy juguetón y ruidoso. Encontrado cerca de la playa.',
        imageUrls: ['https://picsum.photos/seed/found_dog3/400/400'],
        userEmail: 'user17@example.com'
    },
    {
        id: '18',
        status: PET_STATUS.ENCONTRADO,
        name: 'Desconocido',
        animalType: ANIMAL_TYPES.GATO,
        breed: 'Persa',
        color: 'Blanco',
        size: SIZES.MEDIANO,
        location: 'Castilla, Piura',
        date: '2024-07-21T07:00:00Z',
        contact: '555-1818',
        description: 'Pelaje largo y enredado. Parece perdido hace tiempo. Cara chata característica.',
        imageUrls: ['https://picsum.photos/seed/found_cat3/400/400'],
        userEmail: 'user18@example.com'
    },
    {
        id: '19',
        status: PET_STATUS.ENCONTRADO,
        name: 'Desconocido',
        animalType: ANIMAL_TYPES.PERRO,
        breed: 'Mestizo',
        color: 'Marrón',
        size: SIZES.MEDIANO,
        location: 'Santiago de Surco, Lima',
        date: '2024-07-20T23:00:00Z',
        contact: '555-1919',
        description: 'Perrita encontrada en la noche. Tiene collar pero sin datos. Es muy buena.',
        imageUrls: ['https://picsum.photos/seed/found_dog4/400/400'],
        userEmail: 'user19@example.com'
    },
    {
        id: '20',
        status: PET_STATUS.ENCONTRADO,
        name: 'Desconocido',
        animalType: ANIMAL_TYPES.GATO,
        breed: 'Ragdoll',
        color: 'Bicolor',
        size: SIZES.GRANDE,
        location: 'Cayma, Arequipa',
        date: '2024-07-18T13:15:00Z',
        contact: '555-2020',
        description: 'Gato grande y muy dócil, se deja cargar. Ojos azules intensos.',
        imageUrls: ['https://picsum.photos/seed/found_cat4/400/400'],
        userEmail: 'user20@example.com'
    },
    {
        id: '21',
        status: PET_STATUS.ENCONTRADO,
        name: 'Desconocido',
        animalType: ANIMAL_TYPES.PERRO,
        breed: 'Pug',
        color: 'Dorado',
        size: SIZES.PEQUENO,
        location: 'Jesús María, Lima',
        date: '2024-07-22T16:00:00Z',
        contact: '555-2121',
        description: 'Encontrado en un parque, respira con dificultad. Parece mayor.',
        imageUrls: ['https://picsum.photos/seed/found_dog5/400/400'],
        userEmail: 'user21@example.com'
    },

    // 10 Mascotas Avistadas
    {
        id: '3',
        status: PET_STATUS.AVISTADO,
        name: 'Desconocido',
        animalType: ANIMAL_TYPES.PERRO,
        breed: 'Mestizo',
        color: 'Negro y blanco',
        size: SIZES.MEDIANO,
        location: 'Av. Principal cerca del puente, Arequipa',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        contact: 'No aplica',
        description: 'Perro de tamaño mediano visto deambulando solo. Parece perdido.',
        imageUrls: ['https://picsum.photos/seed/avistado/400/400'],
        userEmail: 'user3@example.com'
    },
    {
        id: '22',
        status: PET_STATUS.AVISTADO,
        name: 'Desconocido',
        animalType: ANIMAL_TYPES.GATO,
        breed: 'Mestizo',
        color: 'Negro',
        size: SIZES.MEDIANO,
        location: 'Tejado de un mercado, Cusco',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        contact: 'No aplica',
        description: 'Gato negro visto en el tejado, no se deja acercar. Parece sano.',
        imageUrls: ['https://picsum.photos/seed/sighted_cat1/400/400'],
        userEmail: 'user22@example.com'
    },
    {
        id: '23',
        status: PET_STATUS.AVISTADO,
        name: 'Desconocido',
        animalType: ANIMAL_TYPES.PERRO,
        breed: 'Dálmata',
        color: 'Blanco',
        size: SIZES.GRANDE,
        location: 'Malecón, Miraflores, Lima',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        contact: 'No aplica',
        description: 'Dálmata sin collar corriendo por el malecón. No pude detenerlo.',
        imageUrls: ['https://picsum.photos/seed/sighted_dog1/400/400'],
        userEmail: 'user23@example.com'
    },
    {
        id: '24',
        status: PET_STATUS.AVISTADO,
        name: 'Desconocido',
        animalType: ANIMAL_TYPES.GATO,
        breed: 'Mestizo',
        color: 'Atigrado',
        size: SIZES.MEDIANO,
        location: 'Cerca de un restaurante, Trujillo',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        contact: 'No aplica',
        description: 'Gato atigrado gris merodeando. Busca comida.',
        imageUrls: ['https://picsum.photos/seed/sighted_cat2/400/400'],
        userEmail: 'user24@example.com'
    },
    {
        id: '25',
        status: PET_STATUS.AVISTADO,
        name: 'Desconocido',
        animalType: ANIMAL_TYPES.PERRO,
        breed: 'Golden Retriever',
        color: 'Dorado',
        size: SIZES.GRANDE,
        location: 'Corriendo asustado, San Borja, Lima',
        date: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
        contact: 'No aplica',
        description: 'Visto corriendo muy asustado por la Av. Aviación. Podría ser Buddy.',
        imageUrls: ['https://picsum.photos/seed/sighted_dog2/400/400'],
        userEmail: 'user25@example.com'
    },
    {
        id: '26',
        status: PET_STATUS.AVISTADO,
        name: 'Desconocido',
        animalType: ANIMAL_TYPES.PERRO,
        breed: 'Mestizo',
        color: 'Marrón',
        size: SIZES.PEQUENO,
        location: 'Deambulando por la plaza, Chiclayo',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        contact: 'No aplica',
        description: 'Perrito pequeño de pelo claro. Parece perdido y desorientado.',
        imageUrls: ['https://picsum.photos/seed/sighted_dog3/400/400'],
        userEmail: 'user26@example.com'
    },
    {
        id: '27',
        status: PET_STATUS.AVISTADO,
        name: 'Desconocido',
        animalType: ANIMAL_TYPES.GATO,
        breed: 'Mestizo',
        color: 'Naranja',
        size: SIZES.PEQUENO,
        location: 'En un parque, Piura',
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        contact: 'No aplica',
        description: 'Gatito naranja jugando solo en un parque. No vi a su madre.',
        imageUrls: ['https://picsum.photos/seed/sighted_cat3/400/400'],
        userEmail: 'user27@example.com'
    },
    {
        id: '28',
        status: PET_STATUS.AVISTADO,
        name: 'Desconocido',
        animalType: ANIMAL_TYPES.PERRO,
        breed: 'Boxer',
        color: 'Marrón',
        size: SIZES.GRANDE,
        location: 'Cerca de un colegio, Yanahuara, Arequipa',
        date: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
        contact: 'No aplica',
        description: 'Boxer adulto, parece buscar a alguien. Tenía un collar rojo.',
        imageUrls: ['https://picsum.photos/seed/sighted_dog4/400/400'],
        userEmail: 'user28@example.com'
    },
    {
        id: '29',
        status: PET_STATUS.AVISTADO,
        name: 'Desconocido',
        animalType: ANIMAL_TYPES.GATO,
        breed: 'Siamés',
        color: 'Crema',
        size: SIZES.MEDIANO,
        location: 'Cerca de la estación de tren, Wanchaq, Cusco',
        date: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
        contact: 'No aplica',
        description: 'Un gato con rasgos de siamés, muy delgado.',
        imageUrls: ['https://picsum.photos/seed/sighted_cat4/400/400'],
        userEmail: 'user29@example.com'
    },
    {
        id: '30',
        status: PET_STATUS.AVISTADO,
        name: 'Desconocido',
        animalType: ANIMAL_TYPES.PERRO,
        breed: 'Pastor Alemán',
        color: 'Negro y Fuego',
        size: SIZES.GRANDE,
        location: 'Cerca de un puente, Lima',
        date: new Date(Date.now() - 0.2 * 24 * 60 * 60 * 1000).toISOString(),
        contact: 'No aplica',
        description: 'Visto cojeando. Parecía herido y asustado. No me pude acercar.',
        imageUrls: ['https://picsum.photos/seed/sighted_dog5/400/400'],
        userEmail: 'user30@example.com'
    },
];


const initialChats: Chat[] = [
    {
        id: 'chat1',
        petId: '1',
        participantEmails: ['user2@example.com', 'user1@example.com'],
        messages: [
            { senderEmail: 'user2@example.com', text: 'Hola, vi que perdiste a tu Golden Retriever. Creo que lo vi cerca del parque.', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString() },
            { senderEmail: 'user1@example.com', text: '¡Hola! ¿En serio? ¿Podrías darme más detalles? Estoy muy preocupado.', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() }
        ],
        lastReadTimestamps: {
            'user1@example.com': new Date().toISOString()
        }
    }
];

const App: React.FC = () => {
    const { currentUser, isGhosting, ghostLogin, stopGhosting, unsavePet } = useAuth();
    const [currentPage, setCurrentPage] = useState<'list' | 'profile' | 'messages' | 'chat' | 'admin' | 'support'>('list');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAdoptionModalOpen, setIsAdoptionModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [initialStatusForReport, setInitialStatusForReport] = useState<PetStatus>(PET_STATUS.PERDIDO);
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [petToEdit, setPetToEdit] = useState<Pet | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [viewingUser, setViewingUser] = useState<User | null>(null);
    const [petForFlyer, setPetForFlyer] = useState<Pet | null>(null);
    
    const [isFindingMatches, setIsFindingMatches] = useState(false);
    const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[] | null>(null);
    const [pendingPetReport, setPendingPetReport] = useState<Omit<Pet, 'id' | 'userEmail'> | null>(null);
    const [petToReportFromProfile, setPetToReportFromProfile] = useState<OwnedPet | null>(null);
    
    const [pets, setPets] = useState<Pet[]>(() => {
        try {
            const savedPets = localStorage.getItem('pets');
            const parsedPets = savedPets ? JSON.parse(savedPets) : initialPets;

            if (Array.isArray(parsedPets)) {
                // Sanitize data to prevent crashes from malformed legacy data.
                // The most common issue is missing or empty `imageUrls`.
                return parsedPets
                    .filter(p => p && p.id) // Ensure pet object and id exist
                    .map(p => ({
                        ...p,
                        imageUrls: (p.imageUrls && p.imageUrls.length > 0) 
                            ? p.imageUrls 
                            : ['https://placehold.co/400x400/CCCCCC/FFFFFF?text=Sin+Imagen'],
                        size: p.size || SIZES.MEDIANO, // Also good to have a fallback for size
                    }));
            }
            return initialPets; // Return default if data is malformed
        } catch (error) {
            console.error('Error parsing pets from localStorage:', error);
            return initialPets;
        }
    });

    const [chats, setChats] = useState<Chat[]>(() => {
        try {
            const savedChats = localStorage.getItem('chats');
            const parsedChats = savedChats ? JSON.parse(savedChats) : initialChats;
             // Ensure all chats have the new `lastReadTimestamps` field
            return parsedChats.map((chat: Chat) => ({
                ...chat,
                lastReadTimestamps: chat.lastReadTimestamps || {},
            }));
        } catch (error) {
            console.error('Error parsing chats from localStorage:', error);
            return initialChats;
        }
    });

    const [reports, setReports] = useState<Report[]>(() => {
        try {
            const savedReports = localStorage.getItem('reports');
            return savedReports ? JSON.parse(savedReports) : [];
        } catch (error) {
            console.error('Error parsing reports from localStorage:', error);
            return [];
        }
    });

    const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
        try {
            const saved = localStorage.getItem('supportTickets');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error parsing support tickets from localStorage:', error);
            return [];
        }
    });

    const [notifications, setNotifications] = useState<Notification[]>(() => {
        try {
            const saved = localStorage.getItem('notifications');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error parsing notifications from localStorage:', error);
            return [];
        }
    });
    
    useEffect(() => {
        try {
            // Data is seeded and migrated by AuthProvider. Just load it for display.
            const allUsersData = JSON.parse(localStorage.getItem('users') || '{}');
            const userProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');

            const loadedUsers = Object.keys(allUsersData).map((email): User => {
                const profile = userProfiles[email] || {};
                return {
                    email,
                    // The role is now guaranteed to be in the profile by AuthContext
                    ...profile,
                    role: profile.role || USER_ROLES.USER, // Add fallback just in case
                    status: profile.status || USER_STATUS.ACTIVE,
                };
            });
            setUsers(loadedUsers);
        } catch (error) {
            console.error('Failed to load users for App component display', error);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('pets', JSON.stringify(pets));
    }, [pets]);

    useEffect(() => {
        localStorage.setItem('chats', JSON.stringify(chats));
    }, [chats]);

    useEffect(() => {
        localStorage.setItem('reports', JSON.stringify(reports));
    }, [reports]);

    useEffect(() => {
        localStorage.setItem('supportTickets', JSON.stringify(supportTickets));
    }, [supportTickets]);

    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }, [notifications]);

    const [filters, setFilters] = useState<{
        status: PetStatus | 'Todos',
        type: AnimalType | 'Todos',
        breed: string,
        color1: string,
        color2: string,
        size: PetSize | 'Todos'
    }>({ status: 'Todos', type: 'Todos', breed: 'Todos', color1: 'Todos', color2: 'Todos', size: 'Todos' });
    
    const handleOpenReportModal = (status: PetStatus) => {
        setPetToEdit(null);
        setPetToReportFromProfile(null);
        setInitialStatusForReport(status);
        setIsModalOpen(true);
    };

    const handleOpenReportFromProfile = (pet: OwnedPet) => {
        setPetToReportFromProfile(pet);
        setInitialStatusForReport(PET_STATUS.PERDIDO);
        setIsModalOpen(true);
    };

    const handleOpenAdoptionModal = () => {
        setIsAdoptionModalOpen(true);
    };

    const handleSaveAdoption = (petData: Omit<Pet, 'id' | 'userEmail'>) => {
        if (!currentUser) return;
        
        const newPet: Pet = { 
            ...petData, 
            id: new Date().toISOString(), 
            userEmail: currentUser.email,
        };
        setPets(prevPets => [newPet, ...prevPets]);
        setIsAdoptionModalOpen(false);
    };
    
    const handleOpenEditModal = (pet: Pet) => {
        setPetToEdit(pet);
        setInitialStatusForReport(pet.status);
        setSelectedPet(null);
        setIsModalOpen(true);
    };

    const handleFinalizeReport = () => {
        if (!pendingPetReport || !currentUser) return;
        const newPet: Pet = { ...pendingPetReport, id: new Date().toISOString(), userEmail: currentUser.email };
        setPets(prevPets => [newPet, ...prevPets]);
        setPendingPetReport(null);
        setPotentialMatches(null);
    };

    const handleSavePet = async (petData: Omit<Pet, 'id' | 'userEmail'>, idToUpdate?: string) => {
        if (!currentUser) return;
        
        if (idToUpdate) {
            const updatedPet: Pet = { ...petData, id: idToUpdate, userEmail: currentUser.email };
            setPets(prevPets => prevPets.map(p => p.id === idToUpdate ? updatedPet : p));
            setIsModalOpen(false);
            setPetToEdit(null);
            return;
        }
        
        if (petData.status === PET_STATUS.PERDIDO) {
            setIsModalOpen(false);
            setIsFindingMatches(true);
            setPendingPetReport(petData);

            const candidatePets = pets.filter(p => p.status === PET_STATUS.ENCONTRADO || p.status === PET_STATUS.AVISTADO);
            
            try {
                const matches = await findMatchingPets(petData, candidatePets);
                if (matches.length > 0) {
                    setPotentialMatches(matches);
                } else {
                    handleFinalizeReport();
                }
            } catch (error) {
                console.error("Failed to find matches:", error);
                handleFinalizeReport(); 
            } finally {
                setIsFindingMatches(false);
            }
        } else {
            const newPet: Pet = { ...petData, id: new Date().toISOString(), userEmail: currentUser.email };
            setPets(prevPets => [newPet, ...prevPets]);
            setIsModalOpen(false);
        }
    };

    const handleDeletePet = (petId: string) => {
        // 1. Close modal
        setSelectedPet(null);
    
        // 2. Remove pet from main list
        setPets(prevPets => prevPets.filter(p => p.id !== petId));
    
        // 3. Remove from any user's savedPetIds in localStorage and state
        try {
            const userProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
            let profilesUpdated = false;
            
            Object.keys(userProfiles).forEach(email => {
                const profile = userProfiles[email];
                if (profile.savedPetIds && profile.savedPetIds.includes(petId)) {
                    profile.savedPetIds = profile.savedPetIds.filter((id: string) => id !== petId);
                    profilesUpdated = true;
                }
            });
    
            if (profilesUpdated) {
                localStorage.setItem('userProfiles', JSON.stringify(userProfiles));
            }
    
            // Update the users list in App state to reflect the change
            setUsers(prevUsers => prevUsers.map(user => {
                if (user.savedPetIds?.includes(petId)) {
                    return {
                        ...user,
                        savedPetIds: user.savedPetIds.filter(id => id !== petId)
                    };
                }
                return user;
            }));
    
            // Also update the currentUser in AuthContext if they had this pet saved
            if (currentUser?.savedPetIds?.includes(petId)) {
                unsavePet(petId);
            }
    
        } catch (error) {
            console.error("Failed to update saved pets in user profiles after deletion", error);
        }
    };
    
    const handleStartChat = (pet: Pet) => {
        if (!currentUser || currentUser.email === pet.userEmail) return;
        const existingChat = chats.find(c => c.petId === pet.id && c.participantEmails.includes(currentUser.email));
        if (existingChat) {
            setActiveChatId(existingChat.id);
        } else {
            const now = new Date().toISOString();
            const newChat: Chat = { 
                id: `chat_${now}`, 
                petId: pet.id, 
                participantEmails: [currentUser.email, pet.userEmail], 
                messages: [],
                lastReadTimestamps: {
                    [currentUser.email]: now
                }
            };
            setChats(prev => [...prev, newChat]);
            setActiveChatId(newChat.id);
        }
        setCurrentPage('chat');
        setSelectedPet(null);
        setPotentialMatches(null);
    };
    
    const handleStartAdminChat = (recipientEmail: string) => {
        if (!currentUser) return;
        
        const existingChat = chats.find(c => 
            !c.petId &&
            c.participantEmails.includes(currentUser.email) && 
            c.participantEmails.includes(recipientEmail)
        );

        if (existingChat) {
            setActiveChatId(existingChat.id);
        } else {
            const now = new Date().toISOString();
            const newChat: Chat = { 
                id: `chat_admin_${now}`, 
                participantEmails: [currentUser.email, recipientEmail], 
                messages: [],
                lastReadTimestamps: {
                    [currentUser.email]: now
                }
            };
            setChats(prev => [...prev, newChat]);
            setActiveChatId(newChat.id);
        }
        setViewingUser(null);
        setCurrentPage('chat');
    };
    
    const handleSendMessage = (chatId: string, text: string) => {
        if (!currentUser) return;
        const newMessage: Message = { senderEmail: currentUser.email, text, timestamp: new Date().toISOString() };
        setChats(prevChats => prevChats.map(chat => {
            if (chat.id === chatId) {
                return { 
                    ...chat, 
                    messages: [...chat.messages, newMessage],
                    lastReadTimestamps: {
                        ...chat.lastReadTimestamps,
                        [currentUser.email]: newMessage.timestamp
                    }
                };
            }
            return chat;
        }));
    };
    
    const handleMarkChatAsRead = (chatId: string) => {
        if (!currentUser) return;
        const now = new Date().toISOString();
        setChats(prevChats => prevChats.map(chat => {
            if (chat.id === chatId) {
                // Check if an update is needed to avoid re-renders
                if (chat.lastReadTimestamps[currentUser.email] < now) {
                    return {
                        ...chat,
                        lastReadTimestamps: {
                            ...chat.lastReadTimestamps,
                            [currentUser.email]: now
                        }
                    };
                }
            }
            return chat;
        }));
    };

    const handleUpdatePetStatus = (petId: string, status: PetStatus) => {
        setPets(prevPets => prevPets.map(p => p.id === petId ? { ...p, status } : p));
        setSelectedPet(prev => prev && prev.id === petId ? { ...prev, status } : prev);
    };

    const handleUpdateUserStatus = (userEmail: string, status: UserStatus) => {
        setUsers(prevUsers => prevUsers.map(u => u.email === userEmail ? { ...u, status } : u));
        
        if (viewingUser && viewingUser.email === userEmail) {
            setViewingUser(prev => prev ? { ...prev, status } : null);
        }

        try {
            const userProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
            const userProfileToUpdate = userProfiles[userEmail] || {};
            userProfileToUpdate.status = status;
            userProfiles[userEmail] = userProfileToUpdate;
            localStorage.setItem('userProfiles', JSON.stringify(userProfiles));
        } catch (error) {
            console.error("Failed to update user status in localStorage", error);
        }
    };

    const handleUpdateUserRole = (userEmail: string, role: UserRole) => {
        // Update the main users list in state
        setUsers(prevUsers => prevUsers.map(u => u.email === userEmail ? { ...u, role } : u));
        
        // Update the viewing user modal if it's the same user
        if (viewingUser && viewingUser.email === userEmail) {
            setViewingUser(prev => prev ? { ...prev, role } : null);
        }
    
        // Persist the change to localStorage
        try {
            const userProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
            const userProfileToUpdate = userProfiles[userEmail] || {};
            userProfileToUpdate.role = role;
            userProfiles[userEmail] = userProfileToUpdate;
            localStorage.setItem('userProfiles', JSON.stringify(userProfiles));
    
            if (currentUser && currentUser.email === userEmail) {
                const updatedCurrentUser = { ...currentUser, role };
                localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
            }
        } catch (error) {
            console.error("Failed to update user role in localStorage", error);
        }
    };

    const handleGhostLogin = async (userToImpersonate: User) => {
        try {
            await ghostLogin(userToImpersonate);
            setViewingUser(null);
            handleNavigate('list');
        } catch (error) {
            console.error("Failed to ghost login:", error);
            alert((error as Error).message);
        }
    };

    const handleAddReport = (type: ReportType, targetId: string, reason: ReportReason, details: string) => {
        if (!currentUser) return;
    
        let reportedEmail = '';
        let postSnapshot: ReportPostSnapshot | undefined = undefined;
    
        if (type === 'user') {
            reportedEmail = targetId;
        } else if (type === 'post') {
            const pet = pets.find(p => p.id === targetId);
            if (!pet) {
                console.error('Could not find pet to report:', targetId);
                return;
            }
            reportedEmail = pet.userEmail;
            postSnapshot = { ...pet }; // Create a snapshot of the pet data
        }
    
        const newReport: Report = {
            id: `report_${new Date().toISOString()}`,
            reporterEmail: currentUser.email,
            reportedEmail: reportedEmail,
            type: type,
            targetId: targetId,
            reason: reason,
            details: details,
            timestamp: new Date().toISOString(),
            status: REPORT_STATUS.PENDING,
            ...(postSnapshot && { postSnapshot }),
        };
    
        setReports(prev => [newReport, ...prev]);
        alert('Reporte enviado exitosamente. Gracias por ayudarnos a mantener la comunidad segura.');
    };

    const handleUpdateReportStatus = (reportId: string, status: ReportStatusType) => {
        setReports(prevReports => prevReports.map(r => r.id === reportId ? { ...r, status } : r));
    };

    const handleAddSupportTicket = (category: SupportTicketCategory, subject: string, description: string) => {
        if (!currentUser) return;

        const newTicket: SupportTicket = {
            id: `ticket_${new Date().toISOString()}`,
            userEmail: currentUser.email,
            category,
            subject,
            description,
            timestamp: new Date().toISOString(),
            status: SUPPORT_TICKET_STATUS.PENDING,
        };

        setSupportTickets(prev => [newTicket, ...prev]);
        alert('Ticket de soporte enviado. Nos pondremos en contacto contigo pronto.');
    };

    const handleUpdateSupportTicket = (updatedTicket: SupportTicket) => {
        // If a response was added/changed, create a notification
        const originalTicket = supportTickets.find(t => t.id === updatedTicket.id);
        if (updatedTicket.response && updatedTicket.response !== originalTicket?.response) {
            handleCreateNotification(
                updatedTicket.userEmail,
                `Tu ticket de soporte "${updatedTicket.subject.slice(0, 20)}..." ha sido respondido.`,
                'support'
            );
        }
        setSupportTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    };

    const handleCreateNotification = (userId: string, message: string, link: 'support') => {
        const newNotification: Notification = {
            id: `notif_${new Date().toISOString()}`,
            userId,
            message,
            link,
            timestamp: new Date().toISOString(),
            isRead: false,
        };
        setNotifications(prev => [newNotification, ...prev]);
    };

    const handleMarkNotificationAsRead = (notificationId: string) => {
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    };

    const filteredPets = useMemo(() => {
        return pets.filter(pet => {
            const statusMatch = filters.status === 'Todos' || pet.status === filters.status;
            const typeMatch = filters.type === 'Todos' || pet.animalType === filters.type;
            if (!statusMatch || !typeMatch) return false;
            const canApplyAdvancedFilters = filters.type === ANIMAL_TYPES.PERRO || filters.type === ANIMAL_TYPES.GATO;
            if (canApplyAdvancedFilters) {
                const breedMatch = filters.breed === 'Todos' || pet.breed === filters.breed;
                const sizeMatch = filters.size === 'Todos' || pet.size === filters.size;
                const color1Match = filters.color1 === 'Todos' || pet.color.toLowerCase().includes(filters.color1.toLowerCase());
                const color2Match = filters.color2 === 'Todos' || pet.color.toLowerCase().includes(filters.color2.toLowerCase());
                return breedMatch && sizeMatch && color1Match && color2Match;
            }
            return true;
        });
    }, [pets, filters]);
    
    const isChatUnread = (chat: Chat, user: User): boolean => {
        if (chat.messages.length === 0) return false;

        const lastMessage = chat.messages[chat.messages.length - 1];
        if (lastMessage.senderEmail === user.email) return false;

        const lastRead = chat.lastReadTimestamps?.[user.email];
        if (!lastRead) return true;

        return new Date(lastMessage.timestamp) > new Date(lastRead);
    };
    
    const userPets = useMemo(() => currentUser ? pets.filter(pet => pet.userEmail === currentUser.email) : [], [pets, currentUser]);
    
    const userChatsWithUnread = useMemo(() => {
        if (!currentUser) return [];
        return chats
            .filter(chat => chat.participantEmails.includes(currentUser.email))
            .map(chat => ({
                ...chat,
                isUnread: isChatUnread(chat, currentUser)
            }))
            .sort((a, b) => {
                const lastMessageA = a.messages[a.messages.length - 1]?.timestamp || '0';
                const lastMessageB = b.messages[b.messages.length - 1]?.timestamp || '0';
                return new Date(lastMessageB).getTime() - new Date(lastMessageA).getTime();
            });
    }, [chats, currentUser]);

    const userNotifications = useMemo(() => {
        if (!currentUser) return [];
        return notifications.filter(n => n.userId === currentUser.email);
    }, [notifications, currentUser]);

    const hasUnreadMessages = useMemo(() => userChatsWithUnread.some(c => c.isUnread), [userChatsWithUnread]);
    const activeChat = useMemo(() => chats.find(chat => chat.id === activeChatId), [chats, activeChatId]);

    const handlePetSelect = (pet: Pet) => setSelectedPet(pet);
    const handleCloseModal = () => setSelectedPet(null);
    const handleViewUser = (user: User) => setViewingUser(user);
    
    const handleCloseMatches = () => {
        setPendingPetReport(null);
        setPotentialMatches(null);
    }
    
    const handleOpenFlyer = (pet: Pet) => {
        setSelectedPet(null); 
        setPetForFlyer(pet);
    };

    const handleNavigate = (page: 'list' | 'profile' | 'messages' | 'chat' | 'admin' | 'support') => {
        setCurrentPage(page);
        setIsSidebarOpen(false);
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'profile':
                return currentUser && <ProfilePage user={currentUser} reportedPets={userPets} allPets={pets} onBack={() => handleNavigate('list')} onPetSelect={handlePetSelect} onReportOwnedPetAsLost={handleOpenReportFromProfile} />;
            case 'messages':
                return currentUser && <MessagesPage chats={userChatsWithUnread} pets={pets} users={users} currentUser={currentUser} onSelectChat={(id) => { setActiveChatId(id); handleNavigate('chat'); }} onBack={() => handleNavigate('list')} />;
            case 'chat':
                return currentUser && activeChat && <ChatPage chat={activeChat} pet={pets.find(p => p.id === activeChat.petId)} users={users} currentUser={currentUser} onSendMessage={handleSendMessage} onBack={() => handleNavigate('messages')} onMarkAsRead={handleMarkChatAsRead} />;
            case 'admin':
                return <AdminDashboard pets={pets} chats={chats} users={users} reports={reports} supportTickets={supportTickets} onBack={() => handleNavigate('list')} onViewUser={handleViewUser} onUpdateReportStatus={handleUpdateReportStatus} onDeletePet={handleDeletePet} onUpdateSupportTicket={handleUpdateSupportTicket} />;
            case 'support':
                return currentUser && <SupportPage currentUser={currentUser} userTickets={supportTickets.filter(t => t.userEmail === currentUser.email)} onAddTicket={handleAddSupportTicket} onBack={() => handleNavigate('list')} />;
            case 'list':
            default:
                return <PetList filters={filters} pets={filteredPets} onPetSelect={handlePetSelect} users={users} onViewUser={handleViewUser} />;
        }
    };
    
    return (
        <div id="app-container" className={`flex flex-col h-screen ${isGhosting ? 'pt-10' : ''}`}>
             {isGhosting && currentUser && (
                 <div className="bg-yellow-400 text-black p-2 text-center font-semibold flex justify-center items-center gap-4 fixed top-0 w-full z-50 h-10">
                     <span>Estás navegando como <strong>@{currentUser.username || currentUser.email}</strong>.</span>
                     <button
                        onClick={stopGhosting}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded-lg text-sm"
                     >
                         Volver a mi cuenta (@{isGhosting.username})
                     </button>
                 </div>
            )}
            <Header 
                currentPage={currentPage}
                onToggleSidebar={() => setIsSidebarOpen(true)}
                onReportPet={handleOpenReportModal}
                onOpenAdoptionModal={handleOpenAdoptionModal}
                onNavigateToHome={() => handleNavigate('list')}
                onNavigateToProfile={() => handleNavigate('profile')}
                onNavigateToMessages={() => handleNavigate('messages')}
                onNavigateToAdmin={() => handleNavigate('admin')}
                onNavigateToSupport={() => handleNavigate('support')}
                hasUnreadMessages={hasUnreadMessages}
                notifications={userNotifications}
                onMarkNotificationAsRead={handleMarkNotificationAsRead}
            />
            <div className="flex flex-1 overflow-hidden">
                <FilterControls 
                    filters={filters} 
                    setFilters={setFilters}
                    isSidebarOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    currentPage={currentPage}
                    onNavigateToHome={() => handleNavigate('list')}
                    onNavigateToProfile={() => handleNavigate('profile')}
                    onNavigateToMessages={() => handleNavigate('messages')}
                    onNavigateToAdmin={() => handleNavigate('admin')}
                />
                <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                    {renderPage()}
                </main>
            </div>
            {isModalOpen && (
                <ReportPetForm 
                    onClose={() => { setIsModalOpen(false); setPetToEdit(null); setPetToReportFromProfile(null); }} 
                    onSubmit={handleSavePet} 
                    initialStatus={initialStatusForReport} 
                    petToEdit={petToEdit}
                    petFromProfile={petToReportFromProfile}
                />
            )}
            {isAdoptionModalOpen && (
                <ReportAdoptionForm
                    onClose={() => setIsAdoptionModalOpen(false)}
                    onSubmit={handleSaveAdoption}
                />
            )}
            {selectedPet && (
                <PetDetailModal 
                    pet={selectedPet} 
                    onClose={handleCloseModal} 
                    onStartChat={handleStartChat}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeletePet}
                    onGenerateFlyer={handleOpenFlyer}
                    onUpdateStatus={handleUpdatePetStatus}
                    users={users}
                    onViewUser={handleViewUser}
                    onReport={handleAddReport}
                />
            )}
            {/* FIX: Cast array to UserRole[] to allow .includes() to check against the broader UserRole type of currentUser.role. */}
            {viewingUser && currentUser && ([USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN] as UserRole[]).includes(currentUser.role) && (
                <AdminUserDetailModal 
                    user={viewingUser} 
                    allPets={pets}
                    allChats={chats}
                    allUsers={users}
                    onClose={() => setViewingUser(null)}
                    onUpdateStatus={handleUpdateUserStatus}
                    onUpdateRole={handleUpdateUserRole}
                    onStartChat={handleStartAdminChat}
                    onGhostLogin={currentUser.role === USER_ROLES.SUPERADMIN ? handleGhostLogin : undefined}
                />
            )}
            {isFindingMatches && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex flex-col justify-center items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mb-4"></div>
                    <p className="text-white text-xl font-semibold">Buscando coincidencias con IA...</p>
                </div>
            )}
            {potentialMatches && (
                <PotentialMatchesModal 
                    matches={potentialMatches}
                    onClose={handleCloseMatches}
                    onConfirmPublication={handleFinalizeReport}
                    onPetSelect={handlePetSelect}
                />
            )}
            {petForFlyer && (
                <FlyerModal
                    pet={petForFlyer}
                    onClose={() => setPetForFlyer(null)}
                />
            )}
        </div>
    );
};

export default App;