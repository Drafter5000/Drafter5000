'use client';

import React from 'react';

interface Win95BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline';
  className?: string;
}

export function Win95Badge({ children, variant = 'default', className = '' }: Win95BadgeProps) {
  const variantClasses = {
    default: 'win95-raised',
    secondary: 'win95-sunken',
    outline: 'border border-[var(--win95-button-shadow)]',
  };

  return (
    <span
      className={`
        inline-flex items-center
        px-1 py-[1px]
        text-[10px]
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
