import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface LiquidSegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: 'glass' | 'emerald' | 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullWidth?: boolean;
}

export function LiquidSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = 'light',
  size = 'md',
  className = '',
  fullWidth = false,
}: LiquidSegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const updatePillPosition = () => {
    const activeIndex = options.findIndex((o) => o.value === value);
    const activeButton = buttonRefs.current[activeIndex];
    const container = containerRef.current;

    if (activeButton && container) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      
      const left = buttonRect.left - containerRect.left;
      const width = buttonRect.width;

      setPillStyle({
        left,
        width,
        ready: true,
      });
    }
  };

  useLayoutEffect(() => {
    updatePillPosition();
  }, [value, options]);

  useEffect(() => {
    const handleResize = () => updatePillPosition();
    window.addEventListener('resize', handleResize);
    const timeout = setTimeout(updatePillPosition, 50);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, [value, options]);

  // Clean, flat original styling dimensions
  const sizeClasses = {
    sm: 'p-1 text-xs',
    md: 'p-1 text-xs',
    lg: 'p-1.5 text-sm',
  }[size];

  const buttonPadding = {
    sm: 'px-2.5 py-1 gap-1',
    md: 'px-3 py-1.5 gap-1.5',
    lg: 'px-3.5 py-2 gap-2',
  }[size];

  // Flat original container styles (NO 3D glass, NO water droplets)
  const variantTrackClasses = {
    light: 'bg-slate-100 border border-slate-200 rounded-xl',
    glass: 'bg-slate-100 border border-slate-200 rounded-xl',
    emerald: 'bg-slate-100 border border-slate-200 rounded-xl',
    dark: 'bg-slate-900 border border-slate-800 rounded-xl',
  }[variant];

  // Flat original solid active pill styles
  const variantPillClasses = {
    light: 'bg-white text-slate-900 shadow-xs border border-slate-200/80 rounded-lg',
    glass: 'bg-white text-slate-900 shadow-xs border border-slate-200/80 rounded-lg',
    emerald: 'bg-emerald-600 text-white shadow-xs rounded-lg',
    dark: 'bg-slate-800 text-white shadow-xs border border-slate-700 rounded-lg',
  }[variant];

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center select-none transition-all ${
        fullWidth ? 'w-full flex' : ''
      } ${sizeClasses} ${variantTrackClasses} ${className}`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Sliding Active Pill (Flat original styling with smooth horizontal slide) */}
      {pillStyle.ready && (
        <div
          className={`absolute top-1 bottom-1 pointer-events-none transition-transform duration-250 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform ${variantPillClasses}`}
          style={{
            transform: `translateX(${pillStyle.left}px)`,
            width: `${pillStyle.width}px`,
            opacity: pillStyle.width > 0 ? 1 : 0,
          }}
        />
      )}

      {/* Option Buttons */}
      {options.map((option, idx) => {
        const isActive = option.value === value;

        let textColorClass = 'text-slate-600 hover:text-slate-900 font-medium';
        if (isActive) {
          if (variant === 'emerald' || variant === 'dark') {
            textColorClass = 'text-white font-semibold';
          } else {
            textColorClass = 'text-slate-900 font-bold';
          }
        } else if (variant === 'dark') {
          textColorClass = 'text-slate-400 hover:text-slate-200 font-medium';
        }

        return (
          <button
            key={option.value}
            ref={(el) => {
              buttonRefs.current[idx] = el;
            }}
            type="button"
            onClick={() => onChange(option.value)}
            className={`relative z-10 flex items-center justify-center transition-colors duration-150 cursor-pointer rounded-lg active:scale-[0.98] ${buttonPadding} ${textColorClass} ${
              fullWidth ? 'flex-1' : ''
            }`}
          >
            {option.icon && (
              <span className="shrink-0">
                {option.icon}
              </span>
            )}
            <span className="truncate">{option.label}</span>
            {option.badge !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive
                    ? variant === 'emerald'
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
