import { User } from './auth.model';

export interface AuthState {
  currentUser: User | null;

  users: User[];

  isAuthenticated: boolean;

  loading: boolean;

  error: string | null;
}

export const initialState: AuthState = {
  currentUser: null,
  users: [],
  isAuthenticated: false,
  loading: false,
  error: null,
};
