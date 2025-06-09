import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { refreshTokenApi, logoutApi } from './userApi';

// 定义错误响应类型，与后端对齐
interface ErrorResponse {
  error?: { message: string; code: string };
  status: number;
}

export interface CustomAxiosRequestConfig<D = any> extends AxiosRequestConfig<D> {
  retry?: number;
  retryDelay?: number;
  _retry?: boolean;
}

interface CustomAxiosInstance extends AxiosInstance {
  request<T = any, R = AxiosResponse<T>, D = any>(
    config: CustomAxiosRequestConfig<D>
  ): Promise<R>;
}

const api: CustomAxiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api',
  // baseURL: 'http://124.220.37.101:5000/api',
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use((config) => {
  // console.log('Request:', config.method, config.url);
  return config;
});

// 防止并发刷新
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // console.log('Success:', response.status, response.config.url);
    return response;
  },
  async (error: AxiosError<ErrorResponse>) => {
    const config = error.config as CustomAxiosRequestConfig;

    // 处理 401 错误，仅 TOKEN_EXPIRED 触发刷新
    if (error.response?.status === 401 && !config._retry) {
      // const errorCode = error.response.data?.error?.code;
      config._retry = true;
      // console.log('401 TOKEN_EXPIRED detected, attempting to refresh token');

      // 如果正在刷新，加入队列
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(config))
          .catch((err) => Promise.reject(err));
      }

      // 开始刷新
      isRefreshing = true;
      try {
        await refreshTokenApi();
        // console.log('Token refreshed successfully');
        processQueue(null);
        return api(config); // 重试原始请求
      } catch (refreshError: any) {
        // console.error('Refresh token failed:', refreshError);
        processQueue(refreshError);
        await logoutApi();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 处理其他错误（保留原有重试逻辑）
    if (!config || !config.retry) {
      return Promise.reject(error);
    }
    config.retry -= 1;
    const delay = config.retryDelay || 1000;
    // console.log(`Retrying request: ${config.url}, attempts left: ${config.retry}`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return api(config);
  }
);

export default api;