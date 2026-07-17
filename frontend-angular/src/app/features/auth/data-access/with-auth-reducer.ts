import { Injectable } from '@angular/core';

import { User } from './auth.model';
import { AuthStore } from './with-auth-store';

@Injectable({
  providedIn: 'root',
})
export class AuthReducer {
  constructor(private readonly store: AuthStore) {}

  /**
   * Generic state patcher.
   * Every reducer eventually calls this.
   */
  patch(partial: Partial<ReturnType<AuthStore['state']>>) {
    this.store.state.update((state) => ({
      ...state,
      ...partial,
    }));
  }

  /**
   * Reset the whole auth state.
   */
  reset() {
    this.store.state.set({
      currentUser: null,
      users: [],
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  }

  /**
   * Loading state.
   */
  setLoading(loading: boolean) {
    this.patch({
      loading,
    });
  }

  /**
   * Error state.
   */
  setError(error: string | null) {
    this.patch({
      error,
      loading: false,
    });
  }

  /**
   * Replace all registered users.
   */
  setUsers(users: User[]) {
    this.patch({
      users,
    });
  }

  /**
   * User logged in.
   */
  loginSuccess(user: User) {
    this.patch({
      currentUser: user,
      isAuthenticated: true,
      loading: false,
      error: null,
    });
  }

  /**
   * User logged out.
   */
  logoutSuccess() {
    this.patch({
      currentUser: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  }

  /**
   * Restore previous session.
   */
  restoreSession(user: User | null) {
    this.patch({
      currentUser: user,
      isAuthenticated: !!user,
    });
  }
}
