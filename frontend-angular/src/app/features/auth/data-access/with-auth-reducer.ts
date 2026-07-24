import { Injectable, inject } from '@angular/core';

import { User } from './auth.schema';
import { AuthStore } from './with-auth-store';

@Injectable({
  providedIn: 'root',
})
export class AuthReducer {
  private readonly store = inject(AuthStore);

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
    });
  }

  /**
   * User logged in.
   */
  loginSuccess(user: User) {
    this.patch({
      currentUser: user,
      isAuthenticated: true,
    });
  }

  /**
   * User logged out.
   */
  logoutSuccess() {
    this.patch({
      currentUser: null,
      isAuthenticated: false,
    });
  }

  /**
   * Set the current user.
   */
  setCurrentUser(user: User | null) {
    this.patch({
      currentUser: user,
      isAuthenticated: !!user,
    });
  }
}
