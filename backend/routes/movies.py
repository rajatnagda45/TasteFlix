from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, desc, func, or_, select
from sqlalchemy.orm import Session

from database import get_db
from models.movie import Movie
from schemas.movie import MovieOut
from services.seed_service import enrich_movie_assets, upsert_tmdb_movie
from services.tmdb_service import TmdbService


router = APIRouter(prefix="/movies", tags=["movies"])
tmdb_service = TmdbService()


def order_movies_for_display(stmt, limit: int):
    return stmt.order_by(
        case((Movie.poster_url.like("data:image/svg+xml%"), 1), else_=0),
        desc(func.coalesce(Movie.rating_count, 0)),
        desc(func.coalesce(Movie.avg_rating, 0)),
        Movie.title.asc(),
    ).limit(limit)


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
    if search and len(movies) < min(limit, 8) and tmdb_service.is_enabled():
        existing_tmdb_ids = {movie.tmdb_id for movie in movies if movie.tmdb_id}
        tmdb_matches = tmdb_service.search_movies(search.strip(), limit=limit)
        updated = False
        for match in tmdb_matches:
            if match.tmdb_id in existing_tmdb_ids:
                continue
            movie = upsert_tmdb_movie(db, match)
            movies.append(movie)
            existing_tmdb_ids.add(match.tmdb_id)
            updated = True
            if len(movies) >= limit:
                break
        if updated:
            db.commit()

    updated = False
    for movie in movies:
        if enrich_movie_assets(movie):
            updated = True
    if updated:
        db.commit()
    if search:
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

    updated = False
    for movie in results:
        if enrich_movie_assets(movie):
            updated = True
    if updated:
        db.commit()

    return results


@router.get("/bollywood", response_model=list[MovieOut])
def bollywood_movies(limit: int = Query(default=12, ge=1, le=30)) -> list[dict]:
    matches = tmdb_service.discover_bollywood_movies(limit=limit)
    movies: list[dict] = []
    for match in matches:
        movies.append(
            {
                "id": 1_000_000_000 + match.tmdb_id,
                "source_movie_id": match.tmdb_id,
                "title": match.title or "Untitled",
                "year": match.year,
                "tmdb_id": match.tmdb_id,
                "directors": None,
                "actors": None,
                "genres": match.genres,
                "tags": "bollywood indian cinema hindi",
                "avg_rating": (match.vote_average / 2) if match.vote_average is not None else None,
                "rating_count": match.vote_count,
                "overview": match.overview,
                "poster_url": match.poster_url,
                "backdrop_url": match.backdrop_url,
            }
        )
    return movies
