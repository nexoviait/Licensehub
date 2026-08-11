import axios from 'axios';

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Set CSRF token for all requests
const token = document.head.querySelector('meta[name="csrf-token"]');

if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
} else {
    console.error('CSRF token not found://laravel.com/docs/csrf#csrf-protection');
}

// Interceptor to attach Bearer token if available
axios.interceptors.request.use((config) => {
    const jwtToken = localStorage.getItem('lh.jwt.token');
    if (jwtToken) {
        config.headers.Authorization = `Bearer ${jwtToken}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default axios;
