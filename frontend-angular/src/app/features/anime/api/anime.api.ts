import { HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../../shared/api/api-client';
import { JikanApiClient } from '../../../shared/api/jikan-api-client';
import { ApiListResponse } from '../../../shared/types/api-response';
import { ANIME_ENDPOINTS, JIKAN_ANIME_ENDPOINTS } from '../constants/anime-endpoints';
import {
  AnimeSearchResponse,
  AnimeSeasonalResponse,
  JikanSeasonalAnime,
} from '../data-access/anime.schema';

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

@Injectable({
  providedIn: 'root',
})
export class AnimeApi {
  private readonly api = inject(ApiClient);

  getAnimeSeasonalPagination(page: number) {
    let params = new HttpParams();
    params = params.set('per_page', '20');
    params = params.set('page', page.toString());
    return this.api.get<AnimeSeasonalResponse>(ANIME_ENDPOINTS.SEASONAL_NOW, params);
  }

  searchAnimePagination(query: string, page: number) {
    let params = new HttpParams();
    params = params.set('per_page', '20');
    params = params.set('page', page.toString());
    params = params.set('query', query);
    return this.api.get<AnimeSearchResponse>(ANIME_ENDPOINTS.SEARCH, params);
  }
}
