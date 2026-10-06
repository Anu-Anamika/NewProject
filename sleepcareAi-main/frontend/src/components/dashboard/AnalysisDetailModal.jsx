import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Moon,
  Brain,
  ShieldCheck,
  Calendar,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Scale,
  Gauge,
  Footprints,
  Download,
  Trash2,
} from 'lucide-react';
import { downloadAssessmentReport } from '../../services/api';

export default function AnalysisDetailModal({ analysis, onClose, onDelete }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    const targetId = analysis.assessment_id || (analysis.assessment && analysis.assessment.id) || analysis.id;
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!analysis) return null;

  const title = analysis.title || (analysis.assessment_id ? `Sleep Assessment #${analysis.assessment_id}` : 'Sleep Assessment');
  const dateStr = analysis.date || analysis.prediction_date || 'Recently';
  const qualityScore = analysis.sleep_quality_score != null ? `${Number(analysis.sleep_quality_score).toFixed(1)} / 10` : (analysis.sleep_quality || '—');
  const qualityLabel = analysis.sleep_quality_label || '';
  const disorderResult = analysis.sleep_disorder_result || analysis.sleep_disorder || 'No Sleep Disorder';
  const probList = Array.isArray(analysis.probabilities)
    ? analysis.probabilities
    : (analysis.model_probabilities && Array.isArray(analysis.model_probabilities))
      ? analysis.model_probabilities
      : (analysis.probabilities && typeof analysis.probabilities === 'object')
        ? Object.entries(analysis.probabilities).map(([k, v]) => ({ label: k, probability: v }))
        : [];

  const xai = analysis.explainable_ai || {};
  const factors = xai.factors || [];
  const positiveContributors = xai.positive_contributors || [];
  const riskFactors = xai.risk_factors || [];
  const assessment = analysis.assessment || null;
  const inputData = analysis.input_data || {};

  return (
    <div className="sc-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="analysis-modal-title">
      <div className="sc-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sc-modal-header">
          <div className="sc-modal-header-info">
            <div className="sc-dash-card-tag">
              <ShieldCheck size={14} />
              <span>SAVED SLEEP ANALYSIS</span>
            </div>
            <h2 id="analysis-modal-title" className="sc-modal-title">{title}</h2>
            <div className="sc-modal-date">
              <Calendar size={13} />
              <span>{dateStr}</span>
            </div>
          </div>
          <button type="button" className="sc-modal-close-btn" onClick={onClose} aria-label="Close analysis details">
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="sc-modal-body">
          {/* Top 2 Summary Cards */}
          <div className="sc-modal-results-grid">
            {/* Sleep Quality Box */}
            <div className="sc-modal-result-box quality">
              <div className="sc-modal-result-top">
                <div className="sc-modal-icon-badge blue">
                  <Moon size={18} />
                </div>
                <span className="sc-modal-result-type">Sleep Quality</span>
              </div>
              <div className="sc-modal-score-value">{qualityScore}</div>
              {qualityLabel && (
                <div className="sc-modal-pill quality">{qualityLabel}</div>
              )}
            </div>

            {/* Sleep Disorder Box */}
            <div className="sc-modal-result-box disorder">
              <div className="sc-modal-result-top">
                <div className="sc-modal-icon-badge purple">
                  <Brain size={18} />
                </div>
                <span className="sc-modal-result-type">Sleep Disorder</span>
              </div>
              <div className="sc-modal-disorder-value">{disorderResult}</div>
              <div className={`sc-modal-pill ${disorderResult === 'No Sleep Disorder' ? 'safe' : 'alert'}`}>
                {disorderResult === 'No Sleep Disorder' ? 'Healthy Sleep Pattern' : 'Clinical Screening Indicator'}
              </div>
            </div>
          </div>

          {/* Model Probability Breakdown if available */}
          {probList.length > 0 && (
            <div className="sc-modal-section">
              <h3 className="sc-modal-section-title">
                <Gauge size={16} />
                <span>Classification Probabilities</span>
              </h3>
              <div className="sc-modal-prob-list">
                {probList.map((item, idx) => {
                  const displayLabel = item.label === 'None' ? 'No Sleep Disorder' : item.label;
                  const rawP = Number(item.probability) || 0;
                  const pct = rawP > 1 ? rawP : rawP * 100;
                  const probDisplay = `${pct.toFixed(2)}%`;
                  const barWidth = Math.min(100, Math.max(0, pct));
                  return (
                    <div key={idx} className="sc-modal-prob-row">
                      <div className="sc-modal-prob-labels">
                        <span className="sc-modal-prob-name">{displayLabel}</span>
                        <span className="sc-modal-prob-val">{probDisplay}</span>
                      </div>
                      <div className="sc-modal-prob-track">
                        <div
                          className={`sc-modal-prob-bar ${item.label === 'Insomnia' ? 'insomnia' : item.label === 'Sleep Apnea' ? 'apnea' : 'none'}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Explainable AI Factors */}
          {factors.length > 0 && (
            <div className="sc-modal-section">
              <h3 className="sc-modal-section-title">
                <Layers size={16} />
                <span>Explainable AI (XAI) Attribution</span>
              </h3>
              <div className="sc-modal-factors-grid">
                {factors.map((f, idx) => (
                  <div key={idx} className={`sc-modal-factor-card ${f.impact}`}>
                    <div className="sc-modal-factor-top">
                      <strong className="sc-modal-factor-name">{f.feature}</strong>
                      <span className={`sc-modal-factor-badge ${f.impact}`}>{f.value}</span>
                    </div>
                    <p className="sc-modal-factor-detail">{f.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Positive vs Risk factors list */}
          {(positiveContributors.length > 0 || riskFactors.length > 0) && (
            <div className="sc-modal-pos-risk-grid">
              {positiveContributors.length > 0 && (
                <div className="sc-modal-insights-col positive">
                  <h4 className="sc-modal-insights-heading">
                    <CheckCircle2 size={15} />
                    <span>Positive Contributors</span>
                  </h4>
                  <ul className="sc-modal-insights-list">
                    {positiveContributors.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {riskFactors.length > 0 && (
                <div className="sc-modal-insights-col risk">
                  <h4 className="sc-modal-insights-heading">
                    <AlertTriangle size={15} />
                    <span>Factors Influencing Risk</span>
                  </h4>
                  <ul className="sc-modal-insights-list">
                    {riskFactors.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Chatbot Questionnaire Symptoms (if assessment attached) */}
          {assessment && (
            <div className="sc-modal-section">
              <h3 className="sc-modal-section-title">
                <Sparkles size={16} />
                <span>Conversational Assessment Screening</span>
              </h3>
              <div className="sc-modal-assessment-badges">
                <div className="sc-modal-badge-item">
                  <span className="label">Difficulty Falling Asleep:</span>
                  <span className={`val ${assessment.difficulty_falling_asleep ? 'yes' : 'no'}`}>
                    {assessment.difficulty_falling_asleep ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="sc-modal-badge-item">
                  <span className="label">Night Awakenings:</span>
                  <span className={`val ${assessment.frequent_night_awakenings ? 'yes' : 'no'}`}>
                    {assessment.frequent_night_awakenings ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="sc-modal-badge-item">
                  <span className="label">Daytime Sleepiness:</span>
                  <span className={`val ${assessment.daytime_sleepiness ? 'yes' : 'no'}`}>
                    {assessment.daytime_sleepiness ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="sc-modal-badge-item">
                  <span className="label">Loud Snoring:</span>
                  <span className={`val ${assessment.loud_snoring ? 'yes' : 'no'}`}>
                    {assessment.loud_snoring ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="sc-modal-badge-item">
                  <span className="label">Gasping or Choking:</span>
                  <span className={`val ${assessment.gasping_or_choking ? 'yes' : 'no'}`}>
                    {assessment.gasping_or_choking ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="sc-modal-badge-item">
                  <span className="label">Unrefreshing Sleep:</span>
                  <span className={`val ${assessment.unrefreshing_sleep ? 'yes' : 'no'}`}>
                    {assessment.unrefreshing_sleep ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sc-modal-footer">
          {onDelete && (
            <button
              type="button"
              className="sc-modal-btn-delete"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.6rem 1.05rem',
                borderRadius: '8px',
                background: '#FEF2F2',
                color: '#DC2626',
                border: '1px solid rgba(220, 38, 38, 0.25)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginRight: 'auto',
                transition: 'all 0.15s ease',
              }}
              onClick={() => onDelete(analysis)}
              title="Delete this analysis"
            >
              <Trash2 size={15} />
              <span>Delete Analysis</span>
            </button>
          )}
          <button
            type="button"
            className="sc-modal-btn-download-pdf"
            onClick={handleDownloadPdf}
            disabled={downloading}
            aria-label="Download analysis as PDF report"
          >
            <Download size={15} />
            <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
          </button>
          <button type="button" className="sc-modal-btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
