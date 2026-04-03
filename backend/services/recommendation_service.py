from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.movie import Movie, RecommendationHistory
from models.user import Rating
from schemas.recommend import (
    FeedbackRequest,
    FeedbackResponse,
    RecommendationOut,
    RecommendationResponse,
    SelectedMovieInput,
    TasteProfileItem,
)
from services.seed_service import enrich_movie_assets


class RecommendationService:
    def __init__(self, recommender) -> None:
        self.recommender = recommender

    def store_ratings(self, db: Session, user_id: int, selected_movies: list[SelectedMovieInput]) -> None:
        for selected in selected_movies:
            existing = db.scalar(
                select(Rating).where(Rating.user_id == user_id, Rating.movie_id == selected.movie_id)
            )
            if existing:
                existing.rating = selected.rating
            else:
                db.add(Rating(user_id=user_id, movie_id=selected.movie_id, rating=selected.rating))
        db.commit()

    def get_recommendations(
        self,
        db: Session,
        top_n: int,
        user_id: int | None,
        selected_movies: list[SelectedMovieInput],
    ) -> RecommendationResponse:
        if user_id and selected_movies:
            self.store_ratings(db, user_id, selected_movies)

        scores = self.recommender.recommend(
            db=db,
            top_n=top_n,
            user_id=user_id,
            selected_movie_ids=[movie.movie_id for movie in selected_movies],
        )

        recommendation_items: list[RecommendationOut] = []
        for score in scores:
            movie = db.scalar(select(Movie).where(Movie.id == score.movie_id))
            if not movie:
                continue
            enrich_movie_assets(movie)
            recommendation_items.append(
                RecommendationOut(
                    movie=movie,
                    predicted_rating=round(2.5 + (score.score * 2.5), 2),
                    explanation=score.explanation,
                    confidence=round(score.confidence, 2),
                    because_you_liked=score.because_you_liked,
                    why_recommended=score.why_recommended,
                    similarity_score=score.similarity_score,
                    genre_match_percent=score.genre_match_percent,
                    similar_users_rating=score.similar_users_rating,
                )
            )
            if user_id:
                db.add(
                    RecommendationHistory(
                        user_id=user_id,
                        movie_id=movie.id,
                        score=score.score,
                        explanation=score.explanation,
                    )
                )

        db.commit()
        return RecommendationResponse(
            recommendations=recommendation_items,
            taste_profile=self.build_taste_profile(db, selected_movies),
            generated_at=datetime.utcnow(),
        )

    def build_taste_profile(self, db: Session, selected_movies: list[SelectedMovieInput]) -> list[TasteProfileItem]:
        if not selected_movies:
            return []

        genre_weights: dict[str, float] = {}
        total = 0.0
        movie_ids = [item.movie_id for item in selected_movies]
        movies = db.scalars(select(Movie).where(Movie.id.in_(movie_ids))).all()
        movies_by_id = {movie.id: movie for movie in movies}
        for item in selected_movies:
            movie = movies_by_id.get(item.movie_id)
            if not movie:
                continue
            genres = [genre.strip() for genre in (movie.genres or "").split() if genre.strip()]
            if not genres:
                continue
            weight = item.rating
            share = weight / len(genres)
            total += weight
            for genre in genres:
                genre_weights[genre] = genre_weights.get(genre, 0.0) + share

        if total <= 0:
            return []

        ranked = sorted(genre_weights.items(), key=lambda item: item[1], reverse=True)[:3]
        return [
            TasteProfileItem(genre=genre, percent=max(1, min(100, int(round((value / total) * 100)))))
            for genre, value in ranked
        ]

    def store_feedback(self, db: Session, user_id: int, payload: FeedbackRequest) -> FeedbackResponse:
        rating_value = 5.0 if payload.sentiment == "like" else 0.5
        existing = db.scalar(select(Rating).where(Rating.user_id == user_id, Rating.movie_id == payload.movie_id))
        if existing:
            existing.rating = rating_value
        else:
            db.add(Rating(user_id=user_id, movie_id=payload.movie_id, rating=rating_value))
        db.commit()
        return FeedbackResponse(movie_id=payload.movie_id, sentiment=payload.sentiment)

    def get_similar_movies(self, db: Session, movie_id: int, limit: int) -> list[Movie]:
        movies = self.recommender.similar_movies(db, movie_id=movie_id, limit=limit)
        updated = False
        for movie in movies:
            if enrich_movie_assets(movie):
                updated = True
        if updated:
            db.commit()
        return movies
