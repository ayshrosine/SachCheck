from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, HTTPException
from typing import Callable


def get_device_id(request: Request) -> str:
    """Extract device_id from request or fall back to IP address"""
    # Try to get device_id from headers first
    device_id = request.headers.get("X-Device-ID")
    if device_id:
        return f"device:{device_id}"
    
    # Fall back to IP address
    return get_remote_address(request)


# Initialize rate limiter
limiter = Limiter(key_func=get_device_id)


async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Custom handler for rate limit exceeded errors"""
    return HTTPException(
        status_code=429,
        detail={
            "error": "Rate limit exceeded",
            "message": "Too many requests. Please try again later.",
            "limit": exc.detail
        }
    )