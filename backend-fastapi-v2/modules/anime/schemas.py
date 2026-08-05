"""
Anime Module Schemas
Defines request/response models for anime endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, List


# ============================================
# NESTED SCHEMAS (Matching AniList Response)
# ============================================

class AnimeTitle(BaseModel):
    """Anime title in different languages."""
    romaji: Optional[str] = None
    english: Optional[str] = None
    native: Optional[str] = None

class AnimeCoverImage(BaseModel):
    """Anime cover image URLs."""
    large: Optional[str] = None
    medium: Optional[str] = None

class AnimeNextAiring(BaseModel):
    """Next airing episode information."""
    airingAt: int  # Unix timestamp
    episode: int

class StudioNode(BaseModel):
    """Studio information."""
    name: str

class Studios(BaseModel):
    """Container for studio list."""
    nodes: List[StudioNode] = []


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
    bannerImage: Optional[str] = None
    description: Optional[str] = None
    episodes: Optional[int] = None
    status: str
    # season: Optional[str] = None
    # seasonYear: Optional[int] = None
    averageScore: Optional[int] = None
    # popularity: int
    genres: List[str] = []
    # studios: Studios
    nextAiringEpisode: Optional[AnimeNextAiring] = None

class AnimeSearchItem(BaseModel):
    """Anime item for search results (less detailed)."""
    id: int
    title: AnimeTitle
    coverImage: AnimeCoverImage
    bannerImage: Optional[str] = None
    description: Optional[str] = None
    # episodes: Optional[int] = None
    status: str
    # averageScore: Optional[int] = None
    # popularity: int
    # genres: List[str] = []


# ============================================
# RESPONSE WRAPPERS
# ============================================

class AnimeSeasonalResponse(BaseModel):
    """Response for seasonal anime endpoint."""
    pageInfo: PageInfo
    media: List[AnimeSeasonalItem]

class AnimeSearchResponse(BaseModel):
    """Response for search anime endpoint."""
    pageInfo: PageInfo
    media: List[AnimeSearchItem]
