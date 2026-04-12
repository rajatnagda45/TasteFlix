import pandas as pd
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from core.config import get_settings
from models.movie import Movie
from services.poster_service import build_poster_data_uri
from services.tmdb_service import TmdbService
from services.unsplash_service import UnsplashService


settings = get_settings()
tmdb_service = TmdbService()
unsplash_service = UnsplashService()
TMDB_SOURCE_OFFSET = 2_000_000_000
INDIAN_LANGUAGE_CODES = {"hi", "ta", "te", "ml", "mr", "pa", "kn", "bn", "gu"}


def parse_int(value) -> int | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        return int(float(text))
    except ValueError:
        return None


def parse_float(value) -> float | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def seed_movies(db: Session) -> None:
    existing = db.scalar(select(Movie.id).limit(1))
    if existing:
        return

    frame = pd.read_csv(settings.metadata_csv_path)
    records = []
    for row in frame.fillna("").to_dict(orient="records"):
        year = parse_int(row.get("year"))
        tmdb_id = parse_int(row.get("tmdb_id"))
        avg_rating = parse_float(row.get("avg_rating"))
        rating_count = parse_int(row.get("rating_count"))
        records.append(
            Movie(
                source_movie_id=int(row["movie_id"]),
                title=str(row["title"]).strip().title(),
                year=year,
                tmdb_id=tmdb_id,
                directors=str(row.get("directors", "")).strip() or None,
                actors=str(row.get("actors", "")).strip() or None,
                genres=str(row.get("genres", "")).strip() or None,
                tags=str(row.get("tags", "")).strip() or None,
                avg_rating=avg_rating,
                rating_count=rating_count,
                overview=None,
                poster_url=build_poster_data_uri(str(row["title"]).strip(), year),
                backdrop_url=None,
            )
        )
    db.bulk_save_objects(records)
    db.commit()


def build_unsplash_query(movie: Movie) -> str:
    terms = [movie.title]
    if movie.year:
        terms.append(str(movie.year))
    if movie.genres:
        terms.append(movie.genres.split()[0])
    terms.append("cinema poster")
    return " ".join(term for term in terms if term)


def upsert_tmdb_movie(db: Session, match) -> Movie:
    tags = "bollywood indian cinema hindi" if match.original_language in INDIAN_LANGUAGE_CODES else "tmdb search"
    source_movie_id = TMDB_SOURCE_OFFSET + match.tmdb_id
    movie = db.scalar(
        select(Movie).where(
            or_(
                Movie.tmdb_id == match.tmdb_id,
                Movie.source_movie_id == source_movie_id,
            )
        )
    )
    if not movie:
        movie = Movie(
            source_movie_id=source_movie_id,
            title=match.title or "Untitled",
            year=match.year,
            tmdb_id=match.tmdb_id,
            directors=None,
            actors=None,
            genres=match.genres,
            tags=tags,
            avg_rating=(match.vote_average / 2) if match.vote_average is not None else None,
            rating_count=match.vote_count,
            overview=match.overview,
            poster_url=match.poster_url or build_poster_data_uri(match.title or "Untitled", match.year),
            backdrop_url=match.backdrop_url,
        )
        db.add(movie)
        db.flush()
        return movie

    movie.title = match.title or movie.title
    movie.year = match.year or movie.year
    movie.tmdb_id = match.tmdb_id
    movie.genres = match.genres or movie.genres
    movie.tags = tags
    movie.avg_rating = (match.vote_average / 2) if match.vote_average is not None else movie.avg_rating
    movie.rating_count = match.vote_count or movie.rating_count
    movie.overview = match.overview or movie.overview
    movie.poster_url = match.poster_url or movie.poster_url
    movie.backdrop_url = match.backdrop_url or movie.backdrop_url
    return movie


def enrich_movie_assets(movie: Movie, force: bool = False) -> bool:
    if not tmdb_service.is_enabled() and not unsplash_service.is_enabled():
        return False

    has_real_poster = bool(movie.poster_url) and not movie.poster_url.startswith("data:image/svg+xml")
    if has_real_poster and movie.overview and movie.backdrop_url and not force:
        return False

    updated = False
    match = None
    if tmdb_service.is_enabled():
        if movie.tmdb_id:
            match = tmdb_service.get_movie(movie.tmdb_id)
        if not match:
            match = tmdb_service.search_movie(movie.title, movie.year)

    if match:
        movie.tmdb_id = match.tmdb_id
        movie.title = match.title or movie.title
        movie.year = match.year or movie.year
        movie.genres = match.genres or movie.genres
        movie.avg_rating = (match.vote_average / 2) if match.vote_average is not None else movie.avg_rating
        movie.rating_count = match.vote_count or movie.rating_count
        movie.overview = match.overview or movie.overview
        movie.poster_url = match.poster_url or movie.poster_url
        movie.backdrop_url = match.backdrop_url or movie.backdrop_url
        updated = True

    if (not movie.poster_url or movie.poster_url.startswith("data:image/svg+xml")) and unsplash_service.is_enabled():
        unsplash_url = unsplash_service.search_photo(build_unsplash_query(movie))
        if unsplash_url:
            movie.poster_url = unsplash_url
            updated = True

    if not movie.poster_url:
        movie.poster_url = build_poster_data_uri(movie.title, movie.year)
        updated = True

    return updated


def enrich_movies_with_tmdb(db: Session, limit: int = 100, force: bool = False) -> int:
    if not tmdb_service.is_enabled() and not unsplash_service.is_enabled():
        return 0

    stmt = select(Movie).order_by(Movie.id.asc())
    if not force:
        stmt = stmt.where(
            or_(
                Movie.poster_url.is_(None),
                Movie.poster_url.like("data:image/svg+xml%"),
                Movie.overview.is_(None),
                Movie.backdrop_url.is_(None),
            )
        )

    movies = db.scalars(stmt.limit(limit)).all()
    updated = 0

    for movie in movies:
        if enrich_movie_assets(movie, force=force):
            updated += 1

    if updated:
        db.commit()

    return updated
