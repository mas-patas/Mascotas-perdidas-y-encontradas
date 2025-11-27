

export const PET_STATUS = {
    PERDIDO: 'Perdido',
    ENCONTRADO: 'Encontrado',
    AVISTADO: 'Avistado',
    EN_ADOPCION: 'En Adopción',
    REUNIDO: 'Reunido',
} as const;

export const ANIMAL_TYPES = {
    PERRO: 'Perro',
    GATO: 'Gato',
    OTRO: 'Otro',
} as const;

export const SIZES = {
    PEQUENO: 'Pequeño',
    MEDIANO: 'Mediano',
    GRANDE: 'Grande',
} as const;

export const USER_ROLES = {
    SUPERADMIN: 'Superadmin',
    ADMIN: 'Admin',
    MODERATOR: 'Moderator',
    USER: 'User',
} as const;

export const USER_STATUS = {
    ACTIVE: 'Activo',
    INACTIVE: 'Inactivo',
} as const;

export const REPORT_REASONS = {
    INAPPROPRIATE_CONTENT: 'Contenido inapropiado',
    SPAM: 'Spam o publicidad',
    SCAM: 'Estafa o fraude',
    HARASSMENT: 'Acoso o discurso de odio',
    FALSE_INFORMATION: 'Información falsa',
    OTHER: 'Otro',
} as const;

export const REPORT_STATUS = {
    PENDING: 'Pendiente',
    ELIMINATED: 'Eliminado',
    INVALID: 'Reporte Inválido',
    NO_ACTION: 'Sin Acciones',
} as const;

export const SUPPORT_TICKET_STATUS = {
    PENDING: 'Pendiente',
    IN_PROGRESS: 'En Progreso',
    RESOLVED: 'Resuelto',
    NOT_RESOLVED: 'No Resuelto',
} as const;

export const SUPPORT_TICKET_CATEGORIES = {
    TECHNICAL_ISSUE: 'Problema Técnico',
    ACCOUNT_HELP: 'Ayuda con la Cuenta',
    GENERAL_INQUIRY: 'Consulta General',
    FEEDBACK: 'Sugerencia o Feedback',
    REPORT_FOLLOWUP: 'Seguimiento de Reporte',
} as const;

export const CAMPAIGN_TYPES = {
    ESTERILIZACION: 'Esterilización',
    ADOPCION: 'Adopción',
} as const;

export const BUSINESS_TYPES = {
    VETERINARIA: 'Veterinaria',
    PET_SHOP: 'Pet Shop',
    ESTETICA: 'Estética/Grooming',
    HOTEL: 'Hospedaje',
} as const;
