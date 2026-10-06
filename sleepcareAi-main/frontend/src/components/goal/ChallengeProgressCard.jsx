import React from 'react';
import { Sliders } from 'lucide-react';

export default function ChallengeProgressCard({
  currentDay = 1,
  totalDays = 21,
  onEditGoal,
}) {
  const percentage = Math.min(100, Math.round((currentDay / totalDays) * 100));

  return (
    <div className="sc-goal-card sc-challenge-progress-card">
      <div className="sc-progress-top-row">
        <div className="sc-progress-title-block">
          <h2 className="sc-progress-title">21-Day Sleep Challenge</h2>
          <p className="sc-progress-subtitle">
            Track your progress and build a healthier sleep routine.
          </p>
        </div>

        <div className="sc-progress-actions">
          <div className="sc-day-indicator-pill">
            Day {currentDay} of {totalDays}
          </div>
          {onEditGoal && (
            <button
              type="button"
              onClick={onEditGoal}
              className="sc-edit-goal-btn"
              title="Edit target sleep parameters"
            >
              <Sliders size={15} />
              <span>Edit Goal</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar with dynamic percentage */}
      <div className="sc-progress-bar-wrap">
        <div className="sc-progress-track">
          <div
            className="sc-progress-fill"
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>
        <span className="sc-progress-percentage">{percentage}%</span>
      </div>

      <div className="sc-progress-footer-text">
        {currentDay} / {totalDays} days completed
      </div>
    </div>
  );
}
