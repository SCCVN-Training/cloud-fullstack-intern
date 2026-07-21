import { computed, Injectable, signal } from '@angular/core';
import { AppState, initialState } from './app.state';

@Injectable({
  providedIn: 'root',
})
export class AppStore {
  readonly state = signal<AppState>(initialState);

  readonly serverAvailable = computed(() => this.state().serverAvailable);
  readonly initialized = computed(() => this.state().initialized);
  readonly version = computed(() => this.state().version);
}
