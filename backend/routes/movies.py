from time import monotonic
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, desc, func, or_, select
from sqlalchemy.orm import Session

from database import get_db
from models.movie import Movie
from schemas.movie import MovieDetailOut, MovieOut, TmdbVideoOut
from services.seed_service import enrich_movie_assets, upsert_tmdb_movie
from services.trailer_service import get_movie_trailer
from services.tmdb_service import TmdbService


router = APIRouter(prefix="/movies", tags=["movies"])
tmdb_service = TmdbService()
HOME_TRENDING_CACHE_TTL_SECONDS = 60 * 20
_home_trending_cache: dict[str, Any] = {
    "expires_at": 0.0,
    "movies": [],
}


def parse_year(release_date: str | None) -> int | None:
    value = str(release_date or "")
    return int(value[:4]) if len(value) >= 4 and value[:4].isdigit() else None


def image_url(path: str | None, size: str = "w500") -> str | None:
    return tmdb_service.image_url(path, size=size)


def build_tmdb_video(payload: dict[str, Any], source: str = "tmdb") -> dict[str, str]:
    return {
        "key": payload.get("key") or "",
        "name": payload.get("name") or "Trailer",
        "site": payload.get("site") or "",
        "type": payload.get("type") or "",
        "source": source,
    }


TRAILER_BLOCKLIST = {
    "song",
    "songs",
    "promo",
    "promotional",
    "teaser",
    "clip",
    "scene",
    "making",
    "featurette",
    "behind",
    "bts",
    "lyrical",
    "jukebox",
    "music",
    "announcement",
    "motion poster",
}


def is_clean_trailer(video: dict[str, Any]) -> bool:
    if video.get("site") != "YouTube" or not video.get("key"):
        return False
    if video.get("type") not in {"Trailer", "Teaser"}:
        return False
    name = str(video.get("name") or "").lower()
    return not any(term in name for term in TRAILER_BLOCKLIST)


def build_movie_detail(movie: Movie, payload: dict[str, Any] | None) -> dict[str, Any]:
    if not payload:
        return {
            "movie": movie,
            "runtime": None,
            "release_date": None,
            "imdb_id": None,
            "imdb_rating": movie.avg_rating,
            "tmdb_rating": None,
            "tmdb_vote_count": None,
            "trailer": None,
            "videos": [],
            "cast": [],
            "directors": [name.strip() for name in (movie.directors or "").split(",") if name.strip()],
            "providers": [],
            "similar": [],
        }

    videos_payload = (payload.get("videos") or {}).get("results") or []
    videos = [build_tmdb_video(video) for video in videos_payload if is_clean_trailer(video)]
    trailer = get_movie_trailer(movie.title, movie.year or parse_year(payload.get("release_date")), videos_payload)

    credits = payload.get("credits") or {}
    cast = [
        {
            "id": int(person.get("id")),
            "name": person.get("name") or "",
            "character": person.get("character") or None,
            "profile_url": image_url(person.get("profile_path"), "w185"),
        }
        for person in (credits.get("cast") or [])[:12]
        if person.get("id") and person.get("name")
    ]
    directors = [
        person.get("name")
        for person in credits.get("crew") or []
        if person.get("job") == "Director" and person.get("name")
    ]

    provider_results = (payload.get("watch/providers") or {}).get("results") or {}
    region_payload = provider_results.get("IN") or provider_results.get("US") or {}
    provider_items = []
    seen_provider_ids: set[int] = set()
    for section in ("flatrate", "rent", "buy"):
        for provider in region_payload.get(section) or []:
            provider_id = provider.get("provider_id")
            if not provider_id or provider_id in seen_provider_ids:
                continue
            seen_provider_ids.add(provider_id)
            provider_items.append(
                {
                    "provider_id": int(provider_id),
                    "provider_name": provider.get("provider_name") or "Provider",
                    "logo_url": image_url(provider.get("logo_path"), "w92"),
                }
            )

    similar = [
        {
            "tmdb_id": int(item.get("id")),
            "title": item.get("title") or item.get("name") or "Untitled",
            "year": parse_year(item.get("release_date")),
            "overview": item.get("overview") or None,
            "poster_url": image_url(item.get("poster_path")),
            "backdrop_url": image_url(item.get("backdrop_path")),
            "vote_average": float(item["vote_average"]) if item.get("vote_average") is not None else None,
        }
        for item in ((payload.get("similar") or {}).get("results") or [])[:12]
        if item.get("id") and (item.get("title") or item.get("name"))
    ]

    if payload.get("overview"):
        movie.overview = payload.get("overview")
    if payload.get("runtime"):
        movie.genres = " ".join(genre.get("name", "") for genre in payload.get("genres") or [] if genre.get("name")) or movie.genres
    movie.backdrop_url = image_url(payload.get("backdrop_path")) or movie.backdrop_url
    movie.poster_url = image_url(payload.get("poster_path")) or movie.poster_url

    return {
        "movie": movie,
        "runtime": payload.get("runtime"),
        "release_date": payload.get("release_date") or None,
        "imdb_id": payload.get("imdb_id") or None,
        "imdb_rating": movie.avg_rating,
        "tmdb_rating": float(payload["vote_average"]) if payload.get("vote_average") is not None else None,
        "tmdb_vote_count": int(payload["vote_count"]) if payload.get("vote_count") is not None else None,
        "trailer": trailer.as_payload() if trailer else None,
        "videos": videos[:6],
        "cast": cast,
        "directors": directors or [name.strip() for name in (movie.directors or "").split(",") if name.strip()],
        "providers": provider_items[:10],
        "similar": similar,
    }


def order_movies_for_display(stmt, limit: int):
    return stmt.order_by(
        case((Movie.poster_url.like("data:image/svg+xml%"), 1), else_=0),
        desc(func.coalesce(Movie.rating_count, 0)),
        desc(func.coalesce(Movie.avg_rating, 0)),
        Movie.title.asc(),
    ).limit(limit)


def has_real_poster(movie: Movie) -> bool:
    return bool(movie.poster_url) and not movie.poster_url.startswith("data:image/svg+xml")


def merge_unique_movies(*groups: list[Movie], limit: int) -> list[Movie]:
    movies: list[Movie] = []
    seen: set[int] = set()
    max_length = max((len(group) for group in groups), default=0)
    for index in range(max_length):
        for group in groups:
            if index >= len(group):
                continue
            movie = group[index]
            if movie.id in seen:
                continue
            seen.add(movie.id)
            movies.append(movie)
            if len(movies) >= limit:
                return movies
    return movies


def _get_cached_home_trending(limit: int) -> list[Movie] | None:
    cached_movies = _home_trending_cache.get("movies") or []
    expires_at = float(_home_trending_cache.get("expires_at") or 0.0)
    if monotonic() >= expires_at or not cached_movies:
        return None
    return cached_movies[:limit]


def _set_cached_home_trending(movies: list[Movie]) -> None:
    _home_trending_cache["movies"] = list(movies)
    _home_trending_cache["expires_at"] = monotonic() + HOME_TRENDING_CACHE_TTL_SECONDS


@router.get("", response_model=list[MovieOut])
def list_movies(
    search: str | None = Query(default=None),
    limit: int = Query(default=24, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[Movie]:
    stmt = select(Movie)
    if search:
        pattern = f"%{search.strip()}%"
        normalized_search = search.strip().lower()
        stmt = stmt.where(
            or_(
                Movie.title.ilike(pattern),
                Movie.genres.ilike(pattern),
                Movie.directors.ilike(pattern),
                Movie.tags.ilike(pattern),
            )
        )
        stmt = stmt.order_by(
            case((func.lower(Movie.title) == normalized_search, 0), else_=1),
            case((Movie.poster_url.like("data:image/svg+xml%"), 1), else_=0),
            desc(func.coalesce(Movie.rating_count, 0)),
            desc(func.coalesce(Movie.avg_rating, 0)),
            Movie.title.asc(),
        ).limit(limit)
    else:
        stmt = order_movies_for_display(stmt, limit)
    movies = db.scalars(stmt).all()
    if search:
        updated = False
        if len(search.strip()) >= 3 and tmdb_service.is_enabled():
            for movie in movies[: min(6, limit)]:
                has_genres = bool(movie.genres and movie.genres.strip() and movie.genres.strip().lower() != "nan")
                if has_real_poster(movie) and movie.overview and has_genres:
                    continue
                if enrich_movie_assets(movie):
                    updated = True

            real_poster_count = sum(1 for movie in movies if has_real_poster(movie))
            if real_poster_count < min(6, limit):
                existing_tmdb_ids = {movie.tmdb_id for movie in movies if movie.tmdb_id}
                tmdb_matches = tmdb_service.search_movies(search.strip(), limit=min(8, limit))
                for match in tmdb_matches:
                    if match.tmdb_id in existing_tmdb_ids:
                        continue
                    movie = upsert_tmdb_movie(db, match)
                    movies.append(movie)
                    existing_tmdb_ids.add(match.tmdb_id)
                    updated = True
                    if sum(1 for item in movies if has_real_poster(item)) >= min(6, limit):
                        break

        if updated:
            db.commit()

        normalized_search = search.strip().lower()
        movies.sort(
            key=lambda movie: (
                0 if movie.title.lower() == normalized_search else 1,
                0 if normalized_search in movie.title.lower() else 1,
                1 if (movie.poster_url or "").startswith("data:image/svg+xml") else 0,
                -(movie.rating_count or 0),
                -(movie.avg_rating or 0),
                movie.title.lower(),
            )
        )
    return movies[:limit]


@router.get("/trending", response_model=list[MovieOut])
def trending_movies(limit: int = Query(default=12, ge=1, le=30), db: Session = Depends(get_db)) -> list[Movie]:
    stmt = (
        select(Movie)
        .where(
            Movie.genres.is_not(None),
            ~Movie.genres.ilike("%Documentary%"),
        )
    )
    results = db.scalars(order_movies_for_display(stmt, limit)).all()
    if not results:
        results = db.scalars(order_movies_for_display(select(Movie), limit)).all()

    return results


@router.get("/bollywood", response_model=list[MovieOut])
def bollywood_movies(
    limit: int = Query(default=12, ge=1, le=30),
    db: Session = Depends(get_db),
) -> list[Movie]:
    stmt = select(Movie).where(
        or_(
            Movie.tags.ilike("%bollywood%"),
            Movie.tags.ilike("%hindi%"),
            Movie.tags.ilike("%indian cinema%"),
            Movie.genres.ilike("%bollywood%"),
        )
    )
    movies = db.scalars(order_movies_for_display(stmt, limit)).all()
    if len(movies) >= limit or not tmdb_service.is_enabled():
        return movies[:limit]

    matches = tmdb_service.discover_bollywood_movies(limit=limit - len(movies))
    existing_tmdb_ids = {movie.tmdb_id for movie in movies if movie.tmdb_id}
    for match in matches:
        if match.tmdb_id in existing_tmdb_ids:
            continue
        movies.append(upsert_tmdb_movie(db, match))
        existing_tmdb_ids.add(match.tmdb_id)
        if len(movies) >= limit:
            break
    db.commit()
    return movies[:limit]


@router.get("/home-trending", response_model=list[MovieOut])
def home_trending_movies(
    limit: int = Query(default=12, ge=1, le=30),
    db: Session = Depends(get_db),
) -> list[Movie]:
    cached_movies = _get_cached_home_trending(limit)
    if cached_movies is not None:
        return cached_movies

    if tmdb_service.is_enabled():
        bollywood_matches = tmdb_service.discover_popular_movies(
            language="hi",
            region="IN",
            limit=max(6, limit // 2),
            release_date_gte="2023-01-01",
            hydrate_details=False,
        )
        hollywood_matches = tmdb_service.discover_popular_movies(
            language="en",
            region="US",
            limit=max(6, limit // 2),
            release_date_gte="2024-01-01",
            hydrate_details=False,
        )
        bollywood_movies_list = [upsert_tmdb_movie(db, match) for match in bollywood_matches]
        hollywood_movies_list = [upsert_tmdb_movie(db, match) for match in hollywood_matches]
        db.commit()
        fresh_mix = merge_unique_movies(bollywood_movies_list, hollywood_movies_list, limit=limit)
        if fresh_mix:
            _set_cached_home_trending(fresh_mix)
            return fresh_mix

    bollywood_fallback = db.scalars(
        order_movies_for_display(
            select(Movie).where(
                or_(
                    Movie.tags.ilike("%bollywood%"),
                    Movie.tags.ilike("%hindi%"),
                    Movie.tags.ilike("%indian cinema%"),
                )
            ),
            limit,
        )
    ).all()
    hollywood_fallback = db.scalars(
        order_movies_for_display(
            select(Movie).where(
                Movie.tags.is_not(None),
                ~Movie.tags.ilike("%bollywood%"),
                ~Movie.tags.ilike("%hindi%"),
                ~Movie.tags.ilike("%indian cinema%"),
            ),
            limit,
        )
    ).all()
    fallback_mix = merge_unique_movies(bollywood_fallback, hollywood_fallback, limit=limit)
    if fallback_mix:
        _set_cached_home_trending(fallback_mix)
    return fallback_mix


@router.get("/{movie_id}/detail", response_model=MovieDetailOut)
def movie_detail(movie_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    movie = db.get(Movie, movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    payload = tmdb_service.get_movie_detail_payload(movie.tmdb_id) if movie.tmdb_id and tmdb_service.is_enabled() else None
    return build_movie_detail(movie, payload)


@router.get("/{movie_id}/trailer", response_model=TmdbVideoOut | None)
def movie_trailer(movie_id: int, db: Session = Depends(get_db)) -> dict[str, str] | None:
    movie = db.get(Movie, movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    payload = tmdb_service.get_movie_detail_payload(movie.tmdb_id) if movie.tmdb_id and tmdb_service.is_enabled() else None
    videos_payload = (payload or {}).get("videos", {}).get("results") or []
    release_year = movie.year or parse_year((payload or {}).get("release_date"))
    trailer = get_movie_trailer(movie.title, release_year, videos_payload)
    return trailer.as_payload() if trailer else None
