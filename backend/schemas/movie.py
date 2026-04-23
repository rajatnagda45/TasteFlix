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


class TmdbVideoOut(BaseModel):
    key: str
    name: str
    site: str
    type: str
    source: str = "tmdb"


class TmdbCastOut(BaseModel):
    id: int
    name: str
    character: str | None = None
    profile_url: str | None = None


class TmdbProviderOut(BaseModel):
    provider_id: int
    provider_name: str
    logo_url: str | None = None


class TmdbSimilarMovieOut(BaseModel):
    tmdb_id: int
    title: str
    year: int | None = None
    overview: str | None = None
    poster_url: str | None = None
    backdrop_url: str | None = None
    vote_average: float | None = None


class MovieDetailOut(BaseModel):
    movie: MovieOut
    runtime: int | None = None
    release_date: str | None = None
    imdb_id: str | None = None
    imdb_rating: float | None = None
    tmdb_rating: float | None = None
    tmdb_vote_count: int | None = None
    trailer: TmdbVideoOut | None = None
    videos: list[TmdbVideoOut] = []
    cast: list[TmdbCastOut] = []
    directors: list[str] = []
    providers: list[TmdbProviderOut] = []
    similar: list[TmdbSimilarMovieOut] = []
