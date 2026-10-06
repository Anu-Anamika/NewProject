import React from 'react';
import { Info } from 'lucide-react';

export default function InfoNotice() {
  return (
    <aside className="sc-disclaimer-wrapper" aria-label="Medical Disclaimer">
      <div className="sc-disclaimer-card">
        <div className="sc-disclaimer-icon-wrap" aria-hidden="true">
          <Info size={20} />
        </div>
        <div className="sc-disclaimer-body">
          <h3 className="sc-disclaimer-title">Important Note</h3>
          <p className="sc-disclaimer-text">
            This tool provides model-estimated results for awareness and educational purposes only.
            It is not a medical diagnosis. Please consult a qualified healthcare professional for medical advice.
          </p>
        </div>
      </div>
    </aside>
  );
}
