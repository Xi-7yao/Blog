import { AxiosError } from 'axios';
import { message } from 'antd';
import { requestApi, CustomAxiosRequestConfig } from './axios';
import { ApiResponse, ErrorResponse } from '../type/api';

const defaultConfig: CustomAxiosRequestConfig = {
  retry: 1,
  retryDelay: 1000,
};

export const getRequestErrorMessage = (
  error: AxiosError<ErrorResponse>,
  fallback = '操作失败'
) => {
  if (error.response) {
    return error.response.data.error?.message || fallback;
  }

  if (error.request) {
    return '网络错误，请检查连接';
  }

  return fallback;
};

export const request = async <T, D = unknown>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: D,
  config?: CustomAxiosRequestConfig<D>
): Promise<T> => {
  const mergedConfig: CustomAxiosRequestConfig<D> = {
    retry: defaultConfig.retry,
    retryDelay: defaultConfig.retryDelay,
    ...config,
  };

  try {
    const response = await requestApi<ApiResponse<T>, D>({
      method,
      url,
      data,
      headers: mergedConfig.headers,
      signal: mergedConfig.signal,
      retry: mergedConfig.retry,
      retryDelay: mergedConfig.retryDelay,
    });

    if (response.data.error) {
      throw new Error(response.data.error.message);
    }

    return response.data.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<ErrorResponse>;

    if (axiosError.code === 'ERR_CANCELED') {
      throw new Error('Request canceled by user');
    }

    message.error(getRequestErrorMessage(axiosError));
    throw axiosError;
  }
};
