// anime.effect.ts
import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, EMPTY, finalize, map, Observable, tap } from 'rxjs';
import { NotificationService } from '../../../core/notification/services/notification.service';
import { AnimeApi } from '../api/anime.api';
import { SearchPageInfo } from './anime.state';
import { AnimeSearchReducer, AnimeSeasonalReducer } from './with-anime-reducer';

@Injectable({
  providedIn: 'root',
})
export class AnimeEffect {
  private readonly animeApi = inject(AnimeApi);
  private readonly seasonalReducer = inject(AnimeSeasonalReducer);
  private readonly searchReducer = inject(AnimeSearchReducer);
  private readonly notification = inject(NotificationService);

  // ============================================
  // SEASONAL
  // ============================================
  getAnimeSeasonal(page: number, append = false): Observable<void> {
    // Reset error before attempting fetch
    this.seasonalReducer.setError(null);
    this.seasonalReducer.setLoading(true);

    return this.animeApi.getAnimeSeasonalPagination(page).pipe(
      tap((response) => {
        if (append) {
          this.seasonalReducer.appendItems(response.media, response.pageInfo);
        } else {
          this.seasonalReducer.setItems(response.media, response.pageInfo);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        const message = error.error?.message || 'Failed to load seasonal anime. Please try again.';
        this.seasonalReducer.setError(message);
        this.notification.error(message);
        return EMPTY;
      }),
      map(() => void 0),
      finalize(() => {
        this.seasonalReducer.setLoading(false);
      }),
    );
  }

  // ============================================
  // SEARCH
  // ============================================
  searchAnime(query: string, page: number, append = false): Observable<void> {
    // Reset error before attempting fetch
    this.searchReducer.setError(null);
    this.searchReducer.setLoading(true);

    // Update the stored search query immediately (useful for UI)
    this.searchReducer.setSearchQuery(query);

    return this.animeApi.searchAnimePagination(query, page).pipe(
      tap((response) => {
        // Convert PageInfo to SearchPageInfo (adds searchQuery)
        const searchPageInfo: SearchPageInfo = {
          ...response.pageInfo,
          searchQuery: query,
        };

        if (append) {
          this.searchReducer.appendItems(response.media, searchPageInfo);
        } else {
          this.searchReducer.setItems(response.media, searchPageInfo);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        const message = error.error?.message || 'Search failed. Please try again.';
        this.searchReducer.setError(message);
        this.notification.error(message);
        return EMPTY;
      }),
      map(() => void 0),
      finalize(() => {
        this.searchReducer.setLoading(false);
      }),
    );
  }
}
