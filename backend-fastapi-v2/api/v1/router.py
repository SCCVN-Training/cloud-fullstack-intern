from fastapi import APIRouter
from shared.config import settings

# Import module routers
from modules.auth.routers import auth_router
from modules.profile.routers import profile_router
from modules.anime.routers import anime_router

# Main API Gateway router
router = APIRouter(
    prefix="/api/v1",
)

# ============ Mount Modules ============

# Authentication module
if settings.enable_auth:
    router.include_router(auth_router)

# Profile module
if settings.enable_profile:
    router.include_router(profile_router)


if settings.enable_anime:
    router.include_router(anime_router)

# if settings.enable_manga:
#     from modules.manga.router import manga_router
#     router.include_router(manga_router)

# if settings.enable_music:
#     from modules.music.router import music_router
#     router.include_router(music_router)


# ============ Health Check ============

@router.get("/health")
async def health_check():
    """Health check endpoint for the API Gateway."""
    return {
        "status": "healthy",
        "service": "backend-v1",
        "environment": settings.environment,
        "version": "1.0.0",
        "modules": {
            "auth": settings.enable_auth,
            "profile": settings.enable_profile,
            "anime": settings.enable_anime,
            "manga": settings.enable_manga,
            "music": settings.enable_music,
        }
    }
