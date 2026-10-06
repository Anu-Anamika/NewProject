import React from 'react';

/**
 * WaveDivider component creates a smooth curved transition between the hero and body.
 */
export default function WaveDivider() {
  return (
    <div className="sc-wave-container" aria-hidden="true">
      <svg
        className="sc-wave-svg"
        viewBox="0 0 1440 96"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="sc-wave-fill"
          d="M0,32L48,42.7C96,53,192,75,288,74.7C384,75,480,53,576,42.7C672,32,768,32,864,42.7C960,53,1056,75,1152,74.7C1248,75,1344,53,1392,42.7L1440,32L1440,96L1392,96C1344,96,1248,96,1152,96C1056,96,960,96,864,96C768,96,672,96,576,96C480,96,384,96,288,96C192,96,96,96,48,96L0,96Z"
        />
      </svg>
    </div>
  );
}
