import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Brain, ArrowRight, History, Calendar, Sparkles, ShieldCheck, Download } from 'lucide-react';
import AnalysisDetailModal from './AnalysisDetailModal';
import { downloadAssessmentReport } from '../../services/api';

export default function RecentAnalyses({ analyses = [] }) {
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const hasAnalyses = Array.isArray(analyses) && analyses.length > 0;

  const handleDownloadPdf = async (item) => {
    const targetId = item.assessment_id || item.analysis_id || (typeof item.id === 'string' ? item.id.replace(/^[adq]_/, '') : item.id);
    if (!targetId) return;

    try {
      setDownloadingId(item.id);
      await downloadAssessmentReport(targetId, `SleepCare_Report_${targetId}.pdf`);
    } catch (err) {
      alert(err.message || 'Failed to download PDF report. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <div className="sc-dash-recent-card">
        <div className="sc-recent-card-header">
          <div>
            <div className="sc-dash-card-tag">
              <History size={14} />
              <span>PAST RECORDS</span>
            </div>
            <h3 className="sc-dash-card-title">Previous Analyses</h3>
            <p className="sc-dash-card-subtitle">
              Chronological log of your sleep assessments and machine-learning predictions
            </p>
          </div>

          <Link to="/history" className="sc-recent-view-all-link">
            <span>View All History</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="sc-recent-table-wrap">
          {hasAnalyses ? (
            <table className="sc-recent-table">
              <thead>
                <tr>
                  <th scope="col">Assessment</th>
                  <th scope="col">Prediction Results</th>
                  <th scope="col">Date</th>
                  <th scope="col" className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((item) => {
                  const isAssessment = item.type === 'assessment';
                  const isQuality = item.type === 'quality';

                  return (
                    <tr key={item.id} className="sc-recent-row">
                      {/* Type / Assessment title column */}
                      <td>
                        <div className="sc-table-type-cell">
                          <div className={`sc-table-type-icon ${isAssessment ? 'assessment' : isQuality ? 'quality' : 'disorder'}`}>
                            {isAssessment ? <ShieldCheck size={16} /> : isQuality ? <Moon size={16} /> : <Brain size={16} />}
                          </div>
                          <div className="sc-table-type-info">
                            <span className="sc-table-type-name">
                              {item.title || item.type_label || (isAssessment ? 'Sleep Assessment' : isQuality ? 'Sleep Quality' : 'Sleep Disorder')}
                            </span>
                            {item.duration && (
                              <span className="sc-table-type-meta">{item.duration} hrs sleep</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Prediction Result column */}
                      <td>
                        {isAssessment ? (
                          <div className="sc-table-combined-result">
                            <div className="sc-table-res-line">
                              <span className="sc-res-muted">Sleep Quality:</span>{' '}
                              <strong className="sc-res-highlight quality">{item.sleep_quality || '—'}</strong>
                            </div>
                            <div className="sc-table-res-line">
                              <span className="sc-res-muted">Sleep Disorder:</span>{' '}
                              <strong className="sc-res-highlight disorder">
                                {item.sleep_disorder
                                  ? item.sleep_disorder.replace(/·\s*([\d.]+)%/i, (_, v) => {
                                      const n = parseFloat(v);
                                      const p = n > 100 ? n / 100 : n <= 1 ? n * 100 : n;
                                      return `· ${p.toFixed(2)}%`;
                                    })
                                  : 'No Sleep Disorder'}
                              </strong>
                            </div>
                          </div>
                        ) : (
                          <div className="sc-table-result-cell">
                            <span className={`sc-table-result-badge ${isQuality ? 'quality' : 'disorder'}`}>
                              {item.result
                                ? item.result.replace(/·\s*([\d.]+)%/i, (_, v) => {
                                    const n = parseFloat(v);
                                    const p = n > 100 ? n / 100 : n <= 1 ? n * 100 : n;
                                    return `· ${p.toFixed(2)}%`;
                                  })
                                : 'Assessed'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Date column */}
                      <td>
                        <div className="sc-table-date-cell">
                          <Calendar size={13} className="sc-table-cal-icon" />
                          <span>{item.date}</span>
                        </div>
                      </td>

                      {/* Action column */}
                      <td className="text-right">
                        <div className="sc-table-actions-cell">
                          <button
                            type="button"
                            className="sc-table-view-btn"
                            onClick={() => setSelectedAnalysis(item)}
                            aria-label={`View analysis from ${item.date}`}
                          >
                            <span>View Analysis</span>
                            <ArrowRight size={13} />
                          </button>
                          <button
                            type="button"
                            className="sc-table-pdf-btn"
                            onClick={() => handleDownloadPdf(item)}
                            disabled={downloadingId === item.id}
                            aria-label={`Download PDF report for ${item.title || 'analysis'}`}
                          >
                            <Download size={13} />
                            <span>{downloadingId === item.id ? 'Downloading...' : 'Download PDF'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="sc-recent-empty">
              <div className="sc-recent-empty-icon">
                <Sparkles size={28} />
              </div>
              <p className="sc-recent-empty-text">No recorded analyses yet.</p>
              <span className="sc-recent-empty-sub">
                Your completed assessments and prediction scores will be cataloged here.
              </span>
            </div>
          )}
        </div>

        <div className="sc-recent-card-footer">
          <Link to="/history" className="sc-recent-footer-btn">
            <span>View All History</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Analysis Detail Modal */}
      {selectedAnalysis && (
        <AnalysisDetailModal
          analysis={selectedAnalysis}
          onClose={() => setSelectedAnalysis(null)}
        />
      )}
    </>
  );
}

