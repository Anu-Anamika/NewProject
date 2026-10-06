import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function FormField({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  options = [],
  step,
  min,
  max,
  unit,
  icon: Icon,
  error,
  disabled = false,
  className = '',
}) {
  const inputId = id || `field-${name}`;
  const errorId = `${inputId}-error`;

  return (
    <div className={`sc-form-field ${error ? 'has-error' : ''} ${className}`}>
      <label htmlFor={inputId} className="sc-field-label">
        <span>{label}</span>
        {unit && <span className="sc-field-unit">{unit}</span>}
      </label>

      <div className={`sc-input-wrapper ${Icon ? 'has-icon' : ''}`}>
        {Icon && (
          <span className="sc-input-icon" aria-hidden="true">
            <Icon size={16} />
          </span>
        )}

        {type === 'select' ? (
          <select
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="sc-select"
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={inputId}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            step={step}
            min={min}
            max={max}
            disabled={disabled}
            className="sc-input"
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
        )}
      </div>

      {error && (
        <span id={errorId} className="sc-field-error" role="alert">
          <AlertCircle size={12} />
          <span>{error}</span>
        </span>
      )}
    </div>
  );
}
