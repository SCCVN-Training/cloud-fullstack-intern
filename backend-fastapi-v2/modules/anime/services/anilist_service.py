"""
AniList GraphQL Service with Smart Caching + Background Refresh.
"""

import certifi
import httpx
from typing import Optional, List, Dict, Any
from fastapi import BackgroundTasks

from shared.config import settings
from shared.utils import get_logger  # ✅ NEW
from modules.anime.queries import SEASONAL_ANIME_QUERY, SEARCH_ANIME_QUERY
from modules.anime.schemas import (
    AnimeSeasonalItem,
    AnimeSearchItem,
    AnimeSeasonalResponse,
    AnimeSearchResponse,
    PageInfo,
)
from modules.anime.services.cache_manager import AnimeCacheManager


# ============================================
# LOGGING SETUP
# ============================================

logger = get_logger(__name__)


class AniListService:
    """Service for interacting with AniList GraphQL API with smart caching."""

    def __init__(self, cache_manager: Optional[AnimeCacheManager] = None):
        self.graphql_url = settings.anilist_graphql_url
        self.cache = cache_manager or AnimeCacheManager()

    # ============================================
    # GRAPHQL EXECUTION
    # ============================================

    async def _execute_query(
        self,
        query: str,
        variables: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Execute GraphQL query against AniList."""
        if settings.ssl_verify:
            verify = certifi.where()
            logger.debug(f"SSL verification enabled with certifi: {verify}")
        else:
            verify = False
            logger.debug("SSL verification disabled (development mode)")

        async with httpx.AsyncClient(verify=verify) as client:
            response = await client.post(
                self.graphql_url,
                json={"query": query, "variables": variables},
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()

            if "errors" in data:
                logger.error(f"GraphQL errors: {data['errors']}")
                raise Exception(f"GraphQL errors: {data['errors']}")

            return data["data"]

    # ============================================
    # BACKGROUND CACHE BUILD
    # ============================================

    async def _build_seasonal_cache_background(
        self,
        season: str,
        year: int,
    ) -> None:
        """
        Background task to fetch ALL seasonal pages and cache them.
        This runs asynchronously and doesn't block the response.
        """
        logger.info(f"[Background] Starting seasonal cache build for {season} {year}")
        start_time = __import__('time').time()

        try:
            all_media = await self._fetch_all_seasonal_pages(season, year)
            if all_media:
                await self.cache.set_seasonal_cache(season, year, all_media)
                elapsed = __import__('time').time() - start_time
                logger.info(
                    f"[Background] ✅ Seasonal cache built for {season} {year}: "
                    f"{len(all_media)} items in {elapsed:.2f}s"
                )
            else:
                logger.warning(f"[Background] No media found for {season} {year}")
        except Exception as e:
            elapsed = __import__('time').time() - start_time
            logger.error(
                f"[Background] ❌ Seasonal cache build failed for {season} {year}: {e} "
                f"(after {elapsed:.2f}s)"
            )

    async def _build_search_cache_background(
        self,
        query: str,
        page: int,
        per_page: int,
    ) -> None:
        """
        Background task to fetch search results and cache them.
        """
        logger.info(f"[Background] Starting search cache build for '{query}' page {page}")
        start_time = __import__('time').time()

        try:
            variables = {
                "search": query,
                "page": page,
                "perPage": per_page,
            }
            data = await self._execute_query(SEARCH_ANIME_QUERY, variables)
            page_data = data.get("Page", {})

            response = AnimeSearchResponse(
                pageInfo=PageInfo(
                    hasNextPage=page_data.get("pageInfo", {}).get("hasNextPage", False),
                    currentPage=page_data.get("pageInfo", {}).get("currentPage", 1),
                ),
                media=[AnimeSearchItem(**item) for item in page_data.get("media", [])],
            )

            await self.cache.set_search_cache(
                query,
                page,
                per_page,
                {
                    "pageInfo": {
                        "hasNextPage": response.pageInfo.hasNextPage,
                        "currentPage": response.pageInfo.currentPage,
                    },
                    "media": [item.model_dump() for item in response.media],
                }
            )
            elapsed = __import__('time').time() - start_time
            logger.info(
                f"[Background] ✅ Search cache built for '{query}' page {page}: "
                f"{len(response.media)} items in {elapsed:.2f}s"
            )
        except Exception as e:
            elapsed = __import__('time').time() - start_time
            logger.error(
                f"[Background] ❌ Search cache build failed for '{query}': {e} "
                f"(after {elapsed:.2f}s)"
            )

    # ============================================
    # SMART SEASONAL ANIME (Background Cache)
    # ============================================

    async def get_seasonal_anime(
        self,
        season: str,
        year: int,
        page: int = 1,
        per_page: int = 25,
        background_tasks: Optional[BackgroundTasks] = None,
    ) -> AnimeSeasonalResponse:
        """
        Get seasonal anime with background cache refresh.

        Strategy:
        1. Check cache for full list
        2. If cached: Return paginated results (fast! < 100ms)
        3. If not cached:
           a. Fetch FIRST PAGE only from AniList (fast! ~1-2s)
           b. Return first page to user
           c. Trigger background task to fetch ALL pages and cache them
        """
        logger.debug(f"[Seasonal] Checking cache for {season} {year} page {page}")

        # ✅ Check if full list is cached
        cached_items, total, has_next = await self.cache.get_seasonal_paginated(
            season=season,
            year=year,
            page=page,
            per_page=per_page,
        )

        # ✅ If cache hit, return immediately
        if cached_items:
            logger.info(
                f"[Seasonal] ✅ Cache hit for {season} {year} - returning {len(cached_items)} items "
                f"(page {page} of {total//per_page + 1})"
            )
            return AnimeSeasonalResponse(
                pageInfo=PageInfo(
                    hasNextPage=has_next,
                    currentPage=page,
                ),
                media=cached_items,
            )

        logger.info(f"[Seasonal] ❌ Cache miss for {season} {year} - fetching first page only")

        # ✅ Cache miss: Fetch ONLY the first page (fast)
        first_page_variables = {
            "season": season.upper(),
            "year": year,
            "page": 1,
            "perPage": per_page,
        }

        data = await self._execute_query(SEASONAL_ANIME_QUERY, first_page_variables)
        page_data = data.get("Page", {})

        first_page_media = [AnimeSeasonalItem(**item) for item in page_data.get("media", [])]
        has_next_page = page_data.get("pageInfo", {}).get("hasNextPage", False)

        logger.info(
            f"[Seasonal] First page fetched: {len(first_page_media)} items, "
            f"hasNextPage: {has_next_page}"
        )

        # ✅ Trigger background task to build full cache
        if background_tasks:
            logger.info(f"[Seasonal] Scheduling background cache build for {season} {year}")
            background_tasks.add_task(
                self._build_seasonal_cache_background,
                season,
                year,
            )
        else:
            logger.warning("[Seasonal] No BackgroundTasks available - cache will not be built")

        # ✅ Return first page immediately (don't wait for full cache)
        return AnimeSeasonalResponse(
            pageInfo=PageInfo(
                hasNextPage=has_next_page,
                currentPage=page,
            ),
            media=first_page_media,
        )

    async def _fetch_all_seasonal_pages(
        self,
        season: str,
        year: int,
        per_page: int = 50,
        max_pages: int = 10,
    ) -> List[AnimeSeasonalItem]:
        """Fetch all pages of seasonal anime from AniList."""
        all_media = []
        page = 1
        has_next = True
        pages_fetched = 0

        logger.info(f"[FetchAll] Starting fetch for {season} {year}, per_page={per_page}")

        while has_next:
            if pages_fetched >= max_pages:
                logger.warning(f"[FetchAll] Reached max_pages limit ({max_pages}) - stopping")
                break

            variables = {
                "season": season.upper(),
                "year": year,
                "page": page,
                "perPage": per_page,
            }

            logger.debug(f"[FetchAll] Fetching page {page}")
            data = await self._execute_query(SEASONAL_ANIME_QUERY, variables)
            page_data = data.get("Page", {})

            media = page_data.get("media", [])
            all_media.extend([AnimeSeasonalItem(**item) for item in media])

            has_next = page_data.get("pageInfo", {}).get("hasNextPage", False)
            page += 1
            pages_fetched += 1

            logger.debug(f"[FetchAll] Page {page-1} fetched: {len(media)} items, has_next: {has_next}")

        logger.info(f"[FetchAll] Completed: {len(all_media)} total items across {pages_fetched} pages")
        return all_media

    # ============================================
    # SEARCH ANIME (With Cache)
    # ============================================

    async def search_anime(
        self,
        query: str,
        page: int = 1,
        per_page: int = 25,
        background_tasks: Optional[BackgroundTasks] = None,
    ) -> AnimeSearchResponse:
        """
        Search anime with background cache refresh.

        Strategy:
        1. Check cache
        2. If cached: Return immediately (fast!)
        3. If not cached:
           a. Fetch from AniList (normal response time)
           b. Return to user
           c. Cache in background (for next time)
        """
        # ✅ Check cache
        cached = await self.cache.get_search_cache(query, page, per_page)

        if cached:
            logger.info(
                f"[Search] ✅ Cache hit for '{query}' page {page} - "
                f"{len(cached['media'])} items"
            )
            return AnimeSearchResponse(
                pageInfo=PageInfo(
                    hasNextPage=cached["pageInfo"]["hasNextPage"],
                    currentPage=cached["pageInfo"]["currentPage"],
                ),
                media=[AnimeSearchItem(**item) for item in cached["media"]],
            )

        logger.info(f"[Search] ❌ Cache miss for '{query}' page {page} - fetching from API")

        # ✅ Cache miss: Fetch from API
        variables = {
            "search": query,
            "page": page,
            "perPage": per_page,
        }

        data = await self._execute_query(SEARCH_ANIME_QUERY, variables)
        page_data = data.get("Page", {})

        response = AnimeSearchResponse(
            pageInfo=PageInfo(
                hasNextPage=page_data.get("pageInfo", {}).get("hasNextPage", False),
                currentPage=page_data.get("pageInfo", {}).get("currentPage", 1),
            ),
            media=[AnimeSearchItem(**item) for item in page_data.get("media", [])],
        )

        logger.info(
            f"[Search] API response: {len(response.media)} items, "
            f"hasNextPage: {response.pageInfo.hasNextPage}"
        )

        # ✅ Cache in background (don't wait)
        if background_tasks:
            logger.info(f"[Search] Scheduling background cache for '{query}' page {page}")
            background_tasks.add_task(
                self._build_search_cache_background,
                query,
                page,
                per_page,
            )

        return response

    # ============================================
    # ADMIN / MAINTENANCE
    # ============================================

    # async def refresh_seasonal_cache(self, season: str, year: int) -> None:
    #     """Force refresh seasonal cache."""
    #     logger.info(f"[Admin] Refreshing seasonal cache for {season} {year}")
    #     await self.cache.invalidate_seasonal(season, year)
    #     logger.info(f"[Admin] Seasonal cache invalidated for {season} {year}")
