import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import WelcomeHeader from '../components/dashboard/WelcomeHeader';
import AnalysisActionCard from '../components/dashboard/AnalysisActionCard';
import SleepStats from '../components/dashboard/SleepStats';
import SleepTrendChart from '../components/dashboard/SleepTrendChart';
import LatestAnalysis from '../components/dashboard/LatestAnalysis';
import RecentAnalyses from '../components/dashboard/RecentAnalyses';
import AIInsights from '../components/dashboard/AIInsights';
import ExplainabilityCard from '../components/dashboard/ExplainabilityCard';
import MedicalDisclaimer from '../components/dashboard/MedicalDisclaimer';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';
import GoalBanner from '../components/dashboard/GoalBanner';
import { getDashboardData } from '../services/dashboardApi';
import { RefreshCw, AlertCircle } from 'lucide-react';

import '../styles/dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Unable to load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Derived user representation prioritizing authenticated user context
  const currentUser = dashboardData?.user || user || { username: 'Tony' };

  return (
    <div className="sc-dash-page">
      <div className="sc-dash-container" id="main-content">
        {loading ? (
          /* High-fidelity Skeleton UI during data fetching */
          <DashboardSkeleton />
        ) : error ? (
          /* Friendly Error State without exposing internal backend exceptions */
          <div className="sc-dash-error-card" role="alert">
            <div className="sc-dash-error-icon">
              <AlertCircle size={32} />
            </div>
            <h2 className="sc-dash-error-title">Unable to load your dashboard.</h2>
            <p className="sc-dash-error-desc">Please try again.</p>
            <button
              type="button"
              className="sc-dash-retry-btn"
              onClick={fetchDashboard}
            >
              <RefreshCw size={16} />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          /* Rendered Dashboard Content */
          <div className="sc-dash-content-flow fade-up">
            {/* 1. Welcome Section */}
            <WelcomeHeader user={currentUser} />

            {/* 2. Quick Analysis Action Cards & Sleep Goal */}
            <section className="sc-dash-actions-section" aria-label="Available Sleep Assessments">
              <div className="sc-dash-actions-grid">
                <AnalysisActionCard type="quality" />
                <AnalysisActionCard type="disorder" />
              </div>
              <GoalBanner />
            </section>

            {/* 3. Sleep Overview (4 Statistics & Empty State when 0 analyses) */}
            <SleepStats stats={dashboardData?.stats} />

            {/* 4. Trends & Latest Analysis (2-column layout on desktop) */}
            <section className="sc-dash-trend-latest-grid" aria-label="Trends and Latest Analysis">
              <SleepTrendChart data={dashboardData?.sleep_quality_trend || []} />
              <LatestAnalysis latest={dashboardData?.latest_analysis} />
            </section>

            {/* 5. Recent Analyses Table/List */}
            <section className="sc-dash-recent-section" aria-label="Recent Analyses Records">
              <RecentAnalyses analyses={dashboardData?.recent_analyses || []} />
            </section>

            {/* 6. AI Sleep Insights */}
            <AIInsights insights={dashboardData?.insights || []} />

            {/* 7. Explainable AI Section */}
            <ExplainabilityCard />

            {/* 8. Medical Disclaimer */}
            <MedicalDisclaimer />
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
