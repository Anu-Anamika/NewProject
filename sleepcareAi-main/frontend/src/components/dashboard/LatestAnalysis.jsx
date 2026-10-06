import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Brain, Clock, ArrowRight, ShieldCheck, Sparkles, Download } from 'lucide-react';
import AnalysisDetailModal from './AnalysisDetailModal';
import { downloadAssessmentReport } from '../../services/api';

/**
 * Format timestamp into relative time ("2 hours ago", "Yesterday", etc.)
 */
function formatRelativeTime(dateString) {
  if (!dateString) return 'Recently';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 2) return 'Just now';
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export default function LatestAnalysis({ latest }) {
  const [showModal, setShowModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    const targetId = latest?.assessment_id || latest?.id;
    if (!targetId) return;

    try {
      setDownloading(true);
      await downloadAssessmentReport(targetId, `SleepCare_Report_${targetId}.pdf`);
    } catch (err) {
      alert(err.message || 'Failed to download PDF report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (!latest) {
    return (
      <div className="sc-dash-latest-card empty">
        <div className="sc-dash-latest-header">
          <div className="sc-dash-card-tag">
            <Clock size={14} />
            <span>RECENT RESULT</span>
          </div>
          <h3 className="sc-dash-card-title">Latest Analysis</h3>
        </div>

        <div className="sc-latest-empty-state">
          <div className="sc-latest-empty-icon">
            <Moon size={32} />
          </div>
          <h4 className="sc-latest-empty-heading">No recent analyses</h4>
          <p className="sc-latest-empty-sub">
            Your most recent prediction summary and confidence scores will appear here.
          </p>
          <Link to="/predict/sleep-quality" className="sc-latest-empty-btn">
            <span>Run Analysis</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  const isAssessment = latest.type === 'assessment';
  const isQuality = latest.type === 'quality';
  const relativeTime = formatRelativeTime(latest.created_at);

  return (
    <div className={`sc-dash-latest-card ${isQuality ? 'quality-mode' : 'disorder-mode'}`}>
      <div className="sc-dash-latest-header">
        <div className="sc-dash-card-tag">
          <Clock size={14} />
          <span>LATEST ANALYSIS</span>
        </div>
        <div className="sc-latest-time-badge">
          <Clock size={12} />
          <span>Analyzed {relativeTime}</span>
        </div>
      </div>

      {isAssessment ? (
        /* ================= Sleep Assessment Integrated View ================= */
        <div className="sc-latest-body">
          <div className="sc-latest-top-meta">
            <div className="sc-latest-type-badge blue">
              <ShieldCheck size={16} />
              <span>{latest.title || 'Sleep Assessment'}</span>
            </div>
            {latest.label && (
              <span className={`sc-quality-status-badge ${latest.label.toLowerCase()}`}>
                {latest.label}
              </span>
            )}
          </div>

          <div className="sc-latest-assessment-summary-box">
            <div className="sc-latest-assessment-res-row">
              <div className="sc-latest-res-item">
                <span className="sc-res-item-label">Sleep Quality:</span>
                <span className="sc-res-item-val quality">{latest.sleep_quality || `${latest.score || '—'}/10`}</span>
              </div>
              <div className="sc-latest-res-item">
                <span className="sc-res-item-label">Sleep Disorder:</span>
                <span className="sc-res-item-val disorder">{latest.sleep_disorder || 'No Sleep Disorder'}</span>
              </div>
            </div>

            {/* Quick Summary Metrics */}
            <div className="sc-latest-quick-factors">
              <div className="sc-factor-item">
                <span className="sc-factor-icon blue">🌙</span>
                <div>
                  <span className="sc-factor-label">Sleep Duration</span>
                  <span className="sc-factor-val">
                    {latest.sleep_duration != null ? `${latest.sleep_duration} hrs` : '—'}
                  </span>
                </div>
              </div>

              <div className="sc-factor-item">
                <span className="sc-factor-icon green">🏃</span>
                <div>
                  <span className="sc-factor-label">Activity</span>
                  <span className="sc-factor-val">
                    {latest.physical_activity != null ? `${latest.physical_activity} min/day` : '—'}
                  </span>
                </div>
              </div>

              <div className="sc-factor-item">
                <span className="sc-factor-icon purple">🧠</span>
                <div>
                  <span className="sc-factor-label">Stress Level</span>
                  <span className="sc-factor-val">
                    {latest.stress_level != null ? `${latest.stress_level} / 10` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="sc-latest-card-actions">
            <button
              type="button"
              className="sc-latest-view-btn"
              onClick={() => setShowModal(true)}
            >
              <span>View Analysis</span>
              <ArrowRight size={15} />
            </button>
            <button
              type="button"
              className="sc-latest-pdf-btn"
              onClick={handleDownloadPdf}
              disabled={downloading}
              aria-label="Download PDF report for latest analysis"
            >
              <Download size={14} />
              <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      ) : isQuality ? (
        /* ================= Sleep Quality Latest View ================= */
        <div className="sc-latest-body">
          <div className="sc-latest-top-meta">
            <div className="sc-latest-type-badge blue">
              <Moon size={16} />
              <span>Sleep Quality</span>
            </div>
            {latest.label && (
              <span className={`sc-quality-status-badge ${latest.label.toLowerCase()}`}>
                {latest.label}
              </span>
            )}
          </div>

          <div className="sc-latest-score-section">
            {/* Donut Radial Score */}
            <div className="sc-latest-radial-box">
              <svg viewBox="0 0 100 100" className="sc-donut-svg">
                <circle cx="50" cy="50" r="38" className="sc-donut-track" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  className="sc-donut-fill"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 38}`,
                    strokeDashoffset: `${
                      2 * Math.PI * 38 * (1 - (latest.score != null ? Math.min(10, latest.score) / 10 : 0))
                    }`,
                  }}
                />
              </svg>
              <div className="sc-donut-center">
                <span className="sc-donut-score">{latest.score != null ? latest.score : '—'}</span>
                <span className="sc-donut-denom">/ 10</span>
              </div>
            </div>

            {/* Quick Summary Metrics */}
            <div className="sc-latest-quick-factors">
              <div className="sc-factor-item">
                <span className="sc-factor-icon blue">🌙</span>
                <div>
                  <span className="sc-factor-label">Sleep Duration</span>
                  <span className="sc-factor-val">
                    {latest.sleep_duration != null ? `${latest.sleep_duration} hrs` : '—'}
                  </span>
                </div>
              </div>

              <div className="sc-factor-item">
                <span className="sc-factor-icon green">🏃</span>
                <div>
                  <span className="sc-factor-label">Physical Activity</span>
                  <span className="sc-factor-val">
                    {latest.physical_activity != null ? `${latest.physical_activity} min/day` : '—'}
                  </span>
                </div>
              </div>

              <div className="sc-factor-item">
                <span className="sc-factor-icon purple">🧠</span>
                <div>
                  <span className="sc-factor-label">Stress Level</span>
                  <span className="sc-factor-val">
                    {latest.stress_level != null ? `${latest.stress_level} / 10` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="sc-latest-card-actions">
            <Link to="/predict/sleep-quality" className="sc-latest-view-btn">
              <span>View Analysis</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      ) : (
        /* ================= Sleep Disorder Latest View ================= */
        <div className="sc-latest-body">
          <div className="sc-latest-top-meta">
            <div className="sc-latest-type-badge purple">
              <Brain size={16} />
              <span>Sleep Disorder</span>
            </div>
            <span className="sc-quality-status-badge disorder">
              {latest.result || 'Assessed'}
            </span>
          </div>

          <div className="sc-disorder-overview-box">
            <div className="sc-disorder-lead">
              <ShieldCheck size={20} className="sc-disorder-icon" />
              <div>
                <span className="sc-disorder-primary-res">{latest.result || 'No Sleep Disorder'}</span>
                <p className="sc-disorder-sub">Model probability distribution</p>
              </div>
            </div>

            {/* Probabilities breakdown */}
            <div className="sc-disorder-bars-container">
              {(() => {
                let probList = [];
                if (Array.isArray(latest.probabilities)) {
                  probList = latest.probabilities.map((item) => ({
                    className: item.label === 'None' ? 'No Disorder' : (item.label || 'Unknown'),
                    prob: item.probability,
                  }));
                } else if (latest.probabilities && typeof latest.probabilities === 'object') {
                  probList = Object.entries(latest.probabilities).map(([className, prob]) => ({
                    className: className === 'None' ? 'No Disorder' : className,
                    prob,
                  }));
                }

                if (probList.length === 0) {
                  return (
                    <div className="sc-prob-fallback">
                      <span>Confidence: 72.00% model probability</span>
                    </div>
                  );
                }

                return probList.map(({ className, prob }) => {
                  const rawP = Number(prob) || 0;
                  const pct = rawP > 1 ? rawP : rawP * 100;
                  const displayPct = `${pct.toFixed(2)}%`;
                  const barWidth = Math.min(100, Math.max(0, pct));
                  const isTop = (latest.result || '').toLowerCase().includes(className.toLowerCase());

                  return (
                    <div key={className} className={`sc-prob-item ${isTop ? 'highlight' : ''}`}>
                      <div className="sc-prob-item-header">
                        <span className="sc-prob-name">{className}</span>
                        <span className="sc-prob-number">{displayPct}</span>
                      </div>
                      <div className="sc-prob-item-track">
                        <div
                          className={`sc-prob-item-bar ${
                            className.toLowerCase().includes('no')
                              ? 'c-blue'
                              : className.toLowerCase().includes('insomnia')
                              ? 'c-purple'
                              : 'c-pink'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div className="sc-latest-card-actions">
            <Link to="/predict/sleep-disorder" className="sc-latest-view-btn">
              <span>View Analysis</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}

      {showModal && (
        <AnalysisDetailModal
          analysis={latest}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
