import React, { useState, useEffect, useMemo } from 'react';
import { Bed, Clock, Sun, Info } from 'lucide-react';
import {
  calculateSleepDurationMinutes,
  formatMinutesToDuration,
} from '../../services/sleepGoalApi';

export default function GoalSetupCard({
  initialGoal,
  onStartGoal,
  isEditing = false,
  onCancelEdit,
}) {
  const [bedtime, setBedtime] = useState(initialGoal?.target_bedtime || '10:30 PM');
  const [wakeTime, setWakeTime] = useState(initialGoal?.target_wake_time || '6:30 AM');

  // Sync state whenever initialGoal changes (e.g. entering edit mode)
  useEffect(() => {
    if (initialGoal) {
      if (initialGoal.target_bedtime) setBedtime(initialGoal.target_bedtime);
      if (initialGoal.target_wake_time) setWakeTime(initialGoal.target_wake_time);
    }
  }, [initialGoal]);

  // Automatically calculate target duration from target bedtime and wake-up time
  const calculatedMinutes = useMemo(() => {
    return calculateSleepDurationMinutes(bedtime, wakeTime);
  }, [bedtime, wakeTime]);

  const displayMinutes = calculatedMinutes !== null
    ? calculatedMinutes
    : (initialGoal?.target_sleep_duration || 480);

  const formattedDuration = formatMinutesToDuration(displayMinutes);
  const durationHours = displayMinutes / 60;

  // Calculate visual track percentage across 4h to 12h range
  const trackPercentage = Math.min(100, Math.max(0, ((durationHours - 4) / 8) * 100));

  const handleSubmit = (e) => {
    e.preventDefault();
    onStartGoal({
      target_sleep_duration: displayMinutes,
      target_bedtime: bedtime,
      target_wake_time: wakeTime,
    });
  };

  return (
    <div className="sc-goal-card sc-goal-setup-card">
      <div className="sc-goal-card-header">
        <h2 className="sc-goal-card-title">
          {isEditing ? 'Update Your Sleep Goal' : 'Create Your Sleep Goal'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="sc-goal-setup-form">
        {/* Row A: Target Sleep Duration (Automatically Calculated & Read-Only) */}
        <div className="sc-setup-field-row">
          <div className="sc-setup-label-group">
            <span className="sc-setup-icon" aria-hidden="true">
              <Bed size={20} />
            </span>
            <label className="sc-setup-label">
              Target Sleep Duration
            </label>
          </div>

          <div className="sc-setup-slider-container">
            <div className="sc-slider-track-wrap">
              <div className="sc-range-slider-readonly-track" aria-hidden="true">
                <div
                  className="sc-range-slider-readonly-fill"
                  style={{ width: `${trackPercentage}%` }}
                />
                <div
                  className="sc-range-slider-readonly-thumb"
                  style={{ left: `${trackPercentage}%` }}
                />
              </div>
              <div className="sc-slider-ticks">
                <span>4 hours</span>
                <span>Auto-calculated</span>
                <span>12 hours</span>
              </div>
            </div>

            <div
              className="sc-setup-value-badge"
              aria-live="polite"
              title="Target duration is automatically calculated from your bedtime and wake-up time"
            >
              {formattedDuration}
            </div>
          </div>
        </div>

        {/* Row B: Target Bedtime */}
        <div className="sc-setup-field-row">
          <div className="sc-setup-label-group">
            <span className="sc-setup-icon" aria-hidden="true">
              <Clock size={20} />
            </span>
            <label htmlFor="target-bedtime-input" className="sc-setup-label">
              Target Bedtime
            </label>
          </div>

          <div className="sc-setup-input-wrap">
            <input
              id="target-bedtime-input"
              type="text"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              placeholder="10:30 PM"
              className="sc-setup-time-input"
              required
            />
            <span className="sc-input-trailing-icon" aria-hidden="true">
              <Clock size={16} />
            </span>
          </div>
        </div>

        {/* Row C: Target Wake-up Time */}
        <div className="sc-setup-field-row">
          <div className="sc-setup-label-group">
            <span className="sc-setup-icon" aria-hidden="true">
              <Sun size={20} />
            </span>
            <label htmlFor="target-waketime-input" className="sc-setup-label">
              Target Wake-up Time
            </label>
          </div>

          <div className="sc-setup-input-wrap">
            <input
              id="target-waketime-input"
              type="text"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              placeholder="6:30 AM"
              className="sc-setup-time-input"
              required
            />
            <span className="sc-input-trailing-icon" aria-hidden="true">
              <Clock size={16} />
            </span>
          </div>
        </div>

        {/* Info Banner */}
        <div className="sc-setup-info-banner" role="status">
          <Info size={18} className="sc-setup-info-icon" />
          <p className="sc-setup-info-text">
            Target sleep duration is automatically calculated from your schedule.
            Day 1 starts today and continues for 21 consecutive calendar days.
          </p>
        </div>

        {/* Action Button */}
        <div className="sc-setup-actions-row">
          <button type="submit" className="sc-setup-primary-btn">
            {isEditing ? 'Save Changes' : 'Start 21-Day Goal'}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="sc-setup-cancel-btn"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
