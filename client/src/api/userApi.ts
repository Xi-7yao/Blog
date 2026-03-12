import { message } from 'antd';
import { request } from './request';
import { PasswordLoginRequest, RegisterRequest } from '../type/login';
import { AuthResponse, User } from '../type/user';

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
  message.success('退出成功');
};

export const refreshTokenApi = async (): Promise<AuthResponse> => {
  return request<AuthResponse>('post', '/user/refresh', undefined);
};
