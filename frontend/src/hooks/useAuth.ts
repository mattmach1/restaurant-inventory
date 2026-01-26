import { type User } from '../types/user';

export const useAuth = () => {
    const getUserFromStorage = (): User | null => {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    }

    const user = getUserFromStorage();

    const isAdmin = user?.role === 'ADMIN';
    const isManager = user?.role === 'MANAGER';

    return {
        user,
        isAdmin,
        isManager
    }
}