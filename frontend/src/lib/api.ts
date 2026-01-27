import axios from 'axios';

const api = axios.create({
    baseURL: 'https://restaurant-inventory-production-8b22.up.railway.app/',
});

// Add token to request if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;  