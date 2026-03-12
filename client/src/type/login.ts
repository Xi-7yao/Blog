export interface RegisterRequest {
  email: string;
  password: string;
  inviteCode?: string;
}

export interface PasswordLoginRequest {
  email: string;
  password: string;
}
