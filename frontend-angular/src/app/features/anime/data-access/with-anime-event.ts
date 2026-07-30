import { inject, Injectable } from '@angular/core';
import { AnimeEffect } from './with-anime-effect';

@Injectable({
  providedIn: 'root',
})
export class AnimeEvent {
  private readonly animeEffect = inject(AnimeEffect);

  getSeasonNow(): void {
    console.log('[Anime Event] Get seasonal animes triggered');
    this.animeEffect.getSeasonNow().subscribe();
  }
}
