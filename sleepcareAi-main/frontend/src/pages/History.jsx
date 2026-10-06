import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import {
  Moon,
  Brain,
  Calendar,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import AnalysisDetailModal from '../components/dashboard/AnalysisDetailModal';
import { downloadAssessmentReport, deleteHistoryItem } from '../services/api';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function History() {
  const [historyData, setHistoryData] = useState({ analyses: [], quality_history: [], disorder_history: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const handleDownloadPdf = async (item) => {
    const targetId = item.assessment_id || (item.raw && item.raw.assessment_id) || item.analysis_id || (typeof item.id === 'string' ? item.id.replace(/^[adq]_/, '') : item.id);
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

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      setIsDeleting(true);
      const targetId = deletingItem.rawId || deletingItem.analysis_id;
      await deleteHistoryItem(deletingItem.type, targetId);

      // Optimistically update local state
      setHistoryData((prev) => {
        if (deletingItem.type === 'assessment') {
          return {
            ...prev,
            analyses: (prev.analyses || []).filter((a) => a.id !== targetId),
          };
        } else if (deletingItem.type === 'quality') {
          return {
            ...prev,
            quality_history: (prev.quality_history || []).filter((q) => q.id !== targetId),
          };
        } else if (deletingItem.type === 'disorder') {
          return {
            ...prev,
            disorder_history: (prev.disorder_history || []).filter((d) => d.id !== targetId),
          };
        }
        return prev;
      });

      if (selectedAnalysis && (selectedAnalysis.id === targetId || selectedAnalysis.analysis_id === targetId)) {
        setSelectedAnalysis(null);
      }

      showToast(`Deleted "${deletingItem.title}" successfully.`);
    } catch (err) {
      alert(err.message || 'Failed to delete analysis record. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeletingItem(null);
    }
  };

  const handleConfirmClearAll = async () => {
    try {
      setIsDeleting(true);
      await deleteHistoryItem('all');
      setHistoryData({ analyses: [], quality_history: [], disorder_history: [] });
      setSelectedAnalysis(null);
      showToast('All past analysis history has been permanently cleared.');
    } catch (err) {
      alert(err.message || 'Failed to clear analysis history.');
    } finally {
      setIsDeleting(false);
      setClearingAll(false);
    }
  };

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(`${API_BASE}/api/history/`, {
          method: 'GET',
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setHistoryData(data);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  // Format any probability text safely so that 0.892 -> 89.20% and 89.2 -> 89.20% (never 8920%)
  const formatDisorderProbability = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '';
    const num = Number(val);
    const pct = num > 1 ? num : num * 100;
    return `${pct.toFixed(2)}%`;
  };

  // Combine and format history items chronologically
  const items = React.useMemo(() => {
    const list = [];

    // Unified Sleep Assessments with ML analysis
    (historyData.analyses || []).forEach((a) => {
      let disorderText = a.sleep_disorder || 'No Sleep Disorder';
      if (a.probabilities && disorderText !== 'No Sleep Disorder' && !disorderText.includes('·')) {
        try {
          let topProbVal = null;
          if (Array.isArray(a.probabilities)) {
            const matched = a.probabilities.find(
              (p) => p.label && disorderText.toLowerCase().includes(p.label.toLowerCase()) && p.label !== 'None'
            );
            if (matched && matched.probability !== undefined) {
              topProbVal = matched.probability;
            } else if (a.probabilities[0]?.probability !== undefined) {
              topProbVal = a.probabilities[0].probability;
            }
          } else if (typeof a.probabilities === 'object') {
            const values = Object.values(a.probabilities).map(Number).filter((v) => !isNaN(v));
            if (values.length > 0) topProbVal = Math.max(...values);
          }
          if (topProbVal !== null && !isNaN(topProbVal)) {
            disorderText = `${disorderText} · ${formatDisorderProbability(topProbVal)}`;
          }
        } catch {
          // ignore
        }
      }

      list.push({
        id: `a_${a.id}`,
        analysis_id: a.id,
        rawId: a.id,
        type: 'assessment',
        title: a.title || (a.assessment_id ? `Sleep Assessment #${a.assessment_id}` : 'Sleep Assessment'),
        sleep_quality: a.sleep_quality,
        sleep_quality_label: a.sleep_quality_label,
        sleep_disorder: disorderText,
        date: a.date || new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        rawDate: new Date(a.created_at),
        details: `${a.sleep_duration || '—'} hrs sleep · ${a.stress_level || '—'}/10 stress`,
        probabilities: a.probabilities,
        explainable_ai: a.explainable_ai,
        raw: a,
      });
    });

    (historyData.quality_history || []).forEach((q) => {
      list.push({
        id: `q_${q.id}`,
        rawId: q.id,
        type: 'quality',
        title: 'Sleep Quality',
        score: q.predicted_quality,
        label: q.quality_label || 'Good',
        date: new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        rawDate: new Date(q.created_at),
        details: `${q.sleep_duration || '—'} hrs sleep · ${q.stress_level || '—'}/10 stress`,
        link: '/predict/sleep-quality',
      });
    });

    (historyData.disorder_history || []).forEach((d) => {
      let topProb = '';
      if (d.probabilities && typeof d.probabilities === 'object') {
        try {
          const values = Object.values(d.probabilities).map(Number).filter((v) => !isNaN(v));
          if (values.length > 0) {
            const maxP = Math.max(...values);
            topProb = ` · ${formatDisorderProbability(maxP)}`;
          }
        } catch {
          // ignore
        }
      }
      list.push({
        id: `d_${d.id}`,
        rawId: d.id,
        type: 'disorder',
        title: 'Sleep Disorder',
        result: `${d.predicted_disorder || 'Assessed'}${topProb}`,
        date: new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        rawDate: new Date(d.created_at),
        details: `${d.sleep_duration || '—'} hrs sleep · ${d.stress_level || '—'}/10 stress`,
        link: '/predict/sleep-disorder',
      });
    });

    list.sort((a, b) => b.rawDate - a.rawDate);

    if (filter === 'assessment') return list.filter((i) => i.type === 'assessment');
    if (filter === 'quality') return list.filter((i) => i.type === 'quality');
    if (filter === 'disorder') return list.filter((i) => i.type === 'disorder');
    return list;
  }, [historyData, filter]);

  return (
    <div className="sc-dash-page">
      <div className="sc-dash-container" style={{ padding: '40px 5%' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="sc-dash-section-title" style={{ fontSize: '2rem' }}>
            Analysis History
          </h1>
          <p className="sc-dash-section-subtitle">
            Review and explore your previous machine-learning evaluations, saved assessments, and recorded trends.
          </p>
        </div>

        {/* Toast Alert Notification */}
        {toastMessage && (
          <div className="sc-history-toast" role="status">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CheckCircle2 size={18} color="#059669" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#065F46', display: 'flex' }}
              aria-label="Dismiss message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Filter Tabs & Bulk Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`sc-range-pill ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
              style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
            >
              All Analyses ({items.length})
            </button>
            <button
              type="button"
              className={`sc-range-pill ${filter === 'assessment' ? 'active' : ''}`}
              onClick={() => setFilter('assessment')}
              style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
            >
              Sleep Assessments
            </button>
            <button
              type="button"
              className={`sc-range-pill ${filter === 'quality' ? 'active' : ''}`}
              onClick={() => setFilter('quality')}
              style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
            >
              Sleep Quality
            </button>
            <button
              type="button"
              className={`sc-range-pill ${filter === 'disorder' ? 'active' : ''}`}
              onClick={() => setFilter('disorder')}
              style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
            >
              Sleep Disorder
            </button>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              className="sc-history-clear-btn"
              onClick={() => setClearingAll(true)}
              title="Delete all past analysis records"
            >
              <Trash2 size={14} />
              <span>Clear All History</span>
            </button>
          )}
        </div>

        {/* List of Records */}
        <div className="sc-dash-recent-card">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
              Loading your analysis history...
            </div>
          ) : items.length > 0 ? (
            <div className="sc-recent-table-wrap">
              <table className="sc-recent-table">
                <thead>
                  <tr>
                    <th scope="col">Type / Assessment</th>
                    <th scope="col">Prediction Results</th>
                    <th scope="col">Inputs</th>
                    <th scope="col">Date</th>
                    <th scope="col" className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const isAssessment = item.type === 'assessment';
                    return (
                      <tr key={item.id} className="sc-recent-row">
                        <td>
                          <div className="sc-table-type-cell">
                            <div className={`sc-table-type-icon ${item.type}`}>
                              {isAssessment ? <ShieldCheck size={16} /> : item.type === 'quality' ? <Moon size={16} /> : <Brain size={16} />}
                            </div>
                            <span className="sc-table-type-name">{item.title}</span>
                          </div>
                        </td>
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
                            <span className={`sc-table-result-badge ${item.type}`}>
                              {item.type === 'quality'
                                ? `${item.label} · ${item.score}/10`
                                : item.result
                                ? item.result.replace(/·\s*([\d.]+)%/i, (_, v) => {
                                    const n = parseFloat(v);
                                    const p = n > 100 ? n / 100 : n <= 1 ? n * 100 : n;
                                    return `· ${p.toFixed(2)}%`;
                                  })
                                : 'Assessed'}
                            </span>
                          )}
                        </td>
                        <td style={{ color: '#64748B', fontSize: '0.85rem' }}>{item.details}</td>
                        <td>
                          <div className="sc-table-date-cell">
                            <Calendar size={13} className="sc-table-cal-icon" />
                            <span>{item.date}</span>
                          </div>
                        </td>
                        <td className="text-right">
                          <div className="sc-table-actions-cell">
                            {isAssessment ? (
                              <>
                                <button
                                  type="button"
                                  className="sc-table-view-btn"
                                  onClick={() => setSelectedAnalysis(item.raw || item)}
                                  aria-label={`View analysis from ${item.date}`}
                                >
                                  <span>View</span>
                                  <ArrowRight size={13} />
                                </button>
                                <button
                                  type="button"
                                  className="sc-table-pdf-btn"
                                  onClick={() => handleDownloadPdf(item)}
                                  disabled={downloadingId === item.id}
                                  aria-label={`Download PDF for ${item.title}`}
                                >
                                  <Download size={13} />
                                  <span>{downloadingId === item.id ? 'PDF' : 'PDF'}</span>
                                </button>
                              </>
                            ) : (
                              <Link to={item.link} className="sc-table-view-btn">
                                <span>Re-Analyze</span>
                                <ArrowRight size={13} />
                              </Link>
                            )}

                            {/* Delete Option for this Analysis */}
                            <button
                              type="button"
                              className="sc-table-delete-btn"
                              onClick={() => setDeletingItem(item)}
                              title="Delete this analysis record"
                              aria-label={`Delete ${item.title}`}
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="sc-recent-empty" style={{ padding: '4rem 1rem' }}>
              <div className="sc-recent-empty-icon">
                <Sparkles size={28} />
              </div>
              <h3 className="sc-recent-empty-text">No analyses found</h3>
              <p className="sc-recent-empty-sub" style={{ marginBottom: '1.5rem' }}>
                You have not completed any evaluations in this category yet.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <Link to="/predict/sleep-quality" className="sc-dash-action-btn quality" style={{ fontSize: '0.85rem' }}>
                  <span>Analyze Sleep Quality</span>
                </Link>
                <Link to="/predict/sleep-disorder" className="sc-dash-action-btn disorder" style={{ fontSize: '0.85rem' }}>
                  <span>Analyze Sleep Disorder</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Detail Modal */}
      {selectedAnalysis && (
        <AnalysisDetailModal
          analysis={selectedAnalysis}
          onClose={() => setSelectedAnalysis(null)}
          onDelete={(analysis) => {
            setSelectedAnalysis(null);
            setDeletingItem({
              type: 'assessment',
              rawId: analysis.id || analysis.analysis_id,
              title: analysis.title || (analysis.assessment_id ? `Sleep Assessment #${analysis.assessment_id}` : 'Sleep Assessment'),
              date: analysis.date || analysis.prediction_date || 'Past Record',
            });
          }}
        />
      )}

      {/* Delete Single Item Confirmation Modal */}
      {deletingItem && (
        <div className="sc-delete-modal-overlay" onClick={() => !isDeleting && setDeletingItem(null)}>
          <div className="sc-delete-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sc-delete-modal-icon-wrap">
              <Trash2 size={24} />
            </div>
            <h3 className="sc-delete-modal-title">Delete Past Analysis?</h3>
            <p className="sc-delete-modal-desc">
              Are you sure you want to permanently delete <strong>{deletingItem.title}</strong> recorded on{' '}
              <strong>{deletingItem.date}</strong>? This action cannot be undone.
            </p>
            <div className="sc-delete-modal-actions">
              <button
                type="button"
                className="sc-delete-modal-cancel"
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sc-delete-modal-confirm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                <Trash2 size={14} />
                <span>{isDeleting ? 'Deleting...' : 'Delete Record'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All History Confirmation Modal */}
      {clearingAll && (
        <div className="sc-delete-modal-overlay" onClick={() => !isDeleting && setClearingAll(false)}>
          <div className="sc-delete-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sc-delete-modal-icon-wrap">
              <AlertTriangle size={24} />
            </div>
            <h3 className="sc-delete-modal-title">Clear All Analysis History?</h3>
            <p className="sc-delete-modal-desc">
              This will permanently delete <strong>all {items.length} past analyses and predictions</strong> from your account.
              You will not be able to recover these reports or historical metrics.
            </p>
            <div className="sc-delete-modal-actions">
              <button
                type="button"
                className="sc-delete-modal-cancel"
                onClick={() => setClearingAll(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sc-delete-modal-confirm"
                onClick={handleConfirmClearAll}
                disabled={isDeleting}
              >
                <Trash2 size={14} />
                <span>{isDeleting ? 'Clearing...' : 'Clear All History'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

