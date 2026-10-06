import React from 'react';
import { Calendar, Sparkles, Moon } from 'lucide-react';

export default function WelcomeHeader({ user }) {
  // Determine time-of-day greeting dynamically
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Format today's date dynamically (e.g. "Friday, September 25, 2026")
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const username = user?.first_name || user?.username || 'Tony';

  return (
    <header className="sc-dash-welcome">
      <div className="sc-dash-welcome-bg" aria-hidden="true">
        {/* Soft scenic sleep ambience background graphics */}
        <div className="sc-dash-welcome-stars"></div>
        <div className="sc-dash-welcome-mountain-back"></div>
        <div className="sc-dash-welcome-mountain-front"></div>
        <div className="sc-dash-welcome-trees"></div>
        <div className="sc-dash-welcome-sun-moon"></div>
      </div>

      <div className="sc-dash-welcome-content">
        <div className="sc-dash-welcome-top-row">
          <div className="sc-dash-kicker-badge">
            <Sparkles size={13} className="sc-dash-kicker-icon" />
            <span>YOUR SLEEP HEALTH</span>
          </div>

          <div className="sc-dash-date-badge">
            <Calendar size={13} />
            <span>{formattedDate}</span>
          </div>
        </div>

        <div className="sc-dash-welcome-main-row">
          <div className="sc-dash-welcome-text">
            <h1 className="sc-dash-title">
              {getGreeting()}, <span className="sc-dash-username">{username}</span> <span className="sc-dash-wave">👋</span>
            </h1>
            <p className="sc-dash-subtitle">
              Understand your sleep patterns and make informed decisions about your sleep health.
            </p>
          </div>

          <div className="sc-dash-quote-card">
            <div className="sc-dash-quote-icon">
              <Moon size={16} />
            </div>
            <p className="sc-dash-quote-text">
              “Small steps today for better sleep tomorrow.”
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
