'use client';

import React from 'react';

interface Win95ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Win95Button({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}: Win95ButtonProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-[10px] min-w-[60px]',
    md: 'px-3 py-1 text-[11px] min-w-[75px]',
    lg: 'px-4 py-2 text-[12px] min-w-[90px]',
  };

  return (
    <button
      className={`
        win95-btn
        ${sizeClasses[size]}
        ${disabled ? 'cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
