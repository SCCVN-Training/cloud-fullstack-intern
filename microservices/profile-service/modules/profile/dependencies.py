from uuid import UUID

from fastapi import Header, HTTPException, status


async def get_current_user_id(
    x_user_id: str = Header(
        default=None, alias="X-User-Id", description="Injected by API Gateway"
    ),
) -> UUID:
    """
    Trích xuất User ID từ Header do NGINX Ingress (hoặc API Gateway) truyền xuống.
    """
    if not x_user_id:
        # Nếu không có header này, chứng tỏ request đi vòng qua Gateway (bất hợp pháp)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-User-Id header. Unauthorized request.",
        )

    try:
        return UUID(x_user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid X-User-Id format. Must be UUID.",
        )
