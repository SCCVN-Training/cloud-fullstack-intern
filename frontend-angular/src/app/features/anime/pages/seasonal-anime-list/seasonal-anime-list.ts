import {
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil, throttleTime } from 'rxjs/operators';
import { AnimeCard } from '../../components/anime-card/anime-card';
import { AnimeSeasonalItem } from '../../data-access/anime.schema';
import { AnimeEvent } from '../../data-access/with-anime-event';
import { AnimeSeasonalStore } from '../../data-access/with-anime-store';

@Component({
  selector: 'app-seasonal-anime-list',
  imports: [AnimeCard],
  standalone: true,
  templateUrl: './seasonal-anime-list.html',
  styleUrl: './seasonal-anime-list.scss',
})
export class SeasonalAnimeList implements OnInit, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;

  private readonly seasonalAnimeStore = inject(AnimeSeasonalStore);
  private readonly animeEvent = inject(AnimeEvent);
  private readonly destroy$ = new Subject<void>();

  // Store selectors
  readonly seasonalAnimeList = this.seasonalAnimeStore.seasonalFullList;
  readonly seasonalAnimeLoading = this.seasonalAnimeStore.loading;
  readonly seasonalAnimeError = this.seasonalAnimeStore.error;
  readonly seasonalAnimeHasNextPage = this.seasonalAnimeStore.hasNextPage;

  // UI state
  readonly showScrollTop = signal(false);

  // Scroll configuration
  private scrollThreshold = 200; // Load when 200px from bottom
  private isLoadMoreInProgress = false;

  ngOnInit(): void {
    if (this.seasonalAnimeStore.count() === 0) {
      this.animeEvent.loadSeasonal(1);
    }

    // Setup scroll listener after view initialization
    setTimeout(() => {
      this.setupScrollListener();
    }, 100);
  }

  private setupScrollListener(): void {
    if (!this.scrollContainer) return;

    fromEvent(this.scrollContainer.nativeElement, 'scroll')
      .pipe(throttleTime(100), takeUntil(this.destroy$))
      .subscribe(() => {
        const element = this.scrollContainer.nativeElement;
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;
        const remaining = scrollHeight - scrollTop - clientHeight;

        this.showScrollTop.set(scrollTop > 500);

        if (remaining < this.scrollThreshold) {
          this.handleLoadMore();
        }
      });
  }

  // Handle window resize to adjust card sizes
  @HostListener('window:resize')
  onResize() {
    // The grid will auto-adjust based on CSS
  }

  handleLoadMore(): void {
    if (this.isLoadMoreInProgress) return;

    if (
      !this.seasonalAnimeStore.loading() &&
      this.seasonalAnimeStore.hasNextPage() &&
      this.seasonalAnimeList().length > 0
    ) {
      this.isLoadMoreInProgress = true;
      this.loadMore();
      setTimeout(() => {
        this.isLoadMoreInProgress = false;
      }, 300);
    }
  }

  loadMore(): void {
    if (this.seasonalAnimeStore.hasNextPage()) {
      const nextPage = this.seasonalAnimeStore.currentPage() + 1;
      this.animeEvent.loadMoreSeasonal(nextPage);
    }
  }

  retryLoad(): void {
    if (this.seasonalAnimeList().length === 0) {
      this.animeEvent.loadSeasonal(1);
    } else if (this.seasonalAnimeStore.error()) {
      this.loadMore();
    }
  }

  scrollToTop(): void {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }

  trackById(index: number, anime: AnimeSeasonalItem): number | string {
    return anime?.id || index;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
