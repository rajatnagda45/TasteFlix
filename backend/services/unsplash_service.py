from __future__ import annotations

from json import loads
import ssl
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from core.config import get_settings


settings = get_settings()
SSL_CONTEXT = ssl.create_default_context(cafile="/etc/ssl/cert.pem")


class UnsplashService:
    def __init__(self) -> None:
        self.access_key = settings.unsplash_access_key
        self.base_url = settings.unsplash_base_url.rstrip("/")

    def is_enabled(self) -> bool:
        return bool(self.access_key)

    def _request(self, path: str, params: dict[str, Any]) -> dict[str, Any] | None:
        if not self.access_key:
            return None

        query = urlencode(params)
        request = Request(
            f"{self.base_url}{path}?{query}",
            headers={
                "Accept-Version": "v1",
                "Authorization": f"Client-ID {self.access_key}",
            },
        )
        try:
            with urlopen(request, timeout=8, context=SSL_CONTEXT) as response:
                return loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError):
            return None

    def search_photo(self, query: str) -> str | None:
        payload = self._request(
            "/search/photos",
            {
                "query": query,
                "page": 1,
                "per_page": 1,
                "orientation": "portrait",
                "content_filter": "high",
            },
        )
        if not payload:
            return None

        results = payload.get("results") or []
        if not results:
            return None

        urls = results[0].get("urls") or {}
        return urls.get("regular") or urls.get("small") or urls.get("thumb")
