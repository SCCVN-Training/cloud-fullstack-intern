import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { AnimeSearchItem } from '../../data-access/anime.schema';
import { AnimeEvent } from '../../data-access/with-anime-event';
import { AnimeSearchStore } from '../../data-access/with-anime-store';

export interface AnimeSearchDialogData {
  excludeIds?: number[];
}

@Component({
  selector: 'app-anime-search-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
  ],
  templateUrl: './anime-search-dialog.html',
  styleUrl: './anime-search-dialog.scss',
})
export class AnimeSearchDialog implements OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<AnimeSearchDialog>);
  private readonly data = inject<AnimeSearchDialogData>(MAT_DIALOG_DATA);

  private readonly animeEvent = inject(AnimeEvent);
  private readonly animeSearchStore = inject(AnimeSearchStore);

  readonly searchResults = this.animeSearchStore.items;
  readonly isLoading = this.animeSearchStore.loading;

  searchQuery = '';

  isTyping = signal<boolean>(false);
  currentPage = 1;

  constructor() {
    effect(() => {
      if (this.isLoading()) {
        this.isTyping.set(false);
      }
    });
  }

  onSearch(query: string): void {
    if (!query.trim() || query.trim().length < 2) {
      this.clearSearch();
      return;
    }
    this.isTyping.set(true);
    this.currentPage = 1;
    this.animeEvent.search(query);
  }

  onScroll(event: Event): void {
    const target = event.target as HTMLElement;

    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;

    if (isAtBottom && !this.isLoading() && !this.isTyping() && this.searchQuery) {
      const hasNextPage = this.animeSearchStore.pageInfo()?.hasNextPage ?? true;
      if (!hasNextPage) return;

      this.currentPage++;
      this.animeEvent.loadMoreSearch(this.searchQuery, this.currentPage);
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.isTyping.set(false);
    this.currentPage = 1;
    this.animeEvent.clearSearch();
  }
  selectAnime(anime: AnimeSearchItem): void {
    if (this.isExcluded(anime.id)) return;
    this.dialogRef.close(anime);
  }

  isExcluded(id: number): boolean {
    if (!this.data?.excludeIds) return false;
    return this.data.excludeIds.includes(id);
  }

  close(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.clearSearch();
  }
}
