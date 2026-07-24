import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, EMPTY, finalize, map, Observable, tap } from 'rxjs';
import { NotificationService } from '../../../core/notification/services/notification.service';
import { JikanAnimeApi } from '../api/anime.api';
import { AnimeReducer } from './with-anime-reducer';

@Injectable({
  providedIn: 'root',
})
export class AnimeEffect {
  private readonly animeApi = inject(JikanAnimeApi);
  private readonly animeReducer = inject(AnimeReducer);
  private readonly notification = inject(NotificationService);

  getSeasonNow(): Observable<void> {
    this.animeReducer.setLoading(true);

    return this.animeApi.getSeasonNow().pipe(
      tap((response) => {
        this.animeReducer.patch({
          seasonalAnimeList: response.data.map((anime) => ({
            mal_id: anime.mal_id,
            title: anime.title,
            title_english: anime.title_english,
            title_japanese: anime.title_japanese,
            score: anime.score,
            season: anime.season,
            year: anime.year,
            synopsis: anime.synopsis,
            url: anime.url,
            trailer: anime.trailer,
            images: anime.images,
          })),
        });
        this.animeReducer.setError(null);
      }),
      catchError((error: HttpErrorResponse) => {
        const message = error.error?.message || 'Get seasonal animes failed. Please try again.';
        this.animeReducer.setError(message);
        this.notification.error(message);
        return EMPTY;
      }),
      map(() => void 0),
      finalize(() => {
        this.animeReducer.setLoading(false);
      }),
    );
  }
}
