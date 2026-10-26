import axios, { AxiosError, type AxiosInstance } from 'axios';
import { getAuth } from 'firebase/auth';
import { toast } from 'sonner';

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err: AxiosError<{ message?: string; code?: string }>) => {
    const status = err.response?.status;
    const msg = err.response?.data?.message ?? err.message;
    if (status === 401) { toast.error('Session expired. Please sign in again.'); }
    else if (status === 403) { toast.error('You do not have permission for this action.'); }
    else if (status && status >= 500) { toast.error('Server error. Try again later.'); }
    else if (status && status >= 400) { toast.error(msg || 'Request failed'); }
    else { toast.error('Network error'); }
    return Promise.reject(err);
  },
);

export default api;
