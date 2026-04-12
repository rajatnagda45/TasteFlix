from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import pickle
import re
from typing import Any

import numpy as np
import pandas as pd
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from core.config import get_settings
from models.movie import Movie
from models.user import Rating


settings = get_settings()
TOKEN_PATTERN = re.compile(r"[a-z0-9']+")
INDIAN_CINEMA_TERMS = {
    "india",
    "bollywood",
    "hindi",
    "tamil",
    "telugu",
    "malayalam",
    "marathi",
    "punjabi",
    "kollywood",
    "tollywood",
    "sandalwood",
}
GENRE_HINTS = {
    "action": {"action", "fight", "fighting", "shooter", "lethal", "bloody", "ruthless", "mission", "army", "military"},
    "crime": {"crime", "gang", "gangs", "gangster", "underworld", "mafia", "corrupt", "corruption", "police", "cop", "murder"},
    "thriller": {"thriller", "mysterious", "mystery", "spy", "espionage", "terror", "terrorist", "conspiracy", "revenge"},
    "war": {"war", "soldier", "army", "military", "patriot", "country", "border"},
    "romance": {"romance", "love", "wedding", "bride"},
    "comedy": {"comedy", "funny", "comic"},
    "historical": {"historical", "history", "period"},
}
ACTION_CLUSTER = {"action", "crime", "thriller", "war"}
INVALID_GENRE_TOKENS = {"nan", "none", "unknown", "genre", "unavailable"}


@dataclass
class RecommendationScore:
    movie_id: int
    score: float
    confidence: float
    explanation: str
    because_you_liked: list[str]
    why_recommended: list[str]
    similarity_score: float
    genre_match_percent: int
    similar_users_rating: float | None


class HybridRecommender:
    def __init__(self, metadata_csv_path: str, artifact_path: str) -> None:
        self.metadata_csv_path = metadata_csv_path
        self.artifact_path = Path(artifact_path)
        self.movies_frame = pd.DataFrame()
        self.vectorizer = TfidfVectorizer(stop_words="english", max_features=10_000)
        self.feature_matrix: Any = None
        self.similarity_matrix: np.ndarray | None = None
        self.id_lookup: dict[int, int] = {}

    def fit(self) -> None:
        frame = pd.read_csv(self.metadata_csv_path).fillna("")
        frame["title"] = frame["title"].astype(str).str.title()
        frame["features"] = (
            frame["title"].astype(str)
            + " "
            + frame["genres"].astype(str)
            + " "
            + frame["directors"].astype(str)
            + " "
            + frame["actors"].astype(str)
            + " "
            + frame.get("tags", pd.Series("", index=frame.index)).astype(str)
        )
        self.movies_frame = frame
        self.feature_matrix = self.vectorizer.fit_transform(frame["features"])
        self.similarity_matrix = cosine_similarity(self.feature_matrix)
        self.id_lookup = {int(movie_id): idx for idx, movie_id in enumerate(frame["movie_id"].tolist())}

    def save(self) -> None:
        self.artifact_path.parent.mkdir(parents=True, exist_ok=True)
        with self.artifact_path.open("wb") as handle:
            pickle.dump(self, handle)

    @classmethod
    def load_or_train(cls) -> "HybridRecommender":
        artifact = Path(settings.model_artifact_path)
        if artifact.exists():
            with artifact.open("rb") as handle:
                return pickle.load(handle)
        model = cls(settings.metadata_csv_path, settings.model_artifact_path)
        model.fit()
        model.save()
        return model

    def retrain(self) -> None:
        self.fit()
        self.save()

    def _content_scores(self, selected_movie_ids: list[int]) -> dict[int, float]:
        if not selected_movie_ids or self.similarity_matrix is None:
            return {}
        indices = [self.id_lookup[movie_id] for movie_id in selected_movie_ids if movie_id in self.id_lookup]
        if not indices:
            return {}
        scores = self.similarity_matrix[indices].mean(axis=0)
        content_scores = {
            int(self.movies_frame.iloc[idx]["movie_id"]): float(score)
            for idx, score in enumerate(scores)
            if int(self.movies_frame.iloc[idx]["movie_id"]) not in selected_movie_ids
        }
        return content_scores

    def _tokenize_text(self, value: str | None) -> set[str]:
        if not value:
            return set()
        return {token for token in TOKEN_PATTERN.findall(value.lower()) if len(token) > 1}

    def _movie_tokens(self, movie: Movie) -> set[str]:
        tokens = set()
        tokens.update(self._tokenize_text(movie.title))
        tokens.update(self._tokenize_text(movie.genres))
        tokens.update(self._tokenize_text(movie.tags))
        tokens.update(self._tokenize_text(movie.overview))
        return tokens

    def _genre_tokens(self, movie: Movie) -> set[str]:
        genres = {
            token
            for token in self._tokenize_text(movie.genres)
            if token not in INVALID_GENRE_TOKENS
        }
        evidence_tokens = self._movie_tokens(movie)
        for genre, hints in GENRE_HINTS.items():
            if evidence_tokens.intersection(hints):
                genres.add(genre)
        return genres

    def _selected_genre_tokens(self, selected_movies: list[Movie]) -> set[str]:
        selected_genres: set[str] = set()
        for selected in selected_movies:
            selected_genres.update(self._genre_tokens(selected))
        return selected_genres

    def _max_selected_year(self, selected_movies: list[Movie]) -> int | None:
        years = [movie.year for movie in selected_movies if movie.year]
        return max(years) if years else None

    def _year_affinity(self, movie: Movie, selected_movies: list[Movie]) -> float:
        selected_year = self._max_selected_year(selected_movies)
        if not selected_year or not movie.year:
            return 0.7
        year_gap = abs(selected_year - movie.year)
        if selected_year >= 2020:
            if movie.year < selected_year - 12:
                return 0.05
            if movie.year < selected_year - 8:
                return 0.35
        if year_gap <= 3:
            return 1.0
        if year_gap <= 8:
            return 0.85
        if year_gap <= 15:
            return 0.6
        return 0.25

    def _movie_profile_tokens(self, movie: Movie) -> set[str]:
        return self._movie_tokens(movie)

    def _token_overlap_score(self, left: set[str], right: set[str]) -> float:
        if not left or not right:
            return 0.0
        return len(left.intersection(right)) / max(1, len(left.union(right)))

    def _movie_indian_signal_tokens(self, movie: Movie) -> set[str]:
        tokens = set()
        tokens.update(self._tokenize_text(movie.tags))
        tokens.update(self._tokenize_text(movie.overview))
        return tokens

    def _indian_affinity(self, tokens: set[str]) -> float:
        matches = tokens.intersection(INDIAN_CINEMA_TERMS)
        if not matches:
            return 0.0
        return min(1.0, 0.4 + (0.15 * len(matches)))

    def _database_content_scores(self, db: Session, selected_movies: list[Movie]) -> dict[int, float]:
        if not selected_movies:
            return {}

        selected_ids = {movie.id for movie in selected_movies}
        selected_token_sets = [self._movie_profile_tokens(movie) for movie in selected_movies]
        combined_selected_tokens = set().union(*selected_token_sets) if selected_token_sets else set()
        selected_indian_affinity = self._indian_affinity(combined_selected_tokens)
        selected_genres = self._selected_genre_tokens(selected_movies)

        scores: dict[int, float] = {}
        candidate_movies = db.scalars(select(Movie)).all()
        for movie in candidate_movies:
            if movie.id in selected_ids:
                continue

            candidate_tokens = self._movie_profile_tokens(movie)
            if not candidate_tokens:
                continue

            overlap_scores: list[float] = []
            for selected_tokens in selected_token_sets:
                if not selected_tokens:
                    continue
                overlap = len(selected_tokens.intersection(candidate_tokens))
                denominator = max(1, len(selected_tokens.union(candidate_tokens)))
                overlap_scores.append(overlap / denominator)

            if not overlap_scores:
                continue

            score = max(overlap_scores)
            candidate_genres = self._genre_tokens(movie)
            if selected_genres and candidate_genres:
                genre_overlap = len(selected_genres.intersection(candidate_genres)) / max(1, len(selected_genres))
                score += 0.35 * genre_overlap
            elif selected_genres:
                score *= 0.45

            candidate_indian_affinity = self._indian_affinity(self._movie_indian_signal_tokens(movie))
            if selected_indian_affinity > 0 and candidate_indian_affinity > 0:
                score += 0.12 * min(selected_indian_affinity, candidate_indian_affinity)
            elif selected_indian_affinity > 0 and candidate_indian_affinity == 0:
                score *= 0.35

            score *= self._year_affinity(movie, selected_movies)
            scores[movie.id] = float(min(score, 1.0))
        return scores

    def _collaborative_scores(self, db: Session, user_id: int) -> dict[int, float]:
        ratings = db.execute(select(Rating.user_id, Rating.movie_id, Rating.rating)).all()
        if len(ratings) < 25:
            return {}

        frame = pd.DataFrame(ratings, columns=["user_id", "movie_id", "rating"])
        matrix = frame.pivot_table(index="user_id", columns="movie_id", values="rating", fill_value=0.0)
        if user_id not in matrix.index or matrix.shape[0] < 3 or matrix.shape[1] < 10:
            return {}

        n_components = max(2, min(20, min(matrix.shape) - 1))
        if n_components < 2:
            return {}

        svd = TruncatedSVD(n_components=n_components, random_state=42)
        latent = svd.fit_transform(matrix.values)
        reconstructed = latent @ svd.components_
        user_index = list(matrix.index).index(user_id)
        predictions = reconstructed[user_index]
        existing = set(frame.loc[frame["user_id"] == user_id, "movie_id"].tolist())

        scores: dict[int, float] = {}
        for movie_id, score in zip(matrix.columns.tolist(), predictions):
            if movie_id in existing:
                continue
            normalized = float(np.clip(score / 5.0, 0.0, 1.0))
            scores[int(movie_id)] = normalized
        return scores

    def _popularity_scores(self, db: Session) -> dict[int, float]:
        popularity: dict[int, float] = {}
        if not self.movies_frame.empty and {"movie_id", "avg_rating", "rating_count"}.issubset(self.movies_frame.columns):
            dataset_frame = self.movies_frame[["movie_id", "avg_rating", "rating_count"]].copy()
            dataset_frame["avg_rating"] = pd.to_numeric(dataset_frame["avg_rating"], errors="coerce").fillna(0.0)
            dataset_frame["rating_count"] = pd.to_numeric(dataset_frame["rating_count"], errors="coerce").fillna(0.0)
            for row in dataset_frame.itertuples(index=False):
                if row.avg_rating <= 0:
                    continue
                score = min((float(row.avg_rating) / 5.0) * (1 + np.log1p(float(row.rating_count)) / 8), 1.0)
                popularity[int(row.movie_id)] = float(score)

        stmt = (
            select(
                Rating.movie_id,
                func.avg(Rating.rating).label("avg_rating"),
                func.count(Rating.id).label("rating_count"),
            )
            .group_by(Rating.movie_id)
        )
        rows = db.execute(stmt).all()
        for movie_id, avg_rating, rating_count in rows:
            score = min((float(avg_rating) / 5.0) * (1 + np.log1p(rating_count) / 5), 1.0)
            popularity[int(movie_id)] = max(popularity.get(int(movie_id), 0.0), float(score))
        return popularity

    def _build_explanation(
        self,
        movie: Movie,
        selected_movies: list[Movie],
        collaborative_score: float,
        content_score: float,
    ) -> str:
        reasons: list[str] = []
        if selected_movies:
            selected_tokens = set().union(*(self._movie_tokens(selected) for selected in selected_movies))
            movie_tokens = self._movie_tokens(movie)
            if self._indian_affinity(selected_tokens) > 0 and self._indian_affinity(movie_tokens) > 0:
                reasons.append("keeps you in the lane of Indian and Bollywood cinema")

            selected_genres = self._selected_genre_tokens(selected_movies)
            movie_genres = self._genre_tokens(movie)
            overlap = sorted(selected_genres.intersection(movie_genres))[:2]
            if overlap:
                reasons.append(f"shares your taste for {' and '.join(overlap)} stories")

        if collaborative_score > 0.55:
            reasons.append("matches patterns from users with similar ratings")
        if content_score > 0.55 and movie.directors:
            reasons.append(f"aligns with the style of {movie.directors.split()[0]}")

        if not reasons:
            reasons.append("is a strong fit based on your recent movie selections")
        return "This was recommended because it " + ", ".join(reasons) + "."

    def _genre_match_percent(self, movie: Movie, selected_movies: list[Movie]) -> int:
        if not selected_movies:
            return 0
        selected_genres = self._selected_genre_tokens(selected_movies)
        movie_genres = self._genre_tokens(movie)
        if not selected_genres or not movie_genres:
            return 0
        overlap = len(selected_genres.intersection(movie_genres))
        if overlap <= 0:
            return 0
        return int(round((overlap / max(1, min(len(selected_genres), len(movie_genres)))) * 100))

    def _similar_users_rating(self, collaborative_score: float) -> float | None:
        if collaborative_score <= 0:
            return None
        return round(2.5 + (collaborative_score * 2.5), 1)

    def _because_you_liked(self, movie: Movie, selected_movies: list[Movie]) -> list[str]:
        if not selected_movies:
            return []

        movie_tokens = self._movie_profile_tokens(movie)
        ranked_matches: list[tuple[float, str]] = []
        for selected in selected_movies:
            overlap_score = self._token_overlap_score(movie_tokens, self._movie_profile_tokens(selected))
            if overlap_score <= 0:
                continue
            ranked_matches.append((overlap_score, selected.title))

        ranked_matches.sort(key=lambda item: item[0], reverse=True)
        liked_titles: list[str] = []
        for _, title in ranked_matches:
            if title not in liked_titles:
                liked_titles.append(title)
            if len(liked_titles) == 2:
                break
        return liked_titles

    def _display_confidence(self, content_score: float, collaborative_score: float, popularity_score: float) -> float:
        signal_strength = (0.5 * content_score) + (0.3 * collaborative_score) + (0.2 * popularity_score)
        if signal_strength <= 0:
            return 0.55
        return float(np.clip(0.55 + (0.4 * signal_strength), 0.55, 0.95))

    def _why_recommended(
        self,
        movie: Movie,
        selected_movies: list[Movie],
        collaborative_score: float,
        content_score: float,
    ) -> list[str]:
        reasons: list[str] = []
        genre_match = self._genre_match_percent(movie, selected_movies)
        if collaborative_score > 0.15:
            similar_users_rating = self._similar_users_rating(collaborative_score)
            if similar_users_rating is not None:
                reasons.append(f"Similar users rated it {similar_users_rating}/5")
        if genre_match > 0:
            reasons.append(f"Matches your genre preference ({genre_match}%)")
        elif collaborative_score > 0.15:
            reasons.append("Low genre match (0%), but similar user behavior strongly supports it")
        if content_score >= 0.25:
            reasons.append(f"High similarity score ({content_score:.2f})")
        elif genre_match > 0:
            reasons.append("Recommended because the genre signal is stronger than the title similarity")
        return reasons

    def recommend(
        self,
        db: Session,
        top_n: int,
        user_id: int | None = None,
        selected_movie_ids: list[int] | None = None,
    ) -> list[RecommendationScore]:
        selected_movie_ids = selected_movie_ids or []
        selected_movies = (
            db.scalars(select(Movie).where(Movie.id.in_(selected_movie_ids))).all() if selected_movie_ids else []
        )
        selected_profile_tokens = set().union(*(self._movie_profile_tokens(movie) for movie in selected_movies))
        selected_indian_affinity = self._indian_affinity(selected_profile_tokens)
        selected_genres = self._selected_genre_tokens(selected_movies)
        selected_action_genres = selected_genres.intersection(ACTION_CLUSTER)
        selected_year = self._max_selected_year(selected_movies)

        artifact_content_scores = self._content_scores([movie.source_movie_id for movie in selected_movies])
        db_content_scores = self._database_content_scores(db, selected_movies)
        collaborative_scores = self._collaborative_scores(db, user_id) if user_id else {}
        popularity_scores = self._popularity_scores(db)
        rated_movie_ids = set()
        if user_id:
            rated_movie_ids = set(db.scalars(select(Rating.movie_id).where(Rating.user_id == user_id)).all())

        recommendations: list[RecommendationScore] = []
        for movie in db.scalars(select(Movie)).all():
            if movie.id in selected_movie_ids or movie.id in rated_movie_ids:
                continue

            artifact_content = artifact_content_scores.get(movie.source_movie_id, 0.0)
            db_content = db_content_scores.get(movie.id, 0.0)
            content = max(artifact_content, db_content)
            collaborative = collaborative_scores.get(movie.id, 0.0)
            popularity = popularity_scores.get(movie.id, 0.15)
            candidate_indian_affinity = self._indian_affinity(self._movie_indian_signal_tokens(movie))
            genre_match_percent = self._genre_match_percent(movie, selected_movies)
            candidate_genres = self._genre_tokens(movie)
            year_affinity = self._year_affinity(movie, selected_movies)
            if selected_indian_affinity >= 0.4:
                if candidate_indian_affinity > 0:
                    content = min(1.0, content + (0.08 * candidate_indian_affinity))
                    popularity = min(1.0, popularity + 0.1)
                else:
                    continue

                if selected_genres and genre_match_percent == 0 and content < 0.85:
                    continue

                if selected_action_genres and not candidate_genres.intersection(ACTION_CLUSTER):
                    continue

                if selected_year and selected_year >= 2020 and movie.year and movie.year < selected_year - 12:
                    continue

            content *= year_affinity
            score = (0.6 * content) + (0.25 * collaborative) + (0.15 * popularity)
            if score <= 0:
                continue

            confidence = self._display_confidence(content, collaborative, popularity)
            recommendations.append(
                RecommendationScore(
                    movie_id=movie.id,
                    score=float(score),
                    confidence=float(confidence),
                    explanation=self._build_explanation(movie, selected_movies, collaborative, content),
                    because_you_liked=self._because_you_liked(movie, selected_movies),
                    why_recommended=self._why_recommended(movie, selected_movies, collaborative, content),
                    similarity_score=round(content, 2),
                    genre_match_percent=genre_match_percent,
                    similar_users_rating=self._similar_users_rating(collaborative),
                )
            )

        recommendations.sort(key=lambda item: item.score, reverse=True)
        return recommendations[:top_n]

    def similar_movies(self, db: Session, movie_id: int, limit: int = 6) -> list[Movie]:
        movie = db.scalar(select(Movie).where(Movie.id == movie_id))
        if not movie:
            return []

        scored: list[tuple[float, Movie]] = []
        source_index = self.id_lookup.get(movie.source_movie_id)
        movie_tokens = self._movie_profile_tokens(movie)

        for candidate in db.scalars(select(Movie)).all():
            if candidate.id == movie.id:
                continue

            score = 0.0
            candidate_source_index = self.id_lookup.get(candidate.source_movie_id)
            if (
                self.similarity_matrix is not None
                and source_index is not None
                and candidate_source_index is not None
            ):
                score = float(self.similarity_matrix[source_index][candidate_source_index])
            else:
                score = self._token_overlap_score(movie_tokens, self._movie_profile_tokens(candidate))

            if score <= 0:
                continue
            scored.append((score, candidate))

        scored.sort(
            key=lambda item: (
                -item[0],
                -(item[1].rating_count or 0),
                -(item[1].avg_rating or 0),
                item[1].title.lower(),
            )
        )
        return [candidate for _, candidate in scored[:limit]]
