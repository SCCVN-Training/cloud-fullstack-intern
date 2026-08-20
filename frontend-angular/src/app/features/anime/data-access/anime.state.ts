import { AnimeSearchItem, AnimeSeasonalItem, PageInfo } from './anime.schema';

// ============================================
// SEARCH-SPECIFIC PAGE INFO (extends base)
// ============================================
export interface SearchPageInfo extends PageInfo {
  searchQuery: string;
}

// ============================================
// COMPLETELY SEPARATE STATE DEFINITIONS
// ============================================

export interface AnimeSeasonalState {
  items: AnimeSeasonalItem[];
  pageInfo: PageInfo;
  loading: boolean;
  error: string | null;
}

export const seasonalInitialState: AnimeSeasonalState = {
  items: [],
  pageInfo: {
    hasNextPage: false,
    currentPage: 1,
  },
  loading: false,
  error: null,
};

export interface AnimeSearchState {
  items: AnimeSearchItem[];
  pageInfo: SearchPageInfo;
  loading: boolean;
  error: string | null;
}

export const searchInitialState: AnimeSearchState = {
  items: [],
  pageInfo: {
    hasNextPage: false,
    currentPage: 1,
    searchQuery: '',
  },
  loading: false,
  error: null,
};

// ============================================
// (OPTIONAL) ROOT STATE IF NEEDED
// ============================================
// If you want a single global state, you can combine them later like:
// export interface AnimeState {
//   seasonal: AnimeSeasonalState;
//   search: AnimeSearchState;
// }
// export const animeInitialState: AnimeState = {
//   seasonal: seasonalInitialState,
//   search: searchInitialState,
// };
