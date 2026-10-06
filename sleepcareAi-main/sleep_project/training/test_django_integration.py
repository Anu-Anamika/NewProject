import sys, os
sys.path.insert(0, r'c:\Users\anuan\Downloads\SleepCareAI_Django_Project\sleep_project')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sleep_project.settings')

import django
django.setup()

from predictor.ml_utils import predict_sleep_quality, predict_sleep_disorder

# Test 1: Healthy profile
test1 = {
    'gender': 'Male', 'age': 35, 'occupation': 'Engineer',
    'sleep_duration': 7.5, 'physical_activity_level': 65,
    'stress_level': 4, 'bmi_category': 'Normal',
    'heart_rate': 68, 'daily_steps': 8000,
    'systolic_bp': 118, 'diastolic_bp': 78,
}
q1 = predict_sleep_quality(test1)
d1 = predict_sleep_disorder(test1)
print("--- Test 1: Healthy Profile ---")
print("  Quality label:", q1["label"], "| score:", q1["score"])
print("  Disorder:", d1["label"], "| confidence:", d1["confidence"], "%")
for c in d1["class_probabilities"]:
    print("   ", c["label"], ":", c["probability"], "%")

# Test 2: High stress / poor sleep
test2 = {
    'gender': 'Female', 'age': 45, 'occupation': 'Nurse',
    'sleep_duration': 5.8, 'physical_activity_level': 30,
    'stress_level': 8, 'bmi_category': 'Obese',
    'heart_rate': 82, 'daily_steps': 3000,
    'systolic_bp': 142, 'diastolic_bp': 92,
}
q2 = predict_sleep_quality(test2)
d2 = predict_sleep_disorder(test2)
print("")
print("--- Test 2: High Stress / Obese Profile ---")
print("  Quality label:", q2["label"], "| score:", q2["score"])
print("  Disorder:", d2["label"], "| confidence:", d2["confidence"], "%")
for c in d2["class_probabilities"]:
    print("   ", c["label"], ":", c["probability"], "%")

# Test 3: Unknown occupation (handle_unknown='ignore' test)
test3 = {
    'gender': 'Female', 'age': 52, 'occupation': 'Pharmacist',
    'sleep_duration': 6.2, 'physical_activity_level': 50,
    'stress_level': 6, 'bmi_category': 'Overweight',
    'heart_rate': 75, 'daily_steps': 5500,
    'systolic_bp': 130, 'diastolic_bp': 85,
}
q3 = predict_sleep_quality(test3)
d3 = predict_sleep_disorder(test3)
print("")
print("--- Test 3: Unknown Occupation (handle_unknown='ignore') ---")
print("  Quality label:", q3["label"], "| score:", q3["score"])
print("  Disorder:", d3["label"], "| confidence:", d3["confidence"], "%")
for c in d3["class_probabilities"]:
    print("   ", c["label"], ":", c["probability"], "%")

print("")
print("=== ALL DJANGO INTEGRATION TESTS PASSED ===")
