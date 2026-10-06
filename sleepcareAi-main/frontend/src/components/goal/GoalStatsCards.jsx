import React from 'react';
import { Check, BarChart2, Flame } from 'lucide-react';

export default function GoalStatsCards({ stats }) {
  const {
    recordedDaysCount = 0,
    achievedDaysCount = 0,
    successRate = 0,
    currentStreak = 0,
  } = stats || {};

  return (
    <div className="sc-goal-stats-grid">
      {/* 1. Goal Achievement */}
      <div className="sc-stat-card sc-stat-achievement">
        <div className="sc-stat-card-header">
          <div className="sc-stat-icon-wrap sc-icon-green" aria-hidden="true">
            <Check size={18} strokeWidth={2.8} />
          </div>
          <span className="sc-stat-label">Goal Achievement</span>
        </div>
        <div className="sc-stat-value-row">
          <span className="sc-stat-main-num">
            {achievedDaysCount} <span className="sc-stat-slash">/</span> {recordedDaysCount}
          </span>
          <span className="sc-stat-unit">days</span>
        </div>
        <div className="sc-stat-mini-bar sc-bar-green">
          <div
            className="sc-stat-mini-fill"
            style={{
              width: `${recordedDaysCount ? Math.min(100, Math.round((achievedDaysCount / recordedDaysCount) * 100)) : 0}%`,
            }}
          />
        </div>
      </div>

      {/* 2. Success Rate */}
      <div className="sc-stat-card sc-stat-success">
        <div className="sc-stat-card-header">
          <div className="sc-stat-icon-wrap sc-icon-purple" aria-hidden="true">
            <BarChart2 size={18} strokeWidth={2.5} />
          </div>
          <span className="sc-stat-label">Success Rate</span>
        </div>
        <div className="sc-stat-value-row">
          <span className="sc-stat-main-num">{successRate}%</span>
        </div>
        <div className="sc-stat-mini-bar sc-bar-purple">
          <div
            className="sc-stat-mini-fill"
            style={{ width: `${Math.min(100, successRate)}%` }}
          />
        </div>
      </div>

      {/* 3. Current Streak */}
      <div className="sc-stat-card sc-stat-streak">
        <div className="sc-stat-card-header">
          <div className="sc-stat-icon-wrap sc-icon-orange" aria-hidden="true">
            <Flame size={18} strokeWidth={2.5} />
          </div>
          <span className="sc-stat-label">Current Streak</span>
        </div>
        <div className="sc-stat-value-row">
          <span className="sc-stat-main-num">{currentStreak}</span>
          <span className="sc-stat-unit">days</span>
        </div>
        <div className="sc-stat-mini-bar sc-bar-orange">
          <div
            className="sc-stat-mini-fill"
            style={{ width: `${Math.min(100, (currentStreak / 7) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
