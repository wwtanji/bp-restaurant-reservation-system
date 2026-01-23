from fastapi import HTTPException, Request, status
from datetime import datetime, timedelta
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Simple in-memory rate limiter for API endpoints

    Tracks requests per IP address and enforces limits
    """

    def __init__(self):
        # Store requests as {ip_address: [timestamp1, timestamp2, ...]}
        self.requests: Dict[str, List[datetime]] = {}

    def is_rate_limited(
        self,
        client_ip: str,
        max_requests: int = 5,
        window_seconds: int = 60
    ) -> bool:
        """
        Check if a client IP has exceeded the rate limit

        Args:
            client_ip: Client IP address
            max_requests: Maximum number of requests allowed
            window_seconds: Time window in seconds

        Returns:
            bool: True if rate limited, False otherwise
        """
        now = datetime.now()
        window_start = now - timedelta(seconds=window_seconds)

        # Get or initialize request history for this IP
        if client_ip not in self.requests:
            self.requests[client_ip] = []

        # Remove old requests outside the time window
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if req_time > window_start
        ]

        # Check if limit exceeded
        if len(self.requests[client_ip]) >= max_requests:
            logger.warning(
                f"Rate limit exceeded for IP {client_ip}: "
                f"{len(self.requests[client_ip])} requests in {window_seconds}s"
            )
            return True

        # Add current request
        self.requests[client_ip].append(now)
        return False

    def cleanup_old_entries(self, max_age_minutes: int = 60):
        """
        Clean up old entries from memory to prevent memory leaks

        Args:
            max_age_minutes: Maximum age of entries to keep
        """
        cutoff = datetime.now() - timedelta(minutes=max_age_minutes)
        ips_to_remove = []

        for ip, timestamps in self.requests.items():
            # Remove old timestamps
            self.requests[ip] = [ts for ts in timestamps if ts > cutoff]

            # Mark IP for removal if no recent requests
            if not self.requests[ip]:
                ips_to_remove.append(ip)

        # Remove IPs with no recent requests
        for ip in ips_to_remove:
            del self.requests[ip]

        if ips_to_remove:
            logger.info(f"Cleaned up {len(ips_to_remove)} inactive IPs from rate limiter")


# Global rate limiter instance
rate_limiter = RateLimiter()


def get_client_ip(request: Request) -> str:
    """
    Get client IP address from request

    Checks X-Forwarded-For header first (for proxies), then falls back to client.host

    Args:
        request: FastAPI request object

    Returns:
        str: Client IP address
    """
    # Check X-Forwarded-For header (for requests behind proxies/load balancers)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # X-Forwarded-For can contain multiple IPs, take the first one
        return forwarded_for.split(",")[0].strip()

    # Fall back to direct client IP
    return request.client.host if request.client else "unknown"


async def rate_limit_auth_endpoints(
    request: Request,
    max_requests: int = 5,
    window_seconds: int = 60
):
    """
    Rate limiting dependency for authentication endpoints

    Usage:
        @app.post("/login", dependencies=[Depends(rate_limit_auth_endpoints)])
        async def login(...):
            ...

    Args:
        request: FastAPI request object
        max_requests: Maximum requests allowed (default: 5)
        window_seconds: Time window in seconds (default: 60)

    Raises:
        HTTPException: 429 Too Many Requests if rate limit exceeded
    """
    client_ip = get_client_ip(request)

    if rate_limiter.is_rate_limited(client_ip, max_requests, window_seconds):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many requests. Please try again in {window_seconds} seconds."
        )

    # Periodically cleanup old entries (every 100th request)
    # This prevents memory leaks over time
    if len(rate_limiter.requests) % 100 == 0:
        rate_limiter.cleanup_old_entries()


async def rate_limit_strict(request: Request):
    """
    Strict rate limiting: 3 requests per minute

    For sensitive endpoints like password reset
    """
    return await rate_limit_auth_endpoints(request, max_requests=3, window_seconds=60)


async def rate_limit_relaxed(request: Request):
    """
    Relaxed rate limiting: 10 requests per minute

    For less sensitive endpoints
    """
    return await rate_limit_auth_endpoints(request, max_requests=10, window_seconds=60)
