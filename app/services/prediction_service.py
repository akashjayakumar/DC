"""
No-Show Prediction Service
===========================
Uses a trained XGBoost model (ml/model.pkl) to predict appointment no-shows.
Run ml/train_no_show.py first to generate the model file.
"""
import os
from pathlib import Path
from typing import Optional

import joblib
import numpy as np

MODEL_PATH = Path(__file__).parent.parent / "ml" / "model.pkl"

_model = None


def load_model():
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model not found at {MODEL_PATH}. Run ml/train_no_show.py first."
            )
        _model = joblib.load(MODEL_PATH)
    return _model


def predict_no_show(
    age: int,
    gender: str,
    day_of_week: int,          # 0=Mon … 6=Sun
    hour_of_day: int,           # 0–23
    previous_no_shows: int,
    days_until_appointment: int,
    has_insurance: bool,
) -> dict:
    """
    Returns {probability: float, prediction: 'no_show' | 'will_attend', risk_level: str}
    """
    model = load_model()

    gender_enc = 1 if gender.lower() == "male" else 0
    insurance_enc = 1 if has_insurance else 0

    features = np.array([[
        age,
        gender_enc,
        day_of_week,
        hour_of_day,
        previous_no_shows,
        days_until_appointment,
        insurance_enc,
    ]])

    proba = model.predict_proba(features)[0][1]  # probability of no-show
    prediction = "no_show" if proba >= 0.5 else "will_attend"

    if proba >= 0.7:
        risk = "high"
    elif proba >= 0.4:
        risk = "medium"
    else:
        risk = "low"

    return {
        "probability": round(float(proba), 3),
        "prediction": prediction,
        "risk_level": risk,
    }
