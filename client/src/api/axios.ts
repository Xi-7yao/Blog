import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { refreshTokenApi, logoutApi } from './userApi';
import { ErrorResponse } from '../type/api';

export interface CustomAxiosRequestConfig<D = unknown> extends AxiosRequestConfig<D> {
  retry?: number;
  retryDelay?: number;
  _retry?: boolean;
}

interface FailedQueueItem {
  resolve: () => void;
  reject: (reason?: unknown) => void;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error?: unknown) => {
  failedQueue.forEach((item) => {
    if (error) {
      item.reject(error);
      return;
    }

    item.resolve();
  });

  failedQueue = [];
};

const shouldRefreshToken = (
  error: AxiosError<ErrorResponse>,
  config?: CustomAxiosRequestConfig
) => {
  return (
    error.response?.status === 401 &&
    error.response.data?.error?.code === 'TOKEN_EXPIRED' &&
    !!config &&
    !config._retry
  );
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const config = error.config as CustomAxiosRequestConfig | undefined;

    if (config && shouldRefreshToken(error, config)) {
      config._retry = true;

      if (isRefreshing) {
          return new Promise<void>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => api(config));
      }

      isRefreshing = true;

      try {
        await refreshTokenApi();
        processQueue();
        return api(config);
      } catch (refreshError: unknown) {
        processQueue(refreshError);
        await logoutApi().catch(() => undefined);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (!config || !config.retry) {
      return Promise.reject(error);
    }

    config.retry -= 1;
    const delay = config.retryDelay || 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return api(config);
  }
);

export const requestApi = <T = unknown, D = unknown>(
  config: CustomAxiosRequestConfig<D>
): Promise<AxiosResponse<T>> => {
  return api.request<T, AxiosResponse<T>, D>(config);
};

export default api;
