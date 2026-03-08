import logging
from datetime import datetime, timedelta

from fastapi import HTTPException, Request, status

logger = logging.getLogger(__name__)

CLEANUP_THRESHOLD = 100


class RateLimiter:
    def __init__(self) -> None:
        self.requests: dict[str, list[datetime]] = {}

    def is_rate_limited(
        self,
        client_ip: str,
        max_requests: int = 5,
        window_seconds: int = 60,
    ) -> bool:
        now = datetime.now()
        window_start = now - timedelta(seconds=window_seconds)

        if client_ip not in self.requests:
            self.requests[client_ip] = []

        self.requests[client_ip] = [
            req_time
            for req_time in self.requests[client_ip]
            if req_time > window_start
        ]

        if len(self.requests[client_ip]) >= max_requests:
            return True

        self.requests[client_ip].append(now)
        return False

    def cleanup_old_entries(self, max_age_minutes: int = 60) -> None:
        cutoff = datetime.now() - timedelta(minutes=max_age_minutes)
        ips_to_remove = []

        for ip, timestamps in self.requests.items():
            self.requests[ip] = [ts for ts in timestamps if ts > cutoff]
            if not self.requests[ip]:
                ips_to_remove.append(ip)

        for ip in ips_to_remove:
            del self.requests[ip]


rate_limiter = RateLimiter()


def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def rate_limit_auth_endpoints(
    request: Request,
    max_requests: int = 5,
    window_seconds: int = 60,
) -> None:
    client_ip = get_client_ip(request)

    if rate_limiter.is_rate_limited(client_ip, max_requests, window_seconds):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many requests. Please try again in {window_seconds} seconds.",
        )

    if len(rate_limiter.requests) % CLEANUP_THRESHOLD == 0:
        rate_limiter.cleanup_old_entries()


async def rate_limit_strict(request: Request) -> None:
    return await rate_limit_auth_endpoints(request, max_requests=3, window_seconds=60)


async def rate_limit_relaxed(request: Request) -> None:
    return await rate_limit_auth_endpoints(request, max_requests=10, window_seconds=60)
