import React from 'react';

export default function GoalHeader() {
  return (
    <div className="sc-goal-header-card">
      <div className="sc-goal-header-left">
        <h1 className="sc-goal-main-title">Set Your Sleep Goal</h1>
        <p className="sc-goal-main-subtitle">
          Build a consistent sleep routine with a simple 21-day tracking challenge.
        </p>
      </div>

      {/* Sleep Sky & Rest Illustration on the right */}
      <div className="sc-goal-header-illustration" aria-hidden="true">
        <svg
          viewBox="0 0 280 140"
          className="sc-goal-header-svg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="skyGrad" x1="0" y1="0" x2="280" y2="140" gradientUnits="userSpaceOnUse">
              <stop stopColor="#305ca8" />
              <stop offset="0.6" stopColor="#1e3e7b" />
              <stop offset="1" stopColor="#162955" />
            </linearGradient>
            <linearGradient id="moonGlow" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#ffea79" />
              <stop offset="1" stopColor="#f3c642" />
            </linearGradient>
            <linearGradient id="cloudGrad" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#b6d7fc" stopOpacity="0.85" />
              <stop offset="1" stopColor="#e3efff" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="hairGrad" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#1c2d52" />
              <stop offset="1" stopColor="#0d1830" />
            </linearGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Curved Night Sky Background Pill */}
          <path
            d="M50 10 C140 -8 240 5 275 35 C295 55 285 105 260 130 C220 145 100 145 40 135 C15 120 10 90 20 60 C28 35 40 15 50 10 Z"
            fill="url(#skyGrad)"
            opacity="0.95"
          />

          {/* Stars */}
          <circle cx="85" cy="35" r="1.8" fill="#ffffff" opacity="0.9" />
          <circle cx="110" cy="50" r="1.3" fill="#ffffff" opacity="0.8" />
          <circle cx="140" cy="25" r="2.2" fill="#ffeaa7" opacity="0.95" />
          <path d="M140 21 L141.5 25 L145 26.5 L141.5 28 L140 32 L138.5 28 L135 26.5 L138.5 25 Z" fill="#ffeaa7" opacity="0.85" />
          <circle cx="170" cy="40" r="1.5" fill="#ffffff" opacity="0.75" />
          <circle cx="195" cy="22" r="1.2" fill="#ffffff" opacity="0.9" />

          {/* Crescent Moon */}
          <g filter="url(#softGlow)">
            <path
              d="M80 20 C68 20 58 30 58 43 C58 55 68 65 80 65 C85 65 89 63 93 60 C85 58 80 50 80 41 C80 32 85 24 93 22 C89 21 85 20 80 20 Z"
              fill="url(#moonGlow)"
            />
          </g>

          {/* Soft Pillow / Cloud beneath sleeping head */}
          <ellipse cx="205" cy="112" rx="46" ry="18" fill="#ffffff" opacity="0.9" />
          <ellipse cx="175" cy="115" rx="30" ry="14" fill="#eaf2fc" opacity="0.8" />

          {/* Sleeping Figure (head & hair & serene closed eye) */}
          <g transform="translate(185, 52)">
            {/* Flowing Back Hair */}
            <path
              d="M32 30 C30 5 10 -2 -6 8 C-18 16 -18 36 -12 50 C-6 62 10 65 24 64 C35 63 42 50 36 38 Z"
              fill="url(#hairGrad)"
            />
            {/* Peaceful Face / Skin */}
            <path
              d="M-2 15 C8 15 18 24 20 34 C21 42 16 50 6 52 C-4 54 -10 46 -12 38 C-14 30 -10 15 -2 15 Z"
              fill="#fcd5be"
            />
            {/* Front Fringe / Bangs */}
            <path
              d="M-6 10 C6 12 14 18 16 26 C12 24 6 22 -2 24 C-6 20 -8 15 -6 10 Z"
              fill="url(#hairGrad)"
            />
            {/* Serene Closed Eye Curve */}
            <path
              d="M4 33 C6 37 11 37 13 33"
              stroke="#684737"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
            {/* Soft Cheek Blush */}
            <ellipse cx="7" cy="40" rx="3.5" ry="2" fill="#f89f92" opacity="0.5" />
            {/* Gentle Smile Curve */}
            <path
              d="M10 44 C12 46 15 45 16 43"
              stroke="#b56e60"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* Dreamy Soft Foreground Clouds */}
          <g opacity="0.95">
            <path
              d="M10 135 C20 120 40 120 55 128 C70 115 100 115 115 130 C125 125 145 128 155 135 Z"
              fill="url(#cloudGrad)"
            />
            <path
              d="M140 135 C160 122 195 122 215 132 C230 125 255 126 270 135 Z"
              fill="#f1f7fe"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
