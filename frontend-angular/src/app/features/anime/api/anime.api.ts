import { HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { JikanApiClient } from '../../../shared/api/jikan-api-client';
import { ApiListResponse } from '../../../shared/types/api-response';
import { JIKAN_ANIME_ENDPOINTS } from '../constants/anime-endpoints';
import { JikanSeasonalAnime } from '../data-access/anime.schema';

@Injectable({
  providedIn: 'root',
})
export class JikanAnimeApi {
  private readonly jikanApi = inject(JikanApiClient);

  getSeasonNow() {
    let params = new HttpParams();
    params = params.set('limit', '20');
    return this.jikanApi.get<ApiListResponse<JikanSeasonalAnime>>(
      JIKAN_ANIME_ENDPOINTS.SEASONAL_NOW,
      params,
    );
  }
}
