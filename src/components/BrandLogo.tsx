import React from 'react';

interface BrandLogoProps {
  theme?: 'dark' | 'light';
  onClick?: () => void;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  theme = 'dark', 
  onClick,
  className = ''
}) => {
  const isDark = theme === 'dark';

  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-2.5 cursor-pointer select-none transition-transform active:scale-95 group ${className}`}
      title="Swan HILL - กดเพื่อกลับหน้าหลัก"
    >
      {/* Official Swan Hill Logo Mark with Swan S & Mountain A */}
      <div className="flex flex-col">
        <img 
          src={isDark ? "/swan-hill-white.png" : "/swan-hill-dark.png"}
          alt="Swan HILL Logo"
          className="h-6 md:h-7 object-contain drop-shadow-xs"
        />
        <span className="text-[10px] text-emerald-400 font-bold tracking-wider mt-0.5 pl-0.5">
          RESORT PMS
        </span>
      </div>
    </div>
  );
};
