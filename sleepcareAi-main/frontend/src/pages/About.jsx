import React from 'react';
import { Link } from 'react-router-dom';
import {
  Moon,
  Shield,
  BarChart3,
  Users,
  Database,
  Cpu,
  Brain,
  Heart,
  ClipboardList,
  Settings,
  Activity,
  CheckCircle2,
  Info,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import Footer from '../components/Footer';
import '../styles/about.css';

export default function About() {
  return (
    <div className="sc-about-page">
      {/* ===================================================================
          1. HERO SECTION
          =================================================================== */}
      <section className="sc-about-hero" aria-label="About SleepCare AI Hero">
        <div className="sc-about-container">
          <div className="sc-about-hero-row">
            {/* Left: Text & Actions */}
            <div className="sc-about-hero-left">
              <span className="sc-about-eyebrow">ABOUT SLEEPCARE AI</span>
              <h1 className="sc-about-title">
                Understanding Sleep Through <span className="sc-about-highlight">Intelligent Analysis</span>
              </h1>
              <p className="sc-about-lead">
                SleepCare AI uses machine learning to analyze sleep-related health and lifestyle information, helping you understand your sleep patterns with clear and meaningful insights.
              </p>
              <div className="sc-about-hero-buttons">
                <Link to="/predict/sleep-quality" className="sc-about-btn-primary" id="about-btn-analysis">
                  <span>Explore Sleep Analysis</span>
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <Link to="/dashboard" className="sc-about-btn-secondary" id="about-btn-dashboard">
                  <span>Go to Dashboard</span>
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Right: Bespoke Healthcare + AI Sleep Illustration */}
            <div className="sc-about-hero-right" aria-hidden="true">
              <div className="sc-about-illustration-wrap">
                <svg
                  className="sc-about-hero-svg"
                  viewBox="0 0 520 400"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="cloudGrad" x1="120" y1="160" x2="400" y2="340" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#E0F0FF" />
                      <stop offset="1" stopColor="#BAE0FD" />
                    </linearGradient>
                    <linearGradient id="blanketGrad" x1="180" y1="230" x2="380" y2="330" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#1E88E5" />
                      <stop offset="1" stopColor="#0B4D9C" />
                    </linearGradient>
                    <linearGradient id="cardGrad" x1="0" y1="0" x2="140" y2="90" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FFFFFF" stopOpacity="0.95" />
                      <stop offset="1" stopColor="#F0F7FF" stopOpacity="0.9" />
                    </linearGradient>
                    <filter id="shadowFilter" x="0" y="0" width="520" height="400" filterUnits="userSpaceOnUse">
                      <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#071D3B" floodOpacity="0.08" />
                    </filter>
                  </defs>

                  {/* Soft Background Glow Orb */}
                  <circle cx="340" cy="180" r="140" fill="#EBF5FF" opacity="0.6" />

                  {/* Crescent Moon */}
                  <path
                    d="M330 60 C300 60 275 85 275 115 C275 145 300 170 330 170 C342 170 353 166 362 160 C345 156 332 140 332 121 C332 101 346 84 364 80 C354 67 343 60 330 60 Z"
                    fill="#147DF5"
                    opacity="0.85"
                  />

                  {/* Subtle Stars */}
                  <circle cx="395" cy="85" r="3.5" fill="#5BB8FF" />
                  <circle cx="260" cy="95" r="2.5" fill="#5BB8FF" opacity="0.8" />
                  <circle cx="430" cy="135" r="3" fill="#5BB8FF" opacity="0.6" />

                  {/* Pillow & Cloud Bed */}
                  <ellipse cx="280" cy="275" rx="140" ry="60" fill="url(#cloudGrad)" />
                  <ellipse cx="230" cy="225" rx="60" ry="32" fill="#FFFFFF" opacity="0.9" filter="drop-shadow(0 4px 10px rgba(7,29,59,0.06))" />

                  {/* Sleeping Figure Head & Hair */}
                  <circle cx="240" cy="210" r="24" fill="#F8D7C2" />
                  <path d="M225 190 C235 185 260 185 268 200 C272 208 268 220 262 225 C255 210 240 205 225 212 Z" fill="#20304D" />
                  {/* Gentle Sleeping Eyelash */}
                  <path d="M236 215 C238 218 244 218 246 215" stroke="#20304D" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Cozy Soft Blanket */}
                  <path
                    d="M175 240 C220 225 300 225 365 245 C380 270 375 315 350 330 C290 340 210 335 165 305 Z"
                    fill="url(#blanketGrad)"
                  />

                  {/* Floating Glass Card 1: Sleep Quality (Top Right) */}
                  <g filter="url(#shadowFilter)" transform="translate(330, 45)">
                    <rect width="135" height="70" rx="14" fill="url(#cardGrad)" stroke="#FFFFFF" strokeWidth="1.5" />
                    <text x="14" y="24" fill="#64748B" fontSize="10" fontWeight="700" letterSpacing="0.05em">SLEEP QUALITY</text>
                    <circle cx="28" cy="46" r="14" fill="#EBF5FF" />
                    <text x="28" y="50" fill="#147DF5" fontSize="11" fontWeight="800" textAnchor="middle">8.2</text>
                    <rect x="52" y="38" width="5" height="18" rx="2" fill="#5BB8FF" />
                    <rect x="62" y="32" width="5" height="24" rx="2" fill="#147DF5" />
                    <rect x="72" y="42" width="5" height="14" rx="2" fill="#5BB8FF" />
                    <rect x="82" y="35" width="5" height="21" rx="2" fill="#147DF5" />
                    <rect x="92" y="44" width="5" height="12" rx="2" fill="#93C5FD" />
                  </g>

                  {/* Floating Glass Card 2: AI Neural Node (Far Right) */}
                  <g filter="url(#shadowFilter)" transform="translate(390, 135)">
                    <circle cx="36" cy="36" r="34" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
                    <circle cx="36" cy="36" r="24" fill="#F3E8FF" />
                    <path
                      d="M36 24 C30 24 26 28 26 33 C26 37 28 39 31 40 L31 46 L41 46 L41 40 C44 39 46 37 46 33 C46 28 42 24 36 24 Z"
                      fill="#8B5CF6"
                    />
                    <circle cx="36" cy="33" r="2.5" fill="#FFFFFF" />
                  </g>

                  {/* Floating Glass Card 3: Sleep Insights (Bottom Right) */}
                  <g filter="url(#shadowFilter)" transform="translate(345, 235)">
                    <rect width="145" height="75" rx="14" fill="url(#cardGrad)" stroke="#FFFFFF" strokeWidth="1.5" />
                    <text x="14" y="24" fill="#64748B" fontSize="10" fontWeight="700" letterSpacing="0.05em">SLEEP INSIGHTS</text>
                    {/* Trend Line Wave */}
                    <path
                      d="M16 52 C30 40 45 60 65 44 C85 32 105 52 130 38"
                      fill="none"
                      stroke="#147DF5"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="65" cy="44" r="3.5" fill="#147DF5" />
                    <circle cx="130" cy="38" r="3.5" fill="#10B981" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          2. WHAT IS SLEEPCARE AI?
          =================================================================== */}
      <section className="sc-about-section" aria-label="What is SleepCare AI">
        <div className="sc-about-container">
          <div className="sc-about-section-header">
            <span className="sc-about-section-label">OUR PLATFORM</span>
            <h2 className="sc-about-section-title">What is SleepCare AI?</h2>
            <p className="sc-about-section-desc">
              SleepCare AI is a web application that uses machine learning to analyze sleep-related health and lifestyle information and provide easy-to-understand, model-estimated insights.
            </p>
          </div>

          <div className="sc-about-three-cards">
            {/* Card 1: Sleep Quality */}
            <article className="sc-about-feature-card">
              <div className="sc-about-card-icon-wrap blue" aria-hidden="true">
                <Moon size={26} />
              </div>
              <h3>Sleep Quality Prediction</h3>
              <p>
                Estimate a sleep quality score based on your health and lifestyle information.
              </p>
            </article>

            {/* Card 2: Sleep Disorder */}
            <article className="sc-about-feature-card">
              <div className="sc-about-card-icon-wrap purple" aria-hidden="true">
                <Shield size={26} />
              </div>
              <h3>Sleep Disorder Classification</h3>
              <p>
                Analyze model-estimated probabilities for common sleep-disorder classes.
              </p>
            </article>

            {/* Card 3: Explainable AI */}
            <article className="sc-about-feature-card">
              <div className="sc-about-card-icon-wrap green" aria-hidden="true">
                <BarChart3 size={26} />
              </div>
              <h3>Explainable Predictions</h3>
              <p>
                See which input features contributed most to each prediction using SHAP.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ===================================================================
          3. WHY WE BUILT SLEEPCARE AI (OUR MOTIVATION)
          =================================================================== */}
      <section className="sc-about-motivation-section" aria-label="Our Motivation">
        <div className="sc-about-container">
          <div className="sc-about-motivation-grid">
            <div className="sc-about-motivation-left">
              <span className="sc-about-section-label">OUR MOTIVATION</span>
              <h2>Why We Built SleepCare AI</h2>
              <p>
                Sleep is influenced by many lifestyle, behavioral, and physiological factors. SleepCare AI brings these signals together into one accessible analysis experience.
              </p>
            </div>

            <div className="sc-about-motivation-pills">
              <div className="sc-about-pill-item">
                <div className="sc-about-pill-header">
                  <div className="sc-about-pill-icon" aria-hidden="true">
                    <Users size={18} />
                  </div>
                  <h4>Accessible</h4>
                </div>
                <p>Designed to make model outputs easier to understand.</p>
              </div>

              <div className="sc-about-pill-item">
                <div className="sc-about-pill-header">
                  <div className="sc-about-pill-icon" aria-hidden="true">
                    <Database size={18} />
                  </div>
                  <h4>Data Driven</h4>
                </div>
                <p>Uses structured health and lifestyle information.</p>
              </div>

              <div className="sc-about-pill-item">
                <div className="sc-about-pill-header">
                  <div className="sc-about-pill-icon" aria-hidden="true">
                    <Settings size={18} />
                  </div>
                  <h4>Explainable</h4>
                </div>
                <p>Provides feature-level explanations alongside predictions.</p>
              </div>

              <div className="sc-about-pill-item">
                <div className="sc-about-pill-header">
                  <div className="sc-about-pill-icon" aria-hidden="true">
                    <Heart size={18} />
                  </div>
                  <h4>Awareness Focused</h4>
                </div>
                <p>Designed for education and awareness, not diagnosis.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          4. HOW IT WORKS (4-Step Horizontal Process)
          =================================================================== */}
      <section className="sc-about-how-section" aria-label="How SleepCare AI Works">
        <div className="sc-about-container">
          <div className="sc-about-section-header">
            <span className="sc-about-section-label">OUR PROCESS</span>
            <h2 className="sc-about-section-title">How SleepCare AI Works</h2>
            <p className="sc-about-section-desc">
              From your information to an understandable AI prediction in four simple steps.
            </p>
          </div>

          <div className="sc-about-steps-row">
            {/* Step 1 */}
            <div className="sc-about-step-card">
              <div className="sc-about-step-badge">01</div>
              <div className="sc-about-step-icon" aria-hidden="true">
                <ClipboardList size={28} />
              </div>
              <h4>Enter Information</h4>
              <p>Provide demographic, sleep, lifestyle and physiological information.</p>
            </div>

            <div className="sc-about-step-arrow" aria-hidden="true">→</div>

            {/* Step 2 */}
            <div className="sc-about-step-card">
              <div className="sc-about-step-badge">02</div>
              <div className="sc-about-step-icon" aria-hidden="true">
                <Settings size={28} />
              </div>
              <h4>Process Data</h4>
              <p>Inputs are validated and transformed into the features expected by the model.</p>
            </div>

            <div className="sc-about-step-arrow" aria-hidden="true">→</div>

            {/* Step 3 */}
            <div className="sc-about-step-card">
              <div className="sc-about-step-badge">03</div>
              <div className="sc-about-step-icon" aria-hidden="true">
                <Brain size={28} />
              </div>
              <h4>Machine Learning</h4>
              <p>XGBoost models analyze the prepared feature vector to generate the prediction.</p>
            </div>

            <div className="sc-about-step-arrow" aria-hidden="true">→</div>

            {/* Step 4 */}
            <div className="sc-about-step-card">
              <div className="sc-about-step-badge">04</div>
              <div className="sc-about-step-icon" aria-hidden="true">
                <BarChart3 size={28} />
              </div>
              <h4>Explain Results</h4>
              <p>The system presents the prediction together with model feature contributions and clear insights.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          5. OUR AI CAPABILITIES (2 Detailed Interactive Preview Cards)
          =================================================================== */}
      <section className="sc-about-ai-section" aria-label="Our AI Capabilities">
        <div className="sc-about-container">
          <div className="sc-about-section-header">
            <span className="sc-about-section-label">TWO WAYS TO EXPLORE</span>
            <h2 className="sc-about-section-title">Our AI Capabilities</h2>
            <p className="sc-about-section-desc">
              SleepCare AI offers two specialized XGBoost models designed for sleep quality scoring and disorder risk assessment.
            </p>
          </div>

          <div className="sc-about-ai-cards-grid">
            {/* Capability 1: Sleep Quality */}
            <div className="sc-about-ai-card">
              <div className="sc-about-ai-header">
                <div className="sc-about-ai-icon-circle blue" aria-hidden="true">
                  <Moon size={26} />
                </div>
                <div>
                  <h3>Sleep Quality Prediction</h3>
                  <p className="card-subtitle">Get a numerical sleep quality score based on your health and lifestyle information.</p>
                </div>
              </div>

              {/* Demo Box */}
              <div className="sc-about-demo-box">
                <div className="sc-about-quality-demo">
                  <div className="sc-about-ring-meter">
                    <span className="sc-about-ring-score">7.8</span>
                    <span className="sc-about-ring-max">/ 10</span>
                  </div>
                  <div className="sc-about-checklist">
                    <span className="sc-about-badge-good">Good</span>
                    <div className="sc-about-check-item">
                      <CheckCircle2 size={16} />
                      <span>Regression model (XGBoost)</span>
                    </div>
                    <div className="sc-about-check-item">
                      <CheckCircle2 size={16} />
                      <span>Score-based output</span>
                    </div>
                    <div className="sc-about-check-item">
                      <CheckCircle2 size={16} />
                      <span>Easy to understand</span>
                    </div>
                  </div>
                </div>
              </div>

              <Link to="/predict/sleep-quality" className="sc-about-card-btn sc-btn-blue">
                <span>Try Sleep Quality</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>

            {/* Capability 2: Sleep Disorder */}
            <div className="sc-about-ai-card">
              <div className="sc-about-ai-header">
                <div className="sc-about-ai-icon-circle purple" aria-hidden="true">
                  <Brain size={26} />
                </div>
                <div>
                  <h3>Sleep Disorder Classification</h3>
                  <p className="card-subtitle">Check model-estimated probabilities for common sleep-disorder classes.</p>
                </div>
              </div>

              {/* Demo Box */}
              <div className="sc-about-demo-box">
                <div className="sc-about-disorder-bars">
                  {/* Class 1 */}
                  <div className="sc-about-bar-row">
                    <div className="sc-about-bar-header">
                      <span>No Sleep Disorder</span>
                      <span className="sc-about-bar-pct">72%</span>
                    </div>
                    <div className="sc-about-bar-track">
                      <div className="sc-about-bar-fill blue" style={{ width: '72%' }} />
                    </div>
                  </div>

                  {/* Class 2 */}
                  <div className="sc-about-bar-row">
                    <div className="sc-about-bar-header">
                      <span>Insomnia</span>
                      <span className="sc-about-bar-pct">18%</span>
                    </div>
                    <div className="sc-about-bar-track">
                      <div className="sc-about-bar-fill purple" style={{ width: '18%' }} />
                    </div>
                  </div>

                  {/* Class 3 */}
                  <div className="sc-about-bar-row">
                    <div className="sc-about-bar-header">
                      <span>Sleep Apnea</span>
                      <span className="sc-about-bar-pct">10%</span>
                    </div>
                    <div className="sc-about-bar-track">
                      <div className="sc-about-bar-fill red" style={{ width: '10%' }} />
                    </div>
                  </div>
                </div>
                <span className="sc-about-illustrative-tag">*Illustrative example values</span>
              </div>

              <Link to="/predict/sleep-disorder" className="sc-about-card-btn sc-btn-purple">
                <span>Try Sleep Disorder</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          6. EXPLAINABLE AI
          =================================================================== */}
      <section className="sc-about-explain-section" aria-label="Explainable AI">
        <div className="sc-about-container">
          <div className="sc-about-section-header">
            <span className="sc-about-section-label">INTERPRETABILITY</span>
            <h2 className="sc-about-section-title">Understand Why AI Made a Prediction</h2>
            <p className="sc-about-section-desc">
              SleepCare AI shows which input features contributed to an individual model prediction using transparent feature attribution.
            </p>
          </div>

          <div className="sc-about-explain-card">
            <div className="sc-about-explain-features">
              {/* Feature 1 */}
              <div className="sc-about-feature-item">
                <span className="sc-about-feature-name">Sleep Duration</span>
                <div className="sc-about-feature-bar-wrap">
                  <div className="sc-about-feature-bar-fill" style={{ width: '85%', background: '#10B981' }} />
                </div>
                <span className="sc-about-feature-val positive">+1.42 (High impact)</span>
              </div>

              {/* Feature 2 */}
              <div className="sc-about-feature-item">
                <span className="sc-about-feature-name">Stress Level</span>
                <div className="sc-about-feature-bar-wrap">
                  <div className="sc-about-feature-bar-fill" style={{ width: '58%', background: '#EF4444' }} />
                </div>
                <span className="sc-about-feature-val negative">-0.85 (Negative)</span>
              </div>

              {/* Feature 3 */}
              <div className="sc-about-feature-item">
                <span className="sc-about-feature-name">Physical Activity</span>
                <div className="sc-about-feature-bar-wrap">
                  <div className="sc-about-feature-bar-fill" style={{ width: '42%', background: '#10B981' }} />
                </div>
                <span className="sc-about-feature-val positive">+0.52 (Positive)</span>
              </div>

              {/* Feature 4 */}
              <div className="sc-about-feature-item">
                <span className="sc-about-feature-name">Heart Rate</span>
                <div className="sc-about-feature-bar-wrap">
                  <div className="sc-about-feature-bar-fill" style={{ width: '25%', background: '#F59E0B' }} />
                </div>
                <span className="sc-about-feature-val negative">-0.31 (Mild negative)</span>
              </div>
            </div>

            <div className="sc-about-disclaimer-note">
              <Info size={18} aria-hidden="true" />
              <span>Model explanations describe model behavior and do not establish medical causation.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          7. TECHNOLOGY SECTION
          =================================================================== */}
      <section className="sc-about-tech-section" aria-label="Technologies Used">
        <div className="sc-about-container">
          <span className="sc-about-section-label">CORE TECHNOLOGIES</span>
          <h2 className="sc-about-section-title" style={{ fontSize: '1.75rem' }}>
            Built With Modern Data Science & Web Tools
          </h2>
          <div className="sc-about-tech-badges">
            <span className="sc-about-tech-badge">Python</span>
            <span className="sc-about-tech-badge">XGBoost</span>
            <span className="sc-about-tech-badge">scikit-learn</span>
            <span className="sc-about-tech-badge">pandas</span>
            <span className="sc-about-tech-badge">NumPy</span>
            <span className="sc-about-tech-badge">Django</span>
            <span className="sc-about-tech-badge">React</span>
            <span className="sc-about-tech-badge">Vite</span>
            <span className="sc-about-tech-badge">SHAP</span>
          </div>
        </div>
      </section>

      {/* ===================================================================
          8. RESPONSIBLE AI (One Simple Card)
          =================================================================== */}
      <section className="sc-about-responsible-section" aria-label="Responsible AI Disclaimer">
        <div className="sc-about-container">
          <div className="sc-about-responsible-card">
            <div className="sc-about-responsible-icon" aria-hidden="true">
              <ShieldCheck size={26} />
            </div>
            <p className="sc-about-responsible-text">
              <strong>Responsible AI Commitment:</strong> SleepCare AI provides machine-learning estimates for educational and awareness purposes. It is not a medical diagnosis and should not replace professional medical advice.
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================================
          9. FINAL CTA SECTION
          =================================================================== */}
      <section className="sc-about-final-cta" aria-label="Explore Sleep Analysis Call to Action">
        <div className="sc-about-container">
          <div className="sc-about-cta-box">
            <h2>Ready to Explore Your Sleep?</h2>
            <p>
              Start with a 2-minute sleep analysis and receive instant AI-powered health insights.
            </p>
            <Link to="/predict/sleep-quality" className="sc-about-btn-primary" style={{ padding: '0.95rem 2rem', fontSize: '1.02rem' }}>
              <span>Start Sleep Analysis</span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
