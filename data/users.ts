import { User } from '../types';
import { USER_ROLES, USER_STATUS } from '../constants';

export const initialUsersForDemo: User[] = [
    // Admins
    { 
        email: 'roger1771@gmail.com', 
        role: USER_ROLES.SUPERADMIN, 
        username: 'TonySuperAdmin', 
        firstName: 'Antony', 
        lastName: 'Rojas', 
        phone: '926961387', 
        dni: '76543210', 
        status: USER_STATUS.ACTIVE,
        ownedPets: [
            { id: 'owned-1', name: 'Max', animalType: 'Perro', breed: 'Pastor Alemán', colors: ['Negro', 'Marrón'], description: 'Leal y protector, adora jugar a buscar la pelota.', imageUrls: ['https://picsum.photos/seed/max_tony/400/400'] },
            { id: 'owned-2', name: 'Misha', animalType: 'Gato', breed: 'Siamés', colors: ['Crema', 'Marrón'], description: 'Muy vocal y curiosa, siempre explorando la casa.', imageUrls: ['https://picsum.photos/seed/misha_tony/400/400'] }
        ]
    },
    { 
        email: 'super@admin.com', 
        role: USER_ROLES.SUPERADMIN, 
        username: 'SuperAdmin', 
        firstName: 'Super', 
        lastName: 'Admin', 
        phone: '999999999', 
        dni: '12345678', 
        status: USER_STATUS.ACTIVE,
        ownedPets: [
            { id: 'owned-3', name: 'Rex', animalType: 'Perro', breed: 'Bulldog', colors: ['Atigrado'], description: 'Testarudo pero muy cariñoso. Le encantan las siestas.', imageUrls: ['https://picsum.photos/seed/rex_super/400/400'] },
            { id: 'owned-4', name: 'Whiskers', animalType: 'Gato', breed: 'Maine Coon', colors: ['Gris'], description: 'Un gigante gentil con un pelaje magnífico.', imageUrls: ['https://picsum.photos/seed/whiskers_super/400/400'] }
        ]
    },
    { 
        email: 'admin@admin.com', 
        role: USER_ROLES.ADMIN, 
        username: 'AdminUser', 
        firstName: 'Admin', 
        lastName: 'User', 
        phone: '888888888', 
        dni: '87654321', 
        status: USER_STATUS.ACTIVE,
        ownedPets: [
            { id: 'owned-5', name: 'Bella', animalType: 'Perro', breed: 'Golden Retriever', colors: ['Dorado'], description: 'La perra más dulce y paciente del mundo.', imageUrls: ['https://picsum.photos/seed/bella_admin/400/400'] },
            { id: 'owned-6', name: 'Shadow', animalType: 'Gato', breed: 'Mestizo', colors: ['Negro'], description: 'Sigiloso y misterioso, pero adora los mimos.', imageUrls: ['https://picsum.photos/seed/shadow_admin/400/400'] }
        ]
    },
    { 
        email: 'mod@moderator.com', 
        role: USER_ROLES.MODERATOR, 
        username: 'ModUser', 
        firstName: 'Mod', 
        lastName: 'User', 
        phone: '777777777', 
        dni: '11223344', 
        status: USER_STATUS.ACTIVE,
        ownedPets: [
            { id: 'owned-7', name: 'Charlie', animalType: 'Perro', breed: 'Beagle', colors: ['Tricolor'], description: 'Energético y siempre metiendo su nariz en todo.', imageUrls: ['https://picsum.photos/seed/charlie_mod/400/400'] },
            { id: 'owned-8', name: 'Oreo', animalType: 'Gato', breed: 'Mestizo', colors: ['Blanco', 'Negro'], description: 'Le encanta jugar y perseguir punteros láser.', imageUrls: ['https://picsum.photos/seed/oreo_mod/400/400'] }
        ]
    },
    // Regular Users
    { 
        email: 'user1@example.com', 
        role: USER_ROLES.USER, 
        username: 'carlos_g', 
        firstName: 'Carlos', 
        lastName: 'González', 
        phone: '987654321', 
        dni: '22334455', 
        status: USER_STATUS.ACTIVE,
        ownedPets: [
            { id: 'owned-9', name: 'Rocky', animalType: 'Perro', breed: 'Boxer', colors: ['Marrón'], description: 'Fuerte y juguetón. Un gran compañero de corridas.', imageUrls: ['https://picsum.photos/seed/rocky_carlos/400/400'] },
            { id: 'owned-10', name: 'Lucy', animalType: 'Gato', breed: 'Persa', colors: ['Blanco'], description: 'Tranquila y majestuosa. Reina de la casa.', imageUrls: ['https://picsum.photos/seed/lucy_carlos/400/400'] }
        ]
    },
    { 
        email: 'user2@example.com', 
        role: USER_ROLES.USER, 
        username: 'ana_m', 
        firstName: 'Ana', 
        lastName: 'Martínez', 
        phone: '987654322', 
        dni: '33445566', 
        status: USER_STATUS.ACTIVE,
        ownedPets: [
            { id: 'owned-11', name: 'Toby', animalType: 'Perro', breed: 'Poodle', colors: ['Blanco'], description: 'Inteligente y con un corte de pelo impecable.', imageUrls: ['https://picsum.photos/seed/toby_ana/400/400'] },
            { id: 'owned-12', name: 'Smokey', animalType: 'Gato', breed: 'Azul Ruso', colors: ['Gris'], description: 'Elegante y un poco tímido con los extraños.', imageUrls: ['https://picsum.photos/seed/smokey_ana/400/400'] }
        ]
    },
    { 
        email: 'user3@example.com', 
        role: USER_ROLES.USER, 
        username: 'juan_r', 
        firstName: 'Juan', 
        lastName: 'Rodríguez', 
        phone: '987654323', 
        dni: '44556677', 
        status: USER_STATUS.ACTIVE,
        ownedPets: [
            { id: 'owned-13', name: 'Jack', animalType: 'Perro', breed: 'Husky Siberiano', colors: ['Blanco', 'Negro'], description: 'Le encanta correr y tiene unos ojos azules impresionantes.', imageUrls: ['https://picsum.photos/seed/jack_juan/400/400'] },
            { id: 'owned-14', name: 'Ginger', animalType: 'Gato', breed: 'Mestizo', colors: ['Naranja'], description: 'Una gata con mucha personalidad y energía.', imageUrls: ['https://picsum.photos/seed/ginger_juan/400/400'] }
        ]
    },
    { 
        email: 'user4@example.com', 
        role: USER_ROLES.USER, 
        username: 'maria_l', 
        firstName: 'María', 
        lastName: 'López', 
        phone: '987654324', 
        dni: '55667788', 
        status: USER_STATUS.ACTIVE,
        ownedPets: [
            { id: 'owned-15', name: 'Lola', animalType: 'Perro', breed: 'Chihuahua', colors: ['Canela'], description: 'Pequeña en tamaño pero con un corazón de león.', imageUrls: ['https://picsum.photos/seed/lola_maria/400/400'] },
            { id: 'owned-16', name: 'Chloe', animalType: 'Gato', breed: 'Ragdoll', colors: ['Blanco', 'Crema'], description: 'Muy dócil, le encanta que la carguen.', imageUrls: ['https://picsum.photos/seed/chloe_maria/400/400'] }
        ]
    },
    { 
        email: 'user5@example.com', 
        role: USER_ROLES.USER, 
        username: 'david_p', 
        firstName: 'David', 
        lastName: 'Pérez', 
        phone: '987654325', 
        dni: '66778899', 
        status: USER_STATUS.ACTIVE,
        ownedPets: [
            { id: 'owned-17', name: 'Duke', animalType: 'Perro', breed: 'Doberman', colors: ['Negro'], description: 'Un perro guardián muy leal y cariñoso con su familia.', imageUrls: ['https://picsum.photos/seed/duke_david/400/400'] },
            { id: 'owned-18', name: 'Patches', animalType: 'Gato', breed: 'Mestizo', colors: ['Tricolor'], description: 'Una gatita juguetona con manchas únicas.', imageUrls: ['https://picsum.photos/seed/patches_david/400/400'] }
        ]
    },
    { 
        email: 'user6@example.com', 
        role: USER_ROLES.USER, 
        username: 'laura_s', 
        firstName: 'Laura', 
        lastName: 'Sánchez', 
        phone: '987654326', 
        dni: '77889900', 
        status: USER_STATUS.ACTIVE,
        ownedPets: [
            { id: 'owned-19', name: 'Bear', animalType: 'Perro', breed: 'Gran Danés', colors: ['Negro'], description: 'Un gigante amigable que piensa que es un perro faldero.', imageUrls: ['https://picsum.photos/seed/bear_laura/400/400'] },
            { id: 'owned-20', name: 'Cleo', animalType: 'Gato', breed: 'Esfinge (Sphynx)', colors: ['Crema'], description: 'Siempre buscando el lugar más cálido para acurrucarse.', imageUrls: ['https://picsum.photos/seed/cleo_laura/400/400'] }
        ]
    },
    { 
        email: 'user7@example.com', 
        role: USER_ROLES.USER, 
        username: 'javier_f', 
        firstName: 'Javier', 
        lastName: 'Fernández', 
        phone: '987654327', 
        dni: '88990011', 
        status: USER_STATUS.ACTIVE,
        ownedPets: [
            { id: 'owned-21', name: 'Buster', animalType: 'Perro', breed: 'Mestizo', colors: ['Marrón', 'Blanco'], description: 'Un perro feliz y despreocupado, amigo de todos.', imageUrls: ['https://picsum.photos/seed/buster_javier/400/400'] },
            { id: 'owned-22', name: 'Zoe', animalType: 'Gato', breed: 'Angora Turco', colors: ['Blanco'], description: 'Elegante y grácil, con un pelaje largo y sedoso.', imageUrls: ['https://picsum.photos/seed/zoe_javier/400/400'] }
        ]
    },
    { 
        email: 'user8@example.com', 
        role: USER_ROLES.USER, 
        username: 'sofia_g', 
        firstName: 'Sofía', 
        lastName: 'Gómez', 
        phone: '987654328', 
        dni: '99001122', 
        status: USER_STATUS.ACTIVE,
        ownedPets: [
            { id: 'owned-23', name: 'Zeus', animalType: 'Perro', breed: 'Rottweiler', colors: ['Negro', 'Fuego'], description: 'Un compañero leal y obediente.', imageUrls: ['https://picsum.photos/seed/zeus_sofia/400/400'] },
            { id: 'owned-24', name: 'Milo', animalType: 'Gato', breed: 'Mestizo', colors: ['Atigrado', 'Marrón'], description: 'El amo y señor de las siestas y la comodidad.', imageUrls: ['https://picsum.photos/seed/milo_sofia/400/400'] }
        ]
    },
    { 
        email: 'user9@example.com', 
        role: USER_ROLES.USER, 
        username: 'diego_m', 
        firstName: 'Diego', 
        lastName: 'Martín', 
        phone: '987654329', 
        dni: '00112233', 
        status: USER_STATUS.ACTIVE,
        ownedPets: [
            { id: 'owned-25', name: 'Winston', animalType: 'Perro', breed: 'Bulldog', colors: ['Dorado'], description: 'Encantadoramente terco, con una cara que no puedes ignorar.', imageUrls: ['https://picsum.photos/seed/winston_diego/400/400'] },
            { id: 'owned-26', name: 'Nala', animalType: 'Gato', breed: 'Bengalí', colors: ['Manchado'], description: 'Activa y juguetona, con un toque salvaje.', imageUrls: ['https://picsum.photos/seed/nala_diego/400/400'] }
        ]
    },
    { 
        email: 'user10@example.com', 
        role: USER_ROLES.USER, 
        username: 'elena_r', 
        firstName: 'Elena', 
        lastName: 'Ruiz', 
        phone: '987654310', 
        dni: '11223345', 
        status: USER_STATUS.ACTIVE,
        ownedPets: [
            { id: 'owned-27', name: 'Koda', animalType: 'Perro', breed: 'Pastor Alemán', colors: ['Blanco'], description: 'Inteligente y alerta, siempre listo para una aventura.', imageUrls: ['https://picsum.photos/seed/koda_elena/400/400'] },
            { id: 'owned-28', name: 'Pepper', animalType: 'Gato', breed: 'Mestizo', colors: ['Negro', 'Blanco'], description: 'Curiosa y dulce, le encanta explorar cajas.', imageUrls: ['https://picsum.photos/seed/pepper_elena/400/400'] }
        ]
    },
];
