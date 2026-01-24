import redis
import hashlib
import logging

logger = logging.getLogger("kregg")

# -----------------------------------
# Redis connection (fail-open)
# -----------------------------------
try:
    redis_client = redis.Redis(
        host="localhost",
        port=6379,
        decode_responses=True,
        socket_connect_timeout=1,
    )
    redis_client.ping()
    REDIS_AVAILABLE = True
except Exception:
    REDIS_AVAILABLE = False
    redis_client = None
    logger.warning("⚠️ Redis not available. Rate limiting disabled.")

# -----------------------------------
# Rate limiting config
# -----------------------------------
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_REQUESTS = 30

# -----------------------------------
# Helpers
# -----------------------------------
def make_key(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()

# -----------------------------------
# Rate limiting (tenant-level)
# -----------------------------------
def is_rate_limited(tenant: str) -> bool:
    """
    Returns True if tenant exceeded rate limit.
    Fail-open if Redis is unavailable.
    """
    if not REDIS_AVAILABLE:
        return False

    key = f"rate:{tenant}"
    current = redis_client.get(key)

    if current is None:
        redis_client.set(key, 1, ex=RATE_LIMIT_WINDOW)
        return False

    if int(current) >= RATE_LIMIT_REQUESTS:
        return True

    redis_client.incr(key)
    return False
