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
