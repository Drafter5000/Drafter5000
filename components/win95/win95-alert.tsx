'use client';

import React from 'react';

interface Win95AlertProps {
  type: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

const ALERT_ICONS = {
  info: 'ℹ️',
  warning: '⚠️',
  error: '❌',
  success: '✅',
};

export function Win95Alert({ type, title, children, className = '', onClose }: Win95AlertProps) {
  return (
    <div className={`win95-raised p-2 ${className}`}>
      <div className="flex items-start gap-2">
        <span className="text-[16px] leading-none mt-[2px]">{ALERT_ICONS[type]}</span>
        <div className="flex-1 min-w-0">
          {title && <div className="text-[11px] font-bold mb-1">{title}</div>}
          <div className="text-[11px]">{children}</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="win95-control-btn" aria-label="Close">
            ×
          </button>
        )}
      </div>
    </div>
  );
}
