import React from 'react';

interface HouseLogoProps {
  roomNumber: string;
  size?: 'sm' | 'md' | 'lg';
}

export const HouseLogo: React.FC<HouseLogoProps> = ({ roomNumber, size = 'md' }) => {
  const isLarge = roomNumber === 'S3' || roomNumber === 'S4';
  const isMedium = roomNumber === 'S1' || roomNumber === 'S2';
  const isTwinS5 = roomNumber === 'S5';
  const isTwinS6 = roomNumber === 'S6';

  const dimensionClasses = {
    sm: 'w-10 h-10',
    md: 'w-13 h-13',
    lg: 'w-16 h-16',
  }[size];

  const svgSize = size === 'sm' ? 22 : (size === 'md' ? 28 : 34);

  return (
    <div 
      className={`${dimensionClasses} rounded-2xl flex items-center justify-center border select-none shrink-0 transition-all ${
        isLarge
          ? 'bg-gradient-to-b from-[#fdfaf5] to-[#f4ebdE] border-[#dfcfbc] shadow-sm'
          : (isMedium 
              ? 'bg-gradient-to-b from-[#fdfbf7] to-[#f5eee4] border-[#e2d5c3] shadow-sm' 
              : 'bg-gradient-to-b from-[#fefdfb] to-[#f7f2ea] border-[#e8ded0] shadow-sm')
      }`}
      title={`บ้านพัก ${roomNumber}`}
    >
      {/* Pure Vector Cream & Rich Wood Brown Villa Art (Zero Text inside) */}
      {isLarge ? (
        // 🏰 Large Villa (S3, S4 - ฿1,500) - Grand 2-Floor Villa
        <svg 
          width={svgSize} 
          height={svgSize * 0.8} 
          viewBox="0 0 24 20" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main Large Villa Roof */}
          <path 
            d="M1 9L12 1.5L23 9V19H1V9Z" 
            fill="#fef3c7" 
            stroke="#78350f" 
            strokeWidth="1.8" 
            strokeLinejoin="round"
          />
          {/* Upper Window / Attic */}
          <path d="M10.5 7H13.5V9H10.5V7Z" fill="#78350f" stroke="#78350f" strokeWidth="0.8" />
          {/* Double Grand Doors */}
          <path d="M8.5 19V12H15.5V19" fill="#92400e" stroke="#78350f" strokeWidth="1.3" />
          <path d="M12 12V19" stroke="#fef3c7" strokeWidth="1" />
          {/* Roof Line & Chimney */}
          <path d="M17.5 4.5V2.5H19.5V6" stroke="#78350f" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M0.5 9L12 1L23.5 9" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : isMedium ? (
        // 🏡 Medium Villa (S1, S2 - ฿1,200) - Standalone Gable Villa
        <svg 
          width={svgSize} 
          height={svgSize * 0.8} 
          viewBox="0 0 24 20" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M2 9L12 2L22 9V19H2V9Z" 
            fill="#fef3c7" 
            stroke="#78350f" 
            strokeWidth="1.8" 
            strokeLinejoin="round"
          />
          <path d="M9 19V12H15V19" fill="#92400e" stroke="#78350f" strokeWidth="1.3" />
          <path d="M4 12H6.5" stroke="#78350f" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M17.5 12H20" stroke="#78350f" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M1 9L12 1.5L23 9" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        // 🛖 Twin Duplex Villas (S5 - Left Villa Active, S6 - Right Villa Active)
        <svg 
          width={svgSize * 1.15} 
          height={svgSize * 0.75} 
          viewBox="0 0 28 18" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left House (S5) */}
          <path 
            d="M1 8.5L7.5 2.5L14 8.5V17H1V8.5Z" 
            fill={isTwinS5 ? "#fef3c7" : "#f1f5f9"} 
            stroke={isTwinS5 ? "#78350f" : "#94a3b8"} 
            strokeWidth="1.6" 
            strokeLinejoin="round"
          />
          <path 
            d="M5 17V12H10V17" 
            fill={isTwinS5 ? "#92400e" : "#cbd5e1"} 
            stroke={isTwinS5 ? "#78350f" : "#94a3b8"} 
            strokeWidth="1.2" 
          />

          {/* Right House (S6) */}
          <path 
            d="M14 8.5L20.5 2.5L27 8.5V17H14V8.5Z" 
            fill={isTwinS6 ? "#fef3c7" : "#f1f5f9"} 
            stroke={isTwinS6 ? "#78350f" : "#94a3b8"} 
            strokeWidth="1.6" 
            strokeLinejoin="round"
          />
          <path 
            d="M18 17V12H23V17" 
            fill={isTwinS6 ? "#92400e" : "#cbd5e1"} 
            stroke={isTwinS6 ? "#78350f" : "#94a3b8"} 
            strokeWidth="1.2" 
          />

          {/* Middle Shared Wall / Connecting Line */}
          <line x1="14" y1="8.5" x2="14" y2="17" stroke="#78350f" strokeWidth="1.4" />
        </svg>
      )}
    </div>
  );
};
