from datetime import datetime

from pydantic import BaseModel, Field

from schemas.movie import MovieOut


class SelectedMovieInput(BaseModel):
    movie_id: int
    rating: float = Field(default=5.0, ge=0.5, le=5.0)


class RecommendRequest(BaseModel):
    user_id: int | None = None
    selected_movies: list[SelectedMovieInput] = Field(default_factory=list)
    top_n: int = Field(default=12, ge=1, le=30)


class RecommendationOut(BaseModel):
    movie: MovieOut
    predicted_rating: float
    explanation: str
    confidence: float
    because_you_liked: list[str]
    why_recommended: list[str]
    similarity_score: float
    genre_match_percent: int
    similar_users_rating: float | None


class TasteProfileItem(BaseModel):
    genre: str
    percent: int


class RecommendationResponse(BaseModel):
    recommendations: list[RecommendationOut]
    taste_profile: list[TasteProfileItem]
    generated_at: datetime


class HistoryItem(BaseModel):
    id: int
    movie: MovieOut
    score: float
    explanation: str
    created_at: datetime

    model_config = {"from_attributes": True}


class FeedbackRequest(BaseModel):
    movie_id: int
    sentiment: str = Field(pattern="^(like|dislike)$")


class FeedbackResponse(BaseModel):
    success: bool = True
    movie_id: int
    sentiment: str
