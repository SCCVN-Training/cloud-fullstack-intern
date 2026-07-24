import { User } from './auth.schema';

export interface AuthState {
  currentUser: User | null;

  isAuthenticated: boolean;

  loading: boolean;

  error: string | null;
}

export const initialState: AuthState = {
  currentUser: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};
