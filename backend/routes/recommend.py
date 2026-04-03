from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schemas.movie import MovieOut
from schemas.recommend import FeedbackRequest, FeedbackResponse, RecommendRequest, RecommendationResponse
from services.dependencies import get_current_user_optional, get_recommendation_service
from services.recommendation_service import RecommendationService


router = APIRouter(tags=["recommendations"])


@router.post("/recommend", response_model=RecommendationResponse)
def recommend(
    payload: RecommendRequest,
    db: Session = Depends(get_db),
    service: RecommendationService = Depends(get_recommendation_service),
    current_user: User | None = Depends(get_current_user_optional),
) -> RecommendationResponse:
    if not payload.user_id and not payload.selected_movies:
        raise HTTPException(status_code=400, detail="Provide a user_id or selected_movies")
    user_id = current_user.id if current_user else None
    if user_id is None and payload.user_id:
        user_exists = db.scalar(select(User.id).where(User.id == payload.user_id))
        if user_exists:
            user_id = payload.user_id
    return service.get_recommendations(
        db=db,
        top_n=payload.top_n,
        user_id=user_id,
        selected_movies=payload.selected_movies,
    )


@router.post("/recommend/feedback", response_model=FeedbackResponse)
def submit_feedback(
    payload: FeedbackRequest,
    db: Session = Depends(get_db),
    service: RecommendationService = Depends(get_recommendation_service),
    current_user: User | None = Depends(get_current_user_optional),
) -> FeedbackResponse:
    if not current_user:
        raise HTTPException(status_code=401, detail="Login required to save feedback")
    return service.store_feedback(db=db, user_id=current_user.id, payload=payload)


@router.get("/recommend/similar/{movie_id}", response_model=list[MovieOut])
def similar_movies(
    movie_id: int,
    limit: int = 6,
    db: Session = Depends(get_db),
    service: RecommendationService = Depends(get_recommendation_service),
) -> list:
    return service.get_similar_movies(db=db, movie_id=movie_id, limit=limit)
