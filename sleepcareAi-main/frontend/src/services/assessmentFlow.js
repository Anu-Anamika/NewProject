/**
 * SleepCare AI — Assessment Flow Definition
 * Defines the 13-question guided sleep assessment.
 * No LLM, no backend — pure rule-based question flow.
 */

export const QUESTIONS = [
  // ── Section 1: About You ──────────────────────────────────────────────────
  {
    id: 'age',
    type: 'number',
    label: 'Age',
    question: 'What is your age?',
    placeholder: 'Enter your age (e.g. 28)',
    min: 5,
    max: 110,
  },
  {
    id: 'gender',
    type: 'options',
    label: 'Gender',
    question: 'What is your gender?',
    options: ['Male', 'Female', 'Other', 'Prefer not to say'],
    columns: 2,
  },
  {
    id: 'occupation',
    type: 'text',
    label: 'Occupation',
    question: 'What is your usual occupation?',
    placeholder: 'e.g. Engineer, Teacher, Student...',
  },

  // ── Section 2: Your Sleep ─────────────────────────────────────────────────
  {
    id: 'difficulty_falling_asleep',
    type: 'yesno',
    label: 'Difficulty Falling Asleep',
    question: 'Do you often have difficulty falling asleep?',
    preamble: '😴 Let\'s talk about your sleep.',
  },
  {
    id: 'frequent_waking',
    type: 'yesno',
    label: 'Frequent Night Waking',
    question: 'Do you frequently wake up during the night?',
  },
  {
    id: 'early_waking',
    type: 'yesno',
    label: 'Early Morning Waking',
    question: 'Do you wake up earlier than you want and struggle to fall asleep again?',
  },
  {
    id: 'daytime_sleepiness',
    type: 'yesno',
    label: 'Daytime Sleepiness',
    question: 'Do you often feel tired or sleepy during the daytime?',
  },
  {
    id: 'loud_snoring',
    type: 'yesno',
    label: 'Loud Snoring',
    question: 'Have you been told that you snore loudly while sleeping?',
  },
  {
    id: 'waking_gasping',
    type: 'yesno',
    label: 'Waking Gasping / Choking',
    question: 'Do you ever wake up gasping, choking, or short of breath?',
  },
  {
    id: 'dry_mouth',
    type: 'yesno',
    label: 'Dry Mouth / Sore Throat',
    question: 'Do you sometimes wake up with a dry mouth or sore throat?',
  },
  {
    id: 'morning_headache',
    type: 'yesno',
    label: 'Morning Headaches',
    question: 'Do you often wake up with a headache?',
  },
  {
    id: 'tired_after_sleep',
    type: 'yesno',
    label: 'Tired Despite Sleeping',
    question: 'Do you feel tired even after getting what seems like enough sleep?',
  },
  {
    id: 'sleep_hours',
    type: 'options',
    label: 'Nightly Sleep Duration',
    question: 'Approximately how many hours do you usually sleep each night?',
    options: [
      'Less than 5 hours',
      '5–6 hours',
      '6–7 hours',
      '7–9 hours',
      'More than 9 hours',
    ],
    columns: 1,
  },
];

/** Total question count */
export const TOTAL_QUESTIONS = QUESTIONS.length;

/**
 * Formats a raw answer value for display in the review card.
 * @param {object} question
 * @param {*} value
 * @returns {string}
 */
export function formatAnswerForReview(question, value) {
  if (question.type === 'yesno') {
    return value === 'yes' ? '✅ Yes' : '❌ No';
  }
  return String(value ?? '—');
}
