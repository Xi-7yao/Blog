import { createContext } from 'react';
import { PasswordLoginRequest, RegisterRequest } from '../type/login';
import { User } from '../type/user';

export interface AuthContextType {
  user: User | null;
  isLoginOpen: boolean;
  setUser: (user: User | null) => void;
  setIsLoginOpen: (open: boolean) => void;
  login: (payload: PasswordLoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkLoginStatus: () => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
