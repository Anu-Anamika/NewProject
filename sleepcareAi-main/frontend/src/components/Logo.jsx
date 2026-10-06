import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Logo({ linkTo }) {
  const { isAuthenticated } = useAuth();
  const destination = linkTo !== undefined ? linkTo : (isAuthenticated ? '/dashboard' : '/');

  return (
    <Link to={destination} className="sc-navbar__logo" aria-label="SleepCare AI Home">
      <span className="sc-navbar__logo-icon" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="14" fill="#071D3B" />
          <path
            d="M14.5 5.5c-4.7 0-8.5 3.8-8.5 8.5s3.8 8.5 8.5 8.5c3.3 0 6.1-1.8 7.5-4.5-.6.2-1.3.3-2 .3-4.7 0-8.5-3.8-8.5-8.5 0-1.6.4-3.1 1.2-4.3-.8-.1-1.5-.2-2.2-.2z"
            fill="#FFFFFF"
          />
        </svg>
      </span>
      <span className="sc-navbar__logo-text">
        SleepCare <span className="sc-navbar__logo-accent">AI</span>
      </span>
    </Link>
  );
}
