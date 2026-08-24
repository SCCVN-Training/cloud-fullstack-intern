"""
Anime Module Schemas
Defines request/response models for anime endpoints.
"""

from pydantic import BaseModel, Field

# ============================================
# NESTED SCHEMAS (Matching AniList Response)
# ============================================


class AnimeTitle(BaseModel):
    """Anime title in different languages."""

    romaji: str | None = None
    english: str | None = None
    native: str | None = None


class AnimeCoverImage(BaseModel):
    """Anime cover image URLs."""

    large: str | None = None
    medium: str | None = None


class AnimeNextAiring(BaseModel):
    """Next airing episode information."""

    airingAt: int  # Unix timestamp
    episode: int


class StudioNode(BaseModel):
    """Studio information."""

    name: str


class Studios(BaseModel):
    """Container for studio list."""

    nodes: list[StudioNode] = []


# ============================================
# PAGINATION
# ============================================


class PageInfo(BaseModel):
    """Pagination information."""

    hasNextPage: bool
    currentPage: int


# ============================================
# RESPONSE ITEMS (Different Detail Levels)
# ============================================


class AnimeSeasonalItem(BaseModel):
    """Anime item for seasonal dashboard (more detailed)."""

    id: int
    title: AnimeTitle
    coverImage: AnimeCoverImage
    bannerImage: str | None = None
    description: str | None = None
    episodes: int | None = None
    status: str
    # season: Optional[str] = None
    # seasonYear: Optional[int] = None
    averageScore: int | None = None
    # popularity: int
    genres: list[str] = []
    # studios: Studios
    nextAiringEpisode: AnimeNextAiring | None = None
    siteUrl: str | None = Field(None, alias="siteUrl")  # URL to AniList page
    format: str | None = None  # TV, MOVIE, OVA, etc.


class AnimeSearchItem(BaseModel):
    """Anime item for search results (less detailed)."""

    id: int
    title: AnimeTitle
    coverImage: AnimeCoverImage
    bannerImage: str | None = None
    description: str | None = None
    seasonYear: int | None = None
    # episodes: Optional[int] = None
    status: str
    siteUrl: str | None = Field(None, alias="siteUrl")  # URL to AniList page
    # averageScore: Optional[int] = None
    # popularity: int
    # genres: List[str] = []


# ============================================
# RESPONSE WRAPPERS
# ============================================


class AnimeSeasonalResponse(BaseModel):
    """Response for seasonal anime endpoint."""

    pageInfo: PageInfo
    media: list[AnimeSeasonalItem]


class AnimeSearchResponse(BaseModel):
    """Response for search anime endpoint."""

    pageInfo: PageInfo
    media: list[AnimeSearchItem]
