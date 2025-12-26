'use client';

import React from 'react';

interface Win95Tab {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface Win95TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  tabs: Win95Tab[];
  children: React.ReactNode;
  className?: string;
}

export function Win95Tabs({
  value,
  onValueChange,
  tabs,
  children,
  className = '',
}: Win95TabsProps) {
  return (
    <div className={className}>
      {/* Tab buttons */}
      <div className="flex items-end">
        {tabs.map((tab, index) => {
          const isActive = tab.value === value;
          return (
            <button
              key={tab.value}
              onClick={() => onValueChange(tab.value)}
              className={`
                px-3 py-1
                text-[11px]
                border-t-2 border-l-2 border-r-2
                ${
                  isActive
                    ? 'bg-[var(--win95-bg)] border-t-[var(--win95-button-highlight)] border-l-[var(--win95-button-highlight)] border-r-[var(--win95-button-shadow)] pb-[6px] mb-[-2px] z-10 relative'
                    : 'bg-[var(--win95-bg-dark)] border-t-[var(--win95-button-highlight)] border-l-[var(--win95-button-highlight)] border-r-[var(--win95-button-shadow)] mt-[2px]'
                }
                ${index > 0 ? 'ml-[-1px]' : ''}
              `}
              style={{
                boxShadow: isActive
                  ? 'inset 1px 1px 0 var(--win95-bg-light), inset -1px 0 0 var(--win95-button-dark-shadow)'
                  : 'inset 1px 1px 0 var(--win95-bg-light), inset -1px 0 0 var(--win95-button-dark-shadow)',
              }}
            >
              <span className="flex items-center gap-1">
                {tab.icon}
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* Tab content */}
      <div className="win95-raised p-3 border-t-0">{children}</div>
    </div>
  );
}

interface Win95TabContentProps {
  value: string;
  activeValue: string;
  children: React.ReactNode;
}

export function Win95TabContent({ value, activeValue, children }: Win95TabContentProps) {
  if (value !== activeValue) return null;
  return <>{children}</>;
}
