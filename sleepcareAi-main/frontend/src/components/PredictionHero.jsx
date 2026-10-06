import React from 'react';
import WaveDivider from './WaveDivider';

export default function PredictionHero({ mode = 'quality' }) {
  const isQuality  = mode === 'quality';
  const isAnalysis = mode === 'analysis';
  const isDisorder = mode === 'disorder';

  // ── Hero copy ───────────────────────────────────────────────────────────
  let eyebrow = 'SLEEP QUALITY PREDICTION';
  let title   = (
    <>How Well Are You <span className="sc-hero-title-highlight">Sleeping?</span></>
  );
  let desc    = 'Enter your health and lifestyle information to get a personalized sleep quality score (3–9) with easy-to-understand insights.';
  let artIcon = '🌙';
  let artLabel = 'Moon and night bedroom';
  let cardTag = 'Better sleep, happier you';

  if (isAnalysis) {
    eyebrow  = 'COMPREHENSIVE SLEEP ANALYSIS';
    title    = (
      <>Your Complete <span className="sc-hero-title-highlight">Sleep Health Report</span></>
    );
    desc     = 'Enter your health and lifestyle information once to receive your personalized Sleep Quality Score and Sleep Disorder Risk Assessment — powered by dual XGBoost AI models.';
    artIcon  = '🧬';
    artLabel = 'DNA / health analysis icon';
    cardTag  = 'Quality · Disorder · Insights · all in one';
  } else if (isDisorder) {
    eyebrow  = 'SLEEP DISORDER CLASSIFICATION';
    title    = (
      <>Understand Your <span className="sc-hero-title-highlight">Sleep Health</span></>
    );
    desc     = 'Enter your health and lifestyle information to check the likelihood of insomnia or sleep apnea with confidence scores.';
    artIcon  = '🧠';
    artLabel = 'Glowing brain';
    cardTag  = 'Awareness today for a healthier tomorrow';
  }

  return (
    <section className="sc-hero">
      <div className="sc-hero-ambient" aria-hidden="true" />
      <div className="sc-hero-container">

        {/* Left: text content */}
        <div className="sc-hero-content">
          <span className="sc-hero-eyebrow">{eyebrow}</span>
          <h1 className="sc-hero-title">{title}</h1>
          <p className="sc-hero-desc">{desc}</p>

          {/* Combined badge strip for analysis mode */}
          {isAnalysis && (
            <div className="sc-hero-analysis-badges" aria-hidden="true">
              <span className="sc-hero-badge quality">😴 Sleep Quality</span>
              <span className="sc-hero-badge-sep">+</span>
              <span className="sc-hero-badge disorder">🛡 Disorder Risk</span>
              <span className="sc-hero-badge-sep">+</span>
              <span className="sc-hero-badge xai">✨ XAI Insights</span>
            </div>
          )}
        </div>

        {/* Right: visual card */}
        <div className="sc-hero-visual">
          <div className="sc-hero-card">
            <div className="sc-hero-art">
              <div className="sc-hero-art-icon" role="img" aria-label={artLabel}>
                {artIcon}
              </div>
            </div>
            <div className="sc-hero-card-tag">{cardTag}</div>
          </div>
        </div>
      </div>

      {/* Curved wave transition at bottom */}
      <WaveDivider />
    </section>
  );
}
