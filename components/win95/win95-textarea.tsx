'use client';

import React from 'react';

interface Win95TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Win95Textarea({ label, error, className = '', id, ...props }: Win95TextareaProps) {
  const textareaId = id || `win95-textarea-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={textareaId} className="text-[11px] font-normal">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`
          win95-input
          w-full
          resize-none
          win95-scrollbar
          ${error ? 'outline outline-1 outline-[var(--win95-error)]' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <span className="text-[10px] text-[var(--win95-error)]">{error}</span>}
    </div>
  );
}
