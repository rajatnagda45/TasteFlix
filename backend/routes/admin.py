from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from database import get_db
from services.seed_service import enrich_movies_with_tmdb


router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/retrain")
def retrain_model(request: Request) -> dict[str, str]:
    request.app.state.recommender.retrain()
    return {"status": "ok", "message": "Recommendation model retrained successfully"}


@router.post("/sync-tmdb")
def sync_tmdb(
    limit: int = Query(default=100, ge=1, le=500),
    force: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> dict[str, int | str]:
    updated = enrich_movies_with_tmdb(db, limit=limit, force=force)
    return {"status": "ok", "updated": updated, "message": "TMDB sync completed"}
