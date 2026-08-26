from typing import Any


def get_error_responses(*status_codes: int) -> dict[int | str, dict[str, Any]]:
    descriptions = {
        400: "Bad Request - Invalid payload or parameters",
        401: "Unauthorized - Missing or invalid authentication token",
        403: "Forbidden - Insufficient permissions",
        404: "Not Found - Resource does not exist",
        422: "Validation Error - Invalid request data format",
        500: "Internal Server Error - Unexpected server crash",
        503: "System is currently fetching heavy data, please try again in a few seconds",
    }

    responses = {}
    for code in status_codes:
        responses[code] = {
            "description": descriptions.get(code, "Error occurred"),
            "content": {
                "application/json": {
                    "example": {
                        "error_code": f"ERR_{code}",
                        "message": descriptions.get(code, "Error occurred"),
                        "details": None,
                    }
                }
            },
        }
    return responses
