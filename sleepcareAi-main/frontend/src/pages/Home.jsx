import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  FlaskConical,
  ShieldCheck,
  Cpu,
  HeartPulse,
  Moon,
  Shield,
  BarChart3,
  Users,
  ClipboardList,
  Settings,
  Heart,
  ArrowRight,
} from 'lucide-react';
import Footer from '../components/Footer';
import '../styles/home.css';

export default function Home() {
  return (
    <div className="sca-home-wrapper">
      {/* ===================================================================
          1. HERO SECTION
          =================================================================== */}
      <section className="sca-home-hero" aria-label="Hero Overview">
        <div className="sca-hero-container">
          <div className="sca-hero-row">
            {/* Left Column: Heading, description, CTAs, trust badges */}
            <div className="sca-hero-left">
              <p className="sca-home-eyebrow">
                Understand Today, Sleep Better Tomorrow
              </p>

              <h1 className="sca-home-title">
                Your Sleep Health<br />
                <span className="sca-highlight">Matters</span>
              </h1>

              <p className="sca-home-desc">
                SleepCare AI uses advanced machine learning to analyze your health and lifestyle factors, helping you understand your sleep quality and potential sleep disorder risks.
              </p>

              <div className="sca-hero-ctas">
                <Link
                  to="/predict/sleep-quality"
                  className="sca-cta-primary"
                  id="cta-hero-quality"
                >
                  <Activity size={18} aria-hidden="true" />
                  <span>Check Your Sleep Quality →</span>
                </Link>
                <Link
                  to="/predict/sleep-disorder"
                  className="sca-cta-secondary"
                  id="cta-hero-disorder"
                >
                  <FlaskConical size={18} aria-hidden="true" />
                  <span>Check Sleep Disorder →</span>
                </Link>
              </div>

              {/* Trust Indicators Row */}
              <div className="sca-trust-row">

                <div className="sca-trust-item">
                  <div className="sca-trust-icon" aria-hidden="true">
                    <Cpu size={20} />
                  </div>
                  <div className="sca-trust-text">
                    <strong>AI Powered</strong>
                    <span>XGBoost Models</span>
                  </div>
                </div>

                <div className="sca-trust-item">
                  <div className="sca-trust-icon" aria-hidden="true">
                    <HeartPulse size={20} />
                  </div>
                  <div className="sca-trust-text">
                    <strong>Research Driven</strong>
                    <span>Built for Awareness</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual with Sleeping Woman & Glass Cards */}
            <div className="sca-hero-right">
              <div className="sca-hero-visual">
                {/* Handwritten Cursive Script Accent */}
                <div className="sca-hero-script" aria-hidden="true">
                  Good sleep
                  <span>brighter days</span>
                </div>

                {/* Crescent Moon Glow SVG */}
                <svg
                  className="sca-hero-moon-svg"
                  viewBox="0 0 60 60"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M30 5c-13.8 0-25 11.2-25 25s11.2 25 25 25c9.6 0 17.9-5.4 22.1-13.3-1.9.6-3.9.8-6 .8-13.8 0-25-11.2-25-25 0-4.6 1.2-8.9 3.5-12.6C32.1 5.3 31.1 5 30 5z"
                    fill="#5BB8FF"
                    opacity="0.8"
                  />
                </svg>

                {/* Main Sleeping Image */}
                <div className="sca-hero-image-wrap">
                  <img
                    src="/hero-sleep.jpg"
                    alt="Peaceful sleeping person in a serene night atmosphere with sleep analytics visualization"
                    width="520"
                    height="380"
                    loading="eager"
                  />
                </div>

                {/* Floating Glass Card 1: Sleep Quality */}
                <div
                  className="sca-glass-card sca-glass-quality"
                  aria-label="Sleep Quality indicator showing 8 out of 10, Good"
                >
                  <div className="sca-glass-card-label">Sleep Quality</div>
                  <div className="sca-glass-score-row">
                    <div className="sca-glass-circle" aria-hidden="true">
                      <svg width="48" height="48" viewBox="0 0 48 48">
                        <circle
                          cx="24"
                          cy="24"
                          r="19"
                          fill="none"
                          stroke="rgba(255, 255, 255, 0.15)"
                          strokeWidth="3.5"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r="19"
                          fill="none"
                          stroke="#5BB8FF"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeDasharray="119.4"
                          strokeDashoffset="24"
                          transform="rotate(-90 24 24)"
                        />
                        <text
                          x="24"
                          y="28"
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="12"
                          fontWeight="700"
                          fontFamily="sans-serif"
                        >
                          8/10
                        </text>
                      </svg>
                    </div>

                    <div className="sca-glass-info">
                      <span className="sca-glass-info-label">Good</span>
                      <div className="sca-glass-bars" aria-hidden="true">
                        <div className="sca-glass-bar" style={{ height: '8px' }} />
                        <div className="sca-glass-bar" style={{ height: '14px' }} />
                        <div className="sca-glass-bar" style={{ height: '20px' }} />
                        <div className="sca-glass-bar" style={{ height: '16px' }} />
                        <div className="sca-glass-bar" style={{ height: '22px' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Glass Card 2: Sleep Disorder Risk */}
                <div
                  className="sca-glass-card sca-glass-disorder"
                  aria-label="Sleep Disorder Risk indicator showing Low Risk"
                >
                  <div className="sca-glass-card-label">Sleep Disorder Risk</div>
                  <div className="sca-glass-risk-row">
                    <div className="sca-glass-shield-icon" aria-hidden="true">
                      <ShieldCheck size={28} />
                    </div>
                    <div>
                      <span className="sca-glass-risk-label">Low Risk</span>
                      <div className="sca-glass-bars" aria-hidden="true" style={{ marginTop: '5px' }}>
                        <div className="sca-glass-bar" style={{ height: '7px', background: '#4ADE80' }} />
                        <div className="sca-glass-bar" style={{ height: '11px', background: '#4ADE80' }} />
                        <div className="sca-glass-bar" style={{ height: '16px', background: '#5BB8FF' }} />
                        <div className="sca-glass-bar" style={{ height: '10px', background: '#5BB8FF' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual Quote */}
                <p className="sca-hero-quote">
                  “A healthier tomorrow starts with a better night’s sleep.”
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-layered Wave Divider */}
        <div className="sca-hero-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0,45 C240,95 480,15 720,50 C960,85 1200,20 1440,45 L1440,100 L0,100 Z"
              fill="rgba(91, 184, 255, 0.08)"
            />
            <path
              d="M0,60 C320,88 640,35 960,65 C1120,78 1280,45 1440,58 L1440,100 L0,100 Z"
              fill="rgba(20, 125, 245, 0.06)"
            />
            <path
              d="M0,75 C360,95 720,68 1080,82 C1260,89 1380,72 1440,78 L1440,100 L0,100 Z"
              fill="#F7FBFF"
            />
          </svg>
        </div>
      </section>

      {/* ===================================================================
          2. FEATURE CARDS SECTION (4 Cards)
          =================================================================== */}
      <section className="sca-features-section" aria-label="Core Capabilities">
        <div className="sca-features-grid">
          {/* Card 1: Sleep Quality Prediction */}
          <article className="sca-feature-card">
            <div className="sca-feature-icon" aria-hidden="true">
              <Moon size={24} />
            </div>
            <h3>Sleep Quality Prediction</h3>
            <p>
              Get a personalized sleep quality score (3–9) with easy-to-understand insights.
            </p>
          </article>

          {/* Card 2: Sleep Disorder Classification */}
          <article className="sca-feature-card">
            <div className="sca-feature-icon" aria-hidden="true">
              <Shield size={24} />
            </div>
            <h3>Sleep Disorder Classification</h3>
            <p>
              Check the likelihood of insomnia or sleep apnea with confidence scores.
            </p>
          </article>

          {/* Card 3: Evidence-Based Model */}
          <article className="sca-feature-card">
            <div className="sca-feature-icon" aria-hidden="true">
              <BarChart3 size={24} />
            </div>
            <h3>Evidence-Based Model</h3>
            <p>
              Powered by XGBoost and researched for reliable predictions.
            </p>
          </article>

          {/* Card 4: For a Healthier You */}
          <article className="sca-feature-card">
            <div className="sca-feature-icon" aria-hidden="true">
              <Users size={24} />
            </div>
            <h3>For a Healthier You</h3>
            <p>
              Raise awareness and take proactive steps towards better sleep.
            </p>
          </article>
        </div>
      </section>

      {/* ===================================================================
          3. HOW SLEEPCARE AI WORKS SECTION (Simple 4 Steps)
          =================================================================== */}
      <section className="sca-how-section-new" aria-label="How SleepCare AI Works">
        <div className="sca-how-container">
          <div className="sca-section-header">
            <p className="sca-section-label">SIMPLE STEPS</p>
            <h2 className="sca-section-title">
              How SleepCare AI <span className="sca-highlight">Works</span>
            </h2>
            <p className="sca-section-subtitle">
              Get meaningful insights about your sleep health in just a few steps.
            </p>
          </div>

          <div className="sca-steps-row">
            {/* Step 1 */}
            <div className="sca-step-item">
              <div className="sca-step-icon-wrap" aria-hidden="true">
                <ClipboardList size={30} />
              </div>
              <h4>1. Enter Your Details</h4>
              <p>Fill in your sleep, lifestyle and health information.</p>
            </div>

            <div className="sca-step-arrow" aria-hidden="true">→</div>

            {/* Step 2 */}
            <div className="sca-step-item">
              <div className="sca-step-icon-wrap" aria-hidden="true">
                <Settings size={30} />
              </div>
              <h4>2. AI Analysis</h4>
              <p>Our trained machine learning models analyze your inputs.</p>
            </div>

            <div className="sca-step-arrow" aria-hidden="true">→</div>

            {/* Step 3 */}
            <div className="sca-step-item">
              <div className="sca-step-icon-wrap" aria-hidden="true">
                <BarChart3 size={30} />
              </div>
              <h4>3. Get Results</h4>
              <p>View your sleep quality score or disorder risk with detailed insights.</p>
            </div>

            <div className="sca-step-arrow" aria-hidden="true">→</div>

            {/* Step 4 */}
            <div className="sca-step-item">
              <div className="sca-step-icon-wrap" aria-hidden="true">
                <Heart size={30} />
              </div>
              <h4>4. Take Action</h4>
              <p>Use the insights to make healthier lifestyle choices.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
