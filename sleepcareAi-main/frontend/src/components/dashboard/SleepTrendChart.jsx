import React, { useState } from 'react';
import { TrendingUp, BarChart2, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SleepTrendChart({ data = [] }) {
  const [activeRange, setActiveRange] = useState('7D');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const hasEnoughData = Array.isArray(data) && data.length >= 2;

  // Filter or slice based on range if enough points exist
  const displayData = React.useMemo(() => {
    if (!hasEnoughData) return [];
    if (activeRange === '7D') return data.slice(-7);
    if (activeRange === '30D') return data.slice(-30);
    return data;
  }, [data, activeRange, hasEnoughData]);

  // Chart dimensions & scaling
  const width = 640;
  const height = 240;
  const padding = { top: 25, right: 30, bottom: 45, left: 40 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Y-axis range: 4 to 10 (or 0 to 10)
  const minY = 4;
  const maxY = 10;

  const points = React.useMemo(() => {
    if (!hasEnoughData || displayData.length === 0) return [];
    const count = displayData.length;

    return displayData.map((d, index) => {
      const x = padding.left + (count === 1 ? plotWidth / 2 : (index / (count - 1)) * plotWidth);
      const normalizedScore = Math.max(minY, Math.min(maxY, d.score));
      const y = padding.top + plotHeight - ((normalizedScore - minY) / (maxY - minY)) * plotHeight;
      return { ...d, x, y };
    });
  }, [displayData, hasEnoughData, plotWidth, plotHeight, padding.left, padding.top]);

  // Compute smooth bezier curve path
  const pathD = React.useMemo(() => {
    if (points.length < 2) return '';

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx1 = p0.x + (p1.x - p0.x) / 2;
      const cy1 = p0.y;
      const cx2 = p0.x + (p1.x - p0.x) / 2;
      const cy2 = p1.y;
      d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [points]);

  // Gradient area path (close to bottom)
  const areaD = React.useMemo(() => {
    if (points.length < 2 || !pathD) return '';
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    const bottomY = padding.top + plotHeight;
    return `${pathD} L ${lastPoint.x} ${bottomY} L ${firstPoint.x} ${bottomY} Z`;
  }, [pathD, points, padding.top, plotHeight]);

  return (
    <div className="sc-dash-chart-card">
      <div className="sc-dash-chart-header">
        <div>
          <div className="sc-dash-card-tag">
            <TrendingUp size={14} />
            <span>PROGRESS TRACKER</span>
          </div>
          <h3 className="sc-dash-card-title">Sleep Quality Trend</h3>
          <p className="sc-dash-card-subtitle">
            Your sleep quality across recent analyses
          </p>
        </div>

        {hasEnoughData && (
          <div className="sc-dash-chart-controls">
            <div className="sc-range-pills" role="tablist" aria-label="Time range">
              {['7D', '30D', 'All'].map((range) => (
                <button
                  key={range}
                  type="button"
                  role="tab"
                  aria-selected={activeRange === range}
                  className={`sc-range-pill ${activeRange === range ? 'active' : ''}`}
                  onClick={() => setActiveRange(range)}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="sc-dash-chart-body">
        {hasEnoughData ? (
          <div className="sc-svg-chart-container">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="sc-svg-chart"
              preserveAspectRatio="xMidYMid meet"
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#147DF5" stopOpacity="0.28" />
                  <stop offset="60%" stopColor="#5BB8FF" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#147DF5" stopOpacity="0.0" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#147DF5" floodOpacity="0.35" />
                </filter>
              </defs>

              {/* Y-axis grid lines */}
              {[4, 6, 8, 10].map((val) => {
                const y = padding.top + plotHeight - ((val - minY) / (maxY - minY)) * plotHeight;
                return (
                  <g key={val} className="sc-grid-group">
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={width - padding.right}
                      y2={y}
                      className="sc-chart-gridline"
                    />
                    <text
                      x={padding.left - 10}
                      y={y + 4}
                      className="sc-axis-label y-label"
                      textAnchor="end"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Gradient fill under curve */}
              {areaD && (
                <path d={areaD} fill="url(#trendGradient)" className="sc-chart-area-fill" />
              )}

              {/* Smooth curve line */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#147DF5"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  filter="url(#glow)"
                  className="sc-chart-line-path"
                />
              )}

              {/* Interactive Data Points */}
              {points.map((pt, i) => (
                <g key={pt.id || i} className="sc-chart-point-group">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint?.id === pt.id ? 7 : 4.5}
                    className={`sc-chart-dot ${hoveredPoint?.id === pt.id ? 'active' : ''}`}
                    onMouseEnter={() => setHoveredPoint(pt)}
                  />
                  {/* Invisible hit area for easier mouse/touch hover */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={16}
                    fill="transparent"
                    onMouseEnter={() => setHoveredPoint(pt)}
                  />
                  {/* X-axis date labels */}
                  <text
                    x={pt.x}
                    y={height - 12}
                    className="sc-axis-label x-label"
                    textAnchor="middle"
                  >
                    {pt.short_date || pt.day || `P${i + 1}`}
                  </text>
                </g>
              ))}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div
                className="sc-chart-tooltip"
                style={{
                  left: `${(hoveredPoint.x / width) * 100}%`,
                  top: `${(hoveredPoint.y / height) * 100}%`,
                }}
              >
                <div className="sc-tooltip-date">{hoveredPoint.date || 'Prediction'}</div>
                <div className="sc-tooltip-score">
                  <span className="sc-tt-val">{hoveredPoint.score}</span>
                  <span className="sc-tt-denom">/ 10</span>
                  {hoveredPoint.label && (
                    <span className="sc-tt-badge">{hoveredPoint.label}</span>
                  )}
                </div>
                {hoveredPoint.duration && (
                  <div className="sc-tt-meta">Duration: {hoveredPoint.duration} hrs</div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Empty / Insufficient data state (< 2 analyses) */
          <div className="sc-dash-chart-empty">
            <div className="sc-chart-empty-icon">
              <BarChart2 size={32} />
            </div>
            <h4 className="sc-chart-empty-title">Not enough data yet</h4>
            <p className="sc-chart-empty-text">
              Complete a few analyses to see your sleep-quality trend and patterns.
            </p>
            <Link to="/predict/sleep-quality" className="sc-chart-empty-btn">
              <span>Start Analysis</span>
            </Link>
          </div>
        )}
      </div>

      <div className="sc-dash-chart-footer">
        <div className="sc-chart-note">
          <Info size={13} />
          <span>Scores are calibrated machine-learning estimates based on your lifestyle profile.</span>
        </div>
      </div>
    </div>
  );
}
