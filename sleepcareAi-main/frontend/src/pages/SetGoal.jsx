import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GoalHeader from '../components/goal/GoalHeader';
import GoalSetupCard from '../components/goal/GoalSetupCard';
import ChallengePreview from '../components/goal/ChallengePreview';
import ChallengeProgressCard from '../components/goal/ChallengeProgressCard';
import GoalStatsCards from '../components/goal/GoalStatsCards';
import TodaySleepCard from '../components/goal/TodaySleepCard';
import RecordTodaySleepCard from '../components/goal/RecordTodaySleepCard';
import TrackingGrid from '../components/goal/TrackingGrid';
import GoalCompletionCard from '../components/goal/GoalCompletionCard';
import SleepReportModal from '../components/goal/SleepReportModal';
import Footer from '../components/Footer';
import {
  getActiveGoal,
  createGoal,
  recordDailySleep,
  calculateGoalStats,
  resetGoalData,
} from '../services/sleepGoalApi';

import '../styles/setGoal.css';

/**
 * Parse "YYYY-MM-DD" string to a local Date (avoids UTC offset shifting the day).
 */
function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Get today's date as "YYYY-MM-DD" in local time.
 */
function getTodayStr() {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Given a start date string "YYYY-MM-DD" and today's date string,
 * compute which challenge day number today is (1–21).
 * Returns null if the challenge hasn't started or is past Day 21.
 */
function computeTodayDayNumber(startDateStr) {
  if (!startDateStr) return 1;
  const startObj = parseLocalDate(startDateStr);
  if (!startObj) return 1;
  const todayStr = getTodayStr();
  const todayObj = parseLocalDate(todayStr);
  const diffMs = todayObj - startObj;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const dayNum = diffDays + 1;
  if (dayNum < 1) return 1;
  if (dayNum > 21) return 21;
  return dayNum;
}

export default function SetGoal() {
  const { user } = useAuth();
  const [goal, setGoal] = useState(null);
  const [records, setRecords] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null); // null = auto-select today
  const [isEditingSetup, setIsEditingSetup] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user-specific active goal and records on mount and whenever user changes
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const data = await getActiveGoal(user?.id);
        if (!isMounted) return;
        if (data && data.goal) {
          setGoal(data.goal);
          setRecords(data.records || []);
          setSelectedDay(null); // will auto-compute from start_date
        } else {
          setGoal(null);
          setRecords([]);
          setSelectedDay(null);
        }
      } catch {
        if (!isMounted) return;
        setGoal(null);
        setRecords([]);
        setSelectedDay(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Compute "today's day number" from the goal's real start_date
  const todayDayNumber = useMemo(() => {
    if (!goal?.start_date) return 1;
    return computeTodayDayNumber(goal.start_date);
  }, [goal?.start_date]);

  // The effective selected day — default to today's actual challenge day
  const effectiveSelectedDay = selectedDay !== null ? selectedDay : todayDayNumber;

  // Compute stats in real time strictly from user's records
  const targetDuration = goal?.target_sleep_duration || 480;
  const stats = useMemo(() => {
    return calculateGoalStats(records, targetDuration);
  }, [records, targetDuration]);

  // Record for currently selected day
  const currentSelectedRecord = useMemo(() => {
    return records.find((r) => r.day_number === effectiveSelectedDay) || null;
  }, [records, effectiveSelectedDay]);

  // Record for today specifically (used in TodaySleepCard)
  const todayRecord = useMemo(() => {
    return records.find((r) => r.day_number === todayDayNumber) || null;
  }, [records, todayDayNumber]);

  // Check if challenge is complete (all 21 days recorded OR Day 21 has passed)
  const isChallengeComplete =
    stats.recordedDaysCount >= 21 ||
    (goal?.start_date && todayDayNumber >= 21 && todayRecord?.actual_sleep_duration !== null &&
      todayRecord?.actual_sleep_duration !== undefined);

  // Handle starting a new or updated goal
  const handleStartGoal = async (newGoalData) => {
    try {
      const res = await createGoal(newGoalData, user?.id);
      if (res && res.goal) {
        setGoal(res.goal);
        setRecords(res.records || []);
        setSelectedDay(null); // reset to auto today
        setIsEditingSetup(false);
      }
    } catch {
      // Handled silently
    }
  };

  // Handle saving sleep for selected day (only valid for today)
  const handleSaveDailyRecord = async (recordData) => {
    if (!goal) return;
    // Only allow recording for today's day number
    const dayToRecord = todayDayNumber;
    try {
      const res = await recordDailySleep(goal.id, dayToRecord, recordData, user?.id);
      if (res && res.records) {
        setRecords(res.records);
      }
    } catch {
      // Handled silently
    }
  };

  // Handle setting a new goal after completion or reset
  const handleResetGoal = async () => {
    await resetGoalData(user?.id);
    setGoal(null);
    setRecords([]);
    setSelectedDay(null);
    setIsEditingSetup(true);
  };

  if (loading) {
    return (
      <div className="sc-goal-page">
        <div className="sc-goal-container">
          <GoalHeader />
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
            Loading your sleep goal data...
          </div>
        </div>
      </div>
    );
  }

  const hasActiveGoal = !!goal && goal.status === 'active';

  return (
    <div className="sc-goal-page">
      <div className="sc-goal-container">
        {/* 1. Page Header */}
        <GoalHeader />

        {/* 2. Empty state banner when no goal set yet */}
        {!hasActiveGoal && (
          <div className="sc-no-goal-banner" role="status">
            <Sparkles size={20} className="sc-no-goal-banner-icon" />
            <div>
              <span className="sc-no-goal-banner-title">No sleep goal set yet</span>
              <span className="sc-no-goal-banner-text">
                Choose your target sleep duration and bedtime schedule below to start your personal 21-day challenge.
              </span>
            </div>
          </div>
        )}

        {/* 3. Setup Mode OR Active Challenge Mode */}
        {!hasActiveGoal || isEditingSetup ? (
          <section className="sc-goal-setup-row" aria-label="Create Sleep Goal">
            <GoalSetupCard
              initialGoal={goal}
              onStartGoal={handleStartGoal}
              isEditing={isEditingSetup && hasActiveGoal}
              onCancelEdit={() => setIsEditingSetup(false)}
            />
            <ChallengePreview />
          </section>
        ) : null}

        {/* 4. If Goal is Complete, Show Completion Card */}
        {hasActiveGoal && isChallengeComplete && !isEditingSetup && (
          <GoalCompletionCard
            stats={stats}
            onViewReport={() => setShowReportModal(true)}
            onResetGoal={handleResetGoal}
          />
        )}

        {/* 5. Active Tracking Dashboard (when goal is active and not complete) */}
        {hasActiveGoal && !isChallengeComplete && (
          <>
            {/* Upper Dashboard Row: Challenge Progress Card + 3 Stat Cards */}
            <section className="sc-challenge-dashboard-row" aria-label="Challenge Progress and Stats">
              <ChallengeProgressCard
                currentDay={todayDayNumber}
                totalDays={21}
                onEditGoal={() => setIsEditingSetup(true)}
              />
              <GoalStatsCards stats={stats} />
            </section>

            {/* Lower Dashboard Row: Today's Sleep + Record Today's Sleep + 21-Day Tracking Grid */}
            <section className="sc-tracking-bottom-row" aria-label="Daily Sleep Recording and Calendar">
              {/*
                TodaySleepCard always shows TODAY's data (not the selected day)
                so the user always sees their current day progress.
              */}
              <TodaySleepCard
                targetDurationMinutes={targetDuration}
                targetBedtime={goal.target_bedtime}
                targetWakeTime={goal.target_wake_time}
                todayRecord={todayRecord}
                selectedDay={todayDayNumber}
              />

              {/*
                RecordTodaySleepCard:
                - If selected day is today → interactive form
                - If selected day is past  → read-only past data
                - If selected day is future → locked
              */}
              <RecordTodaySleepCard
                currentRecord={currentSelectedRecord}
                dayNumber={effectiveSelectedDay}
                targetDuration={targetDuration}
                targetBedtime={goal.target_bedtime}
                targetWakeTime={goal.target_wake_time}
                onSaveRecord={handleSaveDailyRecord}
                goalStartDate={goal.start_date}
              />

              <TrackingGrid
                records={records}
                currentDay={todayDayNumber}
                selectedDay={effectiveSelectedDay}
                onSelectDay={(dayNum) => setSelectedDay(dayNum)}
                targetDuration={targetDuration}
                startDate={goal.start_date}
              />
            </section>
          </>
        )}

        {/* Sleep Report Modal */}
        <SleepReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          goal={goal}
          records={records}
          stats={stats}
        />
      </div>

      <Footer />
    </div>
  );
}
