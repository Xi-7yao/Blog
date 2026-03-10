import { AxiosError } from 'axios';
import { message } from 'antd';
import { requestApi, CustomAxiosRequestConfig } from './axios';
import { PasswordLoginRequest, RegisterRequest } from '../type/login';
import { User, AuthResponse } from '../type/user';
import { ApiResponse, ErrorResponse } from '../type/api';

const defaultConfig: CustomAxiosRequestConfig = {
  retry: 1,
  retryDelay: 1000,
};

const getRequestErrorMessage = (
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

const request = async <T, D = unknown>(
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
    message.error(getRequestErrorMessage(axiosError));
    throw axiosError;
  }
};

export const registerApi = async (userRegister: RegisterRequest): Promise<AuthResponse> => {
  const response = await request<AuthResponse, RegisterRequest>('post', '/user/register', userRegister);
  message.success(response.message || '注册成功');
  return response;
};

export const passwordLoginApi = async (
  userLogin: PasswordLoginRequest
): Promise<AuthResponse> => {
  const response = await request<AuthResponse, PasswordLoginRequest>('post', '/user/login', userLogin);
  message.success(response.message || '登录成功');
  return response;
};

export const getUserApi = async (): Promise<User> => {
  const response = await request<{ user: User }>('get', '/user/me', undefined);
  return response.user;
};

export const logoutApi = async (): Promise<void> => {
  await request<void>('post', '/user/logout', undefined);
  message.success('登出成功');
};

export const refreshTokenApi = async (): Promise<AuthResponse> => {
  const response = await request<AuthResponse>('post', '/user/refresh', undefined);
  return response;
};
