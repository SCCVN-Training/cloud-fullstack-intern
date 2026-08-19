//Deprecated: This schema is no longer used in the project. It was previously used for the Jikan API response, but the project has since transitioned to using the AniList API. The AniList API provides a more comprehensive and up-to-date source of anime data, making this schema obsolete.
export interface JikanSeasonalAnime {
  mal_id: number;

  title: string;
  title_english: string | null;
  title_japanese: string | null;

  score: number | null;

  season: string | null;
  year: number | null;

  synopsis: string | null;

  url: string;

  trailer: {
    url: string | null;
  };

  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    };
  };
}

// ============================================
// NESTED TYPES (Matching AniList Response)
// ============================================

export interface AnimeTitle {
  romaji?: string;
  english?: string;
  native?: string;
}

export interface AnimeCoverImage {
  large?: string;
  medium?: string;
}

export interface AnimeNextAiring {
  airingAt: number; // Unix timestamp
  episode: number;
}

export interface StudioNode {
  name: string;
}

export interface Studios {
  nodes: StudioNode[];
}

// ============================================
// PAGINATION
// ============================================

export interface PageInfo {
  hasNextPage: boolean;
  currentPage: number;
}

// ============================================
// RESPONSE ITEMS (Different Detail Levels)
// ============================================

export interface AnimeSeasonalItem {
  id: number;
  title: AnimeTitle;
  coverImage: AnimeCoverImage;
  bannerImage?: string;
  description?: string;
  episodes?: number;
  status: string;
  averageScore?: number;
  genres: string[];
  nextAiringEpisode?: AnimeNextAiring;
  siteUrl?: string;
  format?: string; // TV, MOVIE, OVA, etc.
}

export interface AnimeSearchItem {
  id: number;
  title: AnimeTitle;
  coverImage: AnimeCoverImage;
  bannerImage?: string;
  description?: string;
  status: string;
  siteUrl?: string;
  format?: string; // TV, MOVIE, OVA, etc.
  seasonYear?: number;
}

// ============================================
// RESPONSE WRAPPERS
// ============================================

export interface AnimeSeasonalResponse {
  pageInfo: PageInfo;
  media: AnimeSeasonalItem[];
}

export interface AnimeSearchResponse {
  pageInfo: PageInfo;
  media: AnimeSearchItem[];
}
