import React from 'react';
import { Bed, Moon, Sun, ArrowDownUp, CheckCircle2, XCircle, Info, Calendar } from 'lucide-react';

/**
 * Parse "YYYY-MM-DD" safely into a local Date.
 */
function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function TodaySleepCard({
  targetDurationMinutes = 480, // 8h
  targetBedtime = null,
  targetWakeTime = null,
  todayRecord,
  selectedDay = 1,
}) {
  // Format target duration
  const targetH = Math.floor(targetDurationMinutes / 60);
  const targetM = targetDurationMinutes % 60;
  const targetFormatted = `${targetH}h ${targetM < 10 ? '0' : ''}${targetM}m`;

  const actualMinutes = todayRecord?.actual_sleep_duration;
  const hasRecorded = actualMinutes !== null && actualMinutes !== undefined;

  let actualFormatted = '--';
  let diffText = 'No data recorded yet';
  let isBelow = false;
  let isAbove = false;
  let isExact = false;
  let diffMinutes = 0;

  if (hasRecorded) {
    const actH = Math.floor(actualMinutes / 60);
    const actM = actualMinutes % 60;
    actualFormatted = `${actH}h ${actM < 10 ? '0' : ''}${actM}m`;

    diffMinutes = actualMinutes - targetDurationMinutes;
    if (diffMinutes < 0) {
      isBelow = true;
      const absDiff = Math.abs(diffMinutes);
      const diffH = Math.floor(absDiff / 60);
      const diffRemM = absDiff % 60;
      diffText =
        diffH > 0
          ? `${diffH}h ${diffRemM}m below target`
          : `${absDiff} minutes below target`;
    } else if (diffMinutes > 0) {
      isAbove = true;
      const diffH = Math.floor(diffMinutes / 60);
      const diffRemM = diffMinutes % 60;
      diffText =
        diffH > 0
          ? `${diffH}h ${diffRemM}m above target`
          : `${diffMinutes} minutes above target`;
    } else {
      isExact = true;
      diffText = 'Right on target';
    }
  }

  const isAchieved = hasRecorded && actualMinutes >= targetDurationMinutes;

  // Format today's date
  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(today);

  return (
    <div className="sc-goal-card sc-today-sleep-card">
      <div className="sc-today-card-header">
        <h3 className="sc-today-title">Today's Sleep</h3>
        <div className="sc-today-date-badge">
          <Calendar size={14} />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* 3 Metric Columns: Target Sleep | Actual Sleep | Difference */}
      <div className="sc-today-metrics-row">
        {/* Metric 1: Target Sleep */}
        <div className="sc-metric-col">
          <div className="sc-metric-top">
            <span className="sc-metric-icon sc-icon-bed" aria-hidden="true">
              <Bed size={18} />
            </span>
            <span className="sc-metric-label">Target Sleep</span>
          </div>
          <div className="sc-metric-value">{targetFormatted}</div>
        </div>

        {/* Metric 2: Actual Sleep */}
        <div className="sc-metric-col">
          <div className="sc-metric-top">
            <span className="sc-metric-icon sc-icon-moon" aria-hidden="true">
              <Moon size={18} />
            </span>
            <span className="sc-metric-label">Actual Sleep</span>
          </div>
          <div className="sc-metric-value">{actualFormatted}</div>
        </div>

        {/* Metric 3: Difference */}
        <div className="sc-metric-col">
          <div className="sc-metric-top">
            <span className="sc-metric-icon sc-icon-diff" aria-hidden="true">
              <ArrowDownUp size={18} />
            </span>
            <span className="sc-metric-label">Difference</span>
          </div>
          <div className={`sc-metric-value-sub ${isBelow ? 'is-below' : isAbove || isExact ? 'is-above' : ''}`}>
            {diffText}
          </div>
        </div>
      </div>

      {/* Target schedule row: Bedtime & Wake-up */}
      {(targetBedtime || targetWakeTime) && (
        <div className="sc-today-schedule-row">
          {targetBedtime && (
            <div className="sc-schedule-item">
              <span className="sc-schedule-icon" aria-hidden="true">
                <Moon size={14} />
              </span>
              <span className="sc-schedule-label">Target Bedtime</span>
              <span className="sc-schedule-value">{targetBedtime}</span>
            </div>
          )}
          {targetWakeTime && (
            <div className="sc-schedule-item">
              <span className="sc-schedule-icon" aria-hidden="true">
                <Sun size={14} />
              </span>
              <span className="sc-schedule-label">Target Wake-up</span>
              <span className="sc-schedule-value">{targetWakeTime}</span>
            </div>
          )}
          {hasRecorded && todayRecord?.bedtime && (
            <div className="sc-schedule-item sc-actual-item">
              <span className="sc-schedule-label">Actual Bedtime</span>
              <span className="sc-schedule-value">{todayRecord.bedtime}</span>
            </div>
          )}
          {hasRecorded && todayRecord?.wake_time && (
            <div className="sc-schedule-item sc-actual-item">
              <span className="sc-schedule-label">Actual Wake-up</span>
              <span className="sc-schedule-value">{todayRecord.wake_time}</span>
            </div>
          )}
        </div>
      )}

      {/* Status Box */}
      <div className="sc-today-status-container">
        {!hasRecorded ? (
          <div className="sc-status-banner sc-status-neutral" role="status">
            <div className="sc-status-icon neutral">
              <Info size={24} />
            </div>
            <div className="sc-status-text-wrap">
              <h4 className="sc-status-heading">Not Recorded Yet</h4>
              <p className="sc-status-message">
                Log your sleep duration below to calculate your daily goal achievement.
              </p>
            </div>
          </div>
        ) : isAchieved ? (
          <div className="sc-status-banner sc-status-achieved" role="status">
            <div className="sc-status-icon achieved">
              <CheckCircle2 size={24} />
            </div>
            <div className="sc-status-text-wrap">
              <h4 className="sc-status-heading">✓ Goal Achieved</h4>
              <p className="sc-status-message">
                {isExact
                  ? 'Great job! You met your exact sleep goal target.'
                  : `Well done! You met your target sleep duration by ${diffText.replace('above target', '')}.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="sc-status-banner sc-status-missed" role="status">
            <div className="sc-status-icon missed">
              <XCircle size={24} />
            </div>
            <div className="sc-status-text-wrap">
              <h4 className="sc-status-heading">Goal Not Achieved</h4>
              <p className="sc-status-message">
                You slept {Math.abs(diffMinutes)} minutes less than your target.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
