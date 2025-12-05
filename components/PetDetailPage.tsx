import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import type { Pet, User, ReportType, ReportReason, Comment } from '../types';
import { CalendarIcon, LocationMarkerIcon, PhoneIcon, ChevronLeftIcon, ChevronRightIcon, ChatBubbleIcon, EditIcon, TrashIcon, PrinterIcon, FlagIcon, GoogleMapsIcon, WazeIcon, SendIcon, XCircleIcon, HeartIcon, VerticalDotsIcon, SparklesIcon, LockIcon, WarningIcon } from './icons';
import { PET_STATUS, USER_ROLES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import ConfirmationModal from './ConfirmationModal';
import { ReportModal } from './ReportModal';
import { formatTime } from '../utils/formatters';
import { supabase } from '../services/supabaseClient';
import UserPublicProfileModal from './UserPublicProfileModal';
import { trackContactOwner, trackPetReunited } from '../services/analytics';
import ShareModal from './ShareModal';
import ReunionSuccessModal from './ReunionSuccessModal';
import { mapPetFromDb } from '../utils/mappers';
import { useUsers } from '../hooks/useResources';
import { usePetMutations } from '../hooks/usePetMutations';
import { useInteractionMutations } from '../hooks/useInteractionMutations';
import { LazyImage } from './LazyImage';
import ContactRequestersModal from './ContactRequestersModal';

interface PetDetailPageProps {
    onClose: () => void;
    onStartChat: (pet: Pet) => void;
    onEdit: (pet: Pet) => void;
    onGenerateFlyer: (pet: Pet) => void;
    onViewUser: (user: User) => void;
}

// Helper Components for Comments
const CommentItem: React.FC<{ comment: Comment, currentUser: User | null, onLike: (id: string) => void }> = ({ comment, currentUser, onLike }) => {
    const isLiked = currentUser && comment.likes?.includes(currentUser.id);
    return (
        <div className="flex gap-3 text-sm animate-fade-in">
            <div className="flex-shrink-0 font-bold text-gray-700 bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center">
                {comment.userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-grow">
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                    <p className="font-bold text-gray-800 text-xs">{comment.userName}</p>
                    <p className="text-gray-700">{comment.text}</p>
                </div>
                <div className="flex gap-4 mt-1 ml-2 text-xs text-gray-500">
                    <span>{formatTime(comment.timestamp)}</span>
                    {currentUser && (
                        <button onClick={() => onLike(comment.id)} className={`font-bold hover:underline ${isLiked ? 'text-brand-primary' : ''}`}>
                            Me gusta {comment.likes && comment.likes.length > 0 && `(${comment.likes.length})`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const CommentListAndInput: React.FC<{ 
    comments: Comment[], 
    onAddComment: (text: string) => void, 
    currentUser: User | null, 
    onLike: (id: string) => void 
}> = ({ comments, onAddComment, currentUser, onLike }) => {
    const [newComment, setNewComment] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(newComment);
            setNewComment('');
        }
    };

    return (
        <div className="mt-6 border-t border-gray-100 pt-4">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <ChatBubbleIcon /> Comentarios ({comments.length})
            </h3>
            
            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                {comments.length > 0 ? (
                    comments.map(c => <CommentItem key={c.id} comment={c} currentUser={currentUser} onLike={onLike} />)
                ) : (
                    <p className="text-gray-400 text-sm italic">Sé el primero en comentar para ayudar.</p>
                )}
            </div>

            {currentUser ? (
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input 
                        type="text" 
                        value={newComment} 
                        onChange={e => setNewComment(e.target.value)} 
                        placeholder="Escribe un comentario..." 
                        className="flex-grow p-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-white text-gray-900 text-sm"
                    />
                    <button type="submit" disabled={!newComment.trim()} className="bg-brand-primary text-white p-2 rounded-full hover:bg-brand-dark disabled:opacity-50 transition-colors">
                        <SendIcon />
                    </button>
                </form>
            ) : (
                <div className="bg-gray-50 p-3 rounded-lg text-center text-sm text-gray-600">
                    Inicia sesión para comentar y ayudar.
                </div>
            )}
        </div>
    );
};

export const PetDetailPage: React.FC<PetDetailPageProps> = ({ 
    onClose, onStartChat, onEdit, onGenerateFlyer, onViewUser
}) => {
    const { id } = useParams<{ id: string }>();
    const { currentUser, savePet, unsavePet } = useAuth();
    const navigate = useNavigate();
    const { data: users = [] } = useUsers();
    
    // Hooks for Mutations
    const { updatePetStatus, deletePet, updatePet } = usePetMutations();
    const { addComment, toggleLikeComment, reportContent, requestContact } = useInteractionMutations();

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showContact, setShowContact] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isReunionModalOpen, setIsReunionModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isContactRequestersModalOpen, setIsContactRequestersModalOpen] = useState(false);

    // FETCH SPECIFIC PET
    const { data: pet, isLoading: isLoadingSingle, isError } = useQuery({
        queryKey: ['pet_detail', id],
        enabled: !!id, 
        queryFn: async () => {
            if (!id) throw new Error("ID no proporcionado");
            const { data, error } = await supabase.from('pets').select('*, profiles(email, username)').eq('id', id).single();
            if (error) throw error;
            const { data: commentsData } = await supabase.from('comments').select('*').eq('pet_id', id).order('created_at', { ascending: true });
            const commentIds = commentsData?.map((c: any) => c.id) || [];
            const { data: likesData } = commentIds.length > 0 ? await supabase.from('comment_likes').select('*').in('comment_id', commentIds) : { data: [] };
            return mapPetFromDb(data, [], commentsData || [], likesData || []);
        },
        retry: 1
    });

    // Determine derived state
    const isOwner = currentUser && pet && pet.userEmail === currentUser.email;
    const isSaved = pet && currentUser?.savedPetIds?.includes(pet.id);
    const petOwner = pet ? users.find(u => u.email === pet.userEmail) : undefined;
    const isReunited = pet?.status === PET_STATUS.REUNIDO;

    // Handlers
    const handleNextImage = () => { if(pet?.imageUrls) setCurrentImageIndex((prev) => (prev + 1) % pet.imageUrls.length); };
    const handlePrevImage = () => { if(pet?.imageUrls) setCurrentImageIndex((prev) => (prev - 1 + pet.imageUrls.length) % pet.imageUrls.length); };
    
    const handleContactClick = () => {
        if (!currentUser) return navigate('/login');
        if (!pet) return;
        if (pet.shareContactInfo) {
            setShowContact(true);
            trackContactOwner(pet.id, 'phone_reveal');
            if (!isOwner && !pet.contactRequests?.includes(currentUser.email)) {
                requestContact.mutate(pet.id);
            }
        } else {
            onStartChat(pet);
            trackContactOwner(pet.id, 'chat');
        }
    };

    const handleDelete = () => {
        if (pet) deletePet.mutate(pet.id, { onSuccess: () => onClose() });
    };

    const handleReportSubmit = (reason: ReportReason, details: string) => {
        if (pet && currentUser) {
            reportContent.mutate({ type: 'post', targetId: pet.id, reason, details, reporterEmail: currentUser.email });
            setIsReportModalOpen(false);
        }
    };

    const handleReunionSubmit = async (story: string, date: string, image?: string) => {
        if (!pet) return;
        // Optimization: Handle update locally via mutation
        const updates: Partial<Pet> = {
            reunionStory: story,
            reunionDate: date,
            status: PET_STATUS.REUNIDO,
            imageUrls: image ? [image, ...pet.imageUrls] : pet.imageUrls
        };
        await updatePet.mutateAsync({ id: pet.id, updates });
        updatePetStatus.mutate({ id: pet.id, status: PET_STATUS.REUNIDO, userId: currentUser?.id });
    };

    const handleAddCommentLocal = (text: string) => {
        if (pet && currentUser) {
            addComment.mutate({ 
                petId: pet.id, 
                text, 
                userId: currentUser.id, 
                userEmail: currentUser.email, 
                userName: currentUser.username || 'Usuario' 
            });
        }
    };

    if (isLoadingSingle) return <div className="p-16 text-center text-gray-500 font-bold"><div className="animate-spin rounded-full h-10 w-10 border-b-4 border-brand-primary mx-auto mb-4"></div>Cargando detalles...</div>;
    if (isError || !pet) return <div className="p-16 text-center text-red-600 font-bold">No se encontró la publicación.</div>;

    const themeColor = pet.status === PET_STATUS.PERDIDO ? 'text-red-600 bg-red-50' : 
                       pet.status === PET_STATUS.ENCONTRADO ? 'text-green-600 bg-green-50' : 
                       pet.status === PET_STATUS.EN_ADOPCION ? 'text-purple-600 bg-purple-50' : 'text-blue-600 bg-blue-50';

    return (
        <div className="bg-white min-h-screen pb-20 lg:pb-0 font-sans">
            <Helmet>
                <title>{pet.name} - {pet.status} | Pets</title>
                <meta name="description" content={`${pet.status}: ${pet.breed} en ${pet.location}.`} />
            </Helmet>

            {/* Mobile Header */}
            <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center lg:hidden shadow-sm">
                <button onClick={onClose} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ChevronLeftIcon /></button>
                <span className="font-bold text-gray-800 truncate max-w-[200px]">{pet.name}</span>
                <div className="flex gap-2">
                    <button onClick={() => setIsShareModalOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"><SendIcon /></button>
                    {isOwner && <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"><VerticalDotsIcon /></button>}
                </div>
            </div>

            {/* Desktop Header / Breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 p-4 text-sm text-gray-500 max-w-6xl mx-auto">
                <button onClick={onClose} className="hover:text-brand-primary flex items-center gap-1"><ChevronLeftIcon className="h-4 w-4"/> Volver</button>
                <span>/</span>
                <span>{pet.status}</span>
                <span>/</span>
                <span className="font-semibold text-gray-800">{pet.name}</span>
            </div>

            <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-2 lg:gap-8 lg:px-4 lg:pb-12">
                {/* Image Section */}
                <div className="relative bg-black group lg:rounded-2xl overflow-hidden aspect-square lg:aspect-auto lg:h-[600px]">
                    <LazyImage src={pet.imageUrls[currentImageIndex]} alt={pet.name} className="w-full h-full object-contain" />
                    
                    {pet.imageUrls.length > 1 && (
                        <>
                            <button onClick={handlePrevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm transition opacity-0 group-hover:opacity-100"><ChevronLeftIcon /></button>
                            <button onClick={handleNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm transition opacity-0 group-hover:opacity-100"><ChevronRightIcon /></button>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                {pet.imageUrls.map((_, idx) => (
                                    <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`} />
                                ))}
                            </div>
                        </>
                    )}
                    {isReunited && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                            <div className="text-center p-8 border-4 border-green-500 rounded-3xl bg-white shadow-2xl transform rotate-[-5deg]">
                                <h2 className="text-4xl md:text-6xl font-black text-green-600 mb-2 uppercase tracking-tighter">¡Reunido!</h2>
                                <p className="text-gray-500 font-bold text-lg">Esta mascota ya está en casa ❤️</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Details Section */}
                <div className="p-5 lg:p-0">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${themeColor} mb-2 inline-block`}>{pet.status}</span>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">{pet.name}</h1>
                            <div className="flex items-center gap-2 text-gray-500 text-sm mt-1 font-medium">
                                <span>{pet.breed}</span> • <span>{pet.animalType}</span> • <span>{pet.date.split('T')[0]}</span>
                            </div>
                        </div>
                        {currentUser && (
                            <button onClick={() => isSaved ? unsavePet(pet.id) : savePet(pet.id)} className={`p-3 rounded-full transition-colors ${isSaved ? 'text-brand-primary bg-blue-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                                <HeartIcon filled={isSaved} className="h-6 w-6" />
                            </button>
                        )}
                    </div>

                    {/* Owner Actions (Desktop) */}
                    {isOwner && (
                        <div className="hidden lg:flex gap-3 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <button onClick={() => onEdit(pet)} className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 py-2 rounded-lg font-bold text-gray-700 hover:bg-gray-50 text-sm"><EditIcon /> Editar</button>
                            <button onClick={() => onGenerateFlyer(pet)} className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 py-2 rounded-lg font-bold text-gray-700 hover:bg-gray-50 text-sm"><PrinterIcon /> Afiche</button>
                            <button onClick={() => setIsShareModalOpen(true)} className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 py-2 rounded-lg font-bold text-gray-700 hover:bg-gray-50 text-sm"><SendIcon /> Compartir</button>
                            {!isReunited && (
                                <button onClick={() => setIsReunionModalOpen(true)} className="flex-[1.5] flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 text-sm shadow-md"><SparklesIcon /> ¡Ya lo encontré!</button>
                            )}
                            <button onClick={() => setIsDeleteModalOpen(true)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><TrashIcon /></button>
                        </div>
                    )}

                    {/* Owner Actions (Mobile Menu) */}
                    {isOwner && isMenuOpen && (
                        <div className="lg:hidden bg-white border-b border-gray-100 p-4 grid grid-cols-2 gap-3 animate-fade-in-down mb-4">
                            <button onClick={() => onEdit(pet)} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg font-bold text-sm"><EditIcon /> Editar Info</button>
                            <button onClick={() => onGenerateFlyer(pet)} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg font-bold text-sm"><PrinterIcon /> Crear Afiche</button>
                            {!isReunited && <button onClick={() => setIsReunionModalOpen(true)} className="col-span-2 flex items-center justify-center gap-2 p-3 bg-green-100 text-green-800 rounded-lg font-bold text-sm"><SparklesIcon /> Marcar como Encontrado</button>}
                            <button onClick={() => setIsDeleteModalOpen(true)} className="col-span-2 flex items-center justify-center gap-2 p-3 text-red-600 font-bold text-sm hover:bg-red-50 rounded-lg"><TrashIcon /> Eliminar Publicación</button>
                        </div>
                    )}

                    {/* Location Box */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                        <div className="flex items-start gap-3">
                            <LocationMarkerIcon className="text-brand-primary h-6 w-6 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-blue-900 text-sm uppercase tracking-wide mb-1">Ubicación Reportada</h3>
                                <p className="text-blue-800 font-medium leading-relaxed">{pet.location}</p>
                                <div className="flex gap-3 mt-3">
                                    <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pet.location + ' Peru')}`, '_blank')} className="text-xs bg-white text-blue-700 px-3 py-1.5 rounded-lg font-bold shadow-sm flex items-center gap-1 hover:bg-blue-50"><GoogleMapsIcon /> Ver en Maps</button>
                                    <button onClick={() => window.open(`https://waze.com/ul?q=${encodeURIComponent(pet.location + ' Peru')}`, '_blank')} className="text-xs bg-white text-blue-700 px-3 py-1.5 rounded-lg font-bold shadow-sm flex items-center gap-1 hover:bg-blue-50"><WazeIcon /> Waze</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-8">
                        <h3 className="font-bold text-gray-800 text-lg mb-2">Sobre {pet.name}</h3>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{pet.description}</p>
                        
                        {pet.adoptionRequirements && (
                            <div className="mt-4 p-4 bg-purple-50 border-l-4 border-purple-400 rounded-r-lg">
                                <h4 className="font-bold text-purple-900 text-sm mb-1">Requisitos de Adopción</h4>
                                <p className="text-purple-800 text-sm">{pet.adoptionRequirements}</p>
                            </div>
                        )}
                    </div>

                    {/* Contact Button / Info */}
                    {!isReunited && !isOwner && (
                        <div className="mb-8">
                            {showContact ? (
                                <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center animate-fade-in-up">
                                    <p className="text-green-800 font-bold mb-2 uppercase text-xs tracking-wider">Contacto del Dueño</p>
                                    <a href={`tel:${pet.contact}`} className="text-3xl font-black text-green-600 block hover:underline mb-2">{pet.contact}</a>
                                    <div className="flex justify-center gap-4">
                                        <a href={`https://wa.me/51${pet.contact}?text=Hola, vi tu reporte sobre ${pet.name} en Pets.`} target="_blank" rel="noreferrer" className="bg-green-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-md hover:bg-green-600 transition-colors">WhatsApp</a>
                                        <button onClick={() => window.location.href = `tel:${pet.contact}`} className="bg-white text-green-600 border border-green-200 px-4 py-2 rounded-full font-bold text-sm hover:bg-green-50 transition-colors">Llamar</button>
                                    </div>
                                    <p className="text-xs text-green-700/60 mt-4 max-w-xs mx-auto">Nunca realices pagos por adelantado. Encuéntrate siempre en lugares públicos.</p>
                                </div>
                            ) : (
                                <button 
                                    onClick={handleContactClick}
                                    className="w-full py-4 bg-brand-primary text-white font-bold text-lg rounded-2xl shadow-lg hover:bg-brand-dark transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                                >
                                    {pet.shareContactInfo ? <PhoneIcon /> : <ChatBubbleIcon />}
                                    {pet.shareContactInfo ? 'Ver Teléfono de Contacto' : 'Iniciar Chat con el Dueño'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* User Info */}
                    <div className="flex items-center gap-4 py-6 border-t border-gray-100">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-lg overflow-hidden">
                            {petOwner?.avatarUrl ? <img src={petOwner.avatarUrl} className="w-full h-full object-cover" alt="User" /> : pet.userEmail.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Publicado por</p>
                            <button onClick={() => petOwner && onViewUser(petOwner)} className="font-bold text-gray-900 hover:text-brand-primary text-lg">@{petOwner?.username || pet.userEmail}</button>
                        </div>
                        {!isOwner && (
                            <button onClick={() => setIsReportModalOpen(true)} className="ml-auto text-gray-400 hover:text-red-500 p-2" title="Reportar publicación">
                                <FlagIcon />
                            </button>
                        )}
                        {/* Admin Action: Contact Requests */}
                        {isOwner && pet.contactRequests && pet.contactRequests.length > 0 && (
                            <button 
                                onClick={() => setIsContactRequestersModalOpen(true)}
                                className="ml-auto flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-200"
                            >
                                <LockIcon className="h-3 w-3" /> {pet.contactRequests.length} interesados
                            </button>
                        )}
                    </div>

                    {/* Comments */}
                    <CommentListAndInput 
                        comments={pet.comments || []} 
                        onAddComment={handleAddCommentLocal}
                        currentUser={currentUser}
                        onLike={(cid) => { if(currentUser) toggleLikeComment.mutate({ commentId: cid, userId: currentUser.id, petId: pet.id }); }}
                    />
                </div>
            </div>

            {/* Modals */}
            <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onSubmit={handleReportSubmit} reportType="post" targetIdentifier={pet.name} />
            <ShareModal pet={pet} isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
            <ReunionSuccessModal isOpen={isReunionModalOpen} onClose={() => setIsReunionModalOpen(false)} pet={pet} onSubmit={handleReunionSubmit} />
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDelete} title="Eliminar Publicación" message="¿Estás seguro? Esta acción no se puede deshacer." confirmText="Sí, eliminar" cancelText="Cancelar" />
            
            {isContactRequestersModalOpen && (
                <ContactRequestersModal
                    isOpen={isContactRequestersModalOpen}
                    onClose={() => setIsContactRequestersModalOpen(false)}
                    requesterEmails={pet.contactRequests || []}
                    allUsers={users}
                    onViewUser={onViewUser}
                />
            )}
        </div>
    );
};

export default PetDetailPage;