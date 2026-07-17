export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: string;
  avatarUrl: string | null;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  avatarUrl: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  status: number;
  data: {
    user: User;
  };
}

export interface LoginResponse {
  message: string;
  status: number;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}
