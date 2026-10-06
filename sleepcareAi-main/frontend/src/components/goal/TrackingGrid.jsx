import React from 'react';
import { Check, X, Lock } from 'lucide-react';

/**
 * Parse "YYYY-MM-DD" string safely into a local Date (no timezone shift).
 */
function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Get today's date at midnight local time as "YYYY-MM-DD".
 */
function getTodayStr() {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Convert a Date to "YYYY-MM-DD" string (local time).
 */
function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function TrackingGrid({
  records = [],
  currentDay = 1,
  selectedDay = 1,
  onSelectDay,
  targetDuration = 480,
  startDate = null, // "YYYY-MM-DD" string from goal.start_date
}) {
  const todayStr = getTodayStr();
  const startDateObj = parseLocalDate(startDate);

  // Build a map for quick record lookup by day number
  const recordByDay = {};
  records.forEach((r) => {
    recordByDay[r.day_number] = r;
  });

  // Compute each day's calendar date and determine status
  const daysList = Array.from({ length: 21 }, (_, i) => {
    const dayNum = i + 1;
    const record = recordByDay[dayNum] || null;

    // Compute this day's actual calendar date
    let dayDateStr = null;
    if (startDateObj) {
      const dayDate = new Date(startDateObj);
      dayDate.setDate(startDateObj.getDate() + (dayNum - 1));
      dayDateStr = toDateStr(dayDate);
    } else {
      // Fallback: use record.date if available
      dayDateStr = record?.date || null;
    }

    const isToday = dayDateStr === todayStr;
    const isFuture = dayDateStr ? dayDateStr > todayStr : dayNum > currentDay;
    const isPast = dayDateStr ? dayDateStr < todayStr : dayNum < currentDay;

    const hasData =
      record &&
      record.actual_sleep_duration !== null &&
      record.actual_sleep_duration !== undefined;

    const isAchieved =
      hasData &&
      (record.goal_achieved !== null && record.goal_achieved !== undefined
        ? record.goal_achieved
        : record.actual_sleep_duration >= targetDuration);

    // Status label for tooltip
    let statusLabel = 'Not Recorded';
    let durationText = '';
    if (isFuture) {
      statusLabel = 'Not Available Yet';
    } else if (hasData) {
      const h = Math.floor(record.actual_sleep_duration / 60);
      const m = record.actual_sleep_duration % 60;
      durationText = ` (${h}h ${m}m)`;
      statusLabel = isAchieved ? 'Achieved' : 'Not Achieved';
    }
    if (isToday && !isFuture) statusLabel = `Today${hasData ? ` • ${statusLabel}` : ''}`;

    const tooltip = `Day ${dayNum}${durationText}: ${statusLabel}`;

    return { dayNum, record, isToday, isFuture, isPast, hasData, isAchieved, tooltip, dayDateStr };
  });

  return (
    <div className="sc-goal-card sc-tracking-grid-card">
      <div className="sc-tracking-card-header">
        <h3 className="sc-tracking-title">21-Day Tracking</h3>
      </div>

      {/* Legend */}
      <div className="sc-tracking-legend" aria-label="Status Legend">
        <div className="sc-legend-item">
          <span className="sc-legend-dot sc-dot-achieved" />
          <span>Achieved</span>
        </div>
        <div className="sc-legend-item">
          <span className="sc-legend-dot sc-dot-missed" />
          <span>Not Achieved</span>
        </div>
        <div className="sc-legend-item">
          <span className="sc-legend-dot sc-dot-today" />
          <span>Today</span>
        </div>
        <div className="sc-legend-item">
          <span className="sc-legend-dot sc-dot-empty" />
          <span>Not Recorded</span>
        </div>
        <div className="sc-legend-item">
          <span className="sc-legend-dot sc-dot-locked" />
          <span>Not Available</span>
        </div>
      </div>

      {/* 21 Days 7x3 Grid */}
      <div className="sc-tracking-grid-body" role="grid" aria-label="21 Days Sleep Tracking Grid">
        {daysList.map(({ dayNum, isToday, isFuture, hasData, isAchieved, tooltip }) => {
          const isSelected = dayNum === selectedDay;

          // Determine circle class
          let circleClass = 'empty';
          if (isFuture) {
            circleClass = 'locked';
          } else if (isToday && !hasData) {
            circleClass = 'today-active';
          } else if (isToday && hasData) {
            circleClass = isAchieved ? 'achieved' : 'missed';
          } else if (hasData) {
            circleClass = isAchieved ? 'achieved' : 'missed';
          }

          return (
            <button
              key={dayNum}
              type="button"
              className={`sc-grid-day-cell ${isToday ? 'is-today' : ''} ${
                isSelected ? 'is-selected' : ''
              } ${isFuture ? 'is-future-locked' : ''}`}
              onClick={() => {
                if (onSelectDay) onSelectDay(dayNum);
              }}
              title={tooltip}
              aria-label={tooltip}
              aria-disabled={isFuture}
            >
              {/* Day Number Label */}
              <span className="sc-day-number-label">{dayNum}</span>

              {/* Status Circle */}
              <div className={`sc-day-status-circle ${circleClass}`}>
                {/* Future: lock icon */}
                {isFuture && <Lock size={11} strokeWidth={2.5} />}

                {/* Today with no data */}
                {isToday && !hasData && !isFuture && (
                  <span className="sc-today-circle-num">{dayNum}</span>
                )}

                {/* Today with data */}
                {isToday && hasData && !isFuture && (
                  isAchieved
                    ? <Check size={14} strokeWidth={3} />
                    : <X size={13} strokeWidth={3} />
                )}

                {/* Past with data */}
                {!isToday && !isFuture && hasData && (
                  isAchieved
                    ? <Check size={14} strokeWidth={3} />
                    : <X size={13} strokeWidth={3} />
                )}

                {/* Past with no data */}
                {!isToday && !isFuture && !hasData && (
                  <span className="sc-empty-circle-num">{dayNum}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
