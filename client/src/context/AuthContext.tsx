import { useEffect, useState, ReactNode } from 'react';
import { getUserApi, logoutApi, passwordLoginApi, registerApi } from '../api/userApi';
import { PasswordLoginRequest, RegisterRequest } from '../type/login';
import { User } from '../type/user';
import { AuthContext } from './auth-context';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object'
  ) {
    const response = (error as { response?: { data?: { error?: { message?: string } } } }).response;
    const message = response?.data?.error?.message;
    if (message) {
      return message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const register = async (payload: RegisterRequest) => {
    try {
      const response = await registerApi(payload);
      setUser(response.user);
    } catch (error: unknown) {
      throw new Error(getErrorMessage(error, '注册失败'));
    }
  };

  const login = async (payload: PasswordLoginRequest) => {
    try {
      const response = await passwordLoginApi(payload);
      setUser(response.user);
      setIsLoginOpen(false);
    } catch (error: unknown) {
      throw new Error(getErrorMessage(error, '登录失败'));
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
      setUser(null);
      setIsLoginOpen(false);
    } catch (error: unknown) {
      throw new Error(getErrorMessage(error, '退出失败'));
    }
  };

  const checkLoginStatus = async () => {
    try {
      const response = await getUserApi();
      setUser(response);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    void checkLoginStatus();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoginOpen,
        setUser,
        setIsLoginOpen,
        register,
        login,
        logout,
        checkLoginStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
