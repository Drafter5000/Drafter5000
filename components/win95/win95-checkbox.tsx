'use client';

import React from 'react';

interface Win95CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function Win95Checkbox({
  checked,
  onCheckedChange,
  label,
  disabled = false,
  id,
  className = '',
}: Win95CheckboxProps) {
  const checkboxId = id || `win95-checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        onClick={() => !disabled && onCheckedChange(!checked)}
        className={`
          w-[13px] h-[13px]
          win95-field
          flex items-center justify-center
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        `}
      >
        {checked && <span className="text-[11px] leading-none font-bold">✓</span>}
      </div>
      {label && (
        <label
          htmlFor={checkboxId}
          onClick={() => !disabled && onCheckedChange(!checked)}
          className={`text-[11px] ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
          {label}
        </label>
      )}
    </div>
  );
}
