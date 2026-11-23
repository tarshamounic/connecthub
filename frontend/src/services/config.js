const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8090/api').replace(/\/$/, '');
const BACKEND_URL = API_URL.replace(/\/api$/, '');

export const WS_URL = import.meta.env.VITE_WS_URL || `${BACKEND_URL.replace(/^http/, 'ws')}/ws`;
export const TOKEN_KEY = 'connecthub.token';
export const USER_KEY = 'connecthub.user';

export { API_URL };
