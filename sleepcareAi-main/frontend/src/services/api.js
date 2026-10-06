/**
 * SleepCare AI API Client
 * Interfaces with Django backend for XGBoost model inference.
 */
import { getCsrfToken } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Predict sleep quality score (3.0 - 9.0) and qualitative label
 * @param {Object} data - Cleaned user health & lifestyle features
 * @returns {Promise<{score: number, label: string, score_percent: number, out_of: number}>}
 */
export async function predictSleepQuality(data) {
  const url = `${API_BASE}/api/predict/sleep-quality/`;
  const csrfToken = await getCsrfToken();

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    body: JSON.stringify(data),
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errorMsg = resData.error || (resData.field_errors ? 'Please verify your form inputs.' : 'Prediction failed');
    if (response.status === 401) {
      errorMsg = 'Your session has expired. Please sign in again.';
    }
    const err = new Error(errorMsg);
    err.fieldErrors = resData.field_errors;
    err.status = response.status;
    throw err;
  }

  return resData;
}

/**
 * Classify sleep disorder (None, Insomnia, Sleep Apnea) with class probabilities
 * @param {Object} data - Cleaned user health & lifestyle features
 * @returns {Promise<{label: string, confidence: number, class_probabilities: Array, calibration_note: string}>}
 */
export async function predictSleepDisorder(data) {
  const url = `${API_BASE}/api/predict/sleep-disorder/`;
  const csrfToken = await getCsrfToken();

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    body: JSON.stringify(data),
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errorMsg = resData.error || (resData.field_errors ? 'Please verify your form inputs.' : 'Prediction failed');
    if (response.status === 401) {
      errorMsg = 'Your session has expired. Please sign in again.';
    }
    const err = new Error(errorMsg);
    err.fieldErrors = resData.field_errors;
    err.status = response.status;
    throw err;
  }

  return resData;
}

/**
 * Save a chatbot sleep assessment to the backend.
 * The backend associates it with request.user — no user ID sent from client.
 *
 * @param {Object} answers - Raw answers object from the chatbot assessment flow
 * @returns {Promise<{success: boolean, id: number}>}
 */
export async function saveAssessment(answers) {
  const url = `${API_BASE}/api/assessments/`;
  const csrfToken = await getCsrfToken();

  // Map chatbot answer keys → backend field names
  // Yes/No answers come in as 'yes'/'no' strings — backend validates and converts to boolean
  const payload = {
    age:                       answers.age,
    gender:                    answers.gender,
    occupation:                answers.occupation,
    difficulty_falling_asleep: answers.difficulty_falling_asleep,
    frequent_night_awakenings: answers.frequent_waking,
    early_morning_awakening:   answers.early_waking,
    daytime_sleepiness:        answers.daytime_sleepiness,
    loud_snoring:              answers.loud_snoring,
    gasping_or_choking:        answers.waking_gasping,
    dry_mouth_or_sore_throat:  answers.dry_mouth,
    morning_headache:          answers.morning_headache,
    unrefreshing_sleep:        answers.tired_after_sleep,
    sleep_duration:            answers.sleep_hours,
  };

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    body: JSON.stringify(payload),
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errorMsg = resData.error || 'Failed to save assessment.';
    if (response.status === 401) {
      errorMsg = 'Your session has expired. Please sign in again.';
    }
    const err = new Error(errorMsg);
    err.fieldErrors = resData.field_errors;
    err.status = response.status;
    throw err;
  }

  return resData; // { success: true, id: <int> }
}

/**
 * Retrieve a saved chatbot assessment by ID.
 * Used by the prediction page to pre-fill the HealthInputForm.
 * Only the owner (request.user) can retrieve their own assessment.
 *
 * @param {number} assessmentId
 * @returns {Promise<Object>} The assessment data
 */
export async function getAssessment(assessmentId) {
  const url = `${API_BASE}/api/assessments/${assessmentId}/`;

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = new Error(resData.error || 'Failed to load assessment.');
    err.status = response.status;
    throw err;
  }

  return resData;
}

/**
 * Retrieve a saved SleepAnalysis by ID.
 * Includes quality score, disorder predictions, model probabilities,
 * explainable AI information, and linked chatbot assessment.
 * Only the authenticated owner can access.
 *
 * @param {number} analysisId
 * @returns {Promise<Object>}
 */
export async function getAnalysis(analysisId) {
  const url = `${API_BASE}/api/analyses/${analysisId}/`;

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = new Error(resData.error || 'Failed to load analysis details.');
    err.status = response.status;
    throw err;
  }

  return resData;
}

/**
 * Download a PDF report for a saved assessment.
 * GET /api/assessments/{id}/report/
 * Only authenticated owner can download.
 *
 * @param {number} assessmentId
 * @param {string} [customFilename]
 */
export async function downloadAssessmentReport(assessmentId, customFilename) {
  const url = `${API_BASE}/api/assessments/${assessmentId}/report/`;

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    let errorMsg = 'Failed to generate PDF report.';
    try {
      const resData = await response.json();
      if (resData.error) errorMsg = resData.error;
    } catch (e) {
      // response is not JSON
    }
    throw new Error(errorMsg);
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = customFilename || `SleepCare_Report_Assessment_${assessmentId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}

/**
 * Download a PDF report for a saved analysis.
 * GET /api/analyses/{id}/report/
 *
 * @param {number} analysisId
 * @param {string} [customFilename]
 */
export async function downloadAnalysisReport(analysisId, customFilename) {
  const url = `${API_BASE}/api/analyses/${analysisId}/report/`;

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    let errorMsg = 'Failed to generate PDF report.';
    try {
      const resData = await response.json();
      if (resData.error) errorMsg = resData.error;
    } catch (e) {
      // response is not JSON
    }
    throw new Error(errorMsg);
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = customFilename || `SleepCare_Report_Analysis_${analysisId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}

/**
 * Delete a saved sleep analysis by ID.
 * DELETE /api/analyses/{id}/
 *
 * @param {number} analysisId
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function deleteAnalysis(analysisId) {
  const url = `${API_BASE}/api/analyses/${analysisId}/`;
  const csrfToken = await getCsrfToken();

  const response = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'X-CSRFToken': csrfToken,
    },
  });

  const resData = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(resData.error || 'Failed to delete analysis.');
    err.status = response.status;
    throw err;
  }

  return resData;
}

/**
 * Delete an individual analysis record or clear all history.
 * DELETE /api/history/
 *
 * @param {string} type - 'assessment' | 'quality' | 'disorder' | 'all'
 * @param {number} [id] - The record ID (not needed if type === 'all')
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function deleteHistoryItem(type, id) {
  const url = `${API_BASE}/api/history/`;
  const csrfToken = await getCsrfToken();

  const response = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    body: JSON.stringify({ type, id }),
  });

  const resData = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(resData.error || 'Failed to delete history record.');
    err.status = response.status;
    throw err;
  }

  return resData;
}
