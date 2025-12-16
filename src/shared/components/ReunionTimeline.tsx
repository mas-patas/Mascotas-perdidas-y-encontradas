import React from 'react';
import { CalendarIcon, ClockIcon, HeartIcon } from './icons';
import { calculateDaysApart, formatDate } from '@/utils/date.utils';

interface ReunionTimelineProps {
    lostDate: string;
    reunionDate?: string;
    orientation?: 'horizontal' | 'vertical';
    className?: string;
}

export const ReunionTimeline: React.FC<ReunionTimelineProps> = ({
    lostDate,
    reunionDate,
    orientation = 'horizontal',
    className = ''
}) => {
    const daysLost = calculateDaysApart(lostDate, reunionDate);
    const lostDateFormatted = formatDate(lostDate);
    const reunionDateFormatted = reunionDate ? formatDate(reunionDate) : null;

    if (orientation === 'vertical') {
        return (
            <div className={`space-y-4 ${className}`}>
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                        <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center border-2 border-sky-300">
                            <CalendarIcon className="h-5 w-5 text-sky-600" />
                        </div>
                    </div>
                    <div className="flex-1 pt-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-icon-gray mb-1">Publicado como perdida</p>
                        <p className="text-sm font-semibold text-text-main">{lostDateFormatted}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center border-2 border-amber-300">
                            <ClockIcon className="h-5 w-5 text-amber-600" />
                        </div>
                    </div>
                    <div className="flex-1 pt-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-icon-gray mb-1">Tiempo perdida</p>
                        <p className="text-base font-black text-amber-600">
                            {daysLost} {daysLost === 1 ? 'día' : 'días'}
                        </p>
                    </div>
                </div>

                {reunionDateFormatted && (
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-emerald-300">
                                <HeartIcon className="h-5 w-5 text-emerald-600" filled />
                            </div>
                        </div>
                        <div className="flex-1 pt-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-icon-gray mb-1">Fecha de reencuentro</p>
                            <p className="text-sm font-semibold text-emerald-600">{reunionDateFormatted}</p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Horizontal orientation
    return (
        <div className={`flex flex-wrap items-center gap-4 md:gap-6 ${className}`}>
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center border-2 border-sky-300">
                    <CalendarIcon className="h-4 w-4 text-sky-600" />
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-icon-gray">Publicado</p>
                    <p className="text-sm font-semibold text-text-main">{lostDateFormatted}</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center border-2 border-amber-300">
                    <ClockIcon className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-icon-gray">Tiempo perdida</p>
                    <p className="text-base font-black text-amber-600">
                        {daysLost} {daysLost === 1 ? 'día' : 'días'}
                    </p>
                </div>
            </div>

            {reunionDateFormatted && (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-emerald-300">
                        <HeartIcon className="h-4 w-4 text-emerald-600" filled />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-icon-gray">Reunido</p>
                        <p className="text-sm font-semibold text-emerald-600">{reunionDateFormatted}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

