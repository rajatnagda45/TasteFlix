from __future__ import annotations

import re
from pathlib import Path

import pandas as pd


ROOT_DIR = Path(__file__).resolve().parent.parent
SOURCE_DIR = Path("/Users/rajatnagda/Downloads/archive (1)")
BOLLYWOOD_DATASET_PATH = Path("/Users/rajatnagda/Desktop/Bollywood Movie List (1920-2024).csv")
MOVIES_PATH = SOURCE_DIR / "movie.csv"
LINKS_PATH = SOURCE_DIR / "link.csv"
RATINGS_PATH = SOURCE_DIR / "rating.csv"
TAGS_PATH = SOURCE_DIR / "tag.csv"
OUTPUT_PATH = ROOT_DIR / "data" / "movielens_enriched.csv"
YEAR_PATTERN = re.compile(r"\((\d{4})\)\s*$")
BOLLYWOOD_SOURCE_OFFSET = 3_000_000_000


def extract_title_and_year(raw_title: str) -> tuple[str, int | None]:
    title = str(raw_title).strip()
    match = YEAR_PATTERN.search(title)
    year = int(match.group(1)) if match else None
    if match:
        title = title[: match.start()].strip()
    return title, year


def normalize_genres(raw_genres: str) -> str:
    genres = str(raw_genres or "").strip()
    if not genres or genres == "(no genres listed)":
        return ""
    return " ".join(part.strip() for part in genres.split("|") if part.strip())


def build_tag_frame() -> pd.DataFrame:
    tags = pd.read_csv(TAGS_PATH, usecols=["movieId", "tag"])
    tags["tag"] = tags["tag"].fillna("").astype(str).str.strip().str.lower()
    tags = tags[tags["tag"] != ""]
    tag_counts = (
        tags.groupby(["movieId", "tag"])
        .size()
        .reset_index(name="count")
        .sort_values(["movieId", "count", "tag"], ascending=[True, False, True])
    )
    top_tags = tag_counts.groupby("movieId").head(8)
    aggregated = top_tags.groupby("movieId")["tag"].agg(" ".join).reset_index()
    return aggregated.rename(columns={"movieId": "movie_id", "tag": "tags"})


def build_rating_frame() -> pd.DataFrame:
    aggregates: list[pd.DataFrame] = []
    for chunk in pd.read_csv(RATINGS_PATH, usecols=["movieId", "rating"], chunksize=250_000):
        grouped = chunk.groupby("movieId")["rating"].agg(["sum", "count"]).reset_index()
        aggregates.append(grouped)

    combined = pd.concat(aggregates, ignore_index=True)
    collapsed = combined.groupby("movieId")[["sum", "count"]].sum().reset_index()
    collapsed["avg_rating"] = (collapsed["sum"] / collapsed["count"]).round(4)
    collapsed["rating_count"] = collapsed["count"].astype(int)
    return collapsed.rename(columns={"movieId": "movie_id"})[["movie_id", "avg_rating", "rating_count"]]


def normalize_bollywood_genres(raw_genres: str) -> str:
    genres = str(raw_genres or "").strip().lower()
    if not genres:
        return "Bollywood Indian Cinema"
    return " ".join(part.strip().title() for part in re.split(r"[/,|]+|\s{2,}", genres) if part.strip())


def build_bollywood_frame() -> pd.DataFrame:
    if not BOLLYWOOD_DATASET_PATH.exists():
        return pd.DataFrame(
            columns=["movie_id", "title", "year", "tmdb_id", "directors", "actors", "genres", "tags", "avg_rating", "rating_count"]
        )

    bollywood = pd.read_csv(BOLLYWOOD_DATASET_PATH).rename(
        columns={"Movie ID": "movie_id", "Title": "title", "Year": "year", "Genre": "genres"}
    )
    bollywood["movie_id"] = pd.to_numeric(bollywood["movie_id"], errors="coerce").fillna(0).astype(int)
    bollywood = bollywood[bollywood["movie_id"] > 0].copy()
    bollywood["movie_id"] = bollywood["movie_id"] + BOLLYWOOD_SOURCE_OFFSET
    bollywood["title"] = bollywood["title"].fillna("").astype(str).str.strip().str.title()
    bollywood["year"] = pd.to_numeric(bollywood["year"], errors="coerce").astype("Int64")
    bollywood["genres"] = bollywood["genres"].apply(normalize_bollywood_genres)
    bollywood["tmdb_id"] = pd.Series([pd.NA] * len(bollywood), dtype="Int64")
    bollywood["directors"] = ""
    bollywood["actors"] = ""
    bollywood["tags"] = "bollywood indian cinema hindi"
    bollywood["avg_rating"] = 3.6
    bollywood["rating_count"] = 25
    bollywood = bollywood.drop_duplicates(subset=["title", "year"], keep="first")
    return bollywood[
        ["movie_id", "title", "year", "tmdb_id", "directors", "actors", "genres", "tags", "avg_rating", "rating_count"]
    ]


def main() -> None:
    movies = pd.read_csv(MOVIES_PATH).rename(columns={"movieId": "movie_id"})
    title_year = movies["title"].apply(extract_title_and_year)
    movies["title"] = title_year.apply(lambda value: value[0])
    movies["year"] = title_year.apply(lambda value: value[1])
    movies["genres"] = movies["genres"].apply(normalize_genres)

    links = pd.read_csv(LINKS_PATH, usecols=["movieId", "tmdbId"]).rename(
        columns={"movieId": "movie_id", "tmdbId": "tmdb_id"}
    )
    links["tmdb_id"] = pd.to_numeric(links["tmdb_id"], errors="coerce").astype("Int64")

    tags = build_tag_frame()
    ratings = build_rating_frame()

    merged = movies.merge(links, on="movie_id", how="left")
    merged = merged.merge(tags, on="movie_id", how="left")
    merged = merged.merge(ratings, on="movie_id", how="left")
    merged["directors"] = ""
    merged["actors"] = ""
    merged["tags"] = merged["tags"].fillna("")
    merged["year"] = pd.to_numeric(merged["year"], errors="coerce").astype("Int64")
    merged["tmdb_id"] = pd.to_numeric(merged["tmdb_id"], errors="coerce").astype("Int64")
    merged["avg_rating"] = merged["avg_rating"].fillna(0.0)
    merged["rating_count"] = merged["rating_count"].fillna(0).astype(int)

    output = merged[
        [
            "movie_id",
            "title",
            "year",
            "tmdb_id",
            "directors",
            "actors",
            "genres",
            "tags",
            "avg_rating",
            "rating_count",
        ]
    ]
    bollywood = build_bollywood_frame()
    output = pd.concat([output, bollywood], ignore_index=True)
    output = output.drop_duplicates(subset=["title", "year"], keep="first")
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    output.to_csv(OUTPUT_PATH, index=False)
    print(f"Wrote {len(output)} movies to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
