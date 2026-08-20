// anime.reducer.ts
import { inject, Injectable } from '@angular/core';
import { produce } from 'immer';
import { AnimeSearchItem, AnimeSeasonalItem, PageInfo } from './anime.schema';
import {
  AnimeSearchState,
  AnimeSeasonalState,
  searchInitialState,
  SearchPageInfo,
  seasonalInitialState,
} from './anime.state';
import { AnimeSearchStore, AnimeSeasonalStore } from './with-anime-store';

// ============================================
// SEASONAL REDUCER
// ============================================
@Injectable({ providedIn: 'root' })
export class AnimeSeasonalReducer {
  private readonly store = inject(AnimeSeasonalStore);

  private updateState(recipe: (draft: AnimeSeasonalState) => void) {
    this.store.state.update((state) => produce(state, recipe));
  }

  setLoading(isLoading: boolean) {
    this.updateState((draft) => {
      draft.loading = isLoading;
    });
  }

  setError(error: string | null) {
    this.updateState((draft) => {
      draft.error = error;
    });
  }

  setItems(items: AnimeSeasonalItem[], pageInfo: PageInfo) {
    this.updateState((draft) => {
      draft.items = items;
      draft.pageInfo = pageInfo;
    });
  }

  appendItems(items: AnimeSeasonalItem[], pageInfo: PageInfo) {
    this.updateState((draft) => {
      draft.items.push(...items);
      draft.pageInfo = pageInfo;
    });
  }

  reset() {
    this.store.state.set(seasonalInitialState);
  }
}

// ============================================
// SEARCH REDUCER
// ============================================
@Injectable({ providedIn: 'root' })
export class AnimeSearchReducer {
  private readonly store = inject(AnimeSearchStore);

  private updateState(recipe: (draft: AnimeSearchState) => void) {
    this.store.state.update((state) => produce(state, recipe));
  }

  setLoading(isLoading: boolean) {
    this.updateState((draft) => {
      draft.loading = isLoading;
    });
  }

  setError(error: string | null) {
    this.updateState((draft) => {
      draft.error = error;
    });
  }

  setItems(items: AnimeSearchItem[], pageInfo: SearchPageInfo) {
    this.updateState((draft) => {
      draft.items = items;
      draft.pageInfo = pageInfo;
    });
  }

  appendItems(items: AnimeSearchItem[], pageInfo: SearchPageInfo) {
    this.updateState((draft) => {
      draft.items.push(...items);
      draft.pageInfo = pageInfo;
    });
  }

  setSearchQuery(query: string) {
    this.updateState((draft) => {
      draft.pageInfo.searchQuery = query;
    });
  }

  reset() {
    this.store.state.set(searchInitialState);
  }
}
