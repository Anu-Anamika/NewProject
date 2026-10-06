import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  ShieldCheck,
  X,
  CheckCircle,
} from 'lucide-react';
import '../styles/auth.css';

/* ── Privacy Agreement Modal ────────────────────────────────────────── */

function PrivacyModal({ onClose, onAgree }) {
  // Trap focus & close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent page scroll while modal open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      className="sc-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="sc-modal">
        {/* Header */}
        <div className="sc-modal-header">
          <h2 className="sc-modal-title" id="privacy-modal-title">
            <span className="sc-modal-title-icon">
              <ShieldCheck size={16} />
            </span>
            Privacy &amp; Data Storage Agreement
          </h2>
          <button
            type="button"
            className="sc-modal-close-btn"
            onClick={onClose}
            aria-label="Close privacy agreement"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="sc-modal-body">
          <p className="sc-modal-intro">
            SleepCare AI collects and stores information that you provide during
            registration and sleep assessments so that the application can provide
            its sleep analysis features.
          </p>

          {/* 1. What we collect */}
          <div className="sc-modal-section">
            <p className="sc-modal-section-title">1. What we collect</p>
            <div className="sc-modal-section-body">
              <p>Account information may include:</p>
              <ul>
                <li>Username</li>
                <li>Email address</li>
                <li>Authentication-related information</li>
              </ul>
              <p style={{ marginTop: '0.6rem' }}>Sleep assessment information may include:</p>
              <ul>
                <li>Age</li>
                <li>Gender</li>
                <li>Occupation</li>
                <li>Sleep duration</li>
                <li>Sleep-related questionnaire responses</li>
                <li>Other health or sleep information you enter</li>
              </ul>
            </div>
          </div>

          <div className="sc-modal-divider" />

          {/* 2. Why we store this */}
          <div className="sc-modal-section">
            <p className="sc-modal-section-title">2. Why we store this information</p>
            <div className="sc-modal-section-body">
              <p>The information is stored to:</p>
              <ul>
                <li>Process your sleep assessment</li>
                <li>Generate sleep quality and sleep disorder predictions</li>
                <li>Provide Explainable AI results</li>
                <li>Maintain your analysis history</li>
                <li>Allow you to view previous analyses</li>
                <li>Generate your requested sleep analysis reports</li>
              </ul>
            </div>
          </div>

          <div className="sc-modal-divider" />

          {/* 3. How your data is used */}
          <div className="sc-modal-section">
            <p className="sc-modal-section-title">3. How your data is used</p>
            <p className="sc-modal-section-body">
              Your submitted information is used by SleepCare AI to provide the
              application&rsquo;s analysis features, including sleep quality scoring,
              sleep disorder prediction, and Explainable AI reporting.
            </p>
          </div>

          <div className="sc-modal-divider" />

          {/* 4. Data storage */}
          <div className="sc-modal-section">
            <p className="sc-modal-section-title">4. Data storage</p>
            <p className="sc-modal-section-body">
              Assessment information is associated with your account so that you
              can access your previous analyses and reports. Stored information is
              retained according to the application&rsquo;s configured data-retention
              policy.
            </p>
          </div>

          <div className="sc-modal-divider" />

          {/* 5. Privacy and security */}
          <div className="sc-modal-section">
            <p className="sc-modal-section-title">5. Privacy and security</p>
            <p className="sc-modal-section-body">
              Reasonable technical and access controls are used to protect stored
              account and assessment information. No system can guarantee absolute
              security, but SleepCare AI takes steps to safeguard your data.
            </p>
          </div>

          <div className="sc-modal-divider" />

          {/* 6. Your control */}
          <div className="sc-modal-section">
            <p className="sc-modal-section-title">6. Your control</p>
            <p className="sc-modal-section-body">
              You may contact the application administrator regarding requests to
              access or delete stored information associated with your account.
            </p>
          </div>

          <div className="sc-modal-divider" />

          {/* 7. Medical Disclaimer */}
          <div className="sc-modal-disclaimer">
            <p className="sc-modal-disclaimer-title">Medical Disclaimer</p>
            <p className="sc-modal-disclaimer-text">
              SleepCare AI provides machine-learning based estimates for
              informational purposes only. Results are not a medical diagnosis and
              should not replace evaluation by a qualified healthcare professional.
            </p>
          </div>

          {/* 8. Consent */}
          <div className="sc-modal-consent-summary">
            By creating a SleepCare AI account, you acknowledge that you have read
            this agreement and consent to the collection and storage of the
            information described above for the purposes of providing the
            application&rsquo;s features.
          </div>
        </div>

        {/* Footer */}
        <div className="sc-modal-footer">
          <button
            id="privacy-modal-cancel"
            type="button"
            className="sc-modal-cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            id="privacy-modal-agree"
            type="button"
            className="sc-modal-agree-btn"
            onClick={onAgree}
          >
            <CheckCircle size={16} />
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Register Page ────────────────────────────────────────────────── */

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Privacy consent state
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyConsentError, setPrivacyConsentError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleConsentChange = (e) => {
    setPrivacyConsent(e.target.checked);
    if (e.target.checked) setPrivacyConsentError('');
  };

  const handleOpenModal = useCallback((e) => {
    e.preventDefault();
    setShowPrivacyModal(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setShowPrivacyModal(false);
  }, []);

  const handleModalAgree = useCallback(() => {
    setPrivacyConsent(true);
    setPrivacyConsentError('');
    setShowPrivacyModal(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setPrivacyConsentError('');

    // Client side validation
    const errors = {};
    if (!formData.username.trim()) {
      errors.username = 'Username is required.';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }
    if (formData.password !== formData.password_confirm) {
      errors.password_confirm = 'Passwords do not match.';
    }

    if (!privacyConsent) {
      setPrivacyConsentError(
        'Please review and accept the Privacy & Data Storage Agreement before creating your account.'
      );
      if (Object.keys(errors).length === 0) {
        // Only highlight consent error if no other errors
        return;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the errors in the form.');
      return;
    }

    if (!privacyConsent) return;

    setIsSubmitting(true);

    try {
      await register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        password_confirm: formData.password_confirm,
        privacy_consent: privacyConsent,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sc-auth-page">
      {/* Privacy Agreement Modal (portal-style, rendered at top level) */}
      {showPrivacyModal && (
        <PrivacyModal
          onClose={handleModalClose}
          onAgree={handleModalAgree}
        />
      )}

      <div className="sc-auth-container">
        <div className="sc-auth-card">
          {/* Brand Header */}
          <div className="sc-auth-header">
            <Link to="/" className="sc-auth-brand" aria-label="SleepCare AI">
              <span className="sc-auth-brand-icon">
                <svg width="32" height="32" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="14" cy="14" r="14" fill="#071d3b" />
                  <path
                    d="M14.5 5.5c-4.7 0-8.5 3.8-8.5 8.5s3.8 8.5 8.5 8.5c3.3 0 6.1-1.8 7.5-4.5-.6.2-1.3.3-2 .3-4.7 0-8.5-3.8-8.5-8.5 0-1.6.4-3.1 1.2-4.3-.8-.1-1.5-.2-2.2-.2z"
                    fill="#ffffff"
                  />
                </svg>
              </span>
              <span className="sc-auth-brand-text">
                SleepCare <span className="sc-auth-brand-accent">AI</span>
              </span>
            </Link>
            <h1 className="sc-auth-title">Create Your SleepCare Account</h1>
            <p className="sc-auth-subtitle">Get personalized sleep analytics and insights</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="sc-auth-alert sc-auth-alert-error" role="alert">
              <AlertCircle size={18} className="sc-auth-alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form className="sc-auth-form" onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div className="sc-auth-field-group">
              <label htmlFor="reg-username" className="sc-auth-label">
                Username
              </label>
              <div className="sc-auth-input-wrapper">
                <span className="sc-auth-input-icon">
                  <User size={18} />
                </span>
                <input
                  id="reg-username"
                  name="username"
                  type="text"
                  className="sc-auth-input has-left-icon"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  autoComplete="username"
                  required
                />
              </div>
              {fieldErrors.username && (
                <span className="sc-auth-field-error">{fieldErrors.username}</span>
              )}
            </div>

            {/* Email */}
            <div className="sc-auth-field-group">
              <label htmlFor="reg-email" className="sc-auth-label">
                Email
              </label>
              <div className="sc-auth-input-wrapper">
                <span className="sc-auth-input-icon">
                  <Mail size={18} />
                </span>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  className="sc-auth-input has-left-icon"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  autoComplete="email"
                  required
                />
              </div>
              {fieldErrors.email && (
                <span className="sc-auth-field-error">{fieldErrors.email}</span>
              )}
            </div>

            {/* Password */}
            <div className="sc-auth-field-group">
              <label htmlFor="reg-password" className="sc-auth-label">
                Password
              </label>
              <div className="sc-auth-input-wrapper">
                <span className="sc-auth-input-icon">
                  <Lock size={18} />
                </span>
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="sc-auth-input has-left-icon has-right-toggle"
                  placeholder="Create a strong password (min 8 chars)"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="sc-auth-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.password && (
                <span className="sc-auth-field-error">{fieldErrors.password}</span>
              )}
            </div>

            {/* Confirm Password */}
            <div className="sc-auth-field-group">
              <label htmlFor="reg-confirm-password" className="sc-auth-label">
                Confirm Password
              </label>
              <div className="sc-auth-input-wrapper">
                <span className="sc-auth-input-icon">
                  <Lock size={18} />
                </span>
                <input
                  id="reg-confirm-password"
                  name="password_confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="sc-auth-input has-left-icon has-right-toggle"
                  placeholder="Confirm your password"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="sc-auth-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.password_confirm && (
                <span className="sc-auth-field-error">{fieldErrors.password_confirm}</span>
              )}
            </div>

            {/* ── Privacy & Data Storage Agreement Consent ── */}
            <div className="sc-privacy-consent-group">
              <div className="sc-privacy-consent-row">
                <input
                  id="reg-privacy-consent"
                  type="checkbox"
                  className="sc-privacy-checkbox"
                  checked={privacyConsent}
                  onChange={handleConsentChange}
                  disabled={isSubmitting}
                  aria-required="true"
                  aria-describedby="privacy-consent-hint"
                />
                <label htmlFor="reg-privacy-consent" className="sc-privacy-consent-label">
                  I agree to the{' '}
                  <button
                    type="button"
                    id="open-privacy-modal"
                    className="sc-privacy-consent-link"
                    onClick={handleOpenModal}
                    aria-haspopup="dialog"
                  >
                    Privacy &amp; Data Storage Agreement
                  </button>
                  .
                </label>
              </div>
              <p id="privacy-consent-hint" className="sc-privacy-consent-hint">
                Your sleep assessment information will be stored with your account
                to provide analysis history and reports.
              </p>
              {privacyConsentError && (
                <span className="sc-privacy-consent-error" role="alert">
                  <AlertCircle size={14} />
                  {privacyConsentError}
                </span>
              )}
            </div>

            <button
              id="reg-submit-btn"
              type="submit"
              className="sc-auth-submit-btn"
              disabled={isSubmitting || !privacyConsent}
              aria-disabled={!privacyConsent}
            >
              {isSubmitting ? (
                <>Creating Account...</>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="sc-auth-footer">
            <span>Already have an account?</span>
            <Link to="/login" className="sc-auth-footer-link">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
