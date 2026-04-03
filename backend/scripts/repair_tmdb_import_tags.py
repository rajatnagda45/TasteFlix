from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from database import SessionLocal
from models.movie import Movie
from services.seed_service import TMDB_SOURCE_OFFSET, upsert_tmdb_movie
from services.tmdb_service import TmdbService


def main() -> None:
    tmdb_service = TmdbService()
    if not tmdb_service.is_enabled():
        print("TMDB is not enabled.")
        return

    with SessionLocal() as db:
        movies = db.scalars(select(Movie).where(Movie.source_movie_id >= TMDB_SOURCE_OFFSET)).all()
        updated = 0
        for movie in movies:
            if not movie.tmdb_id:
                continue
            match = tmdb_service.get_movie(movie.tmdb_id)
            if not match:
                continue
            upsert_tmdb_movie(db, match)
            updated += 1
        db.commit()
        print(f"Updated {updated} TMDB-imported movies.")


if __name__ == "__main__":
    main()
