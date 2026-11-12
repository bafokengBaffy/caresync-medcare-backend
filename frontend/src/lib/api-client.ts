import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { getAuth } from 'firebase/auth';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useTenantContextStore } from '@/stores/tenant-context-store';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
const apiBaseUrl = import.meta.env.DEV
  ? ''
  : configuredApiBaseUrl || 'https://caresync-medcare-backend.onrender.com';

const api: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  config.headers = AxiosHeaders.from(config.headers);
  config.headers.delete('X-Tenant-Id');

  const auth = getAuth();
  const user = auth?.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers = config.headers ?? new AxiosHeaders();
    (config.headers as AxiosHeaders).set('Authorization', `Bearer ${token}`);
  }

  const authUser = useAuthStore.getState().user;
  const tenantContext = useTenantContextStore.getState();
  if (
    authUser?.role === 'SUPER_ADMIN'
    && tenantContext.selectedForUid === authUser.uid
    && tenantContext.selectedTenantId
  ) {
    config.headers.set('X-Tenant-Id', tenantContext.selectedTenantId);
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (err: AxiosError<{ message?: string; code?: string }>) => {
    const status = err.response?.status;
    const msg = err.response?.data?.message ?? err.message;

    const request = err.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (status === 401 && request && !request._retry) {
      const user = getAuth().currentUser;
      if (user) {
        request._retry = true;
        try {
          const token = await user.getIdToken(true);
          request.headers = AxiosHeaders.from(request.headers);
          request.headers.set('Authorization', `Bearer ${token}`);
          return api.request(request);
        } catch (refreshError) {
          toast.error('Session expired. Please sign in again.');
          return Promise.reject(refreshError);
        }
      }
    }

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

// Small typed facade for feature modules that need the response body directly.
// Keep the configured Axios instance and its auth/error interceptors as the single transport.
export const apiClient = {
  async get<T>(url: string): Promise<T> {
    const response = await api.get<T>(url);
    return response.data;
  },
  async post<T>(url: string, body?: unknown): Promise<T> {
    const response = await api.post<T>(url, body);
    return response.data;
  },
};
