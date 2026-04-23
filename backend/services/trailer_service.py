from __future__ import annotations

from dataclasses import dataclass
from json import loads
import re
import ssl
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote_plus, urlencode
from urllib.request import Request, urlopen

from core.config import get_settings


settings = get_settings()
SSL_CONTEXT = ssl.create_default_context(cafile="/etc/ssl/cert.pem")
YOUTUBE_WATCH_URL = "https://www.youtube.com/watch?v="
BAD_VIDEO_TERMS = (
    "making",
    "behind the scenes",
    "bts",
    "full movie",
    "song",
    "songs",
    "clip",
    "clips",
    "reaction",
    "review",
)
TRAILER_PREFERRED_TERMS = ("official trailer", "trailer")
YOUTUBE_RESULT_ID_PATTERN = re.compile(r'"videoId":"([A-Za-z0-9_-]{11})"')


@dataclass(frozen=True)
class TrailerResult:
    source: str
    videoKey: str
    name: str
    site: str = "YouTube"
    type: str = "Trailer"

    def as_payload(self) -> dict[str, str]:
        return {
            "key": self.videoKey,
            "name": self.name,
            "site": self.site,
            "type": self.type,
            "source": self.source,
        }


def _normalized(value: str | None) -> str:
    return str(value or "").casefold()


def _contains_bad_terms(title: str | None) -> bool:
    normalized = _normalized(title)
    return any(term in normalized for term in BAD_VIDEO_TERMS)


def _contains_trailer_terms(title: str | None) -> bool:
    normalized = _normalized(title)
    return any(term in normalized for term in TRAILER_PREFERRED_TERMS)


def _score_title(title: str | None) -> int:
    normalized = _normalized(title)
    score = 0

    if "official trailer" in normalized:
        score += 10
    elif "trailer" in normalized:
        score += 5

    if "hd" in normalized:
        score += 2

    if "teaser" in normalized:
        score -= 5

    if _contains_bad_terms(normalized):
        if "making" in normalized or "bts" in normalized:
            score -= 10
        else:
            score -= 6

    return score


def _youtube_request(path: str, params: dict[str, Any]) -> dict[str, Any] | None:
    if not settings.youtube_api_key:
        return None

    query = urlencode({"key": settings.youtube_api_key, **params})
    url = f"{settings.youtube_base_url}{path}?{query}"
    try:
        with urlopen(url, timeout=5, context=SSL_CONTEXT) as response:
            return loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError):
        return None


def _make_request(url: str) -> str | None:
    request = Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/123.0.0.0 Safari/537.36"
            )
        },
    )
    try:
        with urlopen(request, timeout=5, context=SSL_CONTEXT) as response:
            return response.read().decode("utf-8", errors="ignore")
    except (HTTPError, URLError, TimeoutError):
        return None


def _is_tmdb_youtube_video(video: dict[str, Any]) -> bool:
    return video.get("site") == "YouTube" and bool(video.get("key"))


def _tmdb_priority(video: dict[str, Any]) -> tuple[int, int, int, str]:
    normalized_type = _normalized(video.get("type"))
    name = video.get("name") or "Trailer"
    normalized_name = _normalized(name)

    if normalized_type == "trailer":
        type_rank = 0
    elif normalized_type == "teaser":
        type_rank = 1
    else:
        type_rank = 2

    score_rank = -_score_title(normalized_name)
    official_rank = 0 if video.get("official") else 1
    return (type_rank, score_rank, official_rank, normalized_name)


def _pick_tmdb_trailer(videos: list[dict[str, Any]]) -> TrailerResult | None:
    youtube_videos = [
        video for video in videos if _is_tmdb_youtube_video(video) and not _contains_bad_terms(video.get("name"))
    ]
    if not youtube_videos:
        return None

    trailers = [video for video in youtube_videos if _normalized(video.get("type")) == "trailer"]
    teasers = [video for video in youtube_videos if _normalized(video.get("type")) == "teaser"]
    fallback = youtube_videos
    pool = trailers or teasers or fallback
    selected = sorted(pool, key=_tmdb_priority)[0]

    return TrailerResult(
        source="tmdb",
        videoKey=str(selected.get("key")),
        name=selected.get("name") or "Official Trailer",
        type=selected.get("type") or "Trailer",
    )


def _fetch_youtube_api_results(query: str, limit: int = 8) -> list[dict[str, Any]]:
    payload = _youtube_request(
        "/search",
        {
            "part": "snippet",
            "q": query,
            "type": "video",
            "videoEmbeddable": "true",
            "safeSearch": "moderate",
            "maxResults": limit,
        },
    )
    if not payload:
        return []

    video_ids = [
        item.get("id", {}).get("videoId")
        for item in (payload.get("items") or [])
        if item.get("id", {}).get("videoId")
    ]
    if not video_ids:
        return []

    stats_payload = _youtube_request(
        "/videos",
        {
            "part": "snippet,statistics",
            "id": ",".join(video_ids),
            "maxResults": limit,
        },
    )
    stats_by_id = {
        item.get("id"): item
        for item in (stats_payload or {}).get("items", [])
        if item.get("id")
    }

    results: list[dict[str, Any]] = []
    for item in payload.get("items") or []:
        video_id = item.get("id", {}).get("videoId")
        if not video_id:
            continue
        enriched = stats_by_id.get(video_id) or item
        snippet = enriched.get("snippet") or item.get("snippet") or {}
        statistics = enriched.get("statistics") or {}
        results.append(
            {
                "video_id": video_id,
                "title": snippet.get("title") or "Trailer",
                "view_count": int(statistics.get("viewCount") or 0),
            }
        )
    return results


def _fetch_youtube_search_page_results(query: str, limit: int = 8) -> list[dict[str, Any]]:
    search_url = f"https://www.youtube.com/results?search_query={quote_plus(query)}"
    html = _make_request(search_url)
    if not html:
        return []

    video_ids: list[str] = []
    for video_id in YOUTUBE_RESULT_ID_PATTERN.findall(html):
        if video_id not in video_ids:
            video_ids.append(video_id)
        if len(video_ids) >= limit:
            break

    results: list[dict[str, Any]] = []
    for video_id in video_ids:
        watch_html = _make_request(f"{YOUTUBE_WATCH_URL}{video_id}")
        if not watch_html:
            results.append({"video_id": video_id, "title": "Trailer", "view_count": 0})
            continue

        title_match = re.search(r"<title>(.*?)</title>", watch_html, re.IGNORECASE | re.DOTALL)
        title = title_match.group(1).replace(" - YouTube", "").strip() if title_match else "Trailer"
        view_match = re.search(r'"viewCount":"(\d+)"', watch_html)
        view_count = int(view_match.group(1)) if view_match else 0
        results.append(
            {
                "video_id": video_id,
                "title": title,
                "view_count": view_count,
            }
        )
    return results


def _youtube_result_rank(result: dict[str, Any]) -> tuple[int, int, int, str]:
    title = result.get("title") or "Trailer"
    normalized_title = _normalized(title)
    score_rank = -_score_title(normalized_title)
    has_trailer_rank = 0 if _contains_trailer_terms(normalized_title) else 1
    view_rank = -int(result.get("view_count") or 0)
    return (has_trailer_rank, score_rank, view_rank, normalized_title)


def _pick_youtube_trailer(movie_title: str, release_year: int | None) -> TrailerResult | None:
    query = f"{movie_title} {release_year} official trailer" if release_year else f"{movie_title} official trailer"
    results = _fetch_youtube_api_results(query) or _fetch_youtube_search_page_results(query)
    if not results:
        return None

    clean_results = [result for result in results if not _contains_bad_terms(result.get("title"))]
    trailer_results = [result for result in clean_results if _contains_trailer_terms(result.get("title"))]
    ranked_pool = trailer_results or clean_results or results
    selected = sorted(ranked_pool, key=_youtube_result_rank)[0]

    return TrailerResult(
        source="youtube",
        videoKey=selected["video_id"],
        name=selected.get("title") or "Official Trailer",
        type="Trailer" if "teaser" not in _normalized(selected.get("title")) else "Teaser",
    )


def get_movie_trailer(movie_title: str, release_year: int | None, tmdb_videos: list[dict[str, Any]]) -> TrailerResult | None:
    tmdb_trailer = _pick_tmdb_trailer(tmdb_videos)
    if tmdb_trailer:
        return tmdb_trailer
    return _pick_youtube_trailer(movie_title, release_year)


def getMovieTrailer(movie: dict[str, Any], tmdb_videos: list[dict[str, Any]]) -> TrailerResult | None:
    return get_movie_trailer(
        movie_title=str(movie.get("title") or ""),
        release_year=movie.get("year"),
        tmdb_videos=tmdb_videos,
    )
