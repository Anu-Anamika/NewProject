import React from 'react';
import { Moon, Activity, Brain, Heart, ShieldAlert, BookOpen } from 'lucide-react';

const QUALITY_TIPS = [
  {
    id: 'routine',
    title: 'Healthy Routine',
    desc: 'Maintain a consistent sleep schedule.',
    icon: '🌙',
    type: 'moon',
  },
  {
    id: 'active',
    title: 'Stay Active',
    desc: 'Regular physical activity supports healthy sleep.',
    icon: '🏃',
    type: 'activity',
  },
  {
    id: 'stress',
    title: 'Manage Stress',
    desc: 'Lower stress can contribute to better sleep.',
    icon: '🧠',
    type: 'brain',
  },
  {
    id: 'better',
    title: 'Better You',
    desc: 'Good sleep supports overall wellbeing.',
    icon: '❤️',
    type: 'heart',
  },
];

const DISORDER_TIPS = [
  {
    id: 'learn',
    title: 'Learn and Understand',
    desc: 'Gain awareness about sleep disorders and their risk factors.',
    icon: '🌙',
    type: 'moon',
  },
  {
    id: 'awareness',
    title: 'Early Awareness',
    desc: 'Early insights can help you take preventive steps.',
    icon: '🛡',
    type: 'shield',
  },
  {
    id: 'tomorrow',
    title: 'Healthier Tomorrow',
    desc: 'Make informed lifestyle choices for better sleep and overall health.',
    icon: '❤️',
    type: 'heart',
  },
];

const ANALYSIS_TIPS = [
  {
    id: 'routine',
    title: 'Consistent Schedule',
    desc: 'A regular sleep and wake time strengthens your circadian rhythm.',
    icon: '🌙',
    type: 'moon',
  },
  {
    id: 'active',
    title: 'Stay Active',
    desc: 'Regular physical activity supports deeper, more restorative sleep.',
    icon: '🏃',
    type: 'activity',
  },
  {
    id: 'awareness',
    title: 'Early Awareness',
    desc: 'Understanding disorder risk helps you seek care before symptoms worsen.',
    icon: '🛡',
    type: 'shield',
  },
  {
    id: 'better',
    title: 'Holistic Wellbeing',
    desc: 'Good sleep quality and disorder management support overall health.',
    icon: '❤️',
    type: 'heart',
  },
];

export default function HealthTipCard({ mode = 'quality' }) {
  const isQuality  = mode === 'quality';
  const isAnalysis = mode === 'analysis';

  let tips      = QUALITY_TIPS;
  let gridClass = 'sc-tips-grid-4';

  if (isAnalysis) {
    tips      = ANALYSIS_TIPS;
    gridClass = 'sc-tips-grid-4';
  } else if (!isQuality) {
    tips      = DISORDER_TIPS;
    gridClass = 'sc-tips-grid-3';
  }

  return (
    <section className="sc-tips-section" aria-label="Sleep Health Recommendations">
      <div className={gridClass}>
        {tips.map((tip) => (
          <div key={tip.id} className="sc-tip-card">
            <div className={`sc-tip-icon-box ${tip.type}`} aria-hidden="true">
              <span>{tip.icon}</span>
            </div>
            <div className="sc-tip-content">
              <h3 className="sc-tip-title">{tip.title}</h3>
              <p className="sc-tip-desc">{tip.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
