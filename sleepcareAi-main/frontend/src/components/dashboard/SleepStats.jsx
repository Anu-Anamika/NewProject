import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Clock, Activity, FileCheck, ArrowRight, Sparkles } from 'lucide-react';

/**
 * Animated number component for smooth count-up transitions.
 */
function AnimatedValue({ value, decimals = 1, suffix = '' }) {
  const [displayVal, setDisplayVal] = useState(() => {
    return value !== null && value !== undefined && !isNaN(value) ? parseFloat(value) : null;
  });

  useEffect(() => {
    if (value === null || value === undefined || isNaN(value)) {
      return;
    }

    let start = 0;
    const end = parseFloat(value);
    const duration = 800; // ms
    const stepTime = 20;
    const totalSteps = duration / stepTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / totalSteps;
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * ease;

      if (currentStep >= totalSteps) {
        setDisplayVal(end);
        clearInterval(timer);
      } else {
        setDisplayVal(current);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  if (value === null || value === undefined) {
    return <span>—</span>;
  }

  if (displayVal === null) {
    return <span>—</span>;
  }

  const formatted = decimals > 0 ? displayVal.toFixed(decimals) : Math.round(displayVal).toString();
  return (
    <span>
      {formatted}
      {suffix && <span className="sc-stat-suffix">{suffix}</span>}
    </span>
  );
}

export default function SleepStats({ stats }) {
  const hasData = stats && stats.total_analyses > 0;

  return (
    <section className="sc-dash-overview-section" aria-labelledby="overview-heading">
      <div className="sc-dash-section-header">
        <div>
          <h2 id="overview-heading" className="sc-dash-section-title">
            Your Sleep Overview
          </h2>
          <p className="sc-dash-section-subtitle">
            A quick look at your recent sleep-related metrics.
          </p>
        </div>
      </div>

      {/* 4 Statistics Grid */}
      <div className="sc-dash-stats-grid">
        {/* 1. Latest Sleep Score */}
        <div className="sc-dash-stat-card">
          <div className="sc-stat-top-row">
            <span className="sc-stat-label">Latest Sleep Score</span>
            <div className="sc-stat-icon-wrap blue">
              <Moon size={18} />
            </div>
          </div>
          <div className="sc-stat-value-row">
            <div className="sc-stat-number">
              {stats?.latest_sleep_score != null ? (
                <>
                  <AnimatedValue value={stats.latest_sleep_score} decimals={1} />
                  <span className="sc-stat-denom">/ 10</span>
                </>
              ) : (
                <span className="sc-stat-empty">—</span>
              )}
            </div>
            {stats?.latest_quality_label && (
              <span className={`sc-stat-badge ${stats.latest_quality_label.toLowerCase()}`}>
                {stats.latest_quality_label}
              </span>
            )}
          </div>
          <p className="sc-stat-caption">
            {stats?.latest_sleep_score != null ? 'Model estimated quality' : 'No data yet'}
          </p>
        </div>

        {/* 2. Average Sleep Duration */}
        <div className="sc-dash-stat-card">
          <div className="sc-stat-top-row">
            <span className="sc-stat-label">Average Sleep Duration</span>
            <div className="sc-stat-icon-wrap teal">
              <Clock size={18} />
            </div>
          </div>
          <div className="sc-stat-value-row">
            <div className="sc-stat-number">
              {stats?.average_sleep_duration != null ? (
                <AnimatedValue value={stats.average_sleep_duration} decimals={1} suffix=" hrs" />
              ) : (
                <span className="sc-stat-empty">—</span>
              )}
            </div>
          </div>
          <p className="sc-stat-caption">
            {stats?.average_sleep_duration != null ? 'Across all recorded inputs' : 'No data yet'}
          </p>
        </div>

        {/* 3. Average Stress Level */}
        <div className="sc-dash-stat-card">
          <div className="sc-stat-top-row">
            <span className="sc-stat-label">Average Stress Level</span>
            <div className="sc-stat-icon-wrap purple">
              <Activity size={18} />
            </div>
          </div>
          <div className="sc-stat-value-row">
            <div className="sc-stat-number">
              {stats?.average_stress != null ? (
                <>
                  <AnimatedValue value={stats.average_stress} decimals={1} />
                  <span className="sc-stat-denom">/ 10</span>
                </>
              ) : (
                <span className="sc-stat-empty">—</span>
              )}
            </div>
          </div>
          <p className="sc-stat-caption">
            {stats?.average_stress != null ? 'Self-reported stress rating' : 'No data yet'}
          </p>
        </div>

        {/* 4. Total Analyses */}
        <div className="sc-dash-stat-card">
          <div className="sc-stat-top-row">
            <span className="sc-stat-label">Total Analyses</span>
            <div className="sc-stat-icon-wrap indigo">
              <FileCheck size={18} />
            </div>
          </div>
          <div className="sc-stat-value-row">
            <div className="sc-stat-number">
              {stats?.total_analyses != null && stats.total_analyses > 0 ? (
                <AnimatedValue value={stats.total_analyses} decimals={0} />
              ) : (
                <span className="sc-stat-empty">—</span>
              )}
            </div>
          </div>
          <p className="sc-stat-caption">
            {stats?.total_analyses ? 'Evaluations completed' : 'No data yet'}
          </p>
        </div>
      </div>

      {/* Empty State Banner (Displayed when user has 0 analyses) */}
      {!hasData && (
        <div className="sc-dash-empty-banner">
          <div className="sc-dash-empty-content">
            <div className="sc-dash-empty-icon">
              <Sparkles size={24} />
            </div>
            <div className="sc-dash-empty-text">
              <h4 className="sc-dash-empty-title">No sleep analyses yet.</h4>
              <p className="sc-dash-empty-desc">
                Start your first analysis to begin building your personal sleep insights and trend charts.
              </p>
            </div>
          </div>
          <Link to="/predict/sleep-quality" className="sc-dash-empty-btn">
            <span>Analyze Sleep Quality</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </section>
  );
}
