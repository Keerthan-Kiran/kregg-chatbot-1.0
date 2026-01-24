import logging
import time
from typing import Callable, Generator

logger = logging.getLogger("kregg")


class RetryableError(Exception):
    pass


def retry_generator(
    fn: Callable[[], Generator[str, None, None]],
    retries: int = 2,
    delay: float = 0.5,
) -> Generator[str, None, None]:
    """
    Retry a streaming generator safely.
    """
    attempt = 0
    while attempt <= retries:
        try:
            yield from fn()
            return
        except RetryableError as e:
            attempt += 1
            logger.warning(f"Retry {attempt}/{retries}: {e}")
            if attempt > retries:
                raise
            time.sleep(delay)
