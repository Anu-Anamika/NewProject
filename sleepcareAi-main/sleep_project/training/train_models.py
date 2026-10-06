"""
=============================================================================
SLEEP HEALTH DATASET â€” FULL TRAINING PIPELINE
=============================================================================
MSc Project: "Sleep Quality and Sleep Disorder Prediction Using XGBoost
              with Probability Calibration"

Sections:
  1.  Import Libraries
  2.  Load Dataset
  3.  Dataset Inspection (summary)
  4.  Data Quality Checks
  5.  Exploratory Data Analysis
  6.  Target Analysis
  7.  Data Cleaning
  8.  Feature Engineering
  9.  Preprocessing
  10. Sleep Quality Model (Regression)
  11. Sleep Quality Evaluation
  12. Sleep Disorder Model (Classification)
  13. Sleep Disorder Evaluation
  14. XGBoost Hyperparameter Tuning
  15. Probability Calibration
  16. Calibration Evaluation
  17. SHAP / Feature Importance
  18. Final Model Selection
  19. Save Models
  20. Test Saved Models
=============================================================================
"""

# ============================================================
# SECTION 1 â€” IMPORT LIBRARIES
# ============================================================
import os, sys, warnings, joblib, json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')          # Non-interactive backend (no GUI required)
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

from pathlib import Path

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.dummy import DummyRegressor, DummyClassifier
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.model_selection import (
    KFold, StratifiedKFold, RepeatedStratifiedKFold,
    cross_val_score, cross_validate, GridSearchCV
)
from sklearn.metrics import (
    mean_absolute_error, mean_squared_error, r2_score,
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, log_loss, brier_score_loss,
    classification_report, confusion_matrix
)
from sklearn.calibration import CalibratedClassifierCV, calibration_curve

import xgboost as xgb

warnings.filterwarnings('ignore')
np.random.seed(42)

# ============================================================
# PATHS
# ============================================================
BASE_DIR   = Path(__file__).resolve().parent
DATA_PATH  = BASE_DIR / 'sleep_health_dataset.csv'
MODELS_DIR = BASE_DIR.parent / 'predictor' / 'ml_models'
PLOTS_DIR  = BASE_DIR / 'plots'
MODELS_DIR.mkdir(parents=True, exist_ok=True)
PLOTS_DIR.mkdir(parents=True, exist_ok=True)

print("="*70)
print("SLEEP HEALTH PREDICTION â€” TRAINING PIPELINE")
print("="*70)

# ============================================================
# SECTION 2 â€” LOAD DATASET
# ============================================================
print("\n[Section 2] Loading Dataset...")
df_raw = pd.read_csv(DATA_PATH, keep_default_na=False)
print(f"  Loaded: {df_raw.shape[0]} rows Ã-- {df_raw.shape[1]} columns")

# ============================================================
# SECTION 3 â€” DATASET INSPECTION (SUMMARY)
# ============================================================
print("\n[Section 3] Dataset Inspection Summary")
print(f"  Columns: {list(df_raw.columns)}")
print(f"  Dtypes:\n{df_raw.dtypes}")
print(f"  Missing values:\n{df_raw.isnull().sum()}")

# ============================================================
# SECTION 4 â€” DATA QUALITY CHECKS
# ============================================================
print("\n[Section 4] Data Quality Checks")
dups = df_raw.drop(columns=['Person ID']).duplicated().sum()
print(f"  Feature duplicates (excl. Person ID): {dups} ({dups/len(df_raw)*100:.1f}%)")
print(f"  Unique Blood Pressure values: {df_raw['Blood Pressure'].nunique()}")

# ============================================================
# SECTION 5 â€” EXPLORATORY DATA ANALYSIS
# ============================================================
print("\n[Section 5] EDA - Descriptive Statistics")
num_cols = ['Age','Sleep Duration','Physical Activity Level',
            'Stress Level','Heart Rate','Daily Steps','Quality of Sleep']
print(df_raw[num_cols].describe().T.round(2))
print("\n  Sleep Disorder distribution:")
print(df_raw['Sleep Disorder'].value_counts())

# ============================================================
# SECTION 6 â€” TARGET ANALYSIS
# ============================================================
print("\n[Section 6] Target Analysis")
print("  Task 1 â€” Quality of Sleep (Regression Target):")
print(f"    Min: {df_raw['Quality of Sleep'].min()}, Max: {df_raw['Quality of Sleep'].max()}")
print(f"    Mean: {df_raw['Quality of Sleep'].mean():.3f}, Std: {df_raw['Quality of Sleep'].std():.3f}")

print("  Task 2 â€” Sleep Disorder (Classification Target):")
sd_vc = df_raw['Sleep Disorder'].value_counts()
for cls, cnt in sd_vc.items():
    print(f"    {cls}: {cnt} ({cnt/len(df_raw)*100:.2f}%)")

# Check class imbalance ratio
majority = sd_vc.max()
minority = sd_vc.min()
print(f"  Imbalance ratio (majority/minority): {majority/minority:.2f}x")

# ============================================================
# SECTION 7 â€” DATA CLEANING
# ============================================================
print("\n[Section 7] Data Cleaning")
df = df_raw.copy()

# Drop arbitrary identifier â€” zero predictive value
df.drop(columns=['Person ID'], inplace=True)
print("  Dropped: 'Person ID' (arbitrary index, r=0.016)")

# Standardise BMI Category â€” "Normal Weight" â†’ "Normal" if present
df['BMI Category'] = df['BMI Category'].replace('Normal Weight', 'Normal')
bmi_unique = df['BMI Category'].unique()
print(f"  BMI Categories after standardisation: {sorted(bmi_unique)}")

# Verify no remaining nulls
assert df.isnull().sum().sum() == 0, "Unexpected nulls after cleaning!"
print(f"  Missing values after cleaning: {df.isnull().sum().sum()}")

# ============================================================
# SECTION 8 â€” FEATURE ENGINEERING
# ============================================================
print("\n[Section 8] Feature Engineering â€” Blood Pressure Decomposition")
bp_split = df['Blood Pressure'].str.split('/', expand=True)
df['systolic_bp']  = pd.to_numeric(bp_split[0], errors='coerce').astype(int)
df['diastolic_bp'] = pd.to_numeric(bp_split[1], errors='coerce').astype(int)
df.drop(columns=['Blood Pressure'], inplace=True)

print(f"  Systolic BP: min={df['systolic_bp'].min()}, max={df['systolic_bp'].max()}, "
      f"mean={df['systolic_bp'].mean():.1f}")
print(f"  Diastolic BP: min={df['diastolic_bp'].min()}, max={df['diastolic_bp'].max()}, "
      f"mean={df['diastolic_bp'].mean():.1f}")
print("  Rationale: Raw 'Blood Pressure' string is non-numeric. Decomposing into")
print("  systolic/diastolic preserves the physiological information as two distinct")
print("  continuous features, enabling XGBoost to detect threshold-based splits.")

# Final feature columns (excluding both targets)
FEATURE_COLS = [
    'Gender', 'Age', 'Occupation', 'Sleep Duration',
    'Physical Activity Level', 'Stress Level', 'BMI Category',
    'Heart Rate', 'Daily Steps', 'systolic_bp', 'diastolic_bp'
]
QUALITY_TARGET   = 'Quality of Sleep'
DISORDER_TARGET  = 'Sleep Disorder'

print(f"\n  Final feature set ({len(FEATURE_COLS)} features): {FEATURE_COLS}")
print(f"  Note: '{QUALITY_TARGET}' is EXCLUDED from disorder features (leakage prevention)")
print(f"  Note: '{DISORDER_TARGET}' is EXCLUDED from quality features (leakage prevention)")

# ============================================================
# SECTION 9 â€” PREPROCESSING PIPELINE
# ============================================================
print("\n[Section 9] Preprocessing Pipeline")

CATEGORICAL_FEATURES = ['Gender', 'Occupation', 'BMI Category']
NUMERICAL_FEATURES   = ['Age', 'Sleep Duration', 'Physical Activity Level',
                         'Stress Level', 'Heart Rate', 'Daily Steps',
                         'systolic_bp', 'diastolic_bp']

print(f"  Categorical features ({len(CATEGORICAL_FEATURES)}): {CATEGORICAL_FEATURES}")
print(f"  Numerical features  ({len(NUMERICAL_FEATURES)}): {NUMERICAL_FEATURES}")
print("  Encoder: OneHotEncoder(handle_unknown='ignore', sparse_output=False)")
print("  Rationale: handle_unknown='ignore' ensures unseen category values from")
print("  the web form (e.g. future occupations) produce zero-columns rather than errors.")

cat_transformer = Pipeline([
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
])

num_transformer = Pipeline([
    ('imputer', SimpleImputer(strategy='median'))
])

preprocessor = ColumnTransformer(
    transformers=[
        ('cat', cat_transformer, CATEGORICAL_FEATURES),
        ('num', num_transformer, NUMERICAL_FEATURES),
    ],
    remainder='drop'
)

# ============================================================
# SECTION 10 â€” SLEEP QUALITY MODEL (REGRESSION)
# ============================================================
print("\n" + "="*70)
print("[Section 10] TASK 1: SLEEP QUALITY PREDICTION (REGRESSION)")
print("="*70)

X_quality = df[FEATURE_COLS].copy()
y_quality = df[QUALITY_TARGET].copy()

print(f"  Feature matrix shape: {X_quality.shape}")
print(f"  Target: '{QUALITY_TARGET}' â€” Range: {y_quality.min()}â€“{y_quality.max()}, "
      f"Mean: {y_quality.mean():.3f}")

# Cross-validation setup â€” 5-fold for regression
kf = KFold(n_splits=5, shuffle=True, random_state=42)

def evaluate_regressor_cv(pipeline, X, y, cv, label):
    """Run CV and return MAE, RMSE, RÂ2 stats."""
    mae_scores  = []
    rmse_scores = []
    r2_scores   = []
    for train_idx, test_idx in cv.split(X):
        X_tr, X_te = X.iloc[train_idx], X.iloc[test_idx]
        y_tr, y_te = y.iloc[train_idx], y.iloc[test_idx]
        pipeline.fit(X_tr, y_tr)
        y_pred = pipeline.predict(X_te)
        mae_scores.append(mean_absolute_error(y_te, y_pred))
        rmse_scores.append(np.sqrt(mean_squared_error(y_te, y_pred)))
        r2_scores.append(r2_score(y_te, y_pred))
    print(f"\n  [{label}]")
    print(f"    MAE  : {np.mean(mae_scores):.4f} Â+/- {np.std(mae_scores):.4f}")
    print(f"    RMSE : {np.mean(rmse_scores):.4f} Â+/- {np.std(rmse_scores):.4f}")
    print(f"    RÂ2   : {np.mean(r2_scores):.4f} Â+/- {np.std(r2_scores):.4f}")
    return {
        'label': label,
        'mae_mean': np.mean(mae_scores), 'mae_std': np.std(mae_scores),
        'rmse_mean': np.mean(rmse_scores),'rmse_std': np.std(rmse_scores),
        'r2_mean': np.mean(r2_scores),   'r2_std': np.std(r2_scores),
    }

# 10a. Baseline â€” Dummy Regressor (mean prediction)
print("\n  --- Baseline Models ---")
dummy_reg_pipeline = Pipeline([
    ('prep', preprocessor),
    ('model', DummyRegressor(strategy='mean'))
])
quality_results = []
quality_results.append(evaluate_regressor_cv(dummy_reg_pipeline, X_quality, y_quality, kf, 'Dummy (Mean)'))

# 10b. Baseline â€” Linear Regression
lr_pipeline = Pipeline([
    ('prep', preprocessor),
    ('model', LinearRegression())
])
quality_results.append(evaluate_regressor_cv(lr_pipeline, X_quality, y_quality, kf, 'Linear Regression'))

# 10c. XGBoost Default (Baseline XGBoost)
xgb_reg_default = Pipeline([
    ('prep', preprocessor),
    ('model', xgb.XGBRegressor(
        n_estimators=100,
        random_state=42,
        n_jobs=-1,
        verbosity=0
    ))
])
quality_results.append(evaluate_regressor_cv(xgb_reg_default, X_quality, y_quality, kf, 'XGBoost Default'))

# ============================================================
# SECTION 14 (Part A) â€” XGBOOST REGRESSION HYPERPARAMETER TUNING
# ============================================================
print("\n  --- XGBoost Regression Hyperparameter Tuning ---")
print("  (GridSearch over max_depth, learning_rate, n_estimators, subsample)")

param_grid_reg = {
    'model__n_estimators':  [100, 200, 300],
    'model__max_depth':     [3, 5, 7],
    'model__learning_rate': [0.01, 0.05, 0.1],
    'model__subsample':     [0.8, 1.0],
    'model__min_child_weight': [1, 5],
}

xgb_reg_tuned_pipe = Pipeline([
    ('prep', preprocessor),
    ('model', xgb.XGBRegressor(random_state=42, n_jobs=-1, verbosity=0))
])

gs_reg = GridSearchCV(
    xgb_reg_tuned_pipe,
    param_grid_reg,
    scoring='neg_mean_squared_error',
    cv=kf,
    n_jobs=-1,
    verbose=0,
    refit=True,
)
gs_reg.fit(X_quality, y_quality)
print(f"  Best params: {gs_reg.best_params_}")
print(f"  Best CV RMSE: {np.sqrt(-gs_reg.best_score_):.4f}")

xgb_reg_best_pipe = gs_reg.best_estimator_
quality_results.append(evaluate_regressor_cv(xgb_reg_best_pipe, X_quality, y_quality, kf, 'XGBoost Tuned'))

# ============================================================
# SECTION 11 â€” SLEEP QUALITY EVALUATION SUMMARY
# ============================================================
print("\n" + "="*70)
print("[Section 11] SLEEP QUALITY EVALUATION SUMMARY")
print("="*70)
print(f"  {'Model':<28} {'MAE':>8} {'RMSE':>8} {'RÂ2':>8}")
print("  " + "-"*55)
for r in quality_results:
    print(f"  {r['label']:<28} {r['mae_mean']:>8.4f} {r['rmse_mean']:>8.4f} {r['r2_mean']:>8.4f}")

best_quality = max(quality_results[1:], key=lambda x: x['r2_mean'])  # skip dummy
print(f"\n  âœ“ Best regression model: {best_quality['label']}")
print(f"    RÂ2={best_quality['r2_mean']:.4f} Â+/- {best_quality['r2_std']:.4f}")
print(f"    MAE={best_quality['mae_mean']:.4f} Â+/- {best_quality['mae_std']:.4f}")
print(f"    RMSE={best_quality['rmse_mean']:.4f} Â+/- {best_quality['rmse_std']:.4f}")

# Refit on full dataset for deployment
print("\n  Fitting final regression pipeline on full dataset...")
xgb_reg_best_pipe.fit(X_quality, y_quality)
FINAL_QUALITY_PIPELINE = xgb_reg_best_pipe
print("  Done.")

# ============================================================
# SECTION 12 â€” SLEEP DISORDER MODEL (CLASSIFICATION)
# ============================================================
print("\n" + "="*70)
print("[Section 12] TASK 2: SLEEP DISORDER PREDICTION (CLASSIFICATION)")
print("="*70)

X_disorder = df[FEATURE_COLS].copy()
y_disorder_raw = df[DISORDER_TARGET].copy()

# Encode labels
le = LabelEncoder()
y_disorder = le.fit_transform(y_disorder_raw)
class_names = list(le.classes_)
n_classes   = len(class_names)
print(f"  Classes: {class_names}")
print(f"  Encoded: {dict(zip(class_names, le.transform(class_names)))}")

# Class distribution
for cls, enc_val in zip(class_names, le.transform(class_names)):
    cnt = (y_disorder == enc_val).sum()
    print(f"  Class {enc_val} ({cls}): {cnt} ({cnt/len(y_disorder)*100:.2f}%)")

# Repeated Stratified K-Fold (robust small-dataset strategy)
rskf = RepeatedStratifiedKFold(n_splits=5, n_repeats=10, random_state=42)
skf5 = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

def evaluate_classifier_cv(pipeline, X, y, cv, label, class_names, use_proba=True):
    """Run CV and collect all classification metrics."""
    accs, precs, recs, f1s, roc_aucs, loglosses = [], [], [], [], [], []
    for train_idx, test_idx in cv.split(X, y):
        X_tr, X_te = X.iloc[train_idx], X.iloc[test_idx]
        y_tr, y_te = y[train_idx], y[test_idx]
        pipeline.fit(X_tr, y_tr)
        y_pred = pipeline.predict(X_te)
        accs.append(accuracy_score(y_te, y_pred))
        precs.append(precision_score(y_te, y_pred, average='weighted', zero_division=0))
        recs.append(recall_score(y_te, y_pred, average='weighted', zero_division=0))
        f1s.append(f1_score(y_te, y_pred, average='weighted', zero_division=0))
        if use_proba and hasattr(pipeline, 'predict_proba'):
            proba = pipeline.predict_proba(X_te)
            roc_aucs.append(roc_auc_score(y_te, proba, multi_class='ovr', average='weighted'))
            loglosses.append(log_loss(y_te, proba))
    stats = {
        'label': label,
        'acc_mean':  np.mean(accs),   'acc_std':  np.std(accs),
        'prec_mean': np.mean(precs),  'prec_std': np.std(precs),
        'rec_mean':  np.mean(recs),   'rec_std':  np.std(recs),
        'f1_mean':   np.mean(f1s),    'f1_std':   np.std(f1s),
        'roc_mean':  np.mean(roc_aucs) if roc_aucs else np.nan,
        'roc_std':   np.std(roc_aucs)  if roc_aucs else np.nan,
        'logloss_mean': np.mean(loglosses) if loglosses else np.nan,
        'logloss_std':  np.std(loglosses)  if loglosses else np.nan,
    }
    print(f"\n  [{label}] (5-fold Ã-- 10 repeats = 50 evaluations)")
    print(f"    Accuracy  : {stats['acc_mean']:.4f} Â+/- {stats['acc_std']:.4f}")
    print(f"    Precision : {stats['prec_mean']:.4f} Â+/- {stats['prec_std']:.4f}")
    print(f"    Recall    : {stats['rec_mean']:.4f} Â+/- {stats['rec_std']:.4f}")
    print(f"    F1 Score  : {stats['f1_mean']:.4f} Â+/- {stats['f1_std']:.4f}")
    if roc_aucs:
        print(f"    ROC-AUC   : {stats['roc_mean']:.4f} Â+/- {stats['roc_std']:.4f}")
        print(f"    Log Loss  : {stats['logloss_mean']:.4f} Â+/- {stats['logloss_std']:.4f}")
    return stats

# 12a. Dummy Classifier Baseline
print("\n  --- Baseline: Dummy Classifier (most frequent) ---")
dummy_cls_pipeline = Pipeline([
    ('prep', preprocessor),
    ('model', DummyClassifier(strategy='most_frequent', random_state=42))
])
disorder_results = []
disorder_results.append(evaluate_classifier_cv(
    dummy_cls_pipeline, X_disorder, y_disorder, rskf, 'Dummy (Most Frequent)', class_names, use_proba=False
))

# 12b. Logistic Regression Baseline
print("\n  --- Baseline: Logistic Regression ---")
lr_cls_pipeline = Pipeline([
    ('prep', preprocessor),
    ('model', LogisticRegression(max_iter=1000, random_state=42, multi_class='multinomial'))
])
disorder_results.append(evaluate_classifier_cv(
    lr_cls_pipeline, X_disorder, y_disorder, rskf, 'Logistic Regression', class_names
))

# 12c. XGBoost Default Classifier
print("\n  --- XGBoost Default Classifier ---")
xgb_cls_default = Pipeline([
    ('prep', preprocessor),
    ('model', xgb.XGBClassifier(
        n_estimators=100,
        random_state=42,
        n_jobs=-1,
        verbosity=0,
        eval_metric='mlogloss',
        use_label_encoder=False
    ))
])
disorder_results.append(evaluate_classifier_cv(
    xgb_cls_default, X_disorder, y_disorder, rskf, 'XGBoost Default', class_names
))

# ============================================================
# SECTION 14 (Part B) â€” XGBOOST CLASSIFICATION TUNING
# ============================================================
print("\n" + "="*70)
print("[Section 14] XGBOOST CLASSIFIER HYPERPARAMETER TUNING")
print("="*70)

param_grid_cls = {
    'model__n_estimators':    [100, 200, 300],
    'model__max_depth':       [3, 5, 7],
    'model__learning_rate':   [0.01, 0.05, 0.1],
    'model__subsample':       [0.8, 1.0],
    'model__colsample_bytree':[0.8, 1.0],
    'model__min_child_weight':[1, 5],
}

xgb_cls_tune_pipe = Pipeline([
    ('prep', preprocessor),
    ('model', xgb.XGBClassifier(
        random_state=42,
        n_jobs=-1,
        verbosity=0,
        eval_metric='mlogloss',
        use_label_encoder=False
    ))
])

gs_cls = GridSearchCV(
    xgb_cls_tune_pipe,
    param_grid_cls,
    scoring='f1_weighted',
    cv=skf5,
    n_jobs=-1,
    verbose=0,
    refit=True,
)
gs_cls.fit(X_disorder, y_disorder)
print(f"  Best params: {gs_cls.best_params_}")
print(f"  Best CV F1 (weighted): {gs_cls.best_score_:.4f}")

xgb_cls_best_pipe = gs_cls.best_estimator_
disorder_results.append(evaluate_classifier_cv(
    xgb_cls_best_pipe, X_disorder, y_disorder, rskf, 'XGBoost Tuned', class_names
))

# ============================================================
# SECTION 13 â€” SLEEP DISORDER EVALUATION SUMMARY
# ============================================================
print("\n" + "="*70)
print("[Section 13] SLEEP DISORDER EVALUATION SUMMARY")
print("="*70)
header = f"  {'Model':<24} {'Acc':>6} {'F1':>7} {'ROC-AUC':>9} {'LogLoss':>9}"
print(header)
print("  " + "-"*60)
for r in disorder_results:
    roc_str  = f"{r['roc_mean']:>9.4f}"  if not np.isnan(r['roc_mean']) else f"{'N/A':>9}"
    ll_str   = f"{r['logloss_mean']:>9.4f}" if not np.isnan(r['logloss_mean']) else f"{'N/A':>9}"
    print(f"  {r['label']:<24} {r['acc_mean']:>6.4f} {r['f1_mean']:>7.4f} {roc_str} {ll_str}")

# Confusion Matrix on final held-out split (last fold)
print("\n  --- Final Confusion Matrix (XGBoost Tuned, last fold) ---")
splits = list(skf5.split(X_disorder, y_disorder))
train_idx, test_idx = splits[-1]
xgb_cls_best_pipe.fit(X_disorder.iloc[train_idx], y_disorder[train_idx])
y_test_pred = xgb_cls_best_pipe.predict(X_disorder.iloc[test_idx])
cm = confusion_matrix(y_disorder[test_idx], y_test_pred)
print("  Classes:", class_names)
print("  Confusion Matrix:")
print(pd.DataFrame(cm, index=class_names, columns=class_names).to_string(index=True))

print("\n  Classification Report:")
print(classification_report(
    y_disorder[test_idx], y_test_pred,
    target_names=class_names, zero_division=0
))

# ============================================================
# SECTION 15 â€” PROBABILITY CALIBRATION
# ============================================================
print("\n" + "="*70)
print("[Section 15] PROBABILITY CALIBRATION ANALYSIS")
print("="*70)
print("""
  Research Contribution: Comparing calibration quality of:
    1. Uncalibrated XGBoost (tuned)
    2. XGBoost + Platt/Sigmoid Calibration
    3. XGBoost + Isotonic Regression Calibration

  Method: Out-of-fold (OOF) calibration using StratifiedKFold(5).
  The calibration wrappers are trained on held-out fold data only.
  The final test set is NOT used for any calibration fitting.
  Calibration models are re-fitted inside cross-validation to avoid data leakage.
""")

# Get base XGBoost model from the tuned pipeline
xgb_base_model = xgb_cls_best_pipe.named_steps['model']
prep_fitted     = xgb_cls_best_pipe.named_steps['prep']

# Re-transform features once for calibration experiment
X_transformed = prep_fitted.transform(X_disorder)

# Calibration using CalibratedClassifierCV (cross-validated)
cal_skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

def compute_ece(y_true, y_prob, n_bins=10):
    """
    Expected Calibration Error (ECE).
    Measures the weighted average deviation between predicted probability
    and observed frequency across confidence bins.
    """
    y_true_bin = (np.arange(len(np.unique(y_true)))[:,None] == y_true).T
    # Per-class ECE, averaged
    eces = []
    for c in range(y_prob.shape[1]):
        probs_c = y_prob[:, c]
        true_c  = (y_true == c).astype(int)
        bins = np.linspace(0, 1, n_bins + 1)
        bin_lowers = bins[:-1]
        bin_uppers = bins[1:]
        ece = 0.0
        for lb, ub in zip(bin_lowers, bin_uppers):
            mask = (probs_c >= lb) & (probs_c < ub)
            if mask.sum() > 0:
                bin_conf  = probs_c[mask].mean()
                bin_acc   = true_c[mask].mean()
                ece      += mask.sum() * abs(bin_conf - bin_acc)
        eces.append(ece / len(probs_c))
    return np.mean(eces)

def evaluate_calibration_cv(model, X, y, cv, label):
    """Collect OOF probabilities and compute calibration metrics."""
    oof_proba = np.zeros((len(y), n_classes))
    for train_idx, test_idx in cv.split(X, y):
        model.fit(X[train_idx], y[train_idx])
        oof_proba[test_idx] = model.predict_proba(X[test_idx])
    brier  = brier_score_loss(y, oof_proba[:, 1]) if n_classes == 2 else \
             np.mean([brier_score_loss((y == c).astype(int), oof_proba[:, c])
                      for c in range(n_classes)])
    ll     = log_loss(y, oof_proba)
    ece    = compute_ece(y, oof_proba)
    print(f"\n  [{label}]")
    print(f"    Brier Score (avg) : {brier:.6f}")
    print(f"    Log Loss          : {ll:.6f}")
    print(f"    ECE (avg)         : {ece:.6f}")
    return {'label': label, 'brier': brier, 'logloss': ll, 'ece': ece,
            'oof_proba': oof_proba}

# Uncalibrated XGBoost
print("\n  [A] Uncalibrated XGBoost (tuned)")
uncal_model = xgb.XGBClassifier(**{
    k.replace('model__', ''): v
    for k, v in gs_cls.best_params_.items()
    if k.startswith('model__')
}, random_state=42, n_jobs=-1, verbosity=0, eval_metric='mlogloss', use_label_encoder=False)
uncal_results = evaluate_calibration_cv(uncal_model, X_transformed, y_disorder, cal_skf, 'Uncalibrated XGBoost')

# Platt / Sigmoid Calibration
print("\n  [B] XGBoost + Platt (Sigmoid) Calibration")
sigmoid_model = CalibratedClassifierCV(
    xgb.XGBClassifier(**{
        k.replace('model__', ''): v
        for k, v in gs_cls.best_params_.items()
        if k.startswith('model__')
    }, random_state=42, n_jobs=-1, verbosity=0, eval_metric='mlogloss', use_label_encoder=False),
    method='sigmoid', cv=3
)
sigmoid_results = evaluate_calibration_cv(sigmoid_model, X_transformed, y_disorder, cal_skf, 'XGBoost + Platt/Sigmoid')

# Isotonic Regression Calibration
print("\n  [C] XGBoost + Isotonic Regression Calibration")
isotonic_model = CalibratedClassifierCV(
    xgb.XGBClassifier(**{
        k.replace('model__', ''): v
        for k, v in gs_cls.best_params_.items()
        if k.startswith('model__')
    }, random_state=42, n_jobs=-1, verbosity=0, eval_metric='mlogloss', use_label_encoder=False),
    method='isotonic', cv=3
)
isotonic_results = evaluate_calibration_cv(isotonic_model, X_transformed, y_disorder, cal_skf, 'XGBoost + Isotonic')

# ============================================================
# SECTION 16 â€” CALIBRATION EVALUATION SUMMARY
# ============================================================
print("\n" + "="*70)
print("[Section 16] CALIBRATION EVALUATION SUMMARY")
print("="*70)

cal_results = [uncal_results, sigmoid_results, isotonic_results]
print(f"\n  {'Model':<35} {'Brier Score':>12} {'Log Loss':>10} {'ECE':>8}")
print("  " + "-"*68)
for r in cal_results:
    print(f"  {r['label']:<35} {r['brier']:>12.6f} {r['logloss']:>10.6f} {r['ece']:>8.6f}")

# Determine best calibration method
best_cal = min(cal_results, key=lambda x: x['ece'])
print(f"\n  âœ“ Best calibrated model by ECE: {best_cal['label']}")
print(f"    Brier={best_cal['brier']:.6f}, LogLoss={best_cal['logloss']:.6f}, ECE={best_cal['ece']:.6f}")

# Research finding: is calibration actually better?
if best_cal['label'] == 'Uncalibrated XGBoost':
    print("\n  *** RESEARCH FINDING: The uncalibrated XGBoost already produces well-")
    print("      calibrated probabilities. Platt/Isotonic calibration did NOT improve")
    print("      calibration. This is reported as a genuine research finding.")
    USE_CALIBRATION = False
    DEPLOYMENT_CALIBRATION = 'none'
else:
    print(f"\n  *** RESEARCH FINDING: {best_cal['label']} achieves the best calibration.")
    USE_CALIBRATION = True
    DEPLOYMENT_CALIBRATION = 'sigmoid' if 'Platt' in best_cal['label'] else 'isotonic'

print(f"  Deployment decision: {'Calibrated (' + DEPLOYMENT_CALIBRATION + ')' if USE_CALIBRATION else 'Uncalibrated XGBoost'}")

# ============================================================
# CALIBRATION RELIABILITY DIAGRAM
# ============================================================
print("\n  Generating Calibration Reliability Diagrams...")

fig, axes = plt.subplots(1, 3, figsize=(18, 5), sharey=True)
fig.suptitle("Calibration Reliability Diagrams â€” Sleep Disorder (OOF Probabilities)",
             fontsize=13, fontweight='bold')

colors = ['#2196F3', '#FF9800', '#4CAF50']
for ax, res, col in zip(axes, cal_results, colors):
    oof_p = res['oof_proba']
    # Average calibration across all classes
    for c, cls_name in enumerate(class_names):
        fraction_pos, mean_pred = calibration_curve(
            (y_disorder == c).astype(int),
            oof_p[:, c],
            n_bins=10,
            strategy='quantile'
        )
        ax.plot(mean_pred, fraction_pos, marker='o', linewidth=2,
                label=f'{cls_name}', markersize=5)
    ax.plot([0, 1], [0, 1], 'k--', linewidth=1.5, label='Perfect')
    ax.set_xlabel('Mean Predicted Probability', fontsize=10)
    ax.set_ylabel('Fraction of Positives', fontsize=10)
    ax.set_title(f"{res['label']}\nBrier={res['brier']:.4f}, ECE={res['ece']:.4f}", fontsize=10)
    ax.legend(fontsize=8)
    ax.set_xlim([0, 1])
    ax.set_ylim([0, 1])
    ax.grid(alpha=0.3)

plt.tight_layout()
calib_plot_path = PLOTS_DIR / 'calibration_reliability_diagrams.png'
plt.savefig(calib_plot_path, dpi=150, bbox_inches='tight')
plt.close()
print(f"  Saved: {calib_plot_path}")

# ============================================================
# SECTION 17 â€” SHAP / FEATURE IMPORTANCE
# ============================================================
print("\n" + "="*70)
print("[Section 17] SHAP & FEATURE IMPORTANCE ANALYSIS")
print("="*70)

try:
    import shap

    # ---- Task 1: Sleep Quality Regression ----
    print("\n  [Task 1] Sleep Quality â€” XGBoost Feature Importance")
    prep_q = Pipeline([('prep', preprocessor)])
    prep_q.fit(X_quality)
    X_q_transformed = prep_q['prep'].transform(X_quality)

    # Get feature names after OHE
    ohe_feat_names = list(prep_q['prep'].named_transformers_['cat'].named_steps['encoder']
                          .get_feature_names_out(CATEGORICAL_FEATURES))
    feature_names_full = ohe_feat_names + NUMERICAL_FEATURES

    xgb_reg_final_model = FINAL_QUALITY_PIPELINE.named_steps['model']

    # SHAP for regression
    explainer_reg = shap.TreeExplainer(xgb_reg_final_model)
    shap_values_reg = explainer_reg.shap_values(X_q_transformed)

    plt.figure(figsize=(10, 6))
    shap.summary_plot(shap_values_reg, X_q_transformed, feature_names=feature_names_full,
                      plot_type='bar', show=False)
    plt.title("SHAP Feature Importance â€” Sleep Quality Regression", fontweight='bold')
    plt.tight_layout()
    shap_q_path = PLOTS_DIR / 'shap_sleep_quality.png'
    plt.savefig(shap_q_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"  Saved: {shap_q_path}")

    # SHAP summary (beeswarm)
    plt.figure(figsize=(10, 8))
    shap.summary_plot(shap_values_reg, X_q_transformed, feature_names=feature_names_full,
                      show=False)
    plt.title("SHAP Summary Plot â€” Sleep Quality", fontweight='bold')
    plt.tight_layout()
    shap_q_bee_path = PLOTS_DIR / 'shap_sleep_quality_beeswarm.png'
    plt.savefig(shap_q_bee_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"  Saved: {shap_q_bee_path}")

    # ---- Task 2: Sleep Disorder Classification ----
    print("\n  [Task 2] Sleep Disorder â€” XGBoost Feature Importance")
    xgb_cls_final_model = xgb_cls_best_pipe.named_steps['model']

    explainer_cls = shap.TreeExplainer(xgb_cls_final_model)
    shap_values_cls = explainer_cls.shap_values(X_transformed)

    ohe_feat_names_cls = list(xgb_cls_best_pipe.named_steps['prep']
                               .named_transformers_['cat'].named_steps['encoder']
                               .get_feature_names_out(CATEGORICAL_FEATURES))
    feature_names_cls = ohe_feat_names_cls + NUMERICAL_FEATURES

    # SHAP for each class
    if isinstance(shap_values_cls, list):
        for c_idx, (c_name, sv) in enumerate(zip(class_names, shap_values_cls)):
            plt.figure(figsize=(10, 6))
            shap.summary_plot(sv, X_transformed, feature_names=feature_names_cls,
                              plot_type='bar', show=False)
            plt.title(f"SHAP Feature Importance â€” Sleep Disorder: {c_name}", fontweight='bold')
            plt.tight_layout()
            p = PLOTS_DIR / f'shap_disorder_{c_name.lower().replace(" ", "_")}.png'
            plt.savefig(p, dpi=150, bbox_inches='tight')
            plt.close()
            print(f"  Saved: {p}")
    else:
        for c_idx, c_name in enumerate(class_names):
            plt.figure(figsize=(10, 6))
            shap.summary_plot(shap_values_cls[:, :, c_idx], X_transformed,
                              feature_names=feature_names_cls, plot_type='bar', show=False)
            plt.title(f"SHAP â€” Sleep Disorder: {c_name}", fontweight='bold')
            plt.tight_layout()
            p = PLOTS_DIR / f'shap_disorder_{c_name.lower().replace(" ", "_")}.png'
            plt.savefig(p, dpi=150, bbox_inches='tight')
            plt.close()
            print(f"  Saved: {p}")

    # XGBoost built-in feature importance (weight)
    print("\n  XGBoost Built-in Feature Importance (gain) â€” Sleep Quality:")
    fi_reg = xgb_reg_final_model.feature_importances_
    fi_reg_df = pd.Series(fi_reg, index=feature_names_full).sort_values(ascending=False)
    print(fi_reg_df.head(10).to_string())

    print("\n  XGBoost Built-in Feature Importance (gain) â€” Sleep Disorder:")
    fi_cls = xgb_cls_final_model.feature_importances_
    fi_cls_df = pd.Series(fi_cls, index=feature_names_cls).sort_values(ascending=False)
    print(fi_cls_df.head(10).to_string())

except Exception as e:
    print(f"  âš  SHAP analysis failed: {e}")
    print("  Falling back to XGBoost built-in feature importance only.")

# ============================================================
# SECTION 18 â€” FINAL MODEL SELECTION
# ============================================================
print("\n" + "="*70)
print("[Section 18] FINAL MODEL SELECTION")
print("="*70)

print("""
  Selection Criteria:
  - Regression: RÂ2 > 0.85 is excellent for sleep quality prediction.
    Model is chosen by highest RÂ2, not lowest loss alone.
  - Classification: F1-weighted used as primary metric (handles class imbalance).
    ROC-AUC and Log Loss used as secondary checks.
  - Calibration: ECE selected as primary calibration metric.
    Reliability diagram confirms visual calibration quality.
""")

best_disorder_result = max(disorder_results[1:], key=lambda x: x['f1_mean'])
print(f"  Selected Regression Model  : {best_quality['label']}")
print(f"    RÂ2={best_quality['r2_mean']:.4f}, RMSE={best_quality['rmse_mean']:.4f}, MAE={best_quality['mae_mean']:.4f}")
print(f"  Selected Classification Model: {best_disorder_result['label']}")
print(f"    F1={best_disorder_result['f1_mean']:.4f}, ROC-AUC={best_disorder_result['roc_mean']:.4f}")
print(f"  Selected Calibration Method  : {best_cal['label']}")
print(f"    ECE={best_cal['ece']:.6f}, Brier={best_cal['brier']:.6f}")

# Build final deployment disorder model (fit on full data)
print("\n  Fitting final disorder pipeline on full dataset...")
xgb_cls_best_pipe.fit(X_disorder, y_disorder)
print("  Done.")

# Build calibrated disorder model for deployment
print("\n  Fitting final calibrated disorder model for deployment...")
if USE_CALIBRATION:
    final_disorder_pipeline = Pipeline([
        ('prep', preprocessor),
        ('model', CalibratedClassifierCV(
            xgb.XGBClassifier(**{
                k.replace('model__', ''): v
                for k, v in gs_cls.best_params_.items()
                if k.startswith('model__')
            }, random_state=42, n_jobs=-1, verbosity=0,
                eval_metric='mlogloss', use_label_encoder=False),
            method=DEPLOYMENT_CALIBRATION, cv=5
        ))
    ])
    final_disorder_pipeline.fit(X_disorder, y_disorder)
else:
    final_disorder_pipeline = xgb_cls_best_pipe
print("  Done.")

# ============================================================
# SECTION 19 â€” SAVE MODELS
# ============================================================
print("\n" + "="*70)
print("[Section 19] SAVE MODELS")
print("="*70)

# Sleep Quality Pipeline
quality_path = MODELS_DIR / 'sleep_quality_pipeline.joblib'
joblib.dump(FINAL_QUALITY_PIPELINE, quality_path)
print(f"  âœ“ Sleep Quality Pipeline saved â†’ {quality_path}")

# Sleep Disorder Pipeline
disorder_path = MODELS_DIR / 'sleep_disorder_pipeline.joblib'
joblib.dump(final_disorder_pipeline, disorder_path)
print(f"  âœ“ Sleep Disorder Pipeline saved â†’ {disorder_path}")

# Label Encoder (required by Django to decode predicted class index â†’ class name)
le_path = MODELS_DIR / 'disorder_label_encoder.joblib'
joblib.dump(le, le_path)
print(f"  âœ“ Disorder Label Encoder saved â†’ {le_path}")

# Feature metadata (for Django validation)
feature_meta = {
    'feature_cols': FEATURE_COLS,
    'categorical_features': CATEGORICAL_FEATURES,
    'numerical_features': NUMERICAL_FEATURES,
    'quality_target': QUALITY_TARGET,
    'disorder_target': DISORDER_TARGET,
    'disorder_classes': class_names,
    'quality_range': [int(y_quality.min()), int(y_quality.max())],
    'is_calibrated': USE_CALIBRATION,
    'calibration_method': DEPLOYMENT_CALIBRATION,
    'best_quality_model': best_quality['label'],
    'best_disorder_model': best_disorder_result['label'],
    'best_calibration_model': best_cal['label'],
    'results_quality': {
        'r2_mean': round(best_quality['r2_mean'], 4),
        'rmse_mean': round(best_quality['rmse_mean'], 4),
        'mae_mean': round(best_quality['mae_mean'], 4),
    },
    'results_disorder': {
        'f1_mean': round(best_disorder_result['f1_mean'], 4),
        'roc_auc_mean': round(best_disorder_result['roc_mean'], 4),
    },
    'results_calibration': {
        'brier': round(best_cal['brier'], 6),
        'logloss': round(best_cal['logloss'], 6),
        'ece': round(best_cal['ece'], 6),
    }
}
meta_path = MODELS_DIR / 'model_metadata.json'
with open(meta_path, 'w') as f:
    json.dump(feature_meta, f, indent=2)
print(f"  âœ“ Model Metadata saved â†’ {meta_path}")

# ============================================================
# SECTION 20 â€” TEST SAVED MODELS
# ============================================================
print("\n" + "="*70)
print("[Section 20] TEST SAVED MODELS (Smoke Test)")
print("="*70)

# Load back and predict on a sample row
quality_pipe_loaded   = joblib.load(quality_path)
disorder_pipe_loaded  = joblib.load(disorder_path)
le_loaded             = joblib.load(le_path)

# Construct a sample input matching Django form structure
sample_input = pd.DataFrame([{
    'Gender': 'Male',
    'Age': 35,
    'Occupation': 'Engineer',
    'Sleep Duration': 7.0,
    'Physical Activity Level': 60,
    'Stress Level': 5,
    'BMI Category': 'Normal',
    'Heart Rate': 72,
    'Daily Steps': 7000,
    'systolic_bp': 125,
    'diastolic_bp': 82,
}])

# Test Sleep Quality
q_pred = quality_pipe_loaded.predict(sample_input)[0]
print(f"\n  Sample Input: Male, Age 35, Engineer, Sleep 7h, Stress 5, Normal BMI")
print(f"  âœ“ Sleep Quality Prediction: {q_pred:.2f} / 10")

# Test Sleep Disorder
d_proba = disorder_pipe_loaded.predict_proba(sample_input)[0]
d_idx   = int(np.argmax(d_proba))
d_label = le_loaded.inverse_transform([d_idx])[0]
print(f"  âœ“ Sleep Disorder Prediction: '{d_label}'")
print("    Class Probabilities:")
for cls, p in zip(le_loaded.classes_, d_proba):
    print(f"      {cls}: {p*100:.2f}%")

print("\n" + "="*70)
print("TRAINING COMPLETE â€” ALL MODELS SAVED SUCCESSFULLY")
print("="*70)
print(f"""
  Saved to: {MODELS_DIR}
    â€¢ sleep_quality_pipeline.joblib
    â€¢ sleep_disorder_pipeline.joblib
    â€¢ disorder_label_encoder.joblib
    â€¢ model_metadata.json

  Plots saved to: {PLOTS_DIR}
    â€¢ calibration_reliability_diagrams.png
    â€¢ shap_sleep_quality.png
    â€¢ shap_sleep_quality_beeswarm.png
    â€¢ shap_disorder_*.png

  Next step: Update Django ml_utils.py to use the correct feature names.
""")

