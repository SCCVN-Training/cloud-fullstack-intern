import { DecimalPipe } from '@angular/common';
import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';

import { AnimeSearchDialog } from '../../../anime/components/anime-search-dialog/anime-search-dialog';
import { AnimeSearchItem } from '../../../anime/data-access/anime.schema';
import { UserProfileStore } from '../../../user-profile/data-access/with-user-profile-store';
import { ExportControls } from '../../components/export-controls/export-controls';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [
    FormsModule,
    DecimalPipe,
    ExportControls,
    MatIconModule,
    MatSliderModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './reviews.html',
  styleUrl: './reviews.scss',
})
export class Reviews {
  private readonly userProfileStore = inject(UserProfileStore);
  private readonly dialog = inject(MatDialog);

  readonly displayName = this.userProfileStore.profile()?.displayName || 'Anonymous User';
  readonly avatarUrl = this.userProfileStore.profile()?.avatarUrl || '...';

  @ViewChild('exportTarget') previewElement?: ElementRef<HTMLElement>;

  // --- Chuyển toàn bộ State sang Signal ---
  selectedAnime = signal<AnimeSearchItem | null>(null);
  isLoadingAnime = signal<boolean>(false);

  title = signal<string>('');
  image = signal<string>('');
  rating = signal<number>(10);
  review = signal<string>('');

  openSearchDialog(): void {
    const dialogRef = this.dialog.open(AnimeSearchDialog, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'anime-search-dialog-panel',
      data: {
        excludeIds: this.selectedAnime() ? [this.selectedAnime()?.id] : [], // Gọi signal phải có ()
      },
    });

    dialogRef.afterClosed().subscribe((result: AnimeSearchItem) => {
      if (result) {
        this.isLoadingAnime.set(true);
        this.selectedAnime.set(result);

        this.title.set(result.title?.english || result.title?.romaji || 'Unknown Title');
        // this.image.set(
        //   result.coverImage?.extraLarge ||
        //     result.coverImage?.large ||
        //     result.coverImage?.medium ||
        //     '',
        // );
        this.image.set(
          result.bannerImage || result.coverImage.large || result.coverImage.medium || '',
        );

        setTimeout(() => {
          this.isLoadingAnime.set(false);
        }, 600);
      }
    });
  }
}
