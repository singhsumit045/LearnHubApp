import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from './storage';
import { API_BASE_URL } from '../config/env';

export { API_BASE_URL } from '../config/env';

const api = axios.create({ baseURL: API_BASE_URL, timeout: 60000 });

const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/verify-email', '/auth/refresh'];
const isAuthRoute = (url = '') => AUTH_ROUTES.some((r) => url.includes(r));

let onSessionExpired: () => void = () => {};
export const setSessionExpiredHandler = (fn: () => void) => {
  onSessionExpired = fn;
};

let isRefreshing = false;
let subscribers: Array<(token: string | null) => void> = [];

api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (!original || isAuthRoute(original.url)) return Promise.reject(error);

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribers.push((token) => {
            if (!token) return reject(error);
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      try {
        const refresh_token = await storage.getItem('refresh_token');
        if (!refresh_token) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token,
        });
        await storage.setItem('access_token', data.access_token);
        if (data.refresh_token) {
          await storage.setItem('refresh_token', data.refresh_token);
        }

        subscribers.forEach((cb) => cb(data.access_token));
        subscribers = [];
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
        } catch (e) {
        subscribers.forEach((cb) => cb(null));
        subscribers = [];
        await storage.removeMany(['access_token', 'refresh_token', 'user']);
        onSessionExpired();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default api;