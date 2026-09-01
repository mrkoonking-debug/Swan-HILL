import React from 'react';

interface BrandLogoProps {
  theme?: 'dark' | 'light';
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  theme = 'dark', 
  onClick,
  className = '',
  size = 'md',
  showBadge = true,
}) => {
  const isDark = theme === 'dark';

  const badgeSizes = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-8 h-8 md:w-9 md:h-9 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
  };

  const imgHeights = {
    sm: 'h-4.5',
    md: 'h-5 md:h-6',
    lg: 'h-8 md:h-9',
  };

  const subtextSizes = {
    sm: 'text-[8px]',
    md: 'text-[9px] md:text-[10px]',
    lg: 'text-xs',
  };

  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-2.5 cursor-pointer select-none transition-all active:scale-95 group ${className}`}
      title="Swan HILL - กดเพื่อกลับหน้าหลัก"
    >
      {/* Official Swan Hill Emblem Icon Badge */}
      {showBadge && (
        <div className={`${badgeSizes[size]} overflow-hidden shadow-md shadow-emerald-500/15 border border-emerald-500/30 shrink-0 bg-slate-950 flex items-center justify-center transition-transform duration-200 group-hover:scale-105`}>
          <img 
            src="/pwa-192x192.png" 
            alt="Swan HILL Emblem" 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Official Typographic Wordmark */}
      <div className="flex flex-col justify-center min-w-0">
        <img 
          src={isDark ? "/swan-hill-white.png" : "/swan-hill-dark.png"}
          alt="Swan HILL"
          className={`${imgHeights[size]} object-contain drop-shadow-xs transition-opacity group-hover:opacity-90`}
        />
        <span className={`${subtextSizes[size]} text-emerald-400 font-bold tracking-widest pl-0.5 leading-none mt-0.5 uppercase`}>
          RESORT PMS
        </span>
      </div>
    </div>
  );
};
