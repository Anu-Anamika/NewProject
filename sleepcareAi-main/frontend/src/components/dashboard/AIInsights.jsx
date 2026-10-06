import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Moon, Brain, TrendingUp, Heart, ArrowRight } from 'lucide-react';

export default function AIInsights({ insights = [] }) {
  // If user has specific dynamic insights, use them. Otherwise, provide sensible baseline observations.
  const displayInsights = Array.isArray(insights) && insights.length > 0 ? insights : [
    {
      id: 'default-1',
      category: 'Sleep Duration',
      icon: 'moon',
      title: 'Sleep Duration Pattern',
      description: 'Maintaining a consistent sleep schedule can support healthy sleep habits and steady model estimates.',
      highlight: 'Consistency Focus',
    },
    {
      id: 'default-2',
      category: 'Stress Pattern',
      icon: 'brain',
      title: 'Stress Level Correlation',
      description: 'Model observations indicate lower stress ratings are frequently associated with higher sleep quality scores.',
      highlight: 'Calm Routine',
    },
    {
      id: 'default-3',
      category: 'Sleep Trend',
      icon: 'trending-up',
      title: 'Longitudinal Awareness',
      description: 'Regular check-ins help the machine-learning models detect subtle patterns in your health and lifestyle factors.',
      highlight: 'AI Tracking',
    },
  ];

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'brain':
        return <Brain size={20} />;
      case 'trending-up':
        return <TrendingUp size={20} />;
      case 'heart':
        return <Heart size={20} />;
      case 'moon':
      default:
        return <Moon size={20} />;
    }
  };

  return (
    <section className="sc-dash-insights-section" aria-labelledby="insights-heading">
      <div className="sc-dash-section-header">
        <div>
          <div className="sc-dash-card-tag">
            <Sparkles size={14} />
            <span>MACHINE LEARNING OBSERVATIONS</span>
          </div>
          <h2 id="insights-heading" className="sc-dash-section-title">
            AI Sleep Insights
          </h2>
          <p className="sc-dash-section-subtitle">
            Personalized observations based on your recent analyses.
          </p>
        </div>
      </div>

      <div className="sc-dash-insights-grid">
        {displayInsights.map((insight) => (
          <div key={insight.id} className="sc-dash-insight-card">
            <div className="sc-insight-top">
              <div className={`sc-insight-icon-wrap ${insight.icon || 'moon'}`}>
                {getIcon(insight.icon)}
              </div>
              {insight.highlight && (
                <span className="sc-insight-pill">{insight.highlight}</span>
              )}
            </div>

            <div className="sc-insight-category">{insight.category}</div>
            <h4 className="sc-insight-title">{insight.title}</h4>
            <p className="sc-insight-desc">{insight.description}</p>

            <Link to="/predict/sleep-quality" className="sc-insight-link">
              <span>View Details</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
