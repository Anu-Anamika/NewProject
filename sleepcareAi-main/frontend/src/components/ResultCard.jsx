import React from 'react';
import {
  BarChart3,
  ShieldCheck,
  Moon,
  Sparkles,
  Info,
  Clock,
  Gauge,
  Activity,
  AlertCircle,
  FileCheck2,
  FileText,
} from 'lucide-react';

export default function ResultCard({
  mode = 'quality',
  result = null,
  submittedData = null,
  isLoading = false,
  error = null,
  onRetry,
}) {
  const isQuality = mode === 'quality';

  // 1. Loading State Placeholder
  if (isLoading) {
    return (
      <div className="sc-card sc-result-panel">
        <div className="sc-card-header">
          <div className="sc-card-icon-box" aria-hidden="true">
            {isQuality ? <BarChart3 size={22} /> : <ShieldCheck size={22} />}
          </div>
          <div className="sc-card-titles">
            <h2 className="sc-card-title">
              {isQuality ? 'Your Sleep Quality Result' : 'Your Sleep Disorder Result'}
            </h2>
            <p className="sc-card-subtitle">Analyzing your health metrics...</p>
          </div>
        </div>

        <div className="sc-result-empty">
          <div className="sc-empty-illustration">
            <div className="sc-spinner" style={{ width: '48px', height: '48px', borderWidth: '3px', borderTopColor: '#147df5' }} />
          </div>
          <h3 className="sc-empty-title">Analyzing your data...</h3>
          <p className="sc-empty-desc">
            Running XGBoost inference and calculating calibrated metrics.
          </p>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="sc-card sc-result-panel">
        <div className="sc-card-header">
          <div className="sc-card-icon-box" aria-hidden="true">
            <AlertCircle size={22} />
          </div>
          <div className="sc-card-titles">
            <h2 className="sc-card-title">Analysis Error</h2>
            <p className="sc-card-subtitle">Unable to complete prediction</p>
          </div>
        </div>

        <div className="sc-result-error">
          <div className="sc-error-icon" aria-hidden="true">
            <AlertCircle size={28} />
          </div>
          <h3 className="sc-error-title">Unable to generate prediction</h3>
          <p className="sc-error-desc">
            Something went wrong while analyzing your information. Please check your inputs and try again.
          </p>
          {onRetry && (
            <button type="button" className="sc-btn-retry" onClick={onRetry}>
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. Initial Empty State (before prediction)
  if (!result) {
    return (
      <div className="sc-card sc-result-panel">
        <div className="sc-card-header">
          <div className="sc-card-icon-box" aria-hidden="true">
            {isQuality ? <BarChart3 size={22} /> : <ShieldCheck size={22} />}
          </div>
          <div className="sc-card-titles">
            <h2 className="sc-card-title">
              {isQuality ? 'Your Sleep Quality Result' : 'Your Sleep Disorder Result'}
            </h2>
            <p className="sc-card-subtitle">
              {isQuality
                ? 'Your predicted sleep quality score will appear here.'
                : 'Your predicted disorder risk will appear here.'}
            </p>
          </div>
        </div>

        <div className="sc-result-empty">
          <div className="sc-empty-illustration">
            {isQuality ? (
              <span className="sc-empty-icon" role="img" aria-label="Sleeping Moon">
                😴
              </span>
            ) : (
              <span className="sc-empty-icon" role="img" aria-label="Health Assessment">
                📋
              </span>
            )}
          </div>
          <h3 className="sc-empty-title">
            Enter your details and click<br />
            "{isQuality ? 'Predict Sleep Quality' : 'Predict Sleep Disorder'}"
          </h3>
          <p className="sc-empty-desc">
            {isQuality
              ? 'Get personalized insights about your sleep health and recommendations.'
              : 'Get insights into the likelihood of insomnia or sleep apnea with confidence scores.'}
          </p>
        </div>
      </div>
    );
  }

  // 4. Sleep Quality Result View
  if (isQuality) {
    const score = Number(result.score) || 0;
    const scorePercent = Number(result.score_percent) || (score * 10);
    const radius = 68;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (scorePercent / 100) * circumference;

    let badgeClass = 'good';
    let badgeText = 'GOOD';

    if (score >= 8.0) {
      badgeClass = 'excellent';
      badgeText = 'EXCELLENT';
    } else if (score >= 7.0) {
      badgeClass = 'good';
      badgeText = 'GOOD';
    } else if (score >= 6.0) {
      badgeClass = 'moderate';
      badgeText = 'MODERATE';
    } else {
      badgeClass = 'poor';
      badgeText = 'POOR';
    }

    // Generate dynamic health insights based on user data & score
    const generateInsights = () => {
      if (!submittedData) {
        return 'Your score reflects balanced lifestyle habits. Keep maintaining steady sleep hygiene.';
      }
      const duration = submittedData.sleep_duration;
      const stress = submittedData.stress_level;
      const activity = submittedData.physical_activity_level;

      if (score >= 7.5) {
        return `Your sleep duration of ${duration} hours and stress level of ${stress}/10 indicate healthy sleep recovery. Sustaining your daily physical activity (${activity} min/day) helps protect deep restorative sleep cycles.`;
      } else if (score >= 6.0) {
        return `Your sleep score suggests moderate rest quality. Consider aiming for 7–8 hours of uninterrupted sleep and reducing evening screen exposure to ease your stress level (${stress}/10).`;
      } else {
        return `Your predicted score indicates sleep deprivation or elevated strain. High stress (${stress}/10) or irregular sleep schedules often disrupt natural REM sleep. Setting a fixed bedtime may assist recovery.`;
      }
    };

    return (
      <div className="sc-card sc-result-panel">
        <div className="sc-card-header">
          <div className="sc-card-icon-box" aria-hidden="true">
            <BarChart3 size={22} />
          </div>
          <div className="sc-card-titles">
            <h2 className="sc-card-title">Your Sleep Quality Result</h2>
            <p className="sc-card-subtitle">AI-calculated sleep quality assessment</p>
          </div>
        </div>

        <div className="sc-quality-result">
          {/* Circular Score Meter */}
          <div className="sc-score-meter-wrap" aria-label={`Score: ${score} out of 10`}>
            <svg className="sc-meter-svg" viewBox="0 0 160 160">
              <circle
                className="sc-meter-bg"
                cx="80"
                cy="80"
                r={radius}
              />
              <circle
                className="sc-meter-fill"
                cx="80"
                cy="80"
                r={radius}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="sc-meter-content">
              <span className="sc-meter-score">{score.toFixed(1)}</span>
              <span className="sc-meter-out-of">/ 10</span>
            </div>
          </div>

          <div className={`sc-quality-badge ${badgeClass}`}>
            <span>{badgeText}</span>
          </div>

          <p className="sc-quality-label-text">
            {result.label || `Sleep Quality: ${badgeText}`}
          </p>

          {/* User Submitted Highlights */}
          {submittedData && (
            <div className="sc-metrics-row">
              <div className="sc-metric-mini-card">
                <p className="sc-metric-mini-label">Sleep Duration</p>
                <p className="sc-metric-mini-val">{submittedData.sleep_duration} hrs</p>
              </div>
              <div className="sc-metric-mini-card">
                <p className="sc-metric-mini-label">Stress Level</p>
                <p className="sc-metric-mini-val">{submittedData.stress_level} / 10</p>
              </div>
              <div className="sc-metric-mini-card">
                <p className="sc-metric-mini-label">Activity</p>
                <p className="sc-metric-mini-val">{submittedData.physical_activity_level} min/day</p>
              </div>
            </div>
          )}

          {/* Sleep Insights Block */}
          <div className="sc-insights-box">
            <h4 className="sc-insights-title">
              <Sparkles size={15} />
              <span>Sleep Insights</span>
            </h4>
            <p className="sc-insights-text">
              {generateInsights()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 5. Sleep Disorder Result View
  const predictedClass = result.label === 'None' ? 'No Sleep Disorder' : (result.label || 'No Sleep Disorder');
  const rawConf = Number(result.confidence) || 0;
  const confVal = (rawConf > 1 ? rawConf : rawConf * 100).toFixed(2);

  // Determine badge styling
  let disorderClass = 'none';
  if (result.label === 'Insomnia') disorderClass = 'insomnia';
  if (result.label === 'Sleep Apnea') disorderClass = 'apnea';

  // Normalize class probabilities array
  let probList = result.class_probabilities || [];
  if (!Array.isArray(probList) && typeof result.probabilities === 'object' && result.probabilities) {
    probList = Object.entries(result.probabilities).map(([key, val]) => ({
      label: key,
      probability: val,
    }));
  }

  return (
    <div className="sc-card sc-result-panel">
      <div className="sc-card-header">
        <div className="sc-card-icon-box" aria-hidden="true">
          <ShieldCheck size={22} />
        </div>
        <div className="sc-card-titles">
          <h2 className="sc-card-title">Sleep Disorder Assessment</h2>
          <p className="sc-card-subtitle">Multiclass probability classification</p>
        </div>
      </div>

      <div className="sc-disorder-result">
        {/* Main Predicted Class Banner */}
        <div className={`sc-disorder-main-badge ${disorderClass}`}>
          <div className="sc-disorder-title-group">
            <span role="img" aria-hidden="true">
              {disorderClass === 'none' ? '✅' : '⚠️'}
            </span>
            <span className="sc-disorder-name">{predictedClass}</span>
          </div>
          <span className="sc-disorder-conf">Confidence: {confVal}%</span>
        </div>

        {/* Model-estimated probability bars */}
        <div className="sc-prob-section">
          <div className="sc-prob-section-title">
            <span>Model-Estimated Probability</span>
          </div>

          {probList.map((item) => {
            const displayLabel = item.label === 'None' ? 'No Sleep Disorder' : item.label;
            let itemClass = 'none';
            if (item.label === 'Insomnia') itemClass = 'insomnia';
            if (item.label === 'Sleep Apnea') itemClass = 'apnea';

            const rawP = Number(item.probability) || 0;
            const pct = rawP > 1 ? rawP : rawP * 100;
            const probVal = Math.min(100, Math.max(0, pct));
            const probDisplay = `${pct.toFixed(2)}%`;

            return (
              <div key={item.label} className="sc-prob-item">
                <div className="sc-prob-header">
                  <span>{displayLabel}</span>
                  <span className="sc-prob-pct">{probDisplay}</span>
                </div>
                <div className="sc-prob-bar-track">
                  <div
                    className={`sc-prob-bar-fill ${itemClass}`}
                    style={{ width: `${probVal}%` }}
                    role="progressbar"
                    aria-valuenow={probVal}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label={`${displayLabel} probability`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Calibration Note */}
        {result.calibration_note && (
          <div className="sc-calibration-note">
            <strong>Calibration note:</strong> {result.calibration_note}
          </div>
        )}
      </div>
    </div>
  );
}
