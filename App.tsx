
import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { PetList } from './components/PetList';
import { ReportPetForm } from './components/ReportPetForm';
import { PetDetailPage } from './components/PetDetailPage';
import type { Pet, PetStatus, AnimalType, PetSize, Chat, Message, User, UserRole, PotentialMatch, UserStatus, OwnedPet, Report, ReportReason, ReportType, ReportStatus as ReportStatusType, ReportPostSnapshot, SupportTicket, SupportTicketStatus, SupportTicketCategory, Notification, Campaign } from './types';
import { PET_STATUS, ANIMAL_TYPES, SIZES, USER_ROLES, USER_STATUS, REPORT_STATUS, SUPPORT_TICKET_STATUS, CAMPAIGN_TYPES } from './constants';
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
import CampaignsPage from './components/CampaignsPage';
import CampaignDetailPage from './components/CampaignDetailPage';

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
        description: 'Gato grande y muy dócil, se deixa cargar. Ojos azules intensos.',
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

const initialCampaigns: Campaign[] = [
    // 2 Campañas de Esterilización
    {
        id: 'camp1',
        userEmail: 'admin@admin.com',
        type: CAMPAIGN_TYPES.ESTERILIZACION,
        title: 'Campaña de Esterilización Gratuita en Miraflores',
        description: '¡Cuida a tu mascota y a la comunidad! Estaremos ofreciendo esterilizaciones gratuitas para perros y gatos. Cupos limitados. Trae a tu mascota en ayunas.',
        location: 'Parque Kennedy, Miraflores, Lima',
        date: '2024-08-15T09:00:00Z',
        imageUrls: ['https://picsum.photos/seed/sterilization1/800/600', 'https://picsum.photos/seed/sterilization2/800/600'],
        contactPhone: '987654321',
    },
    {
        id: 'camp2',
        userEmail: 'admin@admin.com',
        type: CAMPAIGN_TYPES.ESTERILIZACION,
        title: 'Jornada de Salud y Esterilización en Arequipa',
        description: 'Jornada completa de salud para tu engreído. Ofreceremos desparasitación, vacuna antirrábica y esterilizaciones a bajo costo. ¡No te lo pierdas!',
        location: 'Plaza de Armas, Arequipa',
        date: '2024-08-22T10:00:00Z',
        imageUrls: ['https://picsum.photos/seed/sterilization3/800/600'],
    },
    // 2 Campañas de Adopción
    {
        id: 'camp3',
        userEmail: 'admin@admin.com',
        type: CAMPAIGN_TYPES.ADOPCION,
        title: 'Gran Feria de Adopción: "Adopta un Amigo"',
        description: 'Muchos cachorros y adultos buscan un hogar lleno de amor. Todos están vacunados y desparasitados, listos para empezar una nueva vida contigo. ¡Ven y conoce a tu próximo mejor amigo!',
        location: 'Parque de la Exposición, Lima',
        date: '2024-08-18T11:00:00Z',
        imageUrls: ['https://picsum.photos/seed/adoption1/800/600', 'https://picsum.photos/seed/adoption2/800/600', 'https://picsum.photos/seed/adoption3/800/600'],
    },
    {
        id: 'camp4',
        userEmail: 'admin@admin.com',
        type: CAMPAIGN_TYPES.ADOPCION,
        title: 'Adopción Responsable en Cusco',
        description: 'Dale una segunda oportunidad a un rescatado. Tendremos perritos y gatitos de todas las edades esperando por una familia. Se realizará una entrevista y seguimiento.',
        location: 'Plaza San Blas, Cusco',
        date: '2024-08-25T12:00:00Z',
        imageUrls: ['https://picsum.photos/seed/adoption4/800/600'],
    },
];

const App: React.FC = () => {
    const { currentUser, isGhosting, ghostLogin, stopGhosting, unsavePet } = useAuth();
    
    const getPathFromHash = () => window.location.hash.substring(1) || '/';
    const [path, setPath] = useState(getPathFromHash());

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAdoptionModalOpen, setIsAdoptionModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [initialStatusForReport, setInitialStatusForReport] = useState<PetStatus>(PET_STATUS.PERDIDO);
    const [petToEdit, setPetToEdit] = useState<Pet | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [viewingUser, setViewingUser] = useState<User | null>(null);
    const [petForFlyer, setPetForFlyer] = useState<Pet | null>(null);
    
    const [isFindingMatches, setIsFindingMatches] = useState(false);
    const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[] | null>(null);
    const [pendingPetReport, setPendingPetReport] = useState<Omit<Pet, 'id' | 'userEmail'> | null>(null);
    const [petToReportFromProfile, setPetToReportFromProfile] = useState<OwnedPet | null>(null);

    const [isAiSearchEnabled, setIsAiSearchEnabled] = useState<boolean>(() => {
        try {
            const savedSetting = localStorage.getItem('isAiSearchEnabled');
            return savedSetting ? JSON.parse(savedSetting) : false; // Default to false
        } catch {
            return false;
        }
    });

    useEffect(() => {
        localStorage.setItem('isAiSearchEnabled', JSON.stringify(isAiSearchEnabled));
    }, [isAiSearchEnabled]);
    
    // Router logic
    const navigate = (href: string) => {
        window.location.hash = href;
    };

    useEffect(() => {
        const onHashChange = () => {
            setPath(getPathFromHash());
        };
        window.addEventListener('hashchange', onHashChange);
        setPath(getPathFromHash()); // Set initial path

        return () => {
            window.removeEventListener('hashchange', onHashChange);
        };
    }, []);


    const [pets, setPets] = useState<Pet[]>(() => {
        try {
            const savedPets = localStorage.getItem('pets');
            const parsedPets = savedPets ? JSON.parse(savedPets) : initialPets;

            if (Array.isArray(parsedPets)) {
                // Sanitize data to prevent crashes from malformed legacy data.
                // We strictly check that imageUrls is an array and has length > 0.
                return parsedPets
                    .filter(p => p && typeof p === 'object' && p.id) // Ensure pet object and id exist
                    .map(p => ({
                        ...p,
                        imageUrls: (Array.isArray(p.imageUrls) && p.imageUrls.length > 0) 
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

    const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
        try {
            const saved = localStorage.getItem('campaigns');
            const parsed = saved ? JSON.parse(saved) : initialCampaigns;
            // Ensure it is an array and filter out any null or undefined items.
            // Also sanitize imageUrls to strictly be an array.
            if (Array.isArray(parsed)) {
                return parsed
                    .filter((c: any) => c && typeof c === 'object' && c.id)
                    .map(c => ({
                        ...c,
                        imageUrls: (Array.isArray(c.imageUrls) && c.imageUrls.length > 0)
                            ? c.imageUrls
                            : ['https://placehold.co/800x600/CCCCCC/FFFFFF?text=Sin+Imagen']
                    }));
            }
            return initialCampaigns;
        } catch {
            return initialCampaigns;
        }
    });

    const [chats, setChats] = useState<Chat[]>(() => {
        try {
            const savedChats = localStorage.getItem('chats');
            const parsedChats = savedChats ? JSON.parse(savedChats) : initialChats;
            if (!Array.isArray(parsedChats)) return initialChats;
             // Ensure all chats have the new `lastReadTimestamps` field and filter invalid ones
            return parsedChats.filter(c => c && c.id).map((chat: Chat) => ({
                ...chat,
                lastReadTimestamps: chat.lastReadTimestamps || {},
                messages: Array.isArray(chat.messages) ? chat.messages : []
            }));
        } catch (error) {
            console.error('Error parsing chats from localStorage:', error);
            return initialChats;
        }
    });

    const [reports, setReports] = useState<Report[]>(() => {
        try {
            const savedReports = localStorage.getItem('reports');
            const parsed = savedReports ? JSON.parse(savedReports) : [];
            return Array.isArray(parsed) ? parsed.filter(r => r && r.id) : [];
        } catch (error) {
            console.error('Error parsing reports from localStorage:', error);
            return [];
        }
    });

    const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
        try {
            const saved = localStorage.getItem('supportTickets');
            const parsed = saved ? JSON.parse(saved) : [];
            return Array.isArray(parsed) ? parsed.filter(t => t && t.id) : [];
        } catch (error) {
            console.error('Error parsing support tickets from localStorage:', error);
            return [];
        }
    });

    const [notifications, setNotifications] = useState<Notification[]>(() => {
        try {
            const saved = localStorage.getItem('notifications');
            const parsed = saved ? JSON.parse(saved) : [];
            return Array.isArray(parsed) ? parsed.filter(n => n && n.id) : [];
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
        localStorage.setItem('campaigns', JSON.stringify(campaigns));
    }, [campaigns]);

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
        
        if (petData.status === PET_STATUS.PERDIDO && isAiSearchEnabled) {
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
        // 1. Navigate home if on the detail page of the deleted pet
        if (path === `/mascota/${petId}`) {
            navigate('/');
        }
    
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
        let chatId: string;
        const existingChat = chats.find(c => c.petId === pet.id && c.participantEmails.includes(currentUser.email));
        if (existingChat) {
            chatId = existingChat.id;
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
            chatId = newChat.id;
        }
        setPotentialMatches(null); // Close matches modal if open
        navigate(`/chat/${chatId}`);
    };
    
    const handleStartAdminChat = (recipientEmail: string) => {
        if (!currentUser) return;
        let chatId: string;
        const existingChat = chats.find(c => 
            !c.petId &&
            c.participantEmails.includes(currentUser.email) && 
            c.participantEmails.includes(recipientEmail)
        );

        if (existingChat) {
            chatId = existingChat.id;
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
            chatId = newChat.id;
        }
        setViewingUser(null);
        navigate(`/chat/${chatId}`);
    };
    
    const handleSendMessage = (chatId: string, text: string) => {
        if (!currentUser) return;
        const newMessage: Message = { senderEmail: currentUser.email, text, timestamp: new Date().toISOString() };
        setChats(prevChats => prevChats.map(chat => {
            if (chat.id === chatId) {
                const recipientEmail = chat.participantEmails.find(e => e !== currentUser.email);
                if (recipientEmail) {
                    const pet = pets.find(p => p.id === chat.petId);
                    const notificationMessage = pet 
                        ? `Tienes un nuevo mensaje sobre "${pet.name}"`
                        : `Tienes un nuevo mensaje de la administración`;
                    handleCreateNotification(recipientEmail, notificationMessage, 'messages');
                }
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
    
    const isChatUnread = (chat: Chat, user: User): boolean => {
        if (chat.messages.length === 0) return false;

        const lastMessage = chat.messages[chat.messages.length - 1];
        if (lastMessage.senderEmail === user.email) return false;

        const lastRead = chat.lastReadTimestamps?.[user.email];
        if (!lastRead) return true;

        return new Date(lastMessage.timestamp) > new Date(lastRead);
    };

    const handleMarkChatAsRead = (chatId: string) => {
        if (!currentUser) return;
        const now = new Date().toISOString();
        setChats(prevChats => prevChats.map(chat => {
            if (chat.id === chatId) {
                // Use the existing helper to see if an update is necessary
                if (isChatUnread(chat, currentUser)) {
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
    };

    const handleRecordContactRequest = (petId: string) => {
        if (!currentUser) return;
        setPets(prevPets => prevPets.map(p => {
            if (p.id === petId) {
                const existingRequests = p.contactRequests || [];
                if (!existingRequests.includes(currentUser.email)) {
                    return { ...p, contactRequests: [...existingRequests, currentUser.email] };
                }
            }
            return p;
        }));
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
            handleNavigate('/');
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

    const handleCreateNotification = (userId: string, message: string, link: Notification['link']) => {
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

    const handleMarkAllNotificationsAsRead = () => {
        if (notifications.some(n => !n.isRead)) {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        }
    };

    const handleSaveCampaign = (campaignData: Omit<Campaign, 'id' | 'userEmail'>, idToUpdate?: string) => {
        if (!currentUser) return;

        if (idToUpdate) {
            const updatedCampaign: Campaign = { ...campaignData, id: idToUpdate, userEmail: currentUser.email };
            setCampaigns(prev => prev.map(c => c.id === idToUpdate ? updatedCampaign : c));
        } else {
            const newCampaign: Campaign = { ...campaignData, id: `camp_${new Date().toISOString()}`, userEmail: currentUser.email };
            setCampaigns(prev => [newCampaign, ...prev]);

            // Notify all users
            users.forEach(user => {
                handleCreateNotification(
                    user.email,
                    `¡Nueva campaña! "${newCampaign.title.slice(0, 30)}..."`,
                    { type: 'campaign', id: newCampaign.id }
                );
            });
        }
    };

    const handleDeleteCampaign = (campaignId: string) => {
        setCampaigns(prev => prev.filter(c => c.id !== campaignId));
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

    const handleViewUser = (user: User) => setViewingUser(user);
    
    const handleCloseMatches = () => {
        setPendingPetReport(null);
        setPotentialMatches(null);
    }
    
    const handleOpenFlyer = (pet: Pet) => {
        setPetForFlyer(pet);
    };

    const handleNavigate = (newPath: string) => {
        navigate(newPath);
        setIsSidebarOpen(false);
    };
    
    const getCurrentPageForHeader = () => {
        if (path === '/perfil') return 'profile';
        if (path === '/mensajes' || path.startsWith('/chat')) return 'messages';
        if (path === '/admin') return 'admin';
        if (path === '/soporte') return 'support';
        if (path.startsWith('/campanas')) return 'campaigns';
        return 'list';
    };

    const renderPage = () => {
        const petDetailMatch = path.match(/^\/mascota\/([^/]+)$/);
        if (petDetailMatch) {
            const petId = petDetailMatch[1];
            const pet = pets.find(p => p.id === petId);
            if (!pet) return (
                <div className="text-center py-10">
                    <h2 className="text-2xl font-bold">Mascota no encontrada</h2>
                    <button onClick={() => navigate('/')} className="text-brand-primary hover:underline mt-4 inline-block">&larr; Volver al inicio</button>
                </div>
            );
            return <PetDetailPage 
                pet={pet}
                onStartChat={handleStartChat}
                onEdit={handleOpenEditModal}
                onDelete={handleDeletePet}
                onGenerateFlyer={handleOpenFlyer}
                onUpdateStatus={handleUpdatePetStatus}
                users={users}
                onViewUser={handleViewUser}
                onReport={handleAddReport}
                onClose={() => navigate('/')}
                onRecordContactRequest={handleRecordContactRequest}
            />;
        }

        const campaignDetailMatch = path.match(/^\/campanas\/([^/]+)$/);
        if (campaignDetailMatch) {
            const campaignId = campaignDetailMatch[1];
            const campaign = campaigns.find(c => c.id === campaignId);
            if (!campaign) return (
                <div className="text-center py-10">
                    <h2 className="text-2xl font-bold">Campaña no encontrada</h2>
                    <button onClick={() => navigate('/campanas')} className="text-brand-primary hover:underline mt-4 inline-block">&larr; Volver a campañas</button>
                </div>
            );
            return <CampaignDetailPage campaign={campaign} onClose={() => navigate('/campanas')} />;
        }

        const chatMatch = path.match(/^\/chat\/([^/]+)$/);
        if (chatMatch) {
            const chatId = chatMatch[1];
            const chat = chats.find(c => c.id === chatId);
            return currentUser && chat ? <ChatPage chat={chat} pet={pets.find(p => p.id === chat.petId)} users={users} currentUser={currentUser} onSendMessage={handleSendMessage} onBack={() => handleNavigate('/mensajes')} onMarkAsRead={handleMarkChatAsRead} /> : <p>Chat no encontrado o no autorizado.</p>;
        }
    
        switch (path) {
            case '/perfil':
                return currentUser && <ProfilePage user={currentUser} reportedPets={userPets} allPets={pets} users={users} onBack={() => handleNavigate('/')} onReportOwnedPetAsLost={handleOpenReportFromProfile} onNavigate={navigate} onViewUser={handleViewUser} />;
            case '/mensajes':
                return currentUser && <MessagesPage chats={userChatsWithUnread} pets={pets} users={users} currentUser={currentUser} onSelectChat={(id) => handleNavigate(`/chat/${id}`)} onBack={() => handleNavigate('/')} />;
            case '/admin':
                return <AdminDashboard 
                    pets={pets} 
                    chats={chats} 
                    users={users} 
                    reports={reports} 
                    supportTickets={supportTickets} 
                    onBack={() => handleNavigate('/')} 
                    onViewUser={handleViewUser} 
                    onUpdateReportStatus={handleUpdateReportStatus} 
                    onDeletePet={handleDeletePet} 
                    onUpdateSupportTicket={handleUpdateSupportTicket} 
                    isAiSearchEnabled={isAiSearchEnabled}
                    onToggleAiSearch={() => setIsAiSearchEnabled(prev => !prev)}
                    campaigns={campaigns}
                    onSaveCampaign={handleSaveCampaign}
                    onDeleteCampaign={handleDeleteCampaign}
                    onNavigate={handleNavigate}
                />;
            case '/soporte':
                return currentUser && <SupportPage currentUser={currentUser} userTickets={supportTickets.filter(t => t.userEmail === currentUser.email)} onAddTicket={handleAddSupportTicket} onBack={() => handleNavigate('/')} />;
            case '/campanas':
                return <CampaignsPage campaigns={campaigns} onNavigate={navigate} />;
            case '/':
            default:
                return <PetList filters={filters} pets={filteredPets} users={users} onViewUser={handleViewUser} onNavigate={navigate} />;
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
                currentPage={getCurrentPageForHeader()}
                onToggleSidebar={() => setIsSidebarOpen(true)}
                onReportPet={handleOpenReportModal}
                onOpenAdoptionModal={handleOpenAdoptionModal}
                onNavigate={handleNavigate}
                hasUnreadMessages={hasUnreadMessages}
                notifications={userNotifications}
                onMarkNotificationAsRead={handleMarkNotificationAsRead}
                onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
            />
            <div className="flex flex-1 overflow-hidden">
                <FilterControls 
                    filters={filters} 
                    setFilters={setFilters}
                    isSidebarOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    currentPage={getCurrentPageForHeader()}
                    onNavigateToHome={() => handleNavigate('/')}
                    onNavigateToProfile={() => handleNavigate('/perfil')}
                    onNavigateToMessages={() => handleNavigate('/mensajes')}
                    onNavigateToAdmin={() => handleNavigate('/admin')}
                    onNavigateToCampaigns={() => handleNavigate('/campanas')}
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
                    onViewUser={handleViewUser}
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
                    onPetSelect={(pet) => {
                        setPotentialMatches(null);
                        navigate(`/mascota/${pet.id}`);
                    }}
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
