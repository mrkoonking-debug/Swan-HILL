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
      
      // Calculate relative position within container padding
      const left = buttonRect.left - containerRect.left;
      const width = buttonRect.width;

      setPillStyle({
        left,
        width,
        ready: true,
      });
    }
  };

  // Run layout measurement safely
  useLayoutEffect(() => {
    updatePillPosition();
  }, [value, options]);

  // Window resize observer to keep pill aligned perfectly
  useEffect(() => {
    const handleResize = () => updatePillPosition();
    window.addEventListener('resize', handleResize);
    
    // Also re-measure after fonts load or slight layout settles
    const timeout = setTimeout(updatePillPosition, 50);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, [value, options]);

  // Styling maps based on size and variant
  const sizeClasses = {
    sm: 'p-0.5 text-[11px]',
    md: 'p-1 text-xs',
    lg: 'p-1.5 text-sm',
  }[size];

  const buttonPadding = {
    sm: 'px-2 py-1 gap-1',
    md: 'px-3 py-1.5 gap-1.5',
    lg: 'px-4 py-2 gap-2',
  }[size];

  const variantTrackClasses = {
    light: 'bg-slate-200/80 backdrop-blur-md border border-slate-300/70 shadow-inner',
    glass: 'bg-slate-900/10 backdrop-blur-xl border border-white/40 shadow-inner',
    emerald: 'bg-emerald-950/15 backdrop-blur-md border border-emerald-600/20 shadow-inner',
    dark: 'bg-slate-950/80 backdrop-blur-md border border-slate-800 shadow-inner',
  }[variant];

  const variantPillClasses = {
    light: 'bg-white text-slate-900 shadow-sm border border-slate-200/80 shadow-slate-900/10',
    glass: 'bg-white/95 backdrop-blur-xl text-slate-900 border border-white shadow-md shadow-slate-900/10',
    emerald: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-700/30 border border-emerald-400/30',
    dark: 'bg-slate-800 text-white border border-slate-700 shadow-md shadow-black/40',
  }[variant];

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center rounded-2xl select-none transition-all ${
        fullWidth ? 'w-full flex' : ''
      } ${sizeClasses} ${variantTrackClasses} ${className}`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Sliding Active Pill Indicator (Apple Liquid Spring Physics) */}
      {pillStyle.ready && (
        <div
          className={`absolute top-1 bottom-1 rounded-xl pointer-events-none transition-transform duration-350 ease-[cubic-bezier(0.2,0.9,0.2,1.1)] will-change-transform ${variantPillClasses}`}
          style={{
            transform: `translateX(${pillStyle.left}px)`,
            width: `${pillStyle.width}px`,
            // Fallback for initial render to prevent snap from 0
            opacity: pillStyle.width > 0 ? 1 : 0,
          }}
        >
          {/* Subtle liquid specular reflection line at top */}
          <div className="absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none rounded-full" />
        </div>
      )}

      {/* Option Buttons */}
      {options.map((option, idx) => {
        const isActive = option.value === value;

        // Dynamic text colors based on variant and active state
        let textColorClass = 'text-slate-600 hover:text-slate-900';
        if (isActive) {
          if (variant === 'emerald' || variant === 'dark') {
            textColorClass = 'text-white font-extrabold';
          } else {
            textColorClass = 'text-slate-900 font-extrabold';
          }
        } else if (variant === 'dark') {
          textColorClass = 'text-slate-400 hover:text-slate-200';
        } else if (variant === 'emerald') {
          textColorClass = 'text-emerald-900/80 hover:text-emerald-950 font-semibold';
        }

        return (
          <button
            key={option.value}
            ref={(el) => {
              buttonRefs.current[idx] = el;
            }}
            type="button"
            onClick={() => onChange(option.value)}
            className={`relative z-10 flex items-center justify-center font-bold transition-colors duration-200 cursor-pointer rounded-xl active:scale-[0.98] ${buttonPadding} ${textColorClass} ${
              fullWidth ? 'flex-1' : ''
            }`}
          >
            {option.icon && (
              <span className="shrink-0 transition-transform duration-200">
                {option.icon}
              </span>
            )}
            <span className="truncate">{option.label}</span>
            {option.badge !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive
                    ? variant === 'emerald'
                      ? 'bg-white/25 text-white'
                      : 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-300/70 text-slate-700'
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
