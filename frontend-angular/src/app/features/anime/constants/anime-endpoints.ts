export interface ANIME_ENDPOINTS_INTERFACE {
  SEASONAL_NOW: string;
  SEARCH: string;
}
export const JIKAN_ANIME_ENDPOINTS: ANIME_ENDPOINTS_INTERFACE = {
  SEASONAL_NOW: '/seasons/now',
  SEARCH: '/anime',
} as const;

export const ANIME_ENDPOINTS: ANIME_ENDPOINTS_INTERFACE = {
  SEASONAL_NOW: '/anime/seasonal',
  SEARCH: '/anime/search',
} as const;
