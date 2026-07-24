import { Injectable, computed, signal } from '@angular/core';
import { UserProfileState, initialState } from './user-profile.state';

@Injectable({
  providedIn: 'root',
})
export class UserProfileStore {
  /**
   * Internal writable state.
   * Only reducers should update this signal.
   */
  readonly state = signal<UserProfileState>(initialState);

  // ============================
  // Computed Selectors
  // ============================

  readonly profile = computed(() => this.state().profile);

  readonly loading = computed(() => this.state().loading);

  readonly error = computed(() => this.state().error);
}
