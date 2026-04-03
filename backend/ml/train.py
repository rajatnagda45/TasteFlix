from ml.recommender import HybridRecommender


def main() -> None:
    recommender = HybridRecommender.load_or_train()
    recommender.retrain()
    print("TasteFlix recommender retrained successfully.")


if __name__ == "__main__":
    main()
