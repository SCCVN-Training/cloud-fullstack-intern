"""
AniList GraphQL Queries
All queries stored as constants for maintainability.
"""

# ============================================
# SEASONAL ANIME QUERY
# ============================================

SEASONAL_ANIME_QUERY = """
query GetSeasonalAnime($season: MediaSeason, $year: Int, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
        pageInfo {
            hasNextPage
            currentPage
        }
        media(
            season: $season
            seasonYear: $year
            type: ANIME
            sort: POPULARITY_DESC
            isAdult: false
        ) {
            id
            title { romaji english native }
            coverImage { large medium }
            bannerImage
            description
            episodes
            status
            averageScore
            genres
            nextAiringEpisode { airingAt episode }
            siteUrl
            format
        }
    }
}
"""

# ============================================
# SEARCH ANIME QUERY
# ============================================

SEARCH_ANIME_QUERY = """
query SearchAnime($search: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
        pageInfo {
            hasNextPage
            currentPage
        }
        media(search: $search, type: ANIME, isAdult: false) {
            id
            title { romaji english native }
            coverImage { large medium }
            bannerImage
            description
            status
            siteUrl
            format
            seasonYear
        }
    }
}
"""

# ============================================
# SINGLE ANIME DETAILS (Optional - for later)
# ============================================

ANIME_DETAILS_QUERY = """
query GetAnimeDetails($id: Int) {
    Media(id: $id, type: ANIME) {
        id
        title { romaji english native }
        coverImage { extraLarge large medium }
        bannerImage
        description
        episodes
        duration
        status
        season
        seasonYear
        averageScore
        meanScore
        popularity
        trending
        favourites
        genres
        studios { nodes { name } }
        tags { name }
        nextAiringEpisode { airingAt episode }
        relations { edges { relationType node { id title { romaji } } } }
        characters { edges { node { id name { full } } } }
        staff { edges { node { id name { full } } } }
        rankings { rank type }
        siteUrl
    }
}
"""
