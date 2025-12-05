
// This hook has been deprecated and dismantled. 
// Please use useUsers, usePets, useChats, useAdminData, etc.
// from their respective files in hooks/.

export const useAppData = () => {
    console.warn("useAppData is deprecated. Please refactor your component to use specific hooks.");
    return {
        users: [],
        chats: [],
        reports: [],
        supportTickets: [],
        campaigns: [],
        notifications: [],
        bannedIps: [],
        loading: false,
        setUsers: () => {},
        setChats: () => {},
        setReports: () => {},
        setSupportTickets: () => {},
        setCampaigns: () => {},
        setNotifications: () => {},
        setBannedIps: () => {},
    };
};
