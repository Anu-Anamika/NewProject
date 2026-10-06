import json
import os
import re
import pandas as pd
import numpy as np

transcript_path = r"C:\Users\anuan\.gemini\antigravity-ide\brain\619f8237-8c53-4467-a69e-c1d06f33c42a\.system_generated\logs\transcript_full.jsonl"
output_csv_path = r"c:\Users\anuan\Downloads\SleepCareAI_Django_Project\sleep_project\training\sleep_health_dataset.csv"

# Find user input from transcript
found_csv = None
with open(transcript_path, "r", encoding="utf-8") as f:
    for line in f:
        data = json.loads(line)
        if data.get("type") == "USER_INPUT":
            content = data.get("content", "")
            if "Person ID,Gender,Age" in content:
                # Extract starting from Person ID
                idx = content.find("Person ID,Gender,Age")
                found_csv = content[idx:].strip()
                break

if not found_csv:
    print("CSV not found in transcript!")
else:
    with open(output_csv_path, "w", encoding="utf-8") as f:
        f.write(found_csv)
    print(f"Saved CSV to {output_csv_path}")

df = pd.read_csv(output_csv_path)
print(f"--- 1. Number of rows and columns ---")
print(f"Rows: {df.shape[0]}, Columns: {df.shape[1]}")

print(f"\n--- 2. All column names ---")
print(df.columns.tolist())

print(f"\n--- 3. Data types ---")
print(df.dtypes)

print(f"\n--- 4. Missing values ---")
print(df.isnull().sum())

print(f"\n--- 5. Duplicate rows ---")
# Check without Person ID and with Person ID
print(f"Exact duplicates (all cols): {df.duplicated().sum()}")
features_cols = [c for c in df.columns if c != 'Person ID']
print(f"Duplicates ignoring Person ID: {df.duplicated(subset=features_cols).sum()}")

print(f"\n--- 6. Unique values of categorical columns ---")
for col in df.select_dtypes(include=['object', 'category']).columns:
    print(f"\nColumn '{col}': {df[col].nunique()} unique values")
    print(df[col].value_counts(dropna=False))

print(f"\n--- Numerical columns summary ---")
print(df.describe().T[['min', 'mean', '50%', 'max', 'std']])

print(f"\n--- 7. Distribution of potential target variables ---")
if 'Quality of Sleep' in df.columns:
    print("\n'Quality of Sleep' distribution:")
    print(df['Quality of Sleep'].value_counts().sort_index())
    print("Stats:", df['Quality of Sleep'].describe())

if 'Sleep Disorder' in df.columns:
    print("\n'Sleep Disorder' distribution:")
    print(df['Sleep Disorder'].value_counts(dropna=False))

print(f"\n--- Additional Checks: Blood Pressure format ---")
if 'Blood Pressure' in df.columns:
    print("Sample Blood Pressure values:", df['Blood Pressure'].head(10).tolist())
    bp_parts = df['Blood Pressure'].str.split('/', expand=True)
    print("BP split shape:", bp_parts.shape)
    print("Systolic range:", bp_parts[0].astype(int).min(), "-", bp_parts[0].astype(int).max())
    print("Diastolic range:", bp_parts[1].astype(int).min(), "-", bp_parts[1].astype(int).max())

print(f"\n--- Synthetic vs Real Analysis ---")
# Check correlation matrix and distributions
numeric_df = df.select_dtypes(include=[np.number])
print("Correlation with Quality of Sleep:")
if 'Quality of Sleep' in numeric_df.columns:
    print(numeric_df.corr()['Quality of Sleep'].sort_values(ascending=False))

print(f"\n--- Value counts of BMI Category ---")
print(df['BMI Category'].value_counts())

print(f"\n--- Value counts of Occupation ---")
print(df['Occupation'].value_counts())
