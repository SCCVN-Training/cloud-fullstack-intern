import { Injectable, inject } from '@angular/core';
import { AnimeStore } from './with-anime-store';

@Injectable({
  providedIn: 'root',
})
export class AnimeReducer {
  private readonly store = inject(AnimeStore);

  /**
   * Generic state patcher.
   * Every reducer eventually calls this.
   */
  patch(partial: Partial<ReturnType<AnimeStore['state']>>) {
    this.store.state.update((state) => ({
      ...state,
      ...partial,
    }));
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
}
