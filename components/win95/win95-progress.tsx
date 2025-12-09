'use client';

import React from 'react';

interface Win95ProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  className?: string;
}

export function Win95Progress({
  value,
  max = 100,
  showLabel = false,
  className = '',
}: Win95ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="win95-progress flex-1">
        <div
          className="win95-progress-bar transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[11px] min-w-[40px] text-right">{Math.round(percentage)}%</span>
      )}
    </div>
  );
}
