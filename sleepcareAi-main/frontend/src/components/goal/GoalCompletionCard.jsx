import React from 'react';
import { Award, RotateCcw, FileText, CheckCircle2, XCircle } from 'lucide-react';

export default function GoalCompletionCard({
  stats,
  onViewReport,
  onResetGoal,
}) {
  const {
    recordedDaysCount = 21,
    achievedDaysCount = 17,
    missedDaysCount = 4,
    successRate = 81,
  } = stats || {};

  return (
    <div className="sc-goal-card sc-completion-card">
      <div className="sc-completion-content">
        <div className="sc-completion-badge-icon" aria-hidden="true">
          <Award size={36} />
        </div>

        <h2 className="sc-completion-title">21-Day Challenge Complete 🎉</h2>
        <p className="sc-completion-subtitle">
          <span className="sc-completion-highlight">{achievedDaysCount} of 21 days</span> achieved your sleep goal.
        </p>

        {/* Big percentage display */}
        <div className="sc-completion-rate-display">
          <span className="sc-rate-number">{successRate}%</span>
          <span className="sc-rate-label">Overall Completion</span>
        </div>

        {/* 3 Metric Pills */}
        <div className="sc-completion-metrics-row">
          <div className="sc-comp-pill">
            <span className="sc-comp-pill-label">Goal Days</span>
            <span className="sc-comp-pill-val is-green">{achievedDaysCount}</span>
          </div>

          <div className="sc-comp-pill">
            <span className="sc-comp-pill-label">Missed Days</span>
            <span className="sc-comp-pill-val is-red">{missedDaysCount}</span>
          </div>

          <div className="sc-comp-pill">
            <span className="sc-comp-pill-label">Achievement Rate</span>
            <span className="sc-comp-pill-val is-blue">{successRate}%</span>
          </div>
        </div>

        {/* Scientific Context Disclaimer */}
        <p className="sc-completion-disclaimer">
          This tracking challenge monitors your routine over a 21-day period. Consistent sleep habits are reinforced over extended time with regular daily routines.
        </p>

        {/* Action Buttons */}
        <div className="sc-completion-actions">
          <button
            type="button"
            onClick={onViewReport}
            className="sc-btn-view-report"
          >
            <FileText size={18} />
            <span>View Sleep Report</span>
          </button>

          <button
            type="button"
            onClick={onResetGoal}
            className="sc-btn-new-goal"
          >
            <RotateCcw size={18} />
            <span>Set New Goal</span>
          </button>
        </div>
      </div>
    </div>
  );
}
