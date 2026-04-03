from pydantic import BaseModel


class MovieOut(BaseModel):
    id: int
    source_movie_id: int
    title: str
    year: int | None
    tmdb_id: int | None
    directors: str | None
    actors: str | None
    genres: str | None
    tags: str | None
    avg_rating: float | None
    rating_count: int | None
    overview: str | None
    poster_url: str | None
    backdrop_url: str | None

    model_config = {"from_attributes": True}
