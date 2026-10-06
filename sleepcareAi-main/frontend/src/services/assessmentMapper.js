/**
 * SleepCare AI — Assessment → Prediction Form Mapper
 *
 * Maps the 3 fields that the chatbot assessment and the ML prediction form
 * share in common. The remaining 8 fields (physical_activity_level,
 * stress_level, bmi_category, heart_rate, daily_steps, systolic_bp,
 * diastolic_bp, sleep_duration numeric) are NOT collected by the chatbot
 * and must be entered by the user in the prediction form.
 *
 * IMPORTANT: This mapper NEVER invents data for missing fields.
 * Missing fields remain empty strings so the form validates them as required.
 */

// ---------------------------------------------------------------------------
// Occupation mapping
// The chatbot accepts free-text occupation. The ML model was trained on a
// fixed vocabulary of 11 occupation labels. We attempt a fuzzy match; if
// we can't confidently match, we leave the field empty so the user selects.
// ---------------------------------------------------------------------------

const ML_OCCUPATIONS = [
  'Software Engineer',
  'Doctor',
  'Sales Representative',
  'Teacher',
  'Nurse',
  'Engineer',
  'Accountant',
  'Scientist',
  'Lawyer',
  'Salesperson',
  'Manager',
];

/**
 * Attempts to map a free-text occupation string to the nearest ML vocabulary
 * label. Returns the matched label, or '' if no confident match found.
 *
 * @param {string} rawOccupation - Free text from chatbot
 * @returns {string} ML occupation label, or '' if no match
 */
export function mapOccupation(rawOccupation) {
  if (!rawOccupation) return '';

  const lower = rawOccupation.toLowerCase().trim();

  // Direct case-insensitive match first
  const exactMatch = ML_OCCUPATIONS.find(
    (o) => o.toLowerCase() === lower
  );
  if (exactMatch) return exactMatch;

  // Keyword-based partial matches — conservative, only high-confidence cases
  const KEYWORD_MAP = [
    { keywords: ['software', 'developer', 'programmer', 'coder', 'frontend', 'backend', 'fullstack', 'full stack', 'swe'], label: 'Software Engineer' },
    { keywords: ['doctor', 'physician', 'surgeon', 'gp', 'general practitioner', 'medic'], label: 'Doctor' },
    { keywords: ['sales representative', 'sales rep', 'sales exec'], label: 'Sales Representative' },
    { keywords: ['teacher', 'instructor', 'tutor', 'lecturer', 'professor', 'educator'], label: 'Teacher' },
    { keywords: ['nurse', 'rn ', 'registered nurse', 'nursing'], label: 'Nurse' },
    { keywords: ['engineer', 'civil engineer', 'mechanical engineer', 'electrical engineer', 'chemical engineer'], label: 'Engineer' },
    { keywords: ['accountant', 'accounting', 'bookkeeper', 'auditor', 'cpa'], label: 'Accountant' },
    { keywords: ['scientist', 'researcher', 'research', 'biologist', 'chemist', 'physicist'], label: 'Scientist' },
    { keywords: ['lawyer', 'attorney', 'solicitor', 'barrister', 'legal'], label: 'Lawyer' },
    { keywords: ['salesperson', 'salesman', 'saleswoman', 'retail', 'shop assistant'], label: 'Salesperson' },
    { keywords: ['manager', 'management', 'supervisor', 'director', 'head of'], label: 'Manager' },
  ];

  for (const { keywords, label } of KEYWORD_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return label;
    }
  }

  // No confident match — return empty so user must select
  return '';
}

// ---------------------------------------------------------------------------
// Gender mapping
// The chatbot accepts: Male | Female | Other | Prefer not to say
// The ML model was only trained on Male and Female.
// For Other / Prefer not to say we leave blank — user must select.
// ---------------------------------------------------------------------------

/**
 * Maps chatbot gender to ML form gender (Male/Female only).
 * Returns '' for values outside the training distribution.
 *
 * @param {string} chatbotGender
 * @returns {string}
 */
export function mapGender(chatbotGender) {
  if (chatbotGender === 'Male' || chatbotGender === 'Female') {
    return chatbotGender;
  }
  // 'Other' and 'Prefer not to say' are outside training distribution
  return '';
}

// ---------------------------------------------------------------------------
// Sleep duration mapping
// The chatbot collects a duration band (string). The ML model requires a
// numeric float (hours). We use the midpoint of each band.
// ---------------------------------------------------------------------------

const DURATION_BAND_TO_MIDPOINT = {
  'Less than 5 hours': '4.5',
  '5–6 hours':         '5.5',
  '6–7 hours':         '6.5',
  '7–9 hours':         '8.0',
  'More than 9 hours': '9.5',
};

/**
 * Converts a sleep duration band string → numeric midpoint string.
 * Returns '' if not recognised (won't happen with valid assessment data).
 *
 * @param {string} band
 * @returns {string}
 */
export function mapSleepDuration(band) {
  return DURATION_BAND_TO_MIDPOINT[band] ?? '';
}

// ---------------------------------------------------------------------------
// Main mapper — converts a full assessment object → HealthInputForm initialData
// ---------------------------------------------------------------------------

/**
 * Produces the `initialData` object for HealthInputForm from a saved
 * SleepAssessment. Only the 3 overlapping fields (+ sleep_duration via
 * midpoint) are pre-filled. The remaining 7 clinical fields are left as
 * empty strings so the form correctly marks them as required.
 *
 * @param {Object} assessment - Data from GET /api/assessments/<id>/
 * @returns {{ prefilled: Object, unmappedFields: string[] }}
 */
export function mapAssessmentToFormPrefill(assessment) {
  const mappedGender     = mapGender(assessment.gender);
  const mappedOccupation = mapOccupation(assessment.occupation);
  const mappedDuration   = mapSleepDuration(assessment.sleep_duration);

  // Track which fields could NOT be auto-mapped so the UI can tell the user
  const unmappedFields = [];
  if (!mappedGender)     unmappedFields.push('Gender (select manually — your answer is outside training distribution)');
  if (!mappedOccupation) unmappedFields.push(`Occupation (no close match for "${assessment.occupation}" — please select)`);

  return {
    prefilled: {
      // ── Pre-filled from assessment ─────────────────────────
      gender:           mappedGender,
      age:              String(assessment.age),
      occupation:       mappedOccupation,
      sleep_duration:   mappedDuration,

      // ── Must be entered by user (not collected by chatbot) ─
      physical_activity_level: '',
      stress_level:            '',
      daily_steps:             '',
      bmi_category:            '',
      heart_rate:              '',
      systolic_bp:             '',
      diastolic_bp:            '',
    },
    unmappedFields,
    // Raw assessment data preserved for future use / display
    assessment,
  };
}
