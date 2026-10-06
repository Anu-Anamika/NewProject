import React from 'react';
import { Layers, CheckCircle2, AlertTriangle, Info, Sliders } from 'lucide-react';
import './ExplainabilitySection.css';

/**
 * ExplainabilitySection
 * Displays calibrated Explainable AI (XAI) feature attributions,
 * positive contributors, and risk factors returned by the backend ML pipeline.
 */
export default function ExplainabilitySection({ xai }) {
  if (!xai) return null;

  const factors = xai.factors || [];
  const positiveContributors = xai.positive_contributors || [];
  const riskFactors = xai.risk_factors || [];

  if (factors.length === 0 && positiveContributors.length === 0 && riskFactors.length === 0) {
    return null;
  }

  return (
    <section className="sc-xai-section" aria-labelledby="xai-heading">
      <div className="sc-xai-card">
        {/* Header */}
        <div className="sc-xai-header">
          <div className="sc-xai-tag">
            <Layers size={14} />
            <span>EXPLAINABLE AI (XAI)</span>
          </div>
          <h2 id="xai-heading" className="sc-xai-heading">
            Feature Attribution & Decision Factors
          </h2>
          <p className="sc-xai-subheading">
            Understand how your specific health markers influenced the model's disorder prediction.
          </p>
        </div>

        {/* Feature Attribution Grid */}
        {factors.length > 0 && (
          <div className="sc-xai-factors-grid">
            {factors.map((f, idx) => (
              <div key={idx} className={`sc-xai-factor-card ${f.impact}`}>
                <div className="sc-xai-factor-top">
                  <div className="sc-xai-factor-name-wrap">
                    <Sliders size={14} className="sc-xai-slider-icon" />
                    <strong className="sc-xai-factor-name">{f.feature}</strong>
                  </div>
                  <span className={`sc-xai-factor-badge ${f.impact}`}>
                    {f.value}
                  </span>
                </div>
                <p className="sc-xai-factor-detail">{f.detail}</p>
              </div>
            ))}
          </div>
        )}

        {/* Positive Contributors vs Risk Factors */}
        {(positiveContributors.length > 0 || riskFactors.length > 0) && (
          <div className="sc-xai-pos-risk-grid">
            {positiveContributors.length > 0 && (
              <div className="sc-xai-insights-col positive">
                <h4 className="sc-xai-insights-heading">
                  <CheckCircle2 size={16} />
                  <span>Protective Contributors</span>
                </h4>
                <ul className="sc-xai-insights-list">
                  {positiveContributors.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {riskFactors.length > 0 && (
              <div className="sc-xai-insights-col risk">
                <h4 className="sc-xai-insights-heading">
                  <AlertTriangle size={16} />
                  <span>Factors Influencing Risk</span>
                </h4>
                <ul className="sc-xai-insights-list">
                  {riskFactors.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* XAI Note */}
        <div className="sc-xai-note">
          <Info size={14} />
          <span>
            Feature attribution generated via model explainability heuristics and XGBoost feature importance weights.
          </span>
        </div>
      </div>
    </section>
  );
}
