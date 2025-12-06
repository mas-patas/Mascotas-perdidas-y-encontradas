
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Pet, Mission, ActivityLog, LeaderboardEntry } from '../types';
import { TargetIcon, HistoryIcon, CoinIcon, XCircleIcon, CheckIcon, PlusIcon, ChatBubbleIcon, HeartIcon, MegaphoneIcon, TrophyIcon, CrownIcon } from './icons';
import GamificationBadge, { getLevelFromPoints } from './GamificationBadge';
import { getUserHistory, getWeeklyLeaderboard } from '../services/gamificationService';
import UserPublicProfileModal from './UserPublicProfileModal';

interface GamificationDashboardProps {
    user: User;
    currentPoints: number;
    userReportedPets: Pet[];
    onClose: () => void;
}

const GamificationDashboard: React.FC<GamificationDashboardProps> = ({ user, currentPoints, onClose }) => {
    const [activeTab, setActiveTab] = useState<'missions' | 'leaderboard' | 'history'>('missions');
    const [missions, setMissions] = useState<Mission[]>([]);
    const [history, setHistory] = useState<ActivityLog[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
    const [selectedLeaderboardUser, setSelectedLeaderboardUser] = useState<LeaderboardEntry | null>(null);
    const [viewingPublicProfile, setViewingPublicProfile] = useState<User | null>(null);

    // Define Missions
    const dailyMissions: Mission[] = [
        { id: 'daily_login', title: 'Inicio de Sesión', description: 'Ingresa a la app una vez al día.', points: 5, isCompleted: true, icon: 'login' },
        { id: 'daily_comment', title: 'Comentarista', description: 'Comenta en 3 publicaciones para ayudar.', points: 10, isCompleted: false, icon: 'comment' },
        { id: 'daily_share', title: 'Difusor', description: 'Comparte una publicación en redes.', points: 15, isCompleted: false, icon: 'share' },
    ];

    // Initialize Missions (Simulated Persistence for Demo)
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const storedMissions = localStorage.getItem(`missions_${user.id}_${today}`);
        
        if (storedMissions) {
            setMissions(JSON.parse(storedMissions));
        } else {
            const initMissions = dailyMissions.map(m => ({
                ...m,
                isCompleted: m.id === 'daily_login' ? true : Math.random() > 0.7
            }));
            setMissions(initMissions);
            localStorage.setItem(`missions_${user.id}_${today}`, JSON.stringify(initMissions));
        }
    }, [user.id]);

    // Fetch Data based on Tab
    useEffect(() => {
        const fetchData = async () => {
            if (activeTab === 'history' && user.id) {
                setLoadingHistory(true);
                const data = await getUserHistory(user.id);
                setHistory(data);
                setLoadingHistory(false);
            } else if (activeTab === 'leaderboard') {
                setLoadingLeaderboard(true);
                const data = await getWeeklyLeaderboard();
                setLeaderboard(data);
                setLoadingLeaderboard(false);
            }
        };
        fetchData();
    }, [user.id, activeTab]);

    const handleUserClick = (entry: LeaderboardEntry) => {
        if (entry.user_id === user.id) return; // Don't open own profile modal from here
        
        // Create a partial user object to open the modal
        // Note: We only have partial data, real modal fetches full data by ID
        const partialUser: User = {
            id: entry.user_id,
            username: entry.username,
            email: '', // Hidden
            role: 'User',
            firstName: '',
            lastName: '',
            avatarUrl: entry.avatar_url
        };
        setViewingPublicProfile(partialUser);
    };

    const getActionConfig = (type: ActivityLog['actionType']) => {
        switch (type) {
            case 'report_pet':
                return { label: 'Reporte Publicado', icon: <PlusIcon className="h-4 w-4"/>, colorClass: 'bg-blue-100 text-blue-600' };
            case 'comment_added':
                return { label: 'Comentario de Ayuda', icon: <ChatBubbleIcon className="h-4 w-4"/>, colorClass: 'bg-purple-100 text-purple-600' };
            case 'pet_reunited':
                return { label: 'Mascota Reunida', icon: <HeartIcon className="h-4 w-4" filled/>, colorClass: 'bg-green-100 text-green-600' };
            case 'daily_login':
                return { label: 'Login Diario', icon: <TargetIcon className="h-4 w-4"/>, colorClass: 'bg-gray-100 text-gray-600' };
            case 'share_post':
                return { label: 'Difusión en Redes', icon: <MegaphoneIcon className="h-4 w-4"/>, colorClass: 'bg-orange-100 text-orange-600' };
            default:
                return { label: 'Actividad', icon: <CoinIcon className="h-4 w-4"/>, colorClass: 'bg-gray-100 text-gray-600' };
        }
    };

    // Use Portal to ensure centering works regardless of parent transforms (e.g. sidebar)
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-center items-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black bg-opacity-80 backdrop-blur-sm" onClick={onClose}></div>

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden relative z-10">
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 z-20 transition-colors"
                >
                    <XCircleIcon className="h-8 w-8" />
                </button>

                {/* Hero Header - Shrink-0 prevents it from collapsing */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 md:p-8 text-white relative overflow-hidden shrink-0">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4 md:gap-6">
                            {/* Using white text color via sm/lg logic inside component for dark bg */}
                            <div className="bg-white/10 p-3 md:p-4 rounded-2xl backdrop-blur-md border border-white/20">
                                <GamificationBadge points={currentPoints} size="sm" />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wide">Mi Progreso</h2>
                                <p className="opacity-80 text-xs md:text-sm font-medium">Sigue completando misiones para subir de rango.</p>
                            </div>
                        </div>

                        <div className="bg-black/30 px-6 py-3 rounded-xl border border-white/10 flex items-center gap-4 min-w-[200px]">
                            <div className="bg-yellow-400 p-2 rounded-full shadow-lg text-yellow-900">
                                <CoinIcon className="h-6 w-6 md:h-8 md:w-8" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-xs uppercase font-bold tracking-wider text-yellow-400">Doggy Points</p>
                                <p className="text-3xl md:text-4xl font-black font-mono leading-none">{currentPoints}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation - Shrink-0 ensures tabs stay visible */}
                <div className="flex border-b border-gray-200 bg-gray-50 shrink-0 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('missions')}
                        className={`flex-1 py-3 px-1 sm:px-4 font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-tight sm:tracking-wider flex items-center justify-center gap-1 sm:gap-2 transition-all whitespace-nowrap ${activeTab === 'missions' ? 'bg-white border-b-4 border-indigo-600 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <TargetIcon className="h-4 w-4 sm:h-5 sm:w-5" /> Misiones
                    </button>
                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        className={`flex-1 py-3 px-1 sm:px-4 font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-tight sm:tracking-wider flex items-center justify-center gap-1 sm:gap-2 transition-all whitespace-nowrap ${activeTab === 'leaderboard' ? 'bg-white border-b-4 border-indigo-600 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <TrophyIcon className="h-4 w-4 sm:h-5 sm:w-5" /> Ranking
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 px-1 sm:px-4 font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-tight sm:tracking-wider flex items-center justify-center gap-1 sm:gap-2 transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-white border-b-4 border-indigo-600 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <HistoryIcon className="h-4 w-4 sm:h-5 sm:w-5" /> Historial
                    </button>
                </div>

                {/* Content Area - Flex Grow allows scrolling only here */}
                <div className="flex-grow overflow-y-auto bg-gray-100 p-4 md:p-6">
                    
                    {/* MISSIONS TAB */}
                    {activeTab === 'missions' && (
                        <div className="max-w-2xl mx-auto space-y-4">
                            <div className="flex justify-between items-end mb-2">
                                <h3 className="text-lg md:text-xl font-bold text-gray-800">Misiones de Hoy</h3>
                                <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase bg-gray-200 px-2 py-1 rounded">Reinician en 24h</span>
                            </div>
                            
                            {missions.map(mission => (
                                <div key={mission.id} className={`relative bg-white p-4 rounded-xl shadow-sm border-2 transition-all ${mission.isCompleted ? 'border-green-400 bg-green-50' : 'border-transparent hover:border-indigo-200'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-full ${mission.isCompleted ? 'bg-green-200 text-green-700' : 'bg-indigo-100 text-indigo-600'}`}>
                                                {mission.isCompleted ? <CheckIcon className="h-6 w-6" /> : <TargetIcon className="h-6 w-6" />}
                                            </div>
                                            <div>
                                                <h4 className={`font-bold text-base md:text-lg ${mission.isCompleted ? 'text-green-800 line-through decoration-2' : 'text-gray-800'}`}>{mission.title}</h4>
                                                <p className="text-xs md:text-sm text-gray-500">{mission.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end pl-2">
                                            <span className="font-black text-yellow-500 text-lg md:text-xl flex items-center gap-1 whitespace-nowrap">
                                                +{mission.points} <CoinIcon className="h-4 w-4" />
                                            </span>
                                            {mission.isCompleted && <span className="text-[10px] font-bold text-green-600 uppercase mt-1">Completado</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* LEADERBOARD TAB */}
                    {activeTab === 'leaderboard' && (
                        <div className="max-w-3xl mx-auto">
                            <div className="text-center mb-8">
                                <h3 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-tight mb-2">Héroes de la Semana</h3>
                                <p className="text-gray-500 text-xs md:text-sm">Los usuarios que más ayudan a la comunidad (últimos 7 días)</p>
                            </div>

                            {loadingLeaderboard ? (
                                <div className="flex justify-center items-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
                                </div>
                            ) : leaderboard.length > 0 ? (
                                <>
                                    {/* Podium Section */}
                                    <div className="flex justify-center items-end gap-2 md:gap-4 mb-10 px-2">
                                        {/* 2nd Place */}
                                        {leaderboard[1] && (
                                            <div className="flex flex-col items-center w-1/3 max-w-[120px]">
                                                <div className="relative mb-2">
                                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-gray-300 overflow-hidden shadow-lg">
                                                        {leaderboard[1].avatar_url ? <img src={leaderboard[1].avatar_url} alt="2nd" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">{leaderboard[1].username.charAt(0)}</div>}
                                                    </div>
                                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-300 text-gray-800 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm border border-white">#2</div>
                                                </div>
                                                <p className="text-xs md:text-sm font-bold text-gray-800 truncate w-full text-center">@{leaderboard[1].username}</p>
                                                <p className="text-[10px] md:text-xs text-indigo-600 font-bold">{leaderboard[1].total_points} pts</p>
                                            </div>
                                        )}

                                        {/* 1st Place */}
                                        {leaderboard[0] && (
                                            <div className="flex flex-col items-center w-1/3 max-w-[140px] -mb-4 z-10">
                                                <div className="mb-1 text-yellow-500 animate-bounce-slow">
                                                    <CrownIcon className="h-6 w-6 md:h-8 md:w-8" />
                                                </div>
                                                <div className="relative mb-3">
                                                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-yellow-400 overflow-hidden shadow-xl ring-4 ring-yellow-100">
                                                        {leaderboard[0].avatar_url ? <img src={leaderboard[0].avatar_url} alt="1st" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 text-2xl">{leaderboard[0].username.charAt(0)}</div>}
                                                    </div>
                                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs md:text-sm font-black px-3 py-1 rounded-full shadow-md border-2 border-white">#1</div>
                                                </div>
                                                <p className="text-sm md:text-base font-bold text-gray-900 truncate w-full text-center">@{leaderboard[0].username}</p>
                                                <p className="text-xs md:text-sm text-indigo-600 font-black bg-indigo-50 px-2 py-0.5 rounded-lg mt-1">{leaderboard[0].total_points} pts</p>
                                            </div>
                                        )}

                                        {/* 3rd Place */}
                                        {leaderboard[2] && (
                                            <div className="flex flex-col items-center w-1/3 max-w-[120px]">
                                                <div className="relative mb-2">
                                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-amber-600 overflow-hidden shadow-lg">
                                                        {leaderboard[2].avatar_url ? <img src={leaderboard[2].avatar_url} alt="3rd" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">{leaderboard[2].username.charAt(0)}</div>}
                                                    </div>
                                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm border border-white">#3</div>
                                                </div>
                                                <p className="text-xs md:text-sm font-bold text-gray-800 truncate w-full text-center">@{leaderboard[2].username}</p>
                                                <p className="text-[10px] md:text-xs text-indigo-600 font-bold">{leaderboard[2].total_points} pts</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* List for 4th+ */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                        {leaderboard.slice(3).map((entry, index) => {
                                            const isMe = entry.user_id === user.id;
                                            return (
                                                <div 
                                                    key={entry.user_id} 
                                                    className={`flex items-center p-3 md:p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${isMe ? 'bg-indigo-50 hover:bg-indigo-100' : ''}`}
                                                    onClick={() => handleUserClick(entry)}
                                                >
                                                    <span className="w-8 text-center font-bold text-gray-400 text-xs md:text-sm">#{index + 4}</span>
                                                    <div className="flex items-center gap-3 flex-1 ml-2">
                                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                                            {entry.avatar_url ? <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">{entry.username.charAt(0)}</div>}
                                                        </div>
                                                        <div>
                                                            <p className={`text-xs md:text-sm font-bold ${isMe ? 'text-indigo-700' : 'text-gray-800'}`}>
                                                                @{entry.username} {isMe && '(Tú)'}
                                                            </p>
                                                            <div className="flex items-center gap-1 scale-75 origin-left md:scale-100">
                                                                <GamificationBadge points={entry.total_points} size="sm" /> 
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-bold text-indigo-600 text-sm md:text-base">{entry.total_points}</span>
                                                        <span className="text-[10px] md:text-xs text-gray-400 ml-1">pts</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        
                                        {leaderboard.length <= 3 && (
                                            <div className="p-8 text-center text-gray-400 italic text-sm">
                                                Sé el próximo en aparecer aquí completando misiones.
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="p-12 text-center">
                                    <p className="text-gray-400 mb-2 text-lg">No hay datos de ranking esta semana.</p>
                                    <p className="text-gray-500 text-sm">¡Sé el primero en sumar puntos!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* HISTORY TAB */}
                    {activeTab === 'history' && (
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {loadingHistory ? (
                                    <div className="p-8 text-center text-gray-500">Cargando historial...</div>
                                ) : history.length > 0 ? (
                                    <>
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs">
                                                <tr>
                                                    <th className="px-4 py-3 font-bold">Actividad</th>
                                                    <th className="px-4 py-3 font-bold hidden sm:table-cell">Fecha</th>
                                                    <th className="px-4 py-3 font-bold text-right">Puntos</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {history.slice(0, 5).map((log) => {
                                                    const config = getActionConfig(log.actionType);
                                                    return (
                                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-4 font-medium text-gray-800">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`${config.colorClass} p-2 rounded-lg shadow-sm flex-shrink-0`}>
                                                                        {config.icon}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span>{config.label}</span>
                                                                        <span className="text-[10px] text-gray-400 sm:hidden">
                                                                            {new Date(log.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 text-gray-500 text-xs hidden sm:table-cell">
                                                                {new Date(log.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                            </td>
                                                            <td className="px-4 py-4 text-right font-bold text-green-600 whitespace-nowrap">+{log.points}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                        <div className="p-3 text-center bg-gray-50 border-t border-gray-200">
                                            <p className="text-xs text-gray-500 italic">Se muestran los últimos 5 registros</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-12 text-center">
                                        <p className="text-gray-400 mb-2 text-lg">Aún no tienes historial de actividad.</p>
                                        <p className="text-gray-500 text-sm">¡Empieza a interactuar para ganar puntos!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {viewingPublicProfile && (
                <UserPublicProfileModal
                    isOpen={!!viewingPublicProfile}
                    onClose={() => setViewingPublicProfile(null)}
                    targetUser={viewingPublicProfile}
                />
            )}
        </div>,
        document.body
    );
};

export default GamificationDashboard;
