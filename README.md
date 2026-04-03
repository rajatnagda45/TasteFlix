# TasteFlix

TasteFlix is a full-stack AI-powered movie recommendation platform built with `Next.js`, `Tailwind CSS`, `Framer Motion`, `FastAPI`, `SQLAlchemy`, and a real hybrid recommendation engine.

## What it does

- Auth flow with signup and login
- Movie search and multi-select onboarding
- Hybrid recommendations using metadata similarity, collaborative filtering with `TruncatedSVD`, and popularity smoothing
- Recommendation explanations
- Recommendation history
- Admin retraining endpoint

## Dataset note

TasteFlix now builds its local catalog from the richer MovieLens export in `movie.csv`, `tag.csv`, `link.csv`, and `rating.csv`. The generated file lives at `backend/data/movielens_enriched.csv` and includes cleaned titles, genres, top community tags, TMDB IDs, and aggregate rating stats.

## Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python scripts/build_movielens_metadata.py
uvicorn main:app --reload
```

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## Firebase auth

- The login and signup screens can validate email/password credentials against Firebase Auth from the frontend
- Add your Firebase web config to `frontend/.env.local`
- TasteFlix still creates its own backend session after Firebase succeeds so recommendation history and feedback keep working

## Core endpoints

- `POST /auth/signup`
- `POST /auth/login`
- `GET /movies`
- `GET /movies/trending`
- `POST /recommend`
- `GET /history`
- `POST /admin/retrain`
- `POST /admin/sync-tmdb`
- `GET /health`

## Deployment notes

- Use PostgreSQL by replacing `DATABASE_URL`
- Change `JWT_SECRET` before production
- Deploy frontend to Vercel
- Deploy backend to Railway or Render
- Add your TMDB key to `backend/.env` as `TMDB_API_KEY`
- The backend uses TMDB server-side for richer posters, overviews, and backdrops
- Run `POST /admin/sync-tmdb` to enrich more of the catalog on demand
