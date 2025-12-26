'use client';

import React from 'react';

interface Win95WindowProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  showControls?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  icon?: React.ReactNode;
}

export function Win95Window({
  title,
  children,
  className = '',
  showControls = true,
  onClose,
  onMinimize,
  onMaximize,
  icon,
}: Win95WindowProps) {
  return (
    <div className={`win95-window-border p-[2px] ${className}`}>
      {/* Title Bar */}
      <div className="win95-title-bar h-[18px] flex items-center gap-1">
        {icon && <span className="w-4 h-4 flex items-center justify-center">{icon}</span>}
        <span className="flex-1 truncate text-[11px] font-bold">{title}</span>
        {showControls && (
          <div className="flex gap-[2px]">
            {onMinimize && (
              <button onClick={onMinimize} className="win95-control-btn" aria-label="Minimize">
                <span className="leading-none">_</span>
              </button>
            )}
            {onMaximize && (
              <button onClick={onMaximize} className="win95-control-btn" aria-label="Maximize">
                <span className="leading-none">□</span>
              </button>
            )}
            {onClose && (
              <button onClick={onClose} className="win95-control-btn" aria-label="Close">
                <span className="leading-none">×</span>
              </button>
            )}
          </div>
        )}
      </div>
      {/* Content Area */}
      <div className="bg-[var(--win95-bg)] p-2">{children}</div>
    </div>
  );
}
