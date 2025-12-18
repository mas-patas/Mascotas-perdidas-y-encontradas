import { differenceInDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Calcula la diferencia en días entre dos fechas
 * @param start - Fecha de inicio (string ISO o Date)
 * @param end - Fecha de fin (string ISO o Date). Si no se proporciona, usa la fecha actual
 * @returns Número de días de diferencia
 */
export const calculateDaysApart = (start: string | Date, end?: string | Date): number => {
    const startDate = typeof start === 'string' ? parseISO(start) : start;
    const endDate = end ? (typeof end === 'string' ? parseISO(end) : end) : new Date();
    
    return Math.abs(differenceInDays(endDate, startDate));
};

/**
 * Formatea una fecha a formato legible en español
 * @param dateString - Fecha en formato string ISO
 * @returns Fecha formateada en español (ej: "15 de diciembre de 2024")
 */
export const formatDate = (dateString: string): string => {
    const date = parseISO(dateString);
    return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
};

