import React from 'react';
import { Link } from 'react-router-dom';
import { Moon, Brain, ArrowRight, Sparkles, Activity } from 'lucide-react';

export default function AnalysisActionCard({ type }) {
  if (type === 'quality') {
    return (
      <div className="sc-dash-action-card sc-action-quality">
        <div className="sc-dash-action-content">
          <div className="sc-dash-action-header">
            <div className="sc-dash-action-icon-wrap quality">
              <Moon size={24} />
            </div>
            <div className="sc-dash-action-pill quality">
              <Sparkles size={12} />
              <span>Regression Model</span>
            </div>
          </div>

          <h3 className="sc-dash-action-title">Sleep Quality</h3>
          <p className="sc-dash-action-desc">
            Get an AI-estimated sleep quality score based on your health and lifestyle information.
          </p>

          <Link to="/predict/sleep-quality" className="sc-dash-action-btn quality">
            <span>Analyze Sleep Quality</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Visual: Circular score graphic & dreamy moon illustration */}
        <div className="sc-dash-action-visual quality" aria-hidden="true">
          <div className="sc-quality-visual-badge">
            <div className="sc-quality-radial-ring">
              <svg viewBox="0 0 100 100" className="sc-quality-radial-svg">
                <circle cx="50" cy="50" r="40" className="sc-radial-track" />
                <circle cx="50" cy="50" r="40" className="sc-radial-indicator" />
              </svg>
              <div className="sc-quality-radial-text">
                <span className="sc-score-num">8.2</span>
                <span className="sc-score-max">/ 10</span>
              </div>
            </div>
            <span className="sc-quality-tag">AI Target</span>
          </div>

          {/* Floating decorative elements */}
          <div className="sc-visual-floater f-moon">🌙</div>
          <div className="sc-visual-floater f-zzz1">z</div>
          <div className="sc-visual-floater f-zzz2">z</div>
          <div className="sc-visual-floater f-zzz3">Z</div>
        </div>
      </div>
    );
  }

  // Sleep Disorder variant
  return (
    <div className="sc-dash-action-card sc-action-disorder">
      <div className="sc-dash-action-content">
        <div className="sc-dash-action-header">
          <div className="sc-dash-action-icon-wrap disorder">
            <Brain size={24} />
          </div>
          <div className="sc-dash-action-pill disorder">
            <Activity size={12} />
            <span>Multi-Class XGBoost</span>
          </div>
        </div>

        <h3 className="sc-dash-action-title">Sleep Disorder</h3>
        <p className="sc-dash-action-desc">
          Explore model-estimated probabilities for common sleep-disorder classifications.
        </p>

        <Link to="/predict/sleep-disorder" className="sc-dash-action-btn disorder">
          <span>Analyze Sleep Disorder</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Visual: Deep navy / waveform & probability visualization */}
      <div className="sc-dash-action-visual disorder" aria-hidden="true">
        <div className="sc-disorder-visual-card">
          <div className="sc-disorder-waveform-wrap">
            <svg viewBox="0 0 140 40" className="sc-waveform-svg">
              <path
                d="M0 20 Q 20 20, 30 20 T 45 10 T 55 32 T 65 6 T 75 28 T 85 18 T 95 20 T 140 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="sc-disorder-prob-bars">
            <div className="sc-prob-bar-row">
              <span className="sc-prob-bar-label">No Disorder</span>
              <div className="sc-prob-bar-track">
                <div className="sc-prob-bar-fill c-blue" style={{ width: '74%' }}></div>
              </div>
              <span className="sc-prob-bar-pct">74%</span>
            </div>

            <div className="sc-prob-bar-row">
              <span className="sc-prob-bar-label">Insomnia</span>
              <div className="sc-prob-bar-track">
                <div className="sc-prob-bar-fill c-purple" style={{ width: '18%' }}></div>
              </div>
              <span className="sc-prob-bar-pct">18%</span>
            </div>

            <div className="sc-prob-bar-row">
              <span className="sc-prob-bar-label">Sleep Apnea</span>
              <div className="sc-prob-bar-track">
                <div className="sc-prob-bar-fill c-pink" style={{ width: '8%' }}></div>
              </div>
              <span className="sc-prob-bar-pct">8%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
