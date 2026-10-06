import React from 'react';
import { Calendar } from 'lucide-react';

export default function ChallengePreview() {
  const days = Array.from({ length: 21 }, (_, i) => i + 1);

  return (
    <div className="sc-goal-card sc-challenge-preview-card">
      <div className="sc-challenge-preview-top">
        <div className="sc-challenge-preview-headings">
          <h2 className="sc-challenge-preview-title">Your 21-Day Challenge</h2>
          <p className="sc-challenge-preview-subtitle">
            <span className="sc-bold-highlight">21 days</span> &bull; One day at a time
          </p>
        </div>

        <div className="sc-challenge-preview-badge">
          <div className="sc-badge-cal-icon">
            <Calendar size={18} />
          </div>
          <div className="sc-badge-cal-text">
            <span className="sc-badge-cal-days">21 days</span>
            <span className="sc-badge-cal-sub">One day at a time</span>
          </div>
        </div>
      </div>

      <p className="sc-challenge-preview-desc">
        Each day, SleepCare AI checks whether your recorded sleep matches your selected target.
      </p>

      {/* 21 Day Indicator Circles in 3 rows of 7 */}
      <div className="sc-preview-days-grid" aria-label="21-day timeline preview">
        {days.map((dayNum) => (
          <div key={dayNum} className="sc-preview-day-circle">
            <span>{dayNum}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
