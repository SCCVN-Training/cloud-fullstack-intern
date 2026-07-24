export interface ANIME_ENDPOINTS {
  SEASONAL_NOW: string;
}
export const JIKAN_ANIME_ENDPOINTS: ANIME_ENDPOINTS = {
  SEASONAL_NOW: '/seasons/now',
} as const;
