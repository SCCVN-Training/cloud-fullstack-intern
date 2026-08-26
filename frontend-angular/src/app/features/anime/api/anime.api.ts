import { HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../../shared/api/api-client';
import { ApiResponseWithMeta } from '../../../shared/types/api-response';
import { ANIME_ENDPOINTS } from '../constants/anime-endpoints';
import { AnimeSeasonalItem, PageInfo } from '../data-access/anime.schema';

@Injectable({
  providedIn: 'root',
})
export class AnimeApi {
  private readonly api = inject(ApiClient);

  getAnimeSeasonalPagination(page: number) {
    let params = new HttpParams();
    params = params.set('per_page', '20');
    params = params.set('page', page.toString());
    return this.api.get<ApiResponseWithMeta<AnimeSeasonalItem[], PageInfo>>(
      ANIME_ENDPOINTS.SEASONAL_NOW,
      params,
    );
  }

  searchAnimePagination(query: string, page: number) {
    let params = new HttpParams();
    params = params.set('per_page', '20');
    params = params.set('page', page.toString());
    params = params.set('query', query);
    return this.api.get<ApiResponseWithMeta<AnimeSeasonalItem[], PageInfo>>(
      ANIME_ENDPOINTS.SEARCH,
      params,
    );
  }
}
