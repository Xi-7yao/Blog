import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from '../type/user'
import { PasswordLoginRequest, RegisterRequest } from "../type/login";
import { passwordLoginApi, getUserApi, logoutApi } from '../api/userApi'
import { registerApi } from '../api/userApi'

interface AuthContextType {
    user: User | null;
    isLoginOpen: boolean;
    setUser: (user: User | null) => void;
    setIsLoginOpen: (open: boolean) => void;
    login: ({email, password}: PasswordLoginRequest) => Promise<void>;
    logout: () => Promise<void>;
    checkLoginStatus: () => Promise<void>;
    register: (userRegister: RegisterRequest) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({children}: {children: ReactNode}) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);

    const register = async (userRegister: RegisterRequest) => {
        try {
            const response = await registerApi(userRegister);
            setUser(response.user);
        } catch (error: any) {
            throw new Error(error.response?.message || '注册失败');
        }
    }

    const login = async ({email, password}: PasswordLoginRequest) => {
        try {
            const response = await passwordLoginApi({email, password});
            // console.log(response)
            setUser(response.user);
            setIsLoginOpen(false);
        } catch (error: any) {
            throw new Error(error.response?.message || '登录失败');
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await logoutApi();
            setUser(null);
            setIsLoginOpen(false);
        } catch (error: any) {
            throw new Error(error.response?.message || '退出失败');
        }
    }

    const checkLoginStatus = async () => {
        try {
            const response = await getUserApi();
            setUser(response);
        } catch(error: any) {
            setUser(null);
        }
    };

    useEffect(() => {
        checkLoginStatus();
    }, [])

    return (
        <AuthContext.Provider 
            value={{ 
                user, isLoginOpen, setUser, setIsLoginOpen, register, login, logout, checkLoginStatus 
            }
        }>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
      throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
