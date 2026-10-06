import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, HelpCircle, GitCommit, Sliders, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ExplainabilityCard() {
  return (
    <section className="sc-dash-xai-section" aria-labelledby="xai-heading">
      <div className="sc-xai-container-card">
        <div className="sc-xai-header-content">
          <div className="sc-dash-card-tag xai">
            <Layers size={14} />
            <span>EXPLAINABLE AI (XAI)</span>
          </div>
          <h2 id="xai-heading" className="sc-xai-title">
            Understand Your AI Predictions
          </h2>
          <p className="sc-xai-desc">
            See which factors influenced your individual SleepCare AI predictions with calibrated feature attributions.
          </p>
        </div>

        {/* 3 Mini Cards Grid */}
        <div className="sc-xai-mini-grid">
          {/* 1. SHAP Explanations */}
          <div className="sc-xai-mini-card">
            <div className="sc-xai-icon-wrap blue">
              <Sliders size={20} />
            </div>
            <h4 className="sc-xai-card-title">SHAP Explanations</h4>
            <p className="sc-xai-card-text">
              Understand which features contributed most to each prediction and examine local decision weights.
            </p>
            <div className="sc-xai-badge">
              <CheckCircle2 size={12} />
              <span>Feature Ranking</span>
            </div>
          </div>

          {/* 2. Feature Contributions */}
          <div className="sc-xai-mini-card">
            <div className="sc-xai-icon-wrap teal">
              <GitCommit size={20} />
            </div>
            <h4 className="sc-xai-card-title">Feature Contributions</h4>
            <p className="sc-xai-card-text">
              See whether individual inputs pushed the model output higher or lower relative to population baselines.
            </p>
            <div className="sc-xai-badge">
              <CheckCircle2 size={12} />
              <span>Directional Impact</span>
            </div>
          </div>

          {/* 3. Transparent AI */}
          <div className="sc-xai-mini-card">
            <div className="sc-xai-icon-wrap purple">
              <HelpCircle size={20} />
            </div>
            <h4 className="sc-xai-card-title">Transparent AI</h4>
            <p className="sc-xai-card-text">
              Explore how the calibrated XGBoost model arrived at its estimated result with clear probability outputs.
            </p>
            <div className="sc-xai-badge">
              <CheckCircle2 size={12} />
              <span>Glass-Box Model</span>
            </div>
          </div>
        </div>

        {/* CTA Bar */}
        <div className="sc-xai-footer">
          <Link to="/predict/sleep-quality" className="sc-xai-cta-btn">
            <span>Explore Your Explanations</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
