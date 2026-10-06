import React from 'react';

export default function DashboardSkeleton() {
  return (
    <div className="sc-dash-skeleton-wrapper" aria-busy="true" aria-label="Loading your dashboard">
      {/* Welcome Banner Skeleton */}
      <div className="sc-skeleton-card sc-skel-banner">
        <div className="sc-skeleton-shimmer sc-skel-pill"></div>
        <div className="sc-skeleton-shimmer sc-skel-title"></div>
        <div className="sc-skeleton-shimmer sc-skel-subtitle"></div>
      </div>

      {/* Action Cards Skeleton (2 columns) */}
      <div className="sc-skel-grid-2">
        <div className="sc-skeleton-card sc-skel-action">
          <div className="sc-skeleton-shimmer sc-skel-icon"></div>
          <div className="sc-skeleton-shimmer sc-skel-h"></div>
          <div className="sc-skeleton-shimmer sc-skel-p"></div>
          <div className="sc-skeleton-shimmer sc-skel-btn"></div>
        </div>
        <div className="sc-skeleton-card sc-skel-action">
          <div className="sc-skeleton-shimmer sc-skel-icon"></div>
          <div className="sc-skeleton-shimmer sc-skel-h"></div>
          <div className="sc-skeleton-shimmer sc-skel-p"></div>
          <div className="sc-skeleton-shimmer sc-skel-btn"></div>
        </div>
      </div>

      {/* Stats Skeleton (4 cards) */}
      <div className="sc-skel-grid-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="sc-skeleton-card sc-skel-stat">
            <div className="sc-skeleton-shimmer sc-skel-line-short"></div>
            <div className="sc-skeleton-shimmer sc-skel-number"></div>
            <div className="sc-skeleton-shimmer sc-skel-line-tiny"></div>
          </div>
        ))}
      </div>

      {/* Trend Chart & Latest Analysis Skeleton (2 columns) */}
      <div className="sc-skel-grid-chart">
        <div className="sc-skeleton-card sc-skel-chart-box">
          <div className="sc-skeleton-shimmer sc-skel-h"></div>
          <div className="sc-skeleton-shimmer sc-skel-chart-area"></div>
        </div>
        <div className="sc-skeleton-card sc-skel-latest-box">
          <div className="sc-skeleton-shimmer sc-skel-h"></div>
          <div className="sc-skeleton-shimmer sc-skel-circle"></div>
          <div className="sc-skeleton-shimmer sc-skel-line-short"></div>
        </div>
      </div>
    </div>
  );
}
