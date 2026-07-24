import { computed, Injectable, signal } from '@angular/core';
import { AnimeState, initialState } from './anime.state';

@Injectable({
  providedIn: 'root',
})
export class AnimeStore {
  readonly state = signal<AnimeState>(initialState);

  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly seasonalAnimeList = computed(() => this.state().seasonalAnimeList);
}
