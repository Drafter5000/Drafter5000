'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Win95SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface Win95SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Win95SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Win95Select({
  value,
  onValueChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  className = '',
}: Win95SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          win95-field
          w-full
          flex items-center justify-between
          px-1 py-[2px]
          text-[11px] text-left
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        `}
      >
        <span className="flex items-center gap-1 truncate">
          {selectedOption?.icon}
          {selectedOption?.label || placeholder}
        </span>
        <span className="win95-raised w-4 h-full flex items-center justify-center ml-1">▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 win95-raised mt-0">
          <div className="win95-field max-h-[150px] overflow-y-auto win95-scrollbar">
            {options.map(option => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`
                  px-2 py-1 cursor-pointer text-[11px]
                  flex items-center gap-1
                  ${value === option.value ? 'bg-[var(--win95-selection)] text-[var(--win95-selection-text)]' : 'hover:bg-[var(--win95-selection)] hover:text-[var(--win95-selection-text)]'}
                `}
              >
                {option.icon}
                {option.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
