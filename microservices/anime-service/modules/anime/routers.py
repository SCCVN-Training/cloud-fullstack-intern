"""
Anime Module Router
FastAPI endpoints for anime functionality.
"""

from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from shared.docs import get_error_responses
from shared.logger import get_logger
from shared.models import ApiResponse

from modules.anime.dependencies import get_current_user_id
from modules.anime.rate_limit import AnimeRateLimiter, get_anime_rate_limiter
from modules.anime.schemas import (
    AnimeSearchItem,
    AnimeSeasonalItem,
    PageInfo,
)
from modules.anime.services.anilist_service import AniListService
from modules.anime.services.cache_manager import AnimeCacheManager
from modules.anime.services.season import get_current_season

anime_router = APIRouter(
    prefix="/anime",
    tags=["Anime"],
)


# ============================================
# LOGGING SETUP
# ============================================

logger = get_logger(__name__)


# ============================================
# DEPENDENCIES
# ============================================


async def get_anime_service() -> AniListService:
    """Dependency for AniList service with cache."""
    cache_manager = AnimeCacheManager()
    return AniListService(cache_manager)


# ============================================
# ENDPOINTS
# ============================================


@anime_router.get(
    "/seasonal",
    response_model=ApiResponse[list[AnimeSeasonalItem]],
    status_code=status.HTTP_200_OK,
    responses=get_error_responses(429, 503),
)
async def get_seasonal_anime(
    background_tasks: BackgroundTasks,
    season: str | None = Query(
        None, description="Season: WINTER, SPRING, SUMMER, FALL"
    ),
    year: int | None = Query(None, description="Year (e.g., 2025)"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(25, ge=1, le=50, description="Items per page (max 50)"),
    current_user_id: UUID = Depends(get_current_user_id),
    service: AniListService = Depends(get_anime_service),
    rate_limiter: AnimeRateLimiter = Depends(get_anime_rate_limiter),
):
    """
    Get seasonal anime with background cache refresh.

    ✅ First request: Returns first page immediately (~1-2s)
    ✅ Background task fetches ALL pages and caches them
    ✅ Subsequent requests: Lightning fast from cache (< 100ms)
    """
    logger.info(
        f"[Seasonal] Request started - user: {current_user_id}, "
        f"season: {season}, year: {year}, page: {page}, per_page: {per_page}"
    )

    # ✅ Auto-detect if not provided
    if season is None or year is None:
        current_season, current_year = get_current_season()
        season = season or current_season
        year = year or current_year
        logger.info(f"[Seasonal] Auto-detected season/year: {season} {year}")

    # ✅ Validate season
    season_upper = season.upper()
    if season_upper not in ["WINTER", "SPRING", "SUMMER", "FALL"]:
        logger.warning(f"[Seasonal] Invalid season: {season}")
        raise HTTPException(status_code=400, detail="Invalid season")

    # ✅ Validate year
    if year < 1900 or year > 2100:
        logger.warning(f"[Seasonal] Invalid year: {year}")
        raise HTTPException(status_code=400, detail="Invalid year")

    # ✅ Rate limit check
    logger.debug(f"[Seasonal] Checking rate limit for user: {current_user_id}")
    allowed, remaining, retry_after = await rate_limiter.check_seasonal(
        user_id=str(current_user_id)
    )

    if not allowed:
        logger.warning(f"[Seasonal] Rate limit exceeded for user: {current_user_id}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many seasonal requests. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )

    logger.info(
        f"[Seasonal] Calling service - season: {season_upper}, year: {year}, "
        f"page: {page}, per_page: {per_page}"
    )

    return_data, return_has_next_page = await service.get_seasonal_anime(
        season=season_upper,
        year=year,
        page=page,
        per_page=per_page,
        background_tasks=background_tasks,
    )

    logger.info(
        f"[Seasonal] Response successful - returned {len(return_data)} items, "
        f"hasNextPage: {return_has_next_page}"
    )

    return ApiResponse(
        message=f"Seasonal anime retrieved successfully for page {page}",
        data=[AnimeSeasonalItem(**item) for item in return_data],
        meta=PageInfo(hasNextPage=return_has_next_page, currentPage=page).model_dump(),
    )


@anime_router.get(
    "/search",
    response_model=ApiResponse[list[AnimeSearchItem]],
    status_code=status.HTTP_200_OK,
    responses=get_error_responses(429, 503),
)
async def search_anime(
    background_tasks: BackgroundTasks,
    query: str = Query(..., min_length=2, description="Search term (min 2 characters)"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(25, ge=1, le=50, description="Items per page (max 50)"),
    current_user_id: UUID = Depends(get_current_user_id),
    service: AniListService = Depends(get_anime_service),
    rate_limiter: AnimeRateLimiter = Depends(get_anime_rate_limiter),
):
    """
    Search anime with background cache refresh.

    ✅ First request: Returns from AniList (~1-2s)
    ✅ Background task caches the result
    ✅ Subsequent requests: Lightning fast from cache (< 100ms)
    """
    logger.info(
        f"[Search] Request started - user: {current_user_id}, "
        f"query: '{query}', page: {page}, per_page: {per_page}"
    )

    # ✅ Rate limit check
    logger.debug(f"[Search] Checking rate limit for user: {current_user_id}")
    allowed, remaining, retry_after = await rate_limiter.check_search(
        user_id=str(current_user_id)
    )

    if not allowed:
        logger.warning(f"[Search] Rate limit exceeded for user: {current_user_id}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many search requests. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )

    logger.info(
        f"[Search] Calling service - query: '{query}', page: {page}, per_page: {per_page}"
    )

    return_data, return_has_next_page = await service.search_anime(
        query=query,
        page=page,
        per_page=per_page,
        background_tasks=background_tasks,
    )

    logger.info(
        f"[Search] Response successful - returned {len(return_data)} items, "
        f"hasNextPage: {return_has_next_page}"
    )

    return ApiResponse(
        message="Anime search results retrieved successfully!",
        data=[AnimeSearchItem(**item) for item in return_data],
        meta=PageInfo(hasNextPage=return_has_next_page, currentPage=page).model_dump(),
    )


# ============================================
# ADMIN / MAINTENANCE ENDPOINTS
# ============================================

# @anime_router.post(
#     "/admin/refresh-seasonal",
#     status_code=status.HTTP_200_OK,
# )
# async def refresh_seasonal_cache(
#     season: str = Query(..., description="Season: WINTER, SPRING, SUMMER, FALL"),
#     year: int = Query(..., description="Year (e.g., 2025)"),
#     current_user_id: UUID = Depends(get_current_user_id),
#     service: AniListService = Depends(get_anime_service),
# ):
#     """
#     Force refresh seasonal cache.

#     ⚠️ Admin only endpoint.
#     ✅ Clears cache so next request fetches fresh data.
#     """
#     # TODO: Add admin role check
#     logger.info(f"[Admin] Refreshing seasonal cache for {season} {year} by user: {current_user_id}")
#     await service.refresh_seasonal_cache(season, year)
#     logger.info(f"[Admin] Seasonal cache invalidated for {season} {year}")
#     return {"message": f"Seasonal cache for {season} {year} invalidated."}


# @anime_router.get(
#     "/cache/stats",
#     status_code=status.HTTP_200_OK,
# )
# async def get_cache_stats(
#     current_user_id: UUID = Depends(get_current_user_id),
# ):
#     """
#     Get cache statistics for monitoring.

#     ⚠️ Admin only endpoint.
#     """
#     # TODO: Add admin role check
#     cache_manager = AnimeCacheManager()
#     stats = await cache_manager.get_cache_stats()
#     logger.info(f"[Admin] Cache stats requested by user: {current_user_id}")
#     return stats
