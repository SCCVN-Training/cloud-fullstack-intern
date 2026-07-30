import { JikanSeasonalAnime } from './anime.schema';

export interface AnimeState {
  seasonalAnimeList: JikanSeasonalAnime[];
  loading: boolean;
  error: string | null;
}

export const initialState: AnimeState = {
  seasonalAnimeList: [],
  loading: false,
  error: null,
};
