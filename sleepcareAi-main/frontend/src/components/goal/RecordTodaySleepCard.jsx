import React, { useState, useEffect, useMemo } from 'react';
import { Bed, Moon, Sun, Clock, Check, Lock, Eye } from 'lucide-react';
import {
  calculateSleepDurationMinutes,
  formatMinutesToDuration,
} from '../../services/sleepGoalApi';

/**
 * Parse "YYYY-MM-DD" string to a local-only Date (avoids UTC timezone shift).
 */
function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Get today as "YYYY-MM-DD" in local time.
 */
function getTodayStr() {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Convert local Date to "YYYY-MM-DD" string.
 */
function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Given a goal start_date and a day_number, return the calendar date for that day.
 */
function getDayDateStr(startDate, dayNumber) {
  const startObj = parseLocalDate(startDate);
  if (!startObj) return null;
  const dayDate = new Date(startObj);
  dayDate.setDate(startObj.getDate() + (dayNumber - 1));
  return toDateStr(dayDate);
}

/**
 * Format a "YYYY-MM-DD" string as a human-readable date (e.g. "Mon, 5 Oct 2026").
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = parseLocalDate(dateStr);
  if (!d) return dateStr;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Format minutes to "Xh Ym" display string.
 */
function formatMinutes(mins) {
  return formatMinutesToDuration(mins);
}

export default function RecordTodaySleepCard({
  currentRecord,
  dayNumber = 1,
  targetDuration = 480,
  targetBedtime = '10:30 PM',
  targetWakeTime = '6:30 AM',
  onSaveRecord,
  goalStartDate = null, // "YYYY-MM-DD" — the goal's start_date
}) {
  const todayStr = getTodayStr();
  const thisDayDateStr = getDayDateStr(goalStartDate, dayNumber);

  const isToday = thisDayDateStr === todayStr;
  const isFuture = thisDayDateStr ? thisDayDateStr > todayStr : false;
  const isPast = thisDayDateStr ? thisDayDateStr < todayStr : false;

  const hasRecorded =
    currentRecord?.actual_sleep_duration !== null &&
    currentRecord?.actual_sleep_duration !== undefined;

  // Form state for bedtime and wake-up time
  const [bedtime, setBedtime] = useState(currentRecord?.bedtime || targetBedtime || '10:30 PM');
  const [wakeTime, setWakeTime] = useState(currentRecord?.wake_time || targetWakeTime || '6:30 AM');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (currentRecord) {
      setBedtime(currentRecord.bedtime || targetBedtime || '10:30 PM');
      setWakeTime(currentRecord.wake_time || targetWakeTime || '6:30 AM');
    } else {
      setBedtime(targetBedtime || '10:30 PM');
      setWakeTime(targetWakeTime || '6:30 AM');
    }
  }, [currentRecord, targetBedtime, targetWakeTime]);

  // Automatically calculate duration from bedtime and wake-up time in real-time
  const calculatedMinutes = useMemo(() => {
    return calculateSleepDurationMinutes(bedtime, wakeTime);
  }, [bedtime, wakeTime]);

  const displayMinutes = calculatedMinutes !== null
    ? calculatedMinutes
    : (hasRecorded
        ? currentRecord.actual_sleep_duration
        : targetDuration || 480);

  const formattedCalculatedDuration = formatMinutesToDuration(displayMinutes);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isToday) return; // Extra guard — only today is recordable
    onSaveRecord({
      day_number: dayNumber,
      actual_sleep_duration: displayMinutes,
      bedtime,
      wake_time: wakeTime,
      date: todayStr,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2400);
  };

  // -----------------------------------------------------------------------
  // FUTURE DAY: Locked — cannot record yet
  // -----------------------------------------------------------------------
  if (isFuture) {
    return (
      <div className="sc-goal-card sc-record-sleep-card sc-record-locked">
        <div className="sc-record-card-header">
          <h3 className="sc-record-title">Day {dayNumber}'s Sleep</h3>
          {thisDayDateStr && (
            <span className="sc-record-date-badge">{formatDate(thisDayDateStr)}</span>
          )}
        </div>
        <div className="sc-record-locked-body">
          <div className="sc-locked-icon-wrap">
            <Lock size={36} strokeWidth={1.5} />
          </div>
          <p className="sc-locked-title">Not Available Yet</p>
          <p className="sc-locked-desc">
            This day becomes available on{' '}
            <strong>{thisDayDateStr ? formatDate(thisDayDateStr) : 'a future date'}</strong>.
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // PAST DAY: Read-only — show recorded data or "Not Recorded"
  // -----------------------------------------------------------------------
  if (isPast) {
    return (
      <div className="sc-goal-card sc-record-sleep-card sc-record-past">
        <div className="sc-record-card-header">
          <h3 className="sc-record-title">Day {dayNumber}'s Sleep</h3>
          {thisDayDateStr && (
            <span className="sc-record-date-badge">{formatDate(thisDayDateStr)}</span>
          )}
        </div>

        {hasRecorded ? (
          <div className="sc-record-past-data">
            <div className="sc-past-icon-wrap">
              <Eye size={22} strokeWidth={1.8} />
            </div>
            <p className="sc-past-label">Recorded Sleep Data</p>
            <div className="sc-past-stats-grid">
              <div className="sc-past-stat">
                <span className="sc-past-stat-label">Duration</span>
                <span className="sc-past-stat-value">
                  {formatMinutes(currentRecord.actual_sleep_duration)}
                </span>
              </div>
              <div className="sc-past-stat">
                <span className="sc-past-stat-label">Bedtime</span>
                <span className="sc-past-stat-value">{currentRecord.bedtime || '--'}</span>
              </div>
              <div className="sc-past-stat">
                <span className="sc-past-stat-label">Wake-up</span>
                <span className="sc-past-stat-value">{currentRecord.wake_time || '--'}</span>
              </div>
              <div className="sc-past-stat">
                <span className="sc-past-stat-label">Result</span>
                <span
                  className={`sc-past-stat-value sc-past-result ${
                    currentRecord.goal_achieved ? 'achieved' : 'missed'
                  }`}
                >
                  {currentRecord.goal_achieved ? 'Achieved' : 'Not Achieved'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="sc-record-locked-body">
            <div className="sc-locked-icon-wrap sc-not-recorded-icon">
              <Eye size={36} strokeWidth={1.5} />
            </div>
            <p className="sc-locked-title">Not Recorded</p>
            <p className="sc-locked-desc">
              No sleep data was recorded for this day.
            </p>
          </div>
        )}
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // TODAY: Active recording form (Sleep Duration automatically calculated)
  // -----------------------------------------------------------------------
  return (
    <div className="sc-goal-card sc-record-sleep-card">
      <div className="sc-record-card-header">
        <h3 className="sc-record-title">
          Record Day {dayNumber}'s Sleep
        </h3>
        {thisDayDateStr && (
          <span className="sc-record-date-badge sc-today-badge">Today — {formatDate(thisDayDateStr)}</span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="sc-record-form">
        {/* Row 1: Sleep Duration (Read-only, Automatically Calculated) */}
        <div className="sc-record-field-row">
          <div className="sc-record-label-wrap">
            <span className="sc-record-icon" aria-hidden="true">
              <Bed size={18} />
            </span>
            <label className="sc-record-label">Sleep Duration</label>
          </div>

          <div className="sc-duration-picker-wrap">
            <div
              className="sc-duration-readonly-badge"
              aria-live="polite"
              title="Sleep duration is automatically calculated from bedtime and wake-up time"
            >
              {formattedCalculatedDuration}
            </div>
            <span className="sc-duration-auto-label">Auto-calculated</span>
          </div>
        </div>

        {/* Row 2: Bedtime */}
        <div className="sc-record-field-row">
          <div className="sc-record-label-wrap">
            <span className="sc-record-icon" aria-hidden="true">
              <Moon size={18} />
            </span>
            <label htmlFor="bedtime-input" className="sc-record-label">
              Bedtime
            </label>
          </div>

          <div className="sc-record-input-wrap">
            <input
              id="bedtime-input"
              type="text"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              placeholder="10:45 PM"
              className="sc-record-text-input"
              required
            />
            <span className="sc-input-trailing-icon" aria-hidden="true">
              <Clock size={16} />
            </span>
          </div>
        </div>

        {/* Row 3: Wake-up Time */}
        <div className="sc-record-field-row">
          <div className="sc-record-label-wrap">
            <span className="sc-record-icon" aria-hidden="true">
              <Sun size={18} />
            </span>
            <label htmlFor="waketime-input" className="sc-record-label">
              Wake-up Time
            </label>
          </div>

          <div className="sc-record-input-wrap">
            <input
              id="waketime-input"
              type="text"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              placeholder="6:27 AM"
              className="sc-record-text-input"
              required
            />
            <span className="sc-input-trailing-icon" aria-hidden="true">
              <Clock size={16} />
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="sc-record-action-wrap">
          <button
            type="submit"
            className={`sc-record-submit-btn ${savedSuccess ? 'is-success' : ''}`}
          >
            {savedSuccess ? (
              <>
                <Check size={18} />
                <span>Saved Successfully!</span>
              </>
            ) : (
              <span>{hasRecorded ? 'Update Today\'s Sleep' : 'Save Today\'s Sleep'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
