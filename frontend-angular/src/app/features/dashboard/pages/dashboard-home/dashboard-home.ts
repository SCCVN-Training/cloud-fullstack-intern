import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { AnimeEvent } from '../../../anime/data-access/with-anime-event';
import { AnimeStore } from '../../../anime/data-access/with-anime-store';
import { UserProfileStore } from '../../../user-profile/data-access/with-user-profile-store';
import { AnimeCarousel } from '../../components/anime-carousel/anime-carousel';

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
  private readonly animeStore = inject(AnimeStore);

  private readonly animeEvent = inject(AnimeEvent);

  readonly profile = this.profileStore.profile;
  readonly seasonalAnimeList = this.animeStore.seasonalAnimeList;

  ngOnInit(): void {
    this.animeEvent.getSeasonNow();
  }
}
