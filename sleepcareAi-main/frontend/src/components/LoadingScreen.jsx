import React from 'react';

export default function LoadingScreen({ message = 'Checking authentication...' }) {
  return (
    <div className="sc-auth-loading-screen" role="status" aria-live="polite">
      <div className="sc-auth-loading-card">
        <div className="sc-auth-loading-icon-wrapper">
          <svg
            className="sc-auth-loading-icon"
            width="44"
            height="44"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="14" cy="14" r="14" fill="#071d3b" />
            <path
              d="M14.5 5.5c-4.7 0-8.5 3.8-8.5 8.5s3.8 8.5 8.5 8.5c3.3 0 6.1-1.8 7.5-4.5-.6.2-1.3.3-2 .3-4.7 0-8.5-3.8-8.5-8.5 0-1.6.4-3.1 1.2-4.3-.8-.1-1.5-.2-2.2-.2z"
              fill="#ffffff"
            />
          </svg>
          <div className="sc-auth-spinner" />
        </div>
        <p className="sc-auth-loading-text">{message}</p>
      </div>
    </div>
  );
}
