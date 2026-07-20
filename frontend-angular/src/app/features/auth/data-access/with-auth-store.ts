import { Injectable, computed, signal } from '@angular/core';
import { AuthState, initialState } from './auth.state';

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  /**
   * Internal writable state.
   * Only reducers should update this signal.
   */
  readonly state = signal<AuthState>(initialState);

  // ============================
  // Computed Selectors
  // ============================

  readonly currentUser = computed(() => this.state().currentUser);

  readonly isAuthenticated = computed(() => this.state().isAuthenticated);

  readonly loading = computed(() => this.state().loading);

  readonly error = computed(() => this.state().error);
}
