import { Injectable } from '@angular/core';
import { AppStore } from './with-app-store';

@Injectable({
  providedIn: 'root',
})
export class AppReducer {
  constructor(private readonly store: AppStore) {}

  patch(partial: Partial<ReturnType<AppStore['state']>>) {
    this.store.state.update((state) => ({
      ...state,
      ...partial,
    }));
  }
}
