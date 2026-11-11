import axios, { AxiosError, AxiosHeaders, type AxiosInstance } from 'axios';
import { getAuth } from 'firebase/auth';
import { toast } from 'sonner';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
const apiBaseUrl = configuredApiBaseUrl || (import.meta.env.DEV ? '' : 'https://caresync-api-gateway.onrender.com');

const api: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth?.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers = config.headers ?? new AxiosHeaders();
    (config.headers as AxiosHeaders).set('Authorization', `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (err: AxiosError<{ message?: string; code?: string }>) => {
    const status = err.response?.status;
    const msg = err.response?.data?.message ?? err.message;

    if (status === 401) {
      toast.error('Session expired. Please sign in again.');
    } else if (status === 403) {
      toast.error('You do not have permission for this action.');
    } else if (status === 429) {
      toast.error('Too many requests. Please slow down.');
    } else if (status && status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (status && status >= 400) {
      toast.error(msg || 'Request failed.');
    } else {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(err);
  },
);

export default api;
