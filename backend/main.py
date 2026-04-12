from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import get_settings
from database import Base, SessionLocal, engine
from ml.recommender import HybridRecommender
from routes.admin import router as admin_router
from routes.auth import router as auth_router
from routes.history import router as history_router
from routes.movies import router as movies_router
from routes.recommend import router as recommend_router
from services.recommendation_service import RecommendationService
from services.seed_service import seed_movies


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_movies(db)

    recommender = HybridRecommender.load_or_train()
    app.state.recommender = recommender
    app.state.recommendation_service = RecommendationService(recommender)
    yield


app = FastAPI(title=settings.app_name, debug=settings.debug, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(movies_router)
app.include_router(recommend_router)
app.include_router(history_router)
app.include_router(admin_router)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "healthy"}
