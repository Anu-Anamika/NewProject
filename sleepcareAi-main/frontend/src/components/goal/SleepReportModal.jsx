import React from 'react';
import { X, Calendar, CheckCircle2, XCircle, Clock, Bed, TrendingUp } from 'lucide-react';

export default function SleepReportModal({ isOpen, onClose, goal, records, stats }) {
  if (!isOpen) return null;

  const validRecords = records.filter(
    (r) => r.actual_sleep_duration !== null && r.actual_sleep_duration !== undefined
  );

  const totalSleepMinutes = validRecords.reduce(
    (sum, r) => sum + r.actual_sleep_duration,
    0
  );
  const avgMinutes =
    validRecords.length > 0 ? Math.round(totalSleepMinutes / validRecords.length) : 0;
  const avgH = Math.floor(avgMinutes / 60);
  const avgM = avgMinutes % 60;

  const targetMinutes = goal?.target_sleep_duration || 480;
  const targetH = Math.floor(targetMinutes / 60);
  const targetM = targetMinutes % 60;

  return (
    <div className="sc-report-modal-overlay" role="dialog" aria-modal="true">
      <div className="sc-report-modal-dialog">
        <div className="sc-report-modal-header">
          <div className="sc-report-header-text">
            <h2 className="sc-report-title">21-Day Sleep Challenge Summary</h2>
            <p className="sc-report-subtitle">
              Comprehensive report of your sleep routine and targets
            </p>
          </div>
          <button
            type="button"
            className="sc-report-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sc-report-modal-body">
          {/* Summary Row */}
          <div className="sc-report-summary-grid">
            <div className="sc-rep-card">
              <span className="sc-rep-label">Goal Target</span>
              <span className="sc-rep-val">
                {targetH}h {targetM < 10 ? '0' : ''}{targetM}m
              </span>
              <span className="sc-rep-sub">Per night</span>
            </div>

            <div className="sc-rep-card">
              <span className="sc-rep-label">Average Sleep</span>
              <span className="sc-rep-val">
                {avgH}h {avgM < 10 ? '0' : ''}{avgM}m
              </span>
              <span className="sc-rep-sub">Over {validRecords.length} recorded days</span>
            </div>

            <div className="sc-rep-card">
              <span className="sc-rep-label">Achieved Days</span>
              <span className="sc-rep-val is-green">
                {stats?.achievedDaysCount || 0} / 21
              </span>
              <span className="sc-rep-sub">{stats?.successRate || 0}% success rate</span>
            </div>
          </div>

          {/* Daily Table Breakdown */}
          <div className="sc-report-table-section">
            <h3 className="sc-report-section-title">Day-by-Day Tracking Log</h3>
            <div className="sc-report-table-wrap">
              <table className="sc-report-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Date</th>
                    <th>Bedtime</th>
                    <th>Wake Time</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => {
                    const hasSleep =
                      r.actual_sleep_duration !== null &&
                      r.actual_sleep_duration !== undefined;
                    const rH = hasSleep ? Math.floor(r.actual_sleep_duration / 60) : 0;
                    const rM = hasSleep ? r.actual_sleep_duration % 60 : 0;
                    const isAchieved =
                      hasSleep &&
                      (r.goal_achieved !== null && r.goal_achieved !== undefined
                        ? r.goal_achieved
                        : r.actual_sleep_duration >= targetMinutes);

                    return (
                      <tr key={r.day_number}>
                        <td className="sc-tb-day">Day {r.day_number}</td>
                        <td className="sc-tb-date">{r.date || `Day ${r.day_number}`}</td>
                        <td>{r.bedtime || '—'}</td>
                        <td>{r.wake_time || '—'}</td>
                        <td className="sc-tb-duration">
                          {hasSleep ? `${rH}h ${rM < 10 ? '0' : ''}${rM}m` : 'Not Recorded'}
                        </td>
                        <td>
                          {!hasSleep ? (
                            <span className="sc-pill-status neutral">Not Recorded</span>
                          ) : isAchieved ? (
                            <span className="sc-pill-status achieved">
                              <CheckCircle2 size={13} />
                              <span>Achieved</span>
                            </span>
                          ) : (
                            <span className="sc-pill-status missed">
                              <XCircle size={13} />
                              <span>Missed</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="sc-report-modal-footer">
          <button
            type="button"
            className="sc-report-done-btn"
            onClick={onClose}
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
