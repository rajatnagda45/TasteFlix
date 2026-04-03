from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from database import get_db
from models.movie import RecommendationHistory
from models.user import User
from schemas.recommend import HistoryItem
from services.dependencies import get_current_user_optional


router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=list[HistoryItem])
def get_history(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
) -> list[RecommendationHistory]:
    if not current_user:
        return []
    stmt = (
        select(RecommendationHistory)
        .where(RecommendationHistory.user_id == current_user.id)
        .order_by(desc(RecommendationHistory.created_at))
        .limit(limit)
    )
    return db.scalars(stmt).all()
