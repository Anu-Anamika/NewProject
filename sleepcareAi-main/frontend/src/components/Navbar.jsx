import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, X, Activity, ShieldCheck, LogOut, LayoutDashboard, History, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import '../styles/navbar.css';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const userRef = useRef(null);

  const isPredictActive = location.pathname.startsWith('/predict') || location.pathname.startsWith('/prediction');
  const isHistoryActive = location.pathname.startsWith('/history');
  const isDashboardActive = location.pathname === '/dashboard';
  const isGoalActive = location.pathname.startsWith('/set-goal');

  // Automatically close dropdowns & mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // Click outside listener to safely close open dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (userRef.current && !userRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const getNavClass = ({ isActive }) =>
    isActive ? 'sc-navbar__link active' : 'sc-navbar__link';

  const userInitial = user?.first_name?.[0] || user?.username?.[0] || 'U';

  return (
    <header className="sc-navbar">
      <div className="sc-navbar__container">
        {/* Brand Logo */}
        <Logo />

        {/* Primary Navigation Menu */}
        <nav
          className={`sc-navbar__links ${mobileMenuOpen ? 'open' : ''}`}
          aria-label="Main Navigation"
        >
          {/* 1. Home */}
          <NavLink to="/" end className={getNavClass}>
            Home
          </NavLink>

          {/* 2. Predict */}
          <NavLink
            to="/predict"
            className={() =>
              location.pathname.startsWith('/predict') || location.pathname.startsWith('/prediction')
                ? 'sc-navbar__link active'
                : 'sc-navbar__link'
            }
          >
            Predict
          </NavLink>

          {/* 3. Set Goal */}
          <NavLink
            to="/set-goal"
            className={() => (isGoalActive ? 'sc-navbar__link active' : 'sc-navbar__link')}
          >
            Set Goal
          </NavLink>

          {/* 4. About */}
          <NavLink to="/about" className={getNavClass}>
            About
          </NavLink>

          {/* 5. Analysis History (Active on /history, /history/:id, etc.) */}
          <NavLink
            to="/history"
            className={() => (isHistoryActive ? 'sc-navbar__link active' : 'sc-navbar__link')}
          >
            Analysis History
          </NavLink>
        </nav>

        {/* Right Side Actions: Auth vs Guest */}
        <div className="sc-navbar__right">
          {isAuthenticated ? (
            <>
              {/* Direct Dashboard Link */}
              <NavLink
                to="/dashboard"
                className={() =>
                  isDashboardActive ? 'sc-navbar__dash-link active' : 'sc-navbar__dash-link'
                }
              >
                <LayoutDashboard size={15} aria-hidden="true" />
                <span>Dashboard</span>
              </NavLink>

              {/* User Profile Dropdown */}
              <div className="sc-navbar__profile" ref={userRef}>
                <button
                  type="button"
                  className="sc-navbar__profile-trigger"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="sc-navbar__avatar">{userInitial}</div>
                  <span className="sc-navbar__username">{user?.username || 'User'}</span>
                  <ChevronDown size={14} aria-hidden="true" />
                </button>

                <ul
                  className={`sc-navbar__dropdown-menu sc-navbar__profile-menu ${
                    userDropdownOpen ? 'show' : ''
                  }`}
                  role="menu"
                >
                  <li role="none">
                    <NavLink
                      to="/dashboard"
                      className="sc-navbar__dropdown-item"
                      role="menuitem"
                    >
                      <LayoutDashboard size={16} aria-hidden="true" />
                      <span>Dashboard</span>
                    </NavLink>
                  </li>
                  <li role="none">
                    <NavLink
                      to="/set-goal"
                      className="sc-navbar__dropdown-item"
                      role="menuitem"
                    >
                      <Target size={16} aria-hidden="true" />
                      <span>Set Sleep Goal</span>
                    </NavLink>
                  </li>
                  <li role="none">
                    <NavLink
                      to="/history"
                      className="sc-navbar__dropdown-item"
                      role="menuitem"
                    >
                      <History size={16} aria-hidden="true" />
                      <span>Analysis History</span>
                    </NavLink>
                  </li>
                  <li role="none">
                    <NavLink
                      to="/predict"
                      className="sc-navbar__dropdown-item"
                      role="menuitem"
                    >
                      <Activity size={16} aria-hidden="true" />
                      <span>Sleep Analysis</span>
                    </NavLink>
                  </li>
                  <li role="none" className="sc-navbar__dropdown-divider" />
                  <li role="none">
                    <button
                      type="button"
                      className="sc-navbar__dropdown-item sc-navbar__logout-btn"
                      onClick={handleLogout}
                      role="menuitem"
                    >
                      <LogOut size={16} aria-hidden="true" />
                      <span>Logout</span>
                    </button>
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/login" className="sc-navbar__btn-login">
                Login
              </Link>
              <Link to="/register" className="sc-navbar__btn-signup">
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="sc-navbar__toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
}
