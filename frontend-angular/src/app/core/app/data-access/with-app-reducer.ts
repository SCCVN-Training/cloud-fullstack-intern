import { Injectable, inject } from '@angular/core';
import { AppStore } from './with-app-store';

@Injectable({
  providedIn: 'root',
})
export class AppReducer {
  private readonly store = inject(AppStore);

  patch(partial: Partial<ReturnType<AppStore['state']>>) {
    this.store.state.update((state) => ({
      ...state,
      ...partial,
    }));
  }
}
