from datetime import datetime
from enum import Enum


class Season(str, Enum):
    WINTER = "WINTER"
    SPRING = "SPRING"
    SUMMER = "SUMMER"
    FALL = "FALL"


def get_current_season() -> tuple[Season, int]:
    """Calculate current anime season based on today's date."""
    now = datetime.now()
    year = now.year
    month = now.month

    if 1 <= month <= 3:
        season = Season.WINTER
        # Winter season includes December of previous year
        if month == 1:
            # Winter 2025 = Jan-Mar 2025, but also Dec 2024
            pass
    elif 4 <= month <= 6:
        season = Season.SPRING
    elif 7 <= month <= 9:
        season = Season.SUMMER
    else:
        season = Season.FALL

    return season, year
