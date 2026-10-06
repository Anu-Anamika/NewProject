import os
import pandas as pd
import numpy as np

csv_path = r'c:\Users\anuan\Downloads\SleepCareAI_Django_Project\sleep_project\training\sleep_health_dataset.csv'
df = pd.read_csv(csv_path)

print("="*80)
print("COMPREHENSIVE DATASET INSPECTION REPORT")
print("="*80)

# 1. Number of rows and columns
print(f"1. Dimensions: {df.shape[0]} rows, {df.shape[1]} columns")

# 2. All column names
print("\n2. Column Names:")
for i, col in enumerate(df.columns, 1):
    print(f"   {i}. {col}")

# 3. Data types
print("\n3. Data Types:")
print(df.dtypes)

# 4. Missing values
print("\n4. Missing Values per Column:")
null_counts = df.isnull().sum()
print(null_counts)
print(f"   Total missing values: {null_counts.sum()}")

# 5. Duplicate rows (excluding Person ID)
dups_all = df.duplicated().sum()
dups_no_id = df.drop(columns=['Person ID']).duplicated().sum() if 'Person ID' in df.columns else df.duplicated().sum()
print(f"\n5. Duplicate Rows:")
print(f"   Exact duplicates (including Person ID): {dups_all}")
print(f"   Duplicates (ignoring Person ID): {dups_no_id}")

# 6. Unique values of categorical columns
print("\n6. Unique Values of Categorical Columns:")
cat_cols = df.select_dtypes(include=['object']).columns
for col in cat_cols:
    uniq = df[col].unique()
    print(f"\n   Column: '{col}' (Total unique: {len(uniq)})")
    val_counts = df[col].value_counts(dropna=False)
    for val, count in val_counts.items():
        pct = (count / len(df)) * 100
        print(f"     - '{val}': {count} ({pct:.2f}%)")

# 7. Distribution of every potential target variable
print("\n7. Distribution of Potential Target Variables:")
print("\n   Target 1: 'Quality of Sleep'")
print(f"     Type: {df['Quality of Sleep'].dtype}")
print(f"     Summary Stats: min={df['Quality of Sleep'].min()}, max={df['Quality of Sleep'].max()}, mean={df['Quality of Sleep'].mean():.2f}, std={df['Quality of Sleep'].std():.2f}, median={df['Quality of Sleep'].median()}")
qos_counts = df['Quality of Sleep'].value_counts().sort_index()
for score, count in qos_counts.items():
    pct = (count / len(df)) * 100
    print(f"     Score {score}: {count} ({pct:.2f}%)")

print("\n   Target 2: 'Sleep Disorder'")
sd_counts = df['Sleep Disorder'].value_counts(dropna=False)
for cls, count in sd_counts.items():
    pct = (count / len(df)) * 100
    print(f"     Class '{cls}': {count} ({pct:.2f}%)")

# Also check numerical summary of other features
print("\n--- Numerical Feature Distributions ---")
num_cols = df.select_dtypes(include=[np.number]).columns
print(df[num_cols].describe().T[['mean', 'std', 'min', '25%', '50%', '75%', 'max']])

# Check Blood pressure parsing
if 'Blood Pressure' in df.columns:
    bp_split = df['Blood Pressure'].str.split('/', expand=True)
    df['systolic_bp'] = pd.to_numeric(bp_split[0], errors='coerce')
    df['diastolic_bp'] = pd.to_numeric(bp_split[1], errors='coerce')
    print("\n--- Blood Pressure Decomposition ---")
    print(f"Systolic BP range: {df['systolic_bp'].min()} - {df['systolic_bp'].max()}, mean={df['systolic_bp'].mean():.2f}")
    print(f"Diastolic BP range: {df['diastolic_bp'].min()} - {df['diastolic_bp'].max()}, mean={df['diastolic_bp'].mean():.2f}")

# Check correlation with targets
print("\n--- Correlation with Quality of Sleep ---")
corrs = df.corr(numeric_only=True)['Quality of Sleep'].sort_values(ascending=False)
print(corrs)
