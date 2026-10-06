import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import '../styles/auth.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both your username and password.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
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
            <h1 className="sc-auth-title">Welcome Back</h1>
            <p className="sc-auth-subtitle">Sign in to continue</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="sc-auth-alert sc-auth-alert-error" role="alert">
              <AlertCircle size={18} className="sc-auth-alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form className="sc-auth-form" onSubmit={handleSubmit} noValidate>
            <div className="sc-auth-field-group">
              <label htmlFor="username-input" className="sc-auth-label">
                Username
              </label>
              <div className="sc-auth-input-wrapper">
                <span className="sc-auth-input-icon">
                  <User size={18} />
                </span>
                <input
                  id="username-input"
                  type="text"
                  className="sc-auth-input has-left-icon"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="sc-auth-field-group">
              <label htmlFor="password-input" className="sc-auth-label">
                Password
              </label>
              <div className="sc-auth-input-wrapper">
                <span className="sc-auth-input-icon">
                  <Lock size={18} />
                </span>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  className="sc-auth-input has-left-icon has-right-toggle"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="current-password"
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
            </div>

            <div className="sc-auth-row-between">
              <Link to="/forgot-password" className="sc-auth-link">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="sc-auth-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>Signing in...</>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="sc-auth-footer">
            <span>Don't have an account?</span>
            <Link to="/register" className="sc-auth-footer-link">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
