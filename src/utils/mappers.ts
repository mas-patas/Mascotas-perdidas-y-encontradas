
import { Pet, Comment } from '../types';

/**
 * Transforma un registro crudo de mascota de la base de datos (snake_case)
 * al tipo Pet de la aplicación (camelCase), manejando relaciones opcionales.
 */
export const mapPetFromDb = (
    p: any, 
    profiles: any[] = [], 
    comments: any[] = [], 
    likes: any[] = []
): Pet => {
    // Intenta encontrar el dueño en el array de perfiles proporcionado,
    // o usa el objeto 'profiles' si viene anidado (join directo)
    const ownerEmail = p.profiles?.email || profiles.find((u: any) => u.id === p.user_id)?.email || 'unknown';

    // Mapear comentarios si se proporcionan
    const petComments: Comment[] = comments
        .filter((c: any) => c.pet_id === p.id)
        .map((c: any) => {
            const commentLikes = likes.filter((l: any) => l.comment_id === c.id).map((l: any) => l.user_id);
            return {
                id: c.id,
                userId: c.user_id,
                userEmail: c.user_email,
                userName: c.user_name,
                text: c.text,
                timestamp: c.created_at,
                parentId: c.parent_id,
                likes: commentLikes
            };
        });

    return {
        id: p.id,
        userEmail: ownerEmail,
        status: p.status,
        name: p.name,
        animalType: p.animal_type,
        breed: p.breed,
        color: p.color,
        size: p.size,
        location: p.location,
        date: p.date,
        contact: p.contact,
        description: p.description,
        imageUrls: p.image_urls || [],
        adoptionRequirements: p.adoption_requirements,
        shareContactInfo: p.share_contact_info,
        contactRequests: p.contact_requests || [],
        reward: p.reward,
        currency: p.currency,
        lat: p.lat,
        lng: p.lng,
        comments: petComments,
        expiresAt: p.expires_at,
        createdAt: p.created_at,
        reunionStory: p.reunion_story,
        reunionDate: p.reunion_date
    };
};
