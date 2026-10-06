import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { requestPasswordResetApi } from '../services/authApi';
import '../styles/auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await requestPasswordResetApi(email.trim());
      setSuccessMessage(
        res.message || 'If an account exists with that email address, a password reset link has been sent.'
      );
    } catch (err) {
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sc-auth-page">
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
            <h1 className="sc-auth-title">Forgot your password?</h1>
            <p className="sc-auth-subtitle">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="sc-auth-alert sc-auth-alert-success" role="status">
              <CheckCircle2 size={18} className="sc-auth-alert-icon" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="sc-auth-alert sc-auth-alert-error" role="alert">
              <AlertCircle size={18} className="sc-auth-alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {!successMessage ? (
            <form className="sc-auth-form" onSubmit={handleSubmit} noValidate>
              <div className="sc-auth-field-group">
                <label htmlFor="reset-email" className="sc-auth-label">
                  Email address
                </label>
                <div className="sc-auth-input-wrapper">
                  <span className="sc-auth-input-icon">
                    <Mail size={18} />
                  </span>
                  <input
                    id="reset-email"
                    type="email"
                    className="sc-auth-input has-left-icon"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    autoComplete="email"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="sc-auth-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>Sending Reset Link...</>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Send Reset Link</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link to="/login" className="sc-auth-submit-btn" style={{ textDecoration: 'none' }}>
                Return to Sign In
              </Link>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="sc-auth-footer">
            <Link to="/login" className="sc-auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowLeft size={16} />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
