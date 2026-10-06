import logging
import joblib
import pandas as pd
import numpy as np

from django.conf import settings

logger = logging.getLogger(__name__)


class ModelLoadError(Exception):
    pass


def _patch_estimator_compatibility(estimator):
    """
    Ensure backwards/forwards compatibility across scikit-learn versions
    (e.g., SimpleImputer missing _fill_dtype when loaded in scikit-learn 1.6+).
    """
    if hasattr(estimator, '_fit_dtype') and not hasattr(estimator, '_fill_dtype'):
        estimator._fill_dtype = getattr(estimator, '_fit_dtype', np.float64)
    if hasattr(estimator, 'transformers_'):
        for item in estimator.transformers_:
            if len(item) >= 2:
                _patch_estimator_compatibility(item[1])
    if hasattr(estimator, 'named_steps'):
        for step in estimator.named_steps.values():
            _patch_estimator_compatibility(step)
    if hasattr(estimator, 'steps'):
        for _, step in estimator.steps:
            _patch_estimator_compatibility(step)


class ModelRegistry:
    """Lazy-loading, cached registry for joblib model artifacts."""

    def __init__(self):
        self._cache = {}

    def load(self, key):
        if key in self._cache:
            return self._cache[key]

        filename = settings.ML_MODEL_FILES.get(key)

        if not filename:
            raise ModelLoadError(
                f"No filename configured for '{key}'."
            )

        path = settings.ML_MODELS_DIR / filename

        try:
            model = joblib.load(path)
            _patch_estimator_compatibility(model)
            self._cache[key] = model
            return model
        except FileNotFoundError:
            raise ModelLoadError(
                f"Model file not found: {path}"
            )
        except Exception as exc:
            logger.exception("Model loading failed")
            raise ModelLoadError(
                f"Could not load '{filename}': {exc}"
            )


registry = ModelRegistry()


def build_input_dataframe(form_data):
    """
    Creates a one-row DataFrame with exactly the raw feature names and
    order used when the preprocessing pipelines were trained.

    Feature columns (11 total):
        Gender, Age, Occupation, Sleep Duration,
        Physical Activity Level, Stress Level, BMI Category,
        Heart Rate, Daily Steps, systolic_bp, diastolic_bp

    IMPORTANT:
    - 'Quality of Sleep' is NEVER included here (leakage: used only for Task 1 target).
    - 'Sleep Disorder' is NEVER included here (leakage: used only for Task 2 target).
    - Column names must exactly match those seen during training.
    """

    bmi = form_data["bmi_category"]
    # Normalise legacy label from older form/dataset versions
    if bmi == "Normal Weight":
        bmi = "Normal"

    return pd.DataFrame([{
        "Gender":                   form_data["gender"],
        "Age":                      int(form_data["age"]),
        "Occupation":               form_data["occupation"],
        "Sleep Duration":           float(form_data["sleep_duration"]),
        "Physical Activity Level":  int(form_data["physical_activity_level"]),
        "Stress Level":             int(form_data["stress_level"]),
        "BMI Category":             bmi,
        "Heart Rate":               int(form_data["heart_rate"]),
        "Daily Steps":              int(form_data["daily_steps"]),
        "systolic_bp":              int(form_data["systolic_bp"]),   # lowercase — matches training
        "diastolic_bp":             int(form_data["diastolic_bp"]),  # lowercase — matches training
    }])


def predict_sleep_quality(form_data):
    """
    Predict Sleep Quality score using the trained XGBoost regression pipeline.

    Returns a dict with:
        label        — qualitative category (Excellent / Good / Moderate / Poor)
        score        — predicted numeric score (clipped to 3–9)
        score_percent — score as percentage of 10
        out_of       — always 10
    """

    model = registry.load("sleep_quality_pipeline")

    X = build_input_dataframe(form_data)

    score = float(model.predict(X)[0])

    # Clip to observed training target range (3–9)
    score = float(np.clip(score, 3.0, 9.0))

    if score >= 8:
        label = "Excellent Sleep Quality"
    elif score >= 7:
        label = "Good Sleep Quality"
    elif score >= 6:
        label = "Moderate Sleep Quality"
    else:
        label = "Poor Sleep Quality"

    return {
        "label":         label,
        "score":         round(score, 2),
        "score_percent": round((score / 10) * 100, 1),
        "out_of":        10,
    }


def predict_sleep_disorder(form_data):
    """
    Predict Sleep Disorder class and per-class probabilities using the
    trained XGBoost multiclass classification pipeline.

    The deployment model is the *uncalibrated* tuned XGBoost, which was
    found to have the best ECE (0.021), outperforming both Platt/Sigmoid
    and Isotonic calibration (a genuine research finding).

    Returns a dict with:
        label              — predicted class name ('None', 'Insomnia', 'Sleep Apnea')
        confidence         — probability of predicted class (%)
        class_probabilities — list of {label, probability} sorted descending
        is_calibrated      — False (uncalibrated XGBoost had better ECE)
        calibration_note   — explanation for the web UI
    """

    model   = registry.load("sleep_disorder_pipeline")
    encoder = registry.load("disorder_label_encoder")

    X = build_input_dataframe(form_data)

    probabilities = model.predict_proba(X)[0]

    predicted_index = int(np.argmax(probabilities))
    predicted_label = encoder.inverse_transform([predicted_index])[0]

    class_probabilities = []
    for index, probability in enumerate(probabilities):
        label = encoder.inverse_transform([index])[0]
        class_probabilities.append({
            "label":       label,
            "probability": round(float(probability) * 100, 1),
        })

    class_probabilities.sort(
        key=lambda item: item["probability"],
        reverse=True
    )

    confidence = float(np.max(probabilities))

    return {
        "label":               predicted_label,
        "confidence":          round(confidence * 100, 1),
        "class_probabilities": class_probabilities,
        "is_calibrated":       False,
        "calibration_note": (
            "Model uses uncalibrated XGBoost probabilities. "
            "Calibration analysis (Platt/Isotonic) showed the uncalibrated model "
            "already achieves the lowest Expected Calibration Error (ECE=0.021), "
            "confirming XGBoost is inherently well-calibrated on this dataset."
        ),
    }