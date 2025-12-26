'use client';

import React from 'react';

interface Win95InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Win95Input({ label, error, className = '', id, ...props }: Win95InputProps) {
  const inputId = id || `win95-input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-[11px] font-normal">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          win95-input
          w-full
          ${error ? 'outline outline-1 outline-[var(--win95-error)]' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <span className="text-[10px] text-[var(--win95-error)]">{error}</span>}
    </div>
  );
}
