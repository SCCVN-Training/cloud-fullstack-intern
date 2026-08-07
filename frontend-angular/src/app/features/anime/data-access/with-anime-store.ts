// anime.store.ts
import { computed, Injectable, signal } from '@angular/core';
import {
  AnimeSearchState,
  AnimeSeasonalState,
  searchInitialState,
  seasonalInitialState,
} from './anime.state';

// ============================================
// SEASONAL STORE
// ============================================
@Injectable({ providedIn: 'root' })
export class AnimeSeasonalStore {
  readonly state = signal<AnimeSeasonalState>(seasonalInitialState);

  // Selectors
  readonly items = computed(() => this.state().items);
  readonly count = computed(() => this.state().items.length);
  readonly currentPage = computed(() => this.state().pageInfo.currentPage);
  readonly hasNextPage = computed(() => this.state().pageInfo.hasNextPage);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  // Optional: expose pageInfo entirely if needed
  readonly pageInfo = computed(() => this.state().pageInfo);
}

// ============================================
// SEARCH STORE
// ============================================
@Injectable({ providedIn: 'root' })
export class AnimeSearchStore {
  readonly state = signal<AnimeSearchState>(searchInitialState);

  // Selectors
  readonly items = computed(() => this.state().items);
  readonly count = computed(() => this.state().items.length);
  readonly currentPage = computed(() => this.state().pageInfo.currentPage);
  readonly hasNextPage = computed(() => this.state().pageInfo.hasNextPage);
  readonly searchQuery = computed(() => this.state().pageInfo.searchQuery);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  // Expose pageInfo if needed
  readonly pageInfo = computed(() => this.state().pageInfo);
}
