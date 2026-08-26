// anime.event.ts
import { inject, Injectable } from '@angular/core';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { AnimeEffect } from './with-anime-effect';

@Injectable({
  providedIn: 'root',
})
export class AnimeEvent {
  private readonly animeEffect = inject(AnimeEffect);

  // Subject for debounced search inputs (only for NEW searches, never for appending)
  private searchSubject = new Subject<{ query: string }>();

  constructor() {
    // Set up debounced search pipeline
    // - Waits 300ms after user stops typing
    // - Ignores duplicate consecutive queries
    // - Cancels previous pending request if a new search is triggered
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged((prev, curr) => prev.query === curr.query),
        switchMap(({ query }) => {
          if (!query.trim()) {
            return this.animeEffect.clearSearch();
          }
          // Fresh search always starts at page 1 and REPLACES old results
          return this.animeEffect.searchAnime(query, 1, false);
        }),
      )
      .subscribe(); // Single global subscription – safe since service is long-lived
  }

  // ============================================
  // SEASONAL METHODS
  // ============================================

  /**
   * Load seasonal anime (fresh/replace).
   * Called by:
   * - Dashboard carousel on init
   * - Seasonal grid page on init (if items.length === 0)
   */
  loadSeasonal(page: number): void {
    console.log('[Anime Event]: loadSeasonal called with page', page);
    this.animeEffect.getAnimeSeasonal(page, false).subscribe();
  }

  /**
   * Load more seasonal anime (append for infinite scroll).
   * Called by seasonal grid when user scrolls to bottom.
   */
  loadMoreSeasonal(page: number): void {
    console.log('[Anime Event]: loadMoreSeasonal called with page', page);
    this.animeEffect.getAnimeSeasonal(page, true).subscribe();
  }

  // ============================================
  // SEARCH METHODS
  // ============================================

  /**
   * Trigger a new search (with debouncing).
   * Called by search input on keyup/input events.
   * - Clears old results (via effect's append=false)
   * - Automatically debounces by 300ms
   * - Cancels previous in-flight requests if user types again
   */
  search(query: string): void {
    console.log('[Anime Event]: search called with query', query);
    this.searchSubject.next({ query });
  }

  /**
   * Load more search results (append for infinite scroll).
   * Called by search results grid when user scrolls to bottom.
   * - NO debouncing – scroll events must trigger immediately
   */
  loadMoreSearch(query: string, page: number): void {
    console.log('[Anime Event]: loadMoreSearch called with query', query, 'and page', page);
    this.animeEffect.searchAnime(query, page, true).subscribe();
  }

  clearSearch(): void {
    console.log('[Anime Event]: clearSearch called');
    this.searchSubject.next({ query: '' });
    this.animeEffect.clearSearch().subscribe();
  }
}
