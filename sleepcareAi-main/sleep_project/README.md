# SleepCare AI

**Sleep Quality and Sleep Disorder Prediction Using XGBoost and Probability Calibration**
MSc Data Science project — Django web application.

---

## 1. What's included

- A full Django project (`sleep_project/`) with a single app (`predictor/`).
- Two prediction pages (Sleep Quality, Sleep Disorder), a home page, and an about page.
- A shared `preprocessor.pkl` (encoders + scaler + feature order + target classes) and
  four model artifacts, all loaded by Django — never re-fit inside `views.py`.
- `training/train_models.py`: a script that **generates a synthetic dataset** with the
  same fields your brief specifies, and trains + calibrates real XGBoost models so the
  whole application runs out of the box for your demo.
  **Replace this with your own trained models for your actual submission** — see
  section 5 below.

```
sleep_project/
├── manage.py
├── requirements.txt
├── README.md
├── sleep_project/            # Django project (settings, urls, wsgi/asgi)
├── predictor/                # Django app
│   ├── views.py
│   ├── urls.py
│   ├── forms.py
│   ├── models.py
│   ├── ml_utils.py           # model loading + prediction/preprocessing logic
│   └── ml_models/            # <-- put your trained .pkl files here
│       ├── preprocessor.pkl
│       ├── sleep_quality_model.pkl
│       ├── sleep_quality_calibrator.pkl
│       ├── sleep_disorder_model.pkl
│       └── sleep_disorder_calibrator.pkl
├── templates/                # base.html, home.html, sleep_quality.html, ...
├── static/css/style.css
├── static/js/script.js
└── training/
    └── train_models.py       # generates the demo artifacts above
```

---

## 2. Setup

```bash
# 1. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Generate the demo ML artifacts (synthetic data, real XGBoost + calibration)
python training/train_models.py

# 4. Apply Django's built-in migrations (admin/sessions — no login is used)
python manage.py migrate

# 5. Run the development server
python manage.py runserver
```

Then open **http://127.0.0.1:8000/** in your browser.

---

## 3. Pages

| URL                 | Page                       |
|----------------------|----------------------------|
| `/`                  | Home                       |
| `/sleep-quality/`    | Sleep Quality Prediction   |
| `/sleep-disorder/`   | Sleep Disorder Prediction  |
| `/about/`            | About                      |

No login or registration is required anywhere in the app.

---

## 4. How prediction works (request lifecycle)

1. User submits the form on `/sleep-quality/` or `/sleep-disorder/`.
2. `predictor/forms.py` validates the input (types, ranges, and a cross-field
   check that diastolic BP < systolic BP). Invalid input re-renders the form
   with inline errors — nothing crashes.
3. `predictor/views.py` calls `predict_sleep_quality()` / `predict_sleep_disorder()`
   in `predictor/ml_utils.py`.
4. `ml_utils.py`:
   - Loads `preprocessor.pkl` (label encoders, scaler, feature order, target
     classes) and the relevant model + calibrator, via a small `ModelRegistry`
     that caches them after first load and raises a clear, handled
     `ModelLoadError` if a file is missing or corrupted.
   - Builds a feature vector in the **exact order** stored in
     `preprocessor['feature_order']`, encoding categoricals with the saved
     `LabelEncoder`s and scaling numeric columns with the saved `StandardScaler`.
   - Runs the trained XGBoost model, then — if a calibrator artifact is
     present — reruns the prediction through the calibrator
     (`sklearn.calibration.CalibratedClassifierCV`, fit with `cv='prefit'`)
     to obtain calibrated probabilities.
5. The view passes the result dict to the template, which renders:
   - Sleep Quality: a result card with label, calibrated/raw confidence %,
     a progress bar, and a plain-language interpretation.
   - Sleep Disorder: a result card with the predicted class, a full
     probability table (highlighting the predicted class), and the overall
     model confidence.

All result wording is careful to say **"model-estimated probability"** and
**"not a medical diagnosis"** — this is enforced in the templates, not left
to chance.

---

## 5. Using YOUR real trained models instead of the demo ones

The demo artifacts are trained on **synthetic data** purely so the app runs
end-to-end out of the box. For your actual MSc submission, retrain on your
real dataset and swap in your own artifacts:

1. Train your models with the **same feature order and category labels**
   used throughout this project (see `FEATURE_ORDER` and `CATEGORY_VALUES`
   at the top of `training/train_models.py`, and the choice lists in
   `predictor/forms.py`). If your real dataset uses different category
   labels (e.g. different occupation names), update **both** files so the
   dropdowns and the encoders agree.
2. Fit your `LabelEncoder`s (categorical columns) and `StandardScaler`
   (numeric columns) on your real training data — never at request time.
3. Save a single dict via `joblib.dump(...)` as `preprocessor.pkl` shaped like:
   ```python
   {
       'label_encoders': {'gender': <LabelEncoder>, 'occupation': <LabelEncoder>, 'bmi_category': <LabelEncoder>},
       'scaler': <StandardScaler>,
       'feature_order': ['gender', 'age', 'occupation', 'sleep_duration', 'physical_activity_level',
                          'stress_level', 'bmi_category', 'heart_rate', 'daily_steps',
                          'systolic_bp', 'diastolic_bp'],
       'numeric_columns': ['age', 'sleep_duration', 'physical_activity_level', 'stress_level',
                            'heart_rate', 'daily_steps', 'systolic_bp', 'diastolic_bp'],
       'target_classes': ['Insomnia', 'No Sleep Disorder', 'Sleep Apnea'],  # sleep-disorder model only,
                                                                             # in the exact order predict_proba returns
   }
   ```
4. Save your fitted XGBoost models as `sleep_quality_model.pkl` and
   `sleep_disorder_model.pkl`.
5. Save your fitted calibrators (`CalibratedClassifierCV(estimator=model, method='sigmoid'|'isotonic', cv='prefit')`,
   fit on a held-out calibration split) as `sleep_quality_calibrator.pkl` and
   `sleep_disorder_calibrator.pkl`. If you don't have a calibrator for a
   model, just omit that file — the app will fall back to raw
   `predict_proba` output and label it "Model Confidence" instead of
   "Calibrated Probability" automatically.
6. Copy all files into `predictor/ml_models/`.

### Where to change filenames

If you want different filenames, edit `ML_MODEL_FILES` in
`sleep_project/settings.py`:

```python
ML_MODEL_FILES = {
    'sleep_quality_model': 'sleep_quality_model.pkl',
    'sleep_disorder_model': 'sleep_disorder_model.pkl',
    'sleep_quality_calibrator': 'sleep_quality_calibrator.pkl',
    'sleep_disorder_calibrator': 'sleep_disorder_calibrator.pkl',
    'preprocessor': 'preprocessor.pkl',
}
```

### Where to change feature names / categories

- `predictor/forms.py` — `GENDER_CHOICES`, `OCCUPATION_CHOICES`, `BMI_CHOICES`,
  and the field definitions on `BaseSleepForm` (shared by both pages).
- `training/train_models.py` — `FEATURE_ORDER`, `CATEGORICAL_COLUMNS`,
  `NUMERIC_COLUMNS`, `CATEGORY_VALUES` (only relevant if you use this script
  rather than your own training pipeline).
- `predictor/ml_utils.py` — `build_feature_vector()` reads column names
  directly from `preprocessor['feature_order']`, so as long as your
  `preprocessor.pkl` and your form field names agree, you do not need to
  change this file.

---

## 6. Error handling behaviour

- **Invalid input** (wrong type, out of range, diastolic ≥ systolic): the
  form re-renders with inline field errors; no prediction is attempted.
- **Missing field**: Django's form validation catches this the same way as
  invalid input — the request never reaches the model.
- **Missing or corrupted model file**: `ModelLoadError` is caught in the view
  and a clear message is shown in the result area instead of a server error
  page (`predictor/ml_utils.py` → `ModelRegistry`).
- **Unseen category value** at inference time (e.g. a dropdown value the
  encoder was never fit on): logged as a warning and mapped to a fallback
  class rather than raising, so a single odd value can't crash a request.

---

## 7. Notes

- No user accounts, authentication, or database persistence of predictions
  are used — the app is fully stateless per the project brief. `predictor/models.py`
  is present (per the requested structure) but intentionally has no models.
- Bootstrap 5 (via CDN) is used for the grid, form controls, and buttons;
  all visual styling beyond that is in `static/css/style.css`.
- `static/js/script.js` only adds client-side UX (Bootstrap validation
  styling + a submit-button loading state) — it never bypasses server-side
  validation.
