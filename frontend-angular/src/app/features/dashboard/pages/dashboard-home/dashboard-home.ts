import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { AnimeCarousel } from '../../../anime/components/anime-carousel/anime-carousel';
import { AnimeEvent } from '../../../anime/data-access/with-anime-event';
import { AnimeSeasonalStore } from '../../../anime/data-access/with-anime-store';
import { UserProfileStore } from '../../../user-profile/data-access/with-user-profile-store';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,

    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatFormFieldModule,
    MatListModule,
    AnimeCarousel,
  ],
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.scss',
})
export class DashboardHome implements OnInit {
  private readonly profileStore = inject(UserProfileStore);
  private readonly animeSeasonalStore = inject(AnimeSeasonalStore);
  private readonly router = inject(Router);

  private readonly animeEvent = inject(AnimeEvent);

  readonly profile = this.profileStore.profile;
  readonly seasonalAnimeList = this.animeSeasonalStore.seasonalDashboardList;
  readonly seasonalAnimeLoading = this.animeSeasonalStore.loading;

  ngOnInit(): void {
    if (this.animeSeasonalStore.count() === 0) {
      this.animeEvent.loadSeasonal(1);
    }
  }

  onExploreMore(): void {
    this.router.navigate(['/dashboard/seasonal-anime']);
  }
}
