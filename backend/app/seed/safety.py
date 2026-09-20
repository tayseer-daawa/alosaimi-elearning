"""Safety guards — refuse to seed anything that is not clearly local."""

from __future__ import annotations

from urllib.parse import urlparse

from app.core.config import settings

_LOCAL_HOSTS = frozenset(
    {
        "localhost",
        "127.0.0.1",
        "::1",
        "db",  # docker compose service name
    }
)


def assert_local_environment() -> None:
    """Raise SystemExit if this is not a local development database."""
    if settings.ENVIRONMENT != "local":
        raise SystemExit(
            f"Refusing to seed: ENVIRONMENT={settings.ENVIRONMENT!r} "
            "(only 'local' is allowed)."
        )

    host = (settings.POSTGRES_SERVER or "").strip().lower()
    if host not in _LOCAL_HOSTS:
        # Also accept URI host in case SERVER is overridden oddly
        uri = str(settings.SQLALCHEMY_DATABASE_URI)
        parsed = urlparse(uri)
        uri_host = (parsed.hostname or "").lower()
        if uri_host not in _LOCAL_HOSTS and host not in _LOCAL_HOSTS:
            raise SystemExit(
                f"Refusing to seed: database host {host or uri_host!r} "
                "does not look local (expected localhost / 127.0.0.1 / db)."
            )
