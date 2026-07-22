import { Injectable } from '@angular/core';

import { UserProfileStore } from './with-user-profile-store';

@Injectable({
  providedIn: 'root',
})
export class UserProfileReducer {
  constructor(private readonly store: UserProfileStore) {}

  /**
   * Generic state patcher.
   * Every reducer eventually calls this.
   */
  patch(partial: Partial<ReturnType<UserProfileStore['state']>>) {
    this.store.state.update((state) => ({
      ...state,
      ...partial,
    }));
  }

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

  reset() {
    this.patch({
      profile: null,
      loading: false,
      error: null,
    });
  }
}
