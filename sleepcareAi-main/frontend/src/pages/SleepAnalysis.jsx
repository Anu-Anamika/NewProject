import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import PredictionHero from '../components/PredictionHero';
import HealthInputForm from '../components/HealthInputForm';
import ResultCard from '../components/ResultCard';
import InfoNotice from '../components/InfoNotice';
import HealthTipCard from '../components/HealthTipCard';
import Footer from '../components/Footer';
import DiseaseInformation from '../components/DiseaseInformation';
import ExplainabilitySection from '../components/ExplainabilitySection';
import SleepHealthAssessment from '../components/SleepHealthAssessment';
import { predictSleepDisorder, getAssessment } from '../services/api';
import { mapAssessmentToFormPrefill } from '../services/assessmentMapper';
import { Sparkles, AlertCircle, Loader2, MessageCircle, CheckCircle2 } from 'lucide-react';

/**
 * SleepAnalysis — Combined Sleep Quality + Sleep Disorder prediction page.
 *
 * A single form submission triggers both ML models simultaneously via the
 * /api/predict/sleep-disorder/ endpoint, which internally runs both the
 * quality and disorder XGBoost models and returns a unified response.
 *
 * Accessible via:
 *   /predict/sleep-quality
 *   /predict/sleep-disorder
 *   /prediction/:assessmentId   (chatbot flow → pre-filled form)
 */
export default function SleepAnalysis() {
  const { assessmentId: paramId } = useParams();
  const location = useLocation();
  const assessmentId = paramId || location.state?.assessmentId;

  // ── Prediction Result State ──────────────────────────────────────────────
  const [result, setResult] = useState(null);       // full API response
  const [qualityResult, setQualityResult] = useState(null);   // quality sub-result
  const [disorderResult, setDisorderResult] = useState(null); // disorder sub-result

  const [submittedData, setSubmittedData] = useState(null);
  const [activeTab, setActiveTab] = useState('both');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiError, setApiError] = useState(null);

  // ── Post-Prediction Sleep Health Assessment State ─────────────────────────
  // 'pending' = show card | 'skipped' = hidden | 'done' = completed
  const [assessmentStatus, setAssessmentStatus] = useState('hidden');
  const [currentAnalysisId, setCurrentAnalysisId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // ── Chatbot Assessment Pre-fill State ────────────────────────────────────
  const [prefillData, setPrefillData] = useState(null);
  const [unmappedNotes, setUnmappedNotes] = useState([]);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [assessmentError, setAssessmentError] = useState(null);

  // Load chatbot assessment for pre-fill if assessmentId is present
  useEffect(() => {
    if (!assessmentId) return;

    let isMounted = true;
    async function loadAssessment() {
      setAssessmentLoading(true);
      setAssessmentError(null);

      try {
        const assessment = await getAssessment(assessmentId);
        if (!isMounted) return;

        const { prefilled, unmappedFields } = mapAssessmentToFormPrefill(assessment);
        setPrefillData(prefilled);
        setUnmappedNotes(unmappedFields);
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load assessment:', err);
        setAssessmentError(err.message || 'Could not load your assessment details.');
      } finally {
        if (isMounted) setAssessmentLoading(false);
      }
    }

    loadAssessment();
    return () => { isMounted = false; };
  }, [assessmentId]);

  // ── Prediction Handler ───────────────────────────────────────────────────
  const handlePrediction = async (cleanedData) => {
    setIsLoading(true);
    setError(null);
    setApiError(null);
    setSubmittedData(cleanedData);
    // Clear previous results and reset assessment state
    setResult(null);
    setQualityResult(null);
    setDisorderResult(null);
    setAssessmentStatus('hidden');
    setCurrentAnalysisId(null);
    setIsChatOpen(false);

    try {
      const payload = {
        ...cleanedData,
        assessment_id: assessmentId ? Number(assessmentId) : null,
      };

      // Single API call that runs both quality + disorder models
      const data = await predictSleepDisorder(payload);

      // The disorder endpoint returns:
      //   { label, confidence, class_probabilities, calibration_note,   ← disorder fields
      //     quality: { score, label, score_percent, out_of },            ← quality sub-object
      //     explainable_ai: { factors, positive_contributors, ... },
      //     analysis_id, assessment_id }
      setResult(data);

      // Capture analysis_id for the optional post-prediction assessment
      if (data.analysis_id) {
        setCurrentAnalysisId(data.analysis_id);
        setAssessmentStatus('pending');
      }

      // Split into two separate result objects for the two ResultCards
      const qualitySubResult = data.quality || null;
      const disorderSubResult = {
        label: data.label,
        confidence: data.confidence,
        class_probabilities: data.class_probabilities,
        calibration_note: data.calibration_note,
        probabilities: data.probabilities,
      };

      setQualityResult(qualitySubResult);
      setDisorderResult(disorderSubResult);

      // On mobile: scroll to results panel
      if (window.innerWidth <= 860) {
        setTimeout(() => {
          const el = document.getElementById('prediction-result-panel');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      const errMsg = err.message || 'Something went wrong while generating the prediction.';
      setError(errMsg);
      setApiError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setApiError(null);
    if (submittedData) {
      handlePrediction(submittedData);
    }
  };

  // ── Derive the disorder label for DiseaseInformation ─────────────────────
  const disorderLabel = result?.label || result?.predicted_disorder || null;

  return (
    <div className="sc-page-wrapper">
      <div id="main-content">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <PredictionHero mode="analysis" />

        {/* ── Main 2-column layout: Form (55%) + Results (45%) ─────────── */}
        <section className="sc-main-section">
          <div className="sc-prediction-grid">

            {/* Left: Health Input Form */}
            <div className="sc-grid-col-form">

              {/* Assessment Pre-fill Banners */}
              {assessmentLoading && (
                <div className="sc-assessment-banner loading" role="status">
                  <Loader2 className="sc-spin" size={18} />
                  <span>Loading your assessment details...</span>
                </div>
              )}

              {assessmentError && (
                <div className="sc-assessment-banner error" role="alert">
                  <AlertCircle size={18} />
                  <span>{assessmentError}</span>
                </div>
              )}

              {prefillData && !assessmentLoading && (
                <div className="sc-assessment-banner success" role="status">
                  <div className="sc-assessment-banner-header">
                    <Sparkles size={18} className="sc-sparkle-icon" />
                    <strong>Pre-filled from Sleep Assessment #{assessmentId}</strong>
                  </div>
                  <p className="sc-assessment-banner-text">
                    Your <strong>Age, Gender, Occupation, and Sleep Duration</strong> have been
                    imported from your assessment. Please fill in the remaining physical activity
                    and cardiovascular metrics to generate your full analysis.
                  </p>
                  {unmappedNotes && unmappedNotes.length > 0 && (
                    <div className="sc-assessment-banner-notes">
                      {unmappedNotes.map((note, idx) => (
                        <span key={idx} className="sc-assessment-note-tag">• {note}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <HealthInputForm
                key={assessmentId ? `assessment-${assessmentId}` : 'default'}
                mode="analysis"
                onSubmit={handlePrediction}
                isLoading={isLoading}
                apiError={apiError}
                initialData={prefillData}
              />
            </div>

            {/* Right: Result Cards */}
            <div className="sc-grid-col-result" id="prediction-result-panel">
              {/* Tab Selector when prediction results exist */}
              {result && !isLoading && !error && (
                <div className="sc-analysis-tabs" role="tablist" aria-label="Analysis Result Views">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'both'}
                    className={`sc-analysis-tab ${activeTab === 'both' ? 'active' : ''}`}
                    onClick={() => setActiveTab('both')}
                  >
                    Combined Overview
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'disorder'}
                    className={`sc-analysis-tab ${activeTab === 'disorder' ? 'active' : ''}`}
                    onClick={() => setActiveTab('disorder')}
                  >
                    Sleep Disorder
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'quality'}
                    className={`sc-analysis-tab ${activeTab === 'quality' ? 'active' : ''}`}
                    onClick={() => setActiveTab('quality')}
                  >
                    Sleep Quality
                  </button>
                </div>
              )}

              {/* Initial Empty State Before Prediction */}
              {!result && !isLoading && !error ? (
                <div className="sc-card sc-result-panel">
                  <div className="sc-card-header">
                    <div className="sc-card-icon-box" aria-hidden="true">
                      <Sparkles size={22} />
                    </div>
                    <div className="sc-card-titles">
                      <h2 className="sc-card-title">Sleep Analysis Results</h2>
                      <p className="sc-card-subtitle">AI-calculated quality score & disorder assessment</p>
                    </div>
                  </div>

                  <div className="sc-result-empty">
                    <div className="sc-empty-illustration">
                      <span className="sc-empty-icon" role="img" aria-label="Sleep Analysis">
                        🌙
                      </span>
                    </div>
                    <h3 className="sc-empty-title">
                      Enter your details and click<br />
                      "Predict Sleep Health"
                    </h3>
                    <p className="sc-empty-desc">
                      Get a comprehensive analysis of your sleep quality score, sleep disorder risk (Insomnia / Sleep Apnea), calibrated probabilities, and clinical recommendations.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="sc-analysis-results-stack">
                  {(activeTab === 'both' || activeTab === 'quality') && (
                    <ResultCard
                      mode="quality"
                      result={qualityResult}
                      submittedData={submittedData}
                      isLoading={isLoading}
                      error={error}
                      onRetry={null}
                    />
                  )}

                  {(activeTab === 'both' || activeTab === 'disorder') && (
                    <ResultCard
                      mode="disorder"
                      result={disorderResult}
                      submittedData={submittedData}
                      isLoading={isLoading}
                      error={error}
                      onRetry={handleRetry}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Optional Sleep Health Assessment Invitation Card ── */}
        {result && !isLoading && !error && assessmentStatus === 'pending' && (
          <div className="sc-sha-invitation-container" aria-label="Optional Sleep Health Assessment">
            <div className="sc-sha-invitation-card" id="sha-invitation-card">
              <div className="sc-sha-invitation-header">
                <span className="sc-sha-invitation-icon" aria-hidden="true">
                  <MessageCircle size={20} />
                </span>
                <div className="sc-sha-invitation-title-group">
                  <h3 className="sc-sha-invitation-title">Sleep Health Assessment</h3>
                  <span className="sc-sha-invitation-badge">Optional</span>
                </div>
              </div>
              <p className="sc-sha-invitation-text">
                Would you like to answer a few optional questions about your sleep experience? Your responses can be added as additional context to your personalized report.
              </p>
              <div className="sc-sha-invitation-actions">
                <button
                  type="button"
                  id="start-assessment-btn"
                  className="sc-sha-start-btn"
                  onClick={() => setIsChatOpen(true)}
                >
                  <MessageCircle size={16} aria-hidden="true" />
                  <span>Start Assessment</span>
                </button>
                <button
                  type="button"
                  id="skip-assessment-btn"
                  className="sc-sha-skip-btn"
                  onClick={() => {
                    setAssessmentStatus('skipped');
                    setIsChatOpen(false);
                  }}
                >
                  Skip for Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Completed Assessment Feedback Card ── */}
        {result && !isLoading && !error && assessmentStatus === 'done' && (
          <div className="sc-sha-invitation-container">
            <div className="sc-sha-invitation-card completed" id="sha-completed-card">
              <div className="sc-sha-invitation-header">
                <span className="sc-sha-invitation-icon completed" aria-hidden="true">
                  <CheckCircle2 size={20} />
                </span>
                <div className="sc-sha-invitation-title-group">
                  <h3 className="sc-sha-invitation-title">Sleep Health Assessment Completed</h3>
                  <span className="sc-sha-invitation-badge completed">Saved</span>
                </div>
              </div>
              <p className="sc-sha-invitation-text">
                Your responses have been saved and added as additional context to your personalized report.
              </p>
            </div>
          </div>
        )}

        {/* ── Optional Conversational Sleep Health Assessment Chatbot Popup (Prediction Page Only) */}
        {result && !isLoading && !error && assessmentStatus !== 'skipped' && (
          <SleepHealthAssessment
            analysisId={currentAnalysisId}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            onComplete={(id) => setAssessmentStatus('done')}
          />
        )}

        {/* ── Medical Information + XAI (appears after prediction) ─────── */}
        {result && (
          <section className="sc-details-section" aria-label="Detailed Sleep Analysis">
            <div className="sc-details-container">

              {/* Dynamic disease educational card based on predicted disorder */}
              <DiseaseInformation condition={disorderLabel} />

              {/* Explainable AI feature attribution */}
              {result.explainable_ai && (
                <ExplainabilitySection xai={result.explainable_ai} />
              )}

            </div>
          </section>
        )}

        {/* ── Medical Disclaimer ────────────────────────────────────────── */}
        <InfoNotice />

        {/* ── Health Tip Cards ──────────────────────────────────────────── */}
        <HealthTipCard mode="analysis" />

      </div>
      <Footer />
    </div>
  );
}
