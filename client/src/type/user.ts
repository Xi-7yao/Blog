export interface User {
    userId: string;
    email: string;
    username: string;
    description?: string;
    role: string;
  }
  
  export interface AuthResponse {
    message: string;
    user: User;
    token: string;
  }