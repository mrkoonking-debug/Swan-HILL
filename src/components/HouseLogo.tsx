import React from 'react';

interface HouseLogoProps {
  roomNumber: string;
  size?: 'sm' | 'md' | 'lg';
}

export const HouseLogo: React.FC<HouseLogoProps> = ({ roomNumber, size = 'md' }) => {
  const isLarge = roomNumber === 'S3' || roomNumber === 'S4';
  const isMedium = roomNumber === 'S1' || roomNumber === 'S2';

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
      title={roomNumber}
    >
      {/* Pure Vector Cream & Rich Wood Brown Villa Art (Zero Text inside) */}
      {isLarge ? (
        // 🏰 Large Villa (S3, S4 - ฿1,500)
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
      ) : (isMedium ? (
        // 🏡 Medium Villa (S1, S2 - ฿1,200)
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
        // 🛖 Small Villa (S5, S6 - ฿1,000)
        <svg 
          width={svgSize} 
          height={svgSize * 0.8} 
          viewBox="0 0 24 20" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M3 10L12 3L21 10V18.5H3V10Z" 
            fill="#fef3c7" 
            stroke="#78350f" 
            strokeWidth="1.8" 
            strokeLinejoin="round"
          />
          <path d="M10 18.5V13H14V18.5" fill="#92400e" stroke="#78350f" strokeWidth="1.3" />
          <path d="M2 10L12 2.5L22 10" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ))}
    </div>
  );
};
