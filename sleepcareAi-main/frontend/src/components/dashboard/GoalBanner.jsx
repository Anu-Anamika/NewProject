import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, ArrowRight, Calendar, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getActiveGoal } from '../../services/sleepGoalApi';

export default function GoalBanner() {
  const { user } = useAuth();
  const [goal, setGoal] = useState(null);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function loadUserGoal() {
      try {
        const data = await getActiveGoal(user?.id);
        if (!isMounted) return;
        if (data && data.goal) {
          setGoal(data.goal);
          setRecords(data.records || []);
        } else {
          setGoal(null);
          setRecords([]);
        }
      } catch {
        if (!isMounted) return;
        setGoal(null);
        setRecords([]);
      }
    }
    loadUserGoal();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const hasActiveGoal = !!goal && goal.status === 'active';
  const currentDay = goal?.current_day || 1;

  // Format target duration
  const targetMinutes = goal?.target_sleep_duration || 480;
  const targetH = Math.floor(targetMinutes / 60);
  const targetM = targetMinutes % 60;
  const targetStr = `${targetH}h${targetM > 0 ? ` ${targetM}m` : ''}`;

  return (
    <div className="sc-dash-goal-banner">
      <div className="sc-dash-goal-banner-content">
        <div className="sc-dash-goal-banner-header">
          <div className="sc-dash-goal-icon-wrap" aria-hidden="true">
            <Target size={22} />
          </div>
          <div className="sc-dash-goal-pill">
            <Sparkles size={12} />
            <span>{hasActiveGoal ? `Day ${currentDay} of 21` : 'No Sleep Goal Set Yet'}</span>
          </div>
        </div>

        <h3 className="sc-dash-goal-title">
          {hasActiveGoal ? '21-Day Sleep Challenge' : 'Set Your Sleep Goal'}
        </h3>
        <p className="sc-dash-goal-desc">
          {hasActiveGoal
            ? `Your active goal target is ${targetStr} nightly. Log your sleep daily to maintain your consistency and build a healthy routine.`
            : 'Build a consistent sleep routine with a simple 21-day tracking challenge. Record daily sleep and monitor your success rate.'}
        </p>

        <Link to="/set-goal" className="sc-dash-goal-btn">
          <span>{hasActiveGoal ? 'Continue Tracking' : 'Set Sleep Goal'}</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="sc-dash-goal-visual" aria-hidden="true">
        <div className="sc-dash-goal-preview-box">
          <div className="sc-dash-goal-badge-row">
            <Calendar size={16} className="sc-goal-cal-icon" />
            <span className="sc-goal-cal-label">21 Days Challenge</span>
          </div>
          <div className="sc-dash-goal-dots-row">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => {
              if (!hasActiveGoal) {
                return (
                  <span key={d} className="sc-goal-dot upcoming">
                    {d}
                  </span>
                );
              }
              const rec = records.find((r) => r.day_number === d);
              const isRecorded = rec && rec.actual_sleep_duration !== null && rec.actual_sleep_duration !== undefined;
              const isAchieved = isRecorded && (rec.goal_achieved ?? (rec.actual_sleep_duration >= targetMinutes));
              const isToday = d === currentDay;

              if (isToday) {
                return (
                  <span key={d} className="sc-goal-dot active">
                    ●
                  </span>
                );
              }
              if (isRecorded) {
                return (
                  <span key={d} className={`sc-goal-dot ${isAchieved ? 'done' : 'upcoming'}`}>
                    {isAchieved ? '✓' : '✕'}
                  </span>
                );
              }
              return (
                <span key={d} className="sc-goal-dot upcoming">
                  {d}
                </span>
              );
            })}
          </div>
          <div className="sc-goal-subtext">
            {hasActiveGoal ? `Day ${currentDay} of 21` : 'One day at a time'}
          </div>
        </div>
      </div>
    </div>
  );
}
