from __future__ import annotations

from dataclasses import dataclass
from json import loads
import ssl
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from core.config import get_settings


settings = get_settings()
SSL_CONTEXT = ssl.create_default_context(cafile="/etc/ssl/cert.pem")


@dataclass
class TmdbMovieMatch:
    tmdb_id: int
    title: str | None
    year: int | None
    original_language: str | None
    genres: str | None
    vote_average: float | None
    vote_count: int | None
    overview: str | None
    poster_url: str | None
    backdrop_url: str | None


class TmdbService:
    def __init__(self) -> None:
        self.api_key = settings.tmdb_api_key
        self.base_url = settings.tmdb_base_url
        self.image_base_url = settings.tmdb_image_base_url.rstrip("/")

    def is_enabled(self) -> bool:
        return bool(self.api_key)

    def _request(self, path: str, params: dict[str, Any]) -> dict[str, Any] | None:
        if not self.api_key:
            return None

        query = urlencode({"api_key": self.api_key, **params})
        url = f"{self.base_url}{path}?{query}"
        try:
            with urlopen(url, timeout=4, context=SSL_CONTEXT) as response:
                return loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError):
            return None

    def _build_match(self, payload: dict[str, Any]) -> TmdbMovieMatch:
        poster_path = payload.get("poster_path")
        backdrop_path = payload.get("backdrop_path")
        release_date = str(payload.get("release_date") or "")
        genre_names = [genre.get("name", "").strip() for genre in payload.get("genres") or [] if genre.get("name")]
        year = int(release_date[:4]) if len(release_date) >= 4 and release_date[:4].isdigit() else None
        return TmdbMovieMatch(
            tmdb_id=int(payload["id"]),
            title=payload.get("title") or payload.get("name"),
            year=year,
            original_language=payload.get("original_language") or None,
            genres=" ".join(genre_names) or None,
            vote_average=float(payload["vote_average"]) if payload.get("vote_average") is not None else None,
            vote_count=int(payload["vote_count"]) if payload.get("vote_count") is not None else None,
            overview=payload.get("overview") or None,
            poster_url=f"{self.image_base_url}{poster_path}" if poster_path else None,
            backdrop_url=f"{self.image_base_url}{backdrop_path}" if backdrop_path else None,
        )

    def search_movie(self, title: str, year: int | None = None) -> TmdbMovieMatch | None:
        params: dict[str, Any] = {"query": title}
        if year:
            params["year"] = year

        payload = self._request("/search/movie", params)
        if not payload:
            return None

        results = payload.get("results") or []
        if not results:
            return None

        match = self._build_match(results[0])
        if match.tmdb_id and (not match.genres or not match.overview):
            return self.get_movie(match.tmdb_id) or match
        return match

    def get_movie(self, tmdb_id: int) -> TmdbMovieMatch | None:
        payload = self._request(f"/movie/{tmdb_id}", {})
        if not payload:
            return None

        return self._build_match(payload)

    def discover_bollywood_movies(self, limit: int = 12) -> list[TmdbMovieMatch]:
        payload = self._request(
            "/discover/movie",
            {
                "with_original_language": "hi",
                "region": "IN",
                "sort_by": "popularity.desc",
                "vote_count.gte": 100,
                "include_adult": "false",
                "include_video": "false",
                "page": 1,
            },
        )
        if not payload:
            return []

        matches: list[TmdbMovieMatch] = []
        for item in payload.get("results") or []:
            match = self._build_match(item)
            if not match.poster_url:
                continue
            matches.append(match)
            if len(matches) >= limit:
                break
        return matches

    def search_movies(self, query: str, limit: int = 10) -> list[TmdbMovieMatch]:
        payload = self._request(
            "/search/movie",
            {
                "query": query,
                "include_adult": "false",
                "region": "IN",
                "page": 1,
            },
        )
        if not payload:
            return []

        matches: list[TmdbMovieMatch] = []
        for item in payload.get("results") or []:
            match = self._build_match(item)
            if not match.title:
                continue
            matches.append(match)
            if len(matches) >= limit:
                break
        return matches
