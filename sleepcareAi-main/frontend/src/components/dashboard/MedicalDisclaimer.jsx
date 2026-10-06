import React from 'react';
import { Info, ShieldAlert } from 'lucide-react';

export default function MedicalDisclaimer() {
  return (
    <aside className="sc-dash-disclaimer" aria-label="Medical Disclaimer">
      <div className="sc-disclaimer-icon-wrap">
        <Info size={18} className="sc-disclaimer-icon" />
      </div>
      <div className="sc-disclaimer-content">
        <p className="sc-disclaimer-text">
          <strong className="sc-disclaimer-strong">Important Health Notice: </strong>
          SleepCare AI provides machine-learning estimates for awareness and educational purposes.
          These results are not medical diagnoses and should not replace professional medical advice.
          If you experience chronic sleep disturbances or severe daytime fatigue, please consult a qualified healthcare provider.
        </p>
      </div>
    </aside>
  );
}
