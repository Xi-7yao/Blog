import { AxiosError } from 'axios';
import { message } from 'antd';
import api, { CustomAxiosRequestConfig } from './axios';
import { PasswordLoginRequest, RegisterRequest } from '../type/login';
import { User, AuthResponse } from '../type/user';
import { ApiResponse, ErrorResponse } from '../type/api';

const defaultConfig: CustomAxiosRequestConfig = {
  retry: 1,
  retryDelay: 1000,
};

// 通用请求函数
const request = async <T>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: any,
  config: CustomAxiosRequestConfig = defaultConfig
): Promise<T> => {
  try {
    const response = await api.request<ApiResponse<T>>({
      method,
      url,
      data,
      headers: config.headers,
      signal: config.signal,
      retry: config.retry,
      retryDelay: config.retryDelay,
    });
    if (response.data.error) {
      throw new Error(response.data.error.message);
    }
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError<ErrorResponse>;
    let errorMessage = '操作失败';
    if (axiosError.response) {
      errorMessage = axiosError.response.data.error?.message || errorMessage;
    } else if (axiosError.request) {
      errorMessage = '网络错误，请检查连接';
    }
    // console.error('API error:', {
    //   message: errorMessage,
    //   code: axiosError.response?.data.error?.code,
    //   status: axiosError.response?.status,
    // });
    message.error(errorMessage);
    throw axiosError; // 让拦截器处理 401
  }
};

// 注册
export const registerApi = async (userRegister: RegisterRequest): Promise<AuthResponse> => {
  const response = await request<AuthResponse>('post', '/user/register', userRegister);
  message.success(response.message || '注册成功');
  return response;
};

// 密码登录
export const passwordLoginApi = async (
  userLogin: PasswordLoginRequest
): Promise<AuthResponse> => {
  const response = await request<AuthResponse>('post', '/user/login', userLogin);
  message.success(response.message || '登录成功');
  return response;
};

// 获取用户信息
export const getUserApi = async (): Promise<User> => {
  const response = await request<{ user: User }>('get', '/user/me', undefined);
  return response.user;
};

// 登出
export const logoutApi = async (): Promise<void> => {
  await request<void>('post', '/user/logout', undefined);
  message.success('登出成功');
  window.location.href = '/';
};

// 刷新 token
export const refreshTokenApi = async (): Promise<AuthResponse> => {
  const response = await request<AuthResponse>('post', '/user/refresh', undefined);
  return response;
};