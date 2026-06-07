"""
No-Show Model Training
======================
Generates synthetic appointment data with Faker and trains an XGBoost classifier.
Run from the backend/ directory:
    python -m app.ml.train_no_show
"""
import random
import numpy as np
import pandas as pd
from pathlib import Path
from faker import Faker
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from xgboost import XGBClassifier
import joblib

fake = Faker()
MODEL_PATH = Path(__file__).parent / "model.pkl"

N_SAMPLES = 5000
random.seed(42)
np.random.seed(42)


def generate_data(n: int) -> pd.DataFrame:
    records = []
    for _ in range(n):
        age = random.randint(5, 90)
        gender = random.choice(["male", "female"])
        day_of_week = random.randint(0, 6)        # Mon=0, Sun=6
        hour_of_day = random.randint(8, 18)
        previous_no_shows = random.randint(0, 5)
        days_until = random.randint(0, 30)
        has_insurance = random.choice([0, 1])

        # Simple heuristic to create a realistic label
        no_show_prob = (
            0.05
            + (previous_no_shows * 0.12)
            + (0.10 if day_of_week >= 5 else 0)       # weekends worse
            + (0.08 if hour_of_day < 10 else 0)        # early morning worse
            + (0.05 if days_until > 14 else 0)          # far away → forget
            - (0.05 if has_insurance else 0)            # insured more committed
        )
        no_show = 1 if random.random() < min(no_show_prob, 0.95) else 0

        records.append({
            "age": age,
            "gender": 1 if gender == "male" else 0,
            "day_of_week": day_of_week,
            "hour_of_day": hour_of_day,
            "previous_no_shows": previous_no_shows,
            "days_until_appointment": days_until,
            "has_insurance": has_insurance,
            "no_show": no_show,
        })
    return pd.DataFrame(records)


def train():
    print(f"Generating {N_SAMPLES} synthetic appointment records...")
    df = generate_data(N_SAMPLES)

    X = df.drop("no_show", axis=1)
    y = df["no_show"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = XGBClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        use_label_encoder=False,
        eval_metric="logloss",
        random_state=42,
    )
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

    y_pred = model.predict(X_test)
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Will Attend", "No Show"]))

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"\nModel saved to {MODEL_PATH}")


if __name__ == "__main__":
    train()
