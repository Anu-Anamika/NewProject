import React from 'react';
import {
  Moon,
  Clock,
  Sunrise,
  Brain,
  Frown,
  Volume2,
  EyeOff,
  Wind,
  BatteryLow,
  Droplets,
  Bed,
  Sparkles,
  ShieldCheck,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { normalizeCondition, DISEASE_CONFIG } from '../services/diseaseConfig';
import './DiseaseInformation.css';

/**
 * Custom Respiratory / Lungs Icon for OSA Header
 */
function LungsIcon({ size = 26, color = '#147df5' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v9" />
      <path d="M12 12c-2.4 0-5 2.1-5 5.5A3.5 3.5 0 0 0 13 20" />
      <path d="M12 12c2.4 0 5 2.1 5 5.5A3.5 3.5 0 0 1 11 20" />
      <path d="M9 6.5C7.2 6.5 6 8 6 9.8" />
      <path d="M15 6.5C16.8 6.5 18 8 18 9.8" />
    </svg>
  );
}

/**
 * Icon renderer for white circular line icons in the symptoms card
 */
function SymptomIcon({ type }) {
  const iconProps = { size: 16, strokeWidth: 1.85 };

  switch (type) {
    case 'moon':
      return <Moon {...iconProps} />;
    case 'clock':
      return <Clock {...iconProps} />;
    case 'sunrise':
      return <Sunrise {...iconProps} />;
    case 'tired':
    case 'exhausted':
    case 'battery':
      return <BatteryLow {...iconProps} />;
    case 'brain':
    case 'headache':
      return <Brain {...iconProps} />;
    case 'mood':
    case 'irritability':
      return <Frown {...iconProps} />;
    case 'snore':
    case 'volume':
      return <Volume2 {...iconProps} />;
    case 'eye-off':
      return <EyeOff {...iconProps} />;
    case 'gasp':
    case 'wind':
      return <Wind {...iconProps} />;
    case 'throat':
    case 'droplets':
      return <Droplets {...iconProps} />;
    case 'sparkles':
      return <Sparkles {...iconProps} />;
    default:
      return <Sparkles {...iconProps} />;
  }
}

/**
 * Reusable DiseaseInformation Component
 *
 * Displays dynamically tailored educational medical illustrations, symptoms,
 * and pathology information based on ML prediction result.
 *
 * @param {Object} props
 * @param {string|Object} props.condition - The predicted condition name or prediction object
 */
export default function DiseaseInformation({ condition }) {
  const normalizedKey = normalizeCondition(condition);
  const data = DISEASE_CONFIG[normalizedKey] || DISEASE_CONFIG.no_disorder;

  return (
    <section
      className="sc-disease-info-container"
      aria-label={`Medical information for ${data.title}`}
    >
      <div className="sc-disease-card">
        {/* Header Section */}
        <div className="sc-disease-header">
          {data.headerIcon === 'lungs' && (
            <div className="sc-disease-header-icon-box" aria-hidden="true">
              <LungsIcon size={28} />
            </div>
          )}
          {data.headerIcon === 'shield-check' && (
            <div className="sc-disease-header-icon-box" aria-hidden="true">
              <ShieldCheck size={26} color="#059669" />
            </div>
          )}

          <div className="sc-disease-header-text">
            <span className="sc-disease-eyebrow">{data.eyebrow}</span>
            <h2 className="sc-disease-title">{data.title}</h2>
            <p className="sc-disease-desc">{data.description}</p>

            {/* Action Buttons (e.g. for Insomnia reference design) */}
            {data.actions && data.actions.length > 0 && (
              <div className="sc-disease-actions">
                {data.actions.map((act) => (
                  <a
                    key={act.id}
                    href={act.href}
                    className={`sc-disease-btn ${act.type}`}
                  >
                    {act.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------------
            Condition Layout 1: Insomnia
            (Side-by-side brain activity illustrations + full-width symptoms card)
           ------------------------------------------------------------------ */}
        {data.layoutType === 'insomnia' && (
          <div className="sc-insomnia-layout">
            <div className="sc-insomnia-visuals-grid">
              {data.illustrations.map((ill) => (
                <div key={ill.id} className="sc-illustration-card">
                  <div className="sc-illustration-img-box">
                    <img
                      src={ill.image}
                      alt={ill.alt}
                      className="sc-illustration-img"
                      loading="lazy"
                    />
                  </div>
                  <div className={`sc-pill-badge ${ill.badgeType}`}>
                    {ill.badge}
                  </div>
                  <p className="sc-illustration-desc">{ill.description}</p>
                </div>
              ))}
            </div>

            {/* Symptoms Card */}
            <div className="sc-symptoms-card">
              <h3 className="sc-symptoms-title">{data.symptomsCard.title}</h3>
              <p className="sc-symptoms-desc">{data.symptomsCard.description}</p>
              <div
                className={`sc-symptoms-list ${
                  data.symptomsCard.twoColumns ? 'columns-2' : ''
                }`}
              >
                {data.symptomsCard.items.map((item, idx) => (
                  <div key={idx} className="sc-symptom-item">
                    <div className="sc-symptom-icon-wrap" aria-hidden="true">
                      <SymptomIcon type={item.icon} />
                    </div>
                    <span className="sc-symptom-label">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            Condition Layout 2: Sleep Apnea / OSA
            (Left column: 2 airway cross-sections; Right column: What happens + Common symptoms)
           ------------------------------------------------------------------ */}
        {data.layoutType === 'sleep_apnea' && (
          <div className="sc-osa-layout">
            {/* Left Column: Side-by-side airway cross-sections */}
            <div className="sc-osa-visuals-col">
              {data.illustrations.map((ill) => (
                <div key={ill.id} className="sc-illustration-card">
                  <div className="sc-illustration-img-box">
                    <img
                      src={ill.image}
                      alt={ill.alt}
                      className="sc-illustration-img"
                      loading="lazy"
                    />
                  </div>
                  <div className={`sc-pill-badge ${ill.badgeType}`}>
                    {ill.badge}
                  </div>
                  <p className="sc-illustration-desc">{ill.description}</p>
                </div>
              ))}
            </div>

            {/* Right Column: "What happens?" card + Symptoms Card */}
            <div className="sc-osa-info-col">
              {data.whatHappens && (
                <div className="sc-what-happens-card">
                  <div className="sc-what-happens-header">
                    <div className="sc-what-happens-icon-box" aria-hidden="true">
                      <AlertTriangle size={18} />
                    </div>
                    <h4 className="sc-what-happens-title">
                      {data.whatHappens.title}
                    </h4>
                  </div>
                  <p className="sc-what-happens-text">{data.whatHappens.text}</p>
                </div>
              )}

              {/* Blue Common Symptoms Card */}
              <div className="sc-symptoms-card">
                <div className="sc-symptoms-card-header">
                  <div className="sc-symptoms-header-icon" aria-hidden="true">
                    <Bed size={20} />
                  </div>
                  <div className="sc-symptoms-header-content">
                    <h3 className="sc-symptoms-title">
                      {data.symptomsCard.title}
                    </h3>
                    <p className="sc-symptoms-desc">
                      {data.symptomsCard.description}
                    </p>
                  </div>
                </div>

                <div className="sc-symptoms-list">
                  {data.symptomsCard.items.map((item, idx) => (
                    <div key={idx} className="sc-symptom-item">
                      <div className="sc-symptom-icon-wrap" aria-hidden="true">
                        <SymptomIcon type={item.icon} />
                      </div>
                      <span className="sc-symptom-label">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            Condition Layout 3: No Sleep Disorder (Healthy Sleep)
            (Left column: Calm healthy sleep visual; Right column: Model notes + sleep practices)
           ------------------------------------------------------------------ */}
        {data.layoutType === 'no_disorder' && (
          <div className="sc-healthy-layout">
            {/* Left Column: Healthy Sleep Illustration */}
            <div className="sc-healthy-visual-col">
              <div className="sc-illustration-card">
                <div className="sc-illustration-img-box large">
                  <img
                    src={data.illustrations[0].image}
                    alt={data.illustrations[0].alt}
                    className="sc-illustration-img"
                    loading="lazy"
                  />
                </div>
                <div className="sc-pill-badge healthy">
                  {data.illustrations[0].badge}
                </div>
                <p className="sc-illustration-desc">
                  {data.illustrations[0].description}
                </p>
              </div>
            </div>

            {/* Right Column: Model Note + Sleep Hygiene Practices */}
            <div className="sc-healthy-info-col">
              {data.whatHappens && (
                <div className="sc-what-happens-card">
                  <div className="sc-what-happens-header">
                    <div
                      className="sc-what-happens-icon-box healthy"
                      aria-hidden="true"
                    >
                      <Sparkles size={18} />
                    </div>
                    <h4 className="sc-what-happens-title">
                      {data.whatHappens.title}
                    </h4>
                  </div>
                  <p className="sc-what-happens-text">{data.whatHappens.text}</p>
                </div>
              )}

              <div className="sc-symptoms-card">
                <div className="sc-symptoms-card-header">
                  <div className="sc-symptoms-header-icon" aria-hidden="true">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="sc-symptoms-header-content">
                    <h3 className="sc-symptoms-title">
                      {data.symptomsCard.title}
                    </h3>
                    <p className="sc-symptoms-desc">
                      {data.symptomsCard.description}
                    </p>
                  </div>
                </div>

                <div className="sc-symptoms-list">
                  {data.symptomsCard.items.map((item, idx) => (
                    <div key={idx} className="sc-symptom-item">
                      <div className="sc-symptom-icon-wrap" aria-hidden="true">
                        <SymptomIcon type={item.icon} />
                      </div>
                      <span className="sc-symptom-label">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            Medical Disclaimer (Mandatory)
           ------------------------------------------------------------------ */}
        <div className="sc-disease-disclaimer" id="medical-disclaimer">
          <Info size={16} className="sc-disease-disclaimer-icon" aria-hidden="true" />
          <span>{data.disclaimer}</span>
        </div>
      </div>
    </section>
  );
}
