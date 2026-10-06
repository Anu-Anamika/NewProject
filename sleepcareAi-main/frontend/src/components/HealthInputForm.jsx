import React, { useState, useEffect } from 'react';
import FormField from './FormField';
import {
  FileSpreadsheet,
  Lock,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

const GENDER_OPTIONS = [
  { value: '', label: 'Select gender', disabled: true },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
];

const OCCUPATION_OPTIONS = [
  { value: '', label: 'Select occupation', disabled: true },
  { value: 'Software Engineer', label: 'Software Engineer' },
  { value: 'Doctor', label: 'Doctor' },
  { value: 'Sales Representative', label: 'Sales Representative' },
  { value: 'Teacher', label: 'Teacher' },
  { value: 'Nurse', label: 'Nurse' },
  { value: 'Engineer', label: 'Engineer' },
  { value: 'Accountant', label: 'Accountant' },
  { value: 'Scientist', label: 'Scientist' },
  { value: 'Lawyer', label: 'Lawyer' },
  { value: 'Salesperson', label: 'Salesperson' },
  { value: 'Manager', label: 'Manager' },
];

const BMI_OPTIONS = [
  { value: '', label: 'Select BMI category', disabled: true },
  { value: 'Normal', label: 'Normal' },
  { value: 'Overweight', label: 'Overweight' },
  { value: 'Obese', label: 'Obese' },
];

const INITIAL_FORM_STATE = {
  gender: '',
  age: '',
  occupation: '',
  sleep_duration: '',
  physical_activity_level: '',
  stress_level: '',
  daily_steps: '',
  bmi_category: '',
  heart_rate: '',
  systolic_bp: '',
  diastolic_bp: '',
};

export default function HealthInputForm({
  mode = 'quality',
  onSubmit,
  isLoading = false,
  apiError = null,
  initialData = null,   // Optional: pre-filled values from chatbot assessment
}) {
  const [formData, setFormData] = useState(() => ({
    ...INITIAL_FORM_STATE,
    ...(initialData || {}),   // merge — only non-empty values override blanks
  }));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  const isQuality = mode === 'quality';
  const isAnalysis = mode === 'analysis';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear individual error as user types
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        delete next.general;
        return next;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // 1. Gender
    if (!formData.gender) {
      newErrors.gender = 'Please select a gender.';
    }

    // 2. Age
    const ageNum = parseInt(formData.age, 10);
    if (!formData.age || isNaN(ageNum)) {
      newErrors.age = 'Age is required.';
    } else if (ageNum < 1 || ageNum > 120) {
      newErrors.age = 'Age must be between 1 and 120.';
    }

    // 3. Occupation
    if (!formData.occupation) {
      newErrors.occupation = 'Please select an occupation.';
    }

    // 4. Sleep Duration
    const sleepNum = parseFloat(formData.sleep_duration);
    if (!formData.sleep_duration || isNaN(sleepNum)) {
      newErrors.sleep_duration = 'Sleep duration is required.';
    } else if (sleepNum < 0 || sleepNum > 24) {
      newErrors.sleep_duration = 'Duration must be between 0 and 24 hours.';
    }

    // 5. Physical Activity
    const activityNum = parseInt(formData.physical_activity_level, 10);
    if (formData.physical_activity_level === '' || isNaN(activityNum)) {
      newErrors.physical_activity_level = 'Activity level is required.';
    } else if (activityNum < 0 || activityNum > 100) {
      newErrors.physical_activity_level = 'Activity must be 0 to 100 min/day.';
    }

    // 6. Stress Level
    const stressNum = parseInt(formData.stress_level, 10);
    if (formData.stress_level === '' || isNaN(stressNum)) {
      newErrors.stress_level = 'Stress level is required.';
    } else if (stressNum < 1 || stressNum > 10) {
      newErrors.stress_level = 'Stress must be between 1 and 10.';
    }

    // 7. Daily Steps
    const stepsNum = parseInt(formData.daily_steps, 10);
    if (formData.daily_steps === '' || isNaN(stepsNum)) {
      newErrors.daily_steps = 'Daily steps are required.';
    } else if (stepsNum < 0 || stepsNum > 50000) {
      newErrors.daily_steps = 'Steps must be 0 to 50,000.';
    }

    // 8. BMI Category
    if (!formData.bmi_category) {
      newErrors.bmi_category = 'Please select a BMI category.';
    }

    // 9. Heart Rate
    const hrNum = parseInt(formData.heart_rate, 10);
    if (formData.heart_rate === '' || isNaN(hrNum)) {
      newErrors.heart_rate = 'Heart rate is required.';
    } else if (hrNum < 30 || hrNum > 220) {
      newErrors.heart_rate = 'Heart rate must be 30 to 220 bpm.';
    }

    // 10. Systolic BP
    const sysNum = parseInt(formData.systolic_bp, 10);
    if (formData.systolic_bp === '' || isNaN(sysNum)) {
      newErrors.systolic_bp = 'Systolic BP is required.';
    } else if (sysNum < 70 || sysNum > 250) {
      newErrors.systolic_bp = 'Systolic must be 70 to 250 mmHg.';
    }

    // 11. Diastolic BP
    const diaNum = parseInt(formData.diastolic_bp, 10);
    if (formData.diastolic_bp === '' || isNaN(diaNum)) {
      newErrors.diastolic_bp = 'Diastolic BP is required.';
    } else if (diaNum < 40 || diaNum > 150) {
      newErrors.diastolic_bp = 'Diastolic must be 40 to 150 mmHg.';
    }

    // Comparison: Systolic > Diastolic
    if (!newErrors.systolic_bp && !newErrors.diastolic_bp) {
      if (diaNum >= sysNum) {
        newErrors.diastolic_bp = 'Diastolic must be lower than systolic BP.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (!validateForm()) {
      return;
    }

    // Cleaned data formatted for Django API
    const cleanedPayload = {
      gender: formData.gender,
      age: parseInt(formData.age, 10),
      occupation: formData.occupation,
      sleep_duration: parseFloat(formData.sleep_duration),
      physical_activity_level: parseInt(formData.physical_activity_level, 10),
      stress_level: parseInt(formData.stress_level, 10),
      daily_steps: parseInt(formData.daily_steps, 10),
      bmi_category: formData.bmi_category,
      heart_rate: parseInt(formData.heart_rate, 10),
      systolic_bp: parseInt(formData.systolic_bp, 10),
      diastolic_bp: parseInt(formData.diastolic_bp, 10),
    };

    onSubmit(cleanedPayload);
  };

  return (
    <div className="sc-card">
      <div className="sc-card-header">
        <div className="sc-card-icon-box" aria-hidden="true">
          <FileSpreadsheet size={22} />
        </div>
        <div className="sc-card-titles">
          <h2 className="sc-card-title">Your Information</h2>
          <p className="sc-card-subtitle">
            {isAnalysis
              ? 'Fill in the details below to analyze your sleep quality and disorder risk.'
              : isQuality
              ? 'Fill in the details below to predict your sleep quality score.'
              : 'Fill in the details below to analyze your sleep disorder risk.'}
          </p>
        </div>
      </div>

      <form className="sc-form" onSubmit={handleSubmit} noValidate>
        {apiError && (
          <div className="sc-form-global-error" role="alert">
            <AlertTriangle size={18} />
            <span>{apiError}</span>
          </div>
        )}

        <div className="sc-form-grid">
          {/* Row 1: Gender, Age, Occupation */}
          <FormField
            id="field-gender"
            name="gender"
            label="Gender"
            type="select"
            value={formData.gender}
            onChange={handleChange}
            options={GENDER_OPTIONS}
            error={errors.gender}
            disabled={isLoading}
          />

          <FormField
            id="field-age"
            name="age"
            label="Age (years)"
            type="number"
            value={formData.age}
            onChange={handleChange}
            min={1}
            max={120}
            error={errors.age}
            disabled={isLoading}
          />

          <FormField
            id="field-occupation"
            name="occupation"
            label="Occupation"
            type="select"
            value={formData.occupation}
            onChange={handleChange}
            options={OCCUPATION_OPTIONS}
            error={errors.occupation}
            disabled={isLoading}
          />

          {/* Row 2: Sleep Duration, Physical Activity, Stress Level */}
          <FormField
            id="field-sleep-duration"
            name="sleep_duration"
            label="Sleep Duration (hours)"
            type="number"
            value={formData.sleep_duration}
            onChange={handleChange}
            step="0.1"
            min={0}
            max={24}
            error={errors.sleep_duration}
            disabled={isLoading}
          />

          <FormField
            id="field-physical-activity"
            name="physical_activity_level"
            label="Physical Activity (minutes/day)"
            type="number"
            value={formData.physical_activity_level}
            onChange={handleChange}
            min={0}
            max={100}
            error={errors.physical_activity_level}
            disabled={isLoading}
          />

          <FormField
            id="field-stress-level"
            name="stress_level"
            label="Stress Level (1–10)"
            type="number"
            value={formData.stress_level}
            onChange={handleChange}
            min={1}
            max={10}
            error={errors.stress_level}
            disabled={isLoading}
          />

          {/* Row 3: Daily Steps, BMI Category */}
          <FormField
            id="field-daily-steps"
            name="daily_steps"
            label="Daily Steps"
            type="number"
            value={formData.daily_steps}
            onChange={handleChange}
            min={0}
            max={50000}
            error={errors.daily_steps}
            disabled={isLoading}
          />

          <FormField
            id="field-bmi"
            name="bmi_category"
            label="BMI Category"
            type="select"
            value={formData.bmi_category}
            onChange={handleChange}
            options={BMI_OPTIONS}
            error={errors.bmi_category}
            disabled={isLoading}
            className="sc-form-col-span-2"
          />

          {/* Row 4: Heart Rate, Systolic BP, Diastolic BP */}
          <FormField
            id="field-heart-rate"
            name="heart_rate"
            label="Heart Rate (bpm)"
            type="number"
            value={formData.heart_rate}
            onChange={handleChange}
            min={30}
            max={220}
            error={errors.heart_rate}
            disabled={isLoading}
          />

          <FormField
            id="field-systolic-bp"
            name="systolic_bp"
            label="Systolic BP (mmHg)"
            type="number"
            value={formData.systolic_bp}
            onChange={handleChange}
            min={70}
            max={250}
            error={errors.systolic_bp}
            disabled={isLoading}
          />

          <FormField
            id="field-diastolic-bp"
            name="diastolic_bp"
            label="Diastolic BP (mmHg)"
            type="number"
            value={formData.diastolic_bp}
            onChange={handleChange}
            min={40}
            max={150}
            error={errors.diastolic_bp}
            disabled={isLoading}
          />
        </div>

        {/* Prediction Button */}
        <div>
          <button
            type="submit"
            className="sc-btn-predict"
            disabled={isLoading}
            id="submit-prediction-btn"
          >
            {isLoading ? (
              <>
                <div className="sc-spinner" aria-hidden="true" />
                <span>Analyzing your data...</span>
              </>
            ) : isAnalysis ? (
              <>
                <ShieldCheck size={18} />
                <span>Predict Sleep Health →</span>
              </>
            ) : isQuality ? (
              <>
                <BarChart3 size={18} />
                <span>Predict Sleep Quality →</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Predict Sleep Disorder →</span>
              </>
            )}
          </button>

          <p className="sc-form-footer-note">
            <Lock size={13} aria-hidden="true" />
            <span>Your data is not stored. Predictions are generated in real-time.</span>
          </p>
        </div>
      </form>
    </div>
  );
}
