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


def has_real_poster(movie: Movie) -> bool:
    return bool(movie.poster_url) and not movie.poster_url.startswith("data:image/svg+xml")


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
                if has_real_poster(movie) and movie.overview:
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
