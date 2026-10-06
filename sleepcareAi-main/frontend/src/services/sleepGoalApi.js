/**
 * SleepCare AI — User-Specific Sleep Goal API Service
 * Handles 21-Day Sleep Challenge Goals and Daily Tracking Records.
 * All goals, daily records, streaks, and progress calculations are strictly
 * scoped to the currently authenticated user with user-specific persistence.
 */

import { getCsrfToken } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Clean up any legacy shared localStorage keys so they never leak across users
try {
  localStorage.removeItem('sleepcare_active_goal');
  localStorage.removeItem('sleepcare_tracking_records');
} catch {
  // Ignore in environments without window.localStorage
}

/**
 * Helper to get user-isolated localStorage keys.
 */
export function getUserStorageKeys(userId) {
  const scope = userId ? `user_${userId}` : 'guest';
  return {
    goalKey: `sleepcare_active_goal_${scope}`,
    recordsKey: `sleepcare_tracking_records_${scope}`,
  };
}

/**
 * Compute real-time streak and progress metrics from records list.
 * Streak rule: Count consecutive achieved days ending with the most recent recorded day.
 * Do not count future days or unrecorded days.
 */
export function calculateGoalStats(records = [], targetDuration = 480) {
  const validRecords = (records || []).filter(
    (r) => r.actual_sleep_duration !== null && r.actual_sleep_duration !== undefined
  );

  const recordedDaysCount = validRecords.length;
  let achievedDaysCount = 0;
  let missedDaysCount = 0;

  validRecords.forEach((r) => {
    const isAchieved =
      r.goal_achieved !== null && r.goal_achieved !== undefined
        ? r.goal_achieved
        : r.actual_sleep_duration >= targetDuration;
    if (isAchieved) {
      achievedDaysCount++;
    } else {
      missedDaysCount++;
    }
  });

  const successRate =
    recordedDaysCount > 0 ? Math.round((achievedDaysCount / recordedDaysCount) * 100) : 0;

  let currentStreak = 0;
  const sorted = [...validRecords].sort((a, b) => a.day_number - b.day_number);

  for (let i = sorted.length - 1; i >= 0; i--) {
    const isAchieved =
      sorted[i].goal_achieved !== null && sorted[i].goal_achieved !== undefined
        ? sorted[i].goal_achieved
        : sorted[i].actual_sleep_duration >= targetDuration;

    if (isAchieved) {
      currentStreak++;
    } else {
      break;
    }
  }

  return {
    recordedDaysCount,
    achievedDaysCount,
    missedDaysCount,
    successRate,
    currentStreak,
    totalDays: 21,
  };
}

/**
 * Parse a time string into total minutes from midnight (0..1439).
 * Supports formats like "10:30 PM", "10:30pm", "22:30", "6:30 AM", "06:30", etc.
 */
export function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const str = timeStr.trim();
  const match = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([aApP][mM])?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3] ? match[3].toUpperCase() : null;

  if (isNaN(hours) || isNaN(minutes)) return null;
  if (minutes < 0 || minutes > 59) return null;

  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (meridiem === 'AM') {
      hours = hours === 12 ? 0 : hours;
    } else if (meridiem === 'PM') {
      hours = hours === 12 ? 12 : hours + 12;
    }
  } else {
    if (hours < 0 || hours > 23) return null;
  }

  return hours * 60 + minutes;
}

/**
 * Calculate the exact sleep duration in minutes between bedtime and wake-up time.
 * If wake-up time is earlier than or equal to bedtime, assumes wake-up occurs the next day.
 * Returns integer total minutes or null if inputs are invalid.
 */
export function calculateSleepDurationMinutes(bedtimeStr, wakeTimeStr) {
  const bMins = parseTimeToMinutes(bedtimeStr);
  const wMins = parseTimeToMinutes(wakeTimeStr);

  if (bMins === null || wMins === null) {
    return null;
  }

  if (wMins <= bMins) {
    return (1440 - bMins) + wMins;
  } else {
    return wMins - bMins;
  }
}

/**
 * Format total minutes to standard "Xh YYm" display string.
 * Example: 480 -> "8h 00m", 450 -> "7h 30m".
 */
export function formatMinutesToDuration(totalMinutes) {
  if (totalMinutes === null || totalMinutes === undefined || isNaN(totalMinutes)) {
    return '--';
  }
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/**
 * Fetch active sleep goal for the logged-in user.
 * If user has no goal set, returns { goal: null, records: [], stats: null }.
 */
export async function getActiveGoal(userId = null) {
  try {
    const res = await fetch(`${API_BASE}/api/sleep-goals/active/`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const { goalKey, recordsKey } = getUserStorageKeys(userId);

      if (data && data.goal) {
        try {
          localStorage.setItem(goalKey, JSON.stringify(data.goal));
          localStorage.setItem(recordsKey, JSON.stringify(data.records || []));
        } catch {
          // Ignore storage quota errors
        }
      } else {
        // Clear cached data for this user if no active goal on server
        try {
          localStorage.removeItem(goalKey);
          localStorage.removeItem(recordsKey);
        } catch {
          // Ignore
        }
      }

      return data;
    }
  } catch {
    // API offline or network error — fall back to user-scoped storage only
  }

  // User-scoped local storage fallback (never shared across users)
  if (userId) {
    const { goalKey, recordsKey } = getUserStorageKeys(userId);
    const storedGoal = localStorage.getItem(goalKey);
    const storedRecords = localStorage.getItem(recordsKey);

    if (storedGoal && storedRecords) {
      try {
        const goal = JSON.parse(storedGoal);
        const records = JSON.parse(storedRecords);
        const stats = calculateGoalStats(records, goal.target_sleep_duration || 480);
        return { goal, records, stats };
      } catch {
        // Ignore parse error
      }
    }
  }

  // When no goal exists for the user, return clean empty state
  return {
    goal: null,
    records: [],
    stats: {
      recordedDaysCount: 0,
      achievedDaysCount: 0,
      missedDaysCount: 0,
      successRate: 0,
      currentStreak: 0,
      totalDays: 21,
    },
  };
}

/**
 * Create a new 21-day sleep goal for the logged-in user.
 */
export async function createGoal(goalPayload, userId = null) {
  try {
    const csrfToken = await getCsrfToken();
    const res = await fetch(`${API_BASE}/api/sleep-goals/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify(goalPayload),
    });

    if (res.ok) {
      const data = await res.json();
      const { goalKey, recordsKey } = getUserStorageKeys(userId);
      try {
        localStorage.setItem(goalKey, JSON.stringify(data.goal));
        localStorage.setItem(recordsKey, JSON.stringify(data.records));
      } catch {
        // Ignore
      }
      return data;
    }
  } catch {
    // Fallback to user-scoped storage if offline
  }

  // Offline fallback (user-scoped)
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 20);

  const targetBedtime = goalPayload.target_bedtime || '10:30 PM';
  const targetWakeTime = goalPayload.target_wake_time || '6:30 AM';
  const calcDuration = calculateSleepDurationMinutes(targetBedtime, targetWakeTime);

  const goal = {
    id: `goal-${Date.now()}`,
    target_sleep_duration: calcDuration !== null ? calcDuration : (goalPayload.target_sleep_duration || 480),
    target_bedtime: targetBedtime,
    target_wake_time: targetWakeTime,
    goal_type: goalPayload.goal_type || 'both',
    start_date: today.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    status: 'active',
    current_day: 1,
  };

  const records = [];
  for (let i = 1; i <= 21; i++) {
    const dayDate = new Date(today);
    dayDate.setDate(today.getDate() + (i - 1));
    records.push({
      id: `rec-${goal.id}-${i}`,
      goal_id: goal.id,
      day_number: i,
      date: dayDate.toISOString().split('T')[0],
      actual_sleep_duration: null,
      bedtime: null,
      wake_time: null,
      goal_achieved: null,
      recorded_at: null,
    });
  }

  const stats = calculateGoalStats(records, goal.target_sleep_duration);
  const { goalKey, recordsKey } = getUserStorageKeys(userId);
  try {
    localStorage.setItem(goalKey, JSON.stringify(goal));
    localStorage.setItem(recordsKey, JSON.stringify(records));
  } catch {
    // Ignore
  }

  return { goal, records, stats };
}

/**
 * Record or update daily sleep for a specific day.
 */
export async function recordDailySleep(goalId, dayNumber, dailyData, userId = null) {
  try {
    const csrfToken = await getCsrfToken();
    const res = await fetch(`${API_BASE}/api/sleep-goals/${goalId}/daily-record/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({
        day_number: dayNumber,
        ...dailyData,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const { recordsKey } = getUserStorageKeys(userId);
      try {
        localStorage.setItem(recordsKey, JSON.stringify(data.records));
      } catch {
        // Ignore
      }
      return data;
    }
  } catch {
    // Fallback to user-scoped storage update
  }

  // Offline fallback
  const { goalKey, recordsKey } = getUserStorageKeys(userId);
  const storedRecords = localStorage.getItem(recordsKey);
  const storedGoal = localStorage.getItem(goalKey);

  let records = storedRecords ? JSON.parse(storedRecords) : [];
  let goal = storedGoal ? JSON.parse(storedGoal) : { target_sleep_duration: 480 };

  const target = goal.target_sleep_duration || 480;

  const calcDailyDuration = calculateSleepDurationMinutes(dailyData.bedtime, dailyData.wake_time);
  const actualDuration = calcDailyDuration !== null ? calcDailyDuration : (dailyData.actual_sleep_duration || 480);
  const isAchieved = actualDuration >= target;

  const idx = records.findIndex((r) => r.day_number === dayNumber);
  const updatedRecord = {
    id: idx >= 0 ? records[idx].id : `rec-${Date.now()}`,
    goal_id: goalId,
    day_number: dayNumber,
    date: dailyData.date || new Date().toISOString().split('T')[0],
    actual_sleep_duration: actualDuration,
    bedtime: dailyData.bedtime,
    wake_time: dailyData.wake_time,
    goal_achieved: isAchieved,
    recorded_at: new Date().toISOString(),
  };

  if (idx >= 0) {
    records[idx] = updatedRecord;
  } else {
    records.push(updatedRecord);
  }

  const stats = calculateGoalStats(records, target);
  try {
    localStorage.setItem(recordsKey, JSON.stringify(records));
  } catch {
    // Ignore
  }

  return { record: updatedRecord, records, stats };
}

/**
 * Reset or set a fresh 21-day goal for the user.
 */
export async function resetGoalData(userId = null) {
  try {
    const csrfToken = await getCsrfToken();
    await fetch(`${API_BASE}/api/sleep-goals/reset/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRFToken': csrfToken,
      },
    });
  } catch {
    // Offline reset
  }

  const { goalKey, recordsKey } = getUserStorageKeys(userId);
  try {
    localStorage.removeItem(goalKey);
    localStorage.removeItem(recordsKey);
  } catch {
    // Ignore
  }
}
