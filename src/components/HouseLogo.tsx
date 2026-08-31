import React from 'react';

interface HouseLogoProps {
  roomNumber: string;
  size?: 'sm' | 'md' | 'lg';
}

export const HouseLogo: React.FC<HouseLogoProps> = ({ roomNumber, size = 'md' }) => {
  const isTwin = roomNumber.includes('5');
  const isRoomA = roomNumber.includes('A');
  const isRoomB = roomNumber.includes('B');

  const dimensionClasses = {
    sm: 'w-10 h-10',
    md: 'w-13 h-13',
    lg: 'w-16 h-16',
  }[size];

  const svgSize = size === 'sm' ? 22 : (size === 'md' ? 28 : 34);

  return (
    <div 
      className={`${dimensionClasses} rounded-2xl flex items-center justify-center border shadow-xs select-none shrink-0 transition-all ${
        isTwin
          ? 'bg-gradient-to-b from-[#fbf8f3] to-[#f0e7db] border-[#d8c8b4]'
          : 'bg-gradient-to-b from-[#fdfbf7] to-[#f3ebdE] border-[#dccbb7]'
      }`}
      title={roomNumber}
    >
      {/* Pure Vector Japanese Minimalist Villa Logo (NO text inside logo) */}
      {isTwin ? (
        // Custom Duplex Twin Houses (Japanese Minimalist Twin Pavilion)
        <svg 
          width={svgSize} 
          height={svgSize * 0.75} 
          viewBox="0 0 32 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left House (Room A) */}
          <path 
            d="M3 10L9 4L15 10V22H3V10Z" 
            fill={isRoomA ? '#bfa07a' : '#f0e6d8'} 
            stroke="#5c3818" 
            strokeWidth="1.8" 
            strokeLinejoin="round"
          />
          <path d="M7 22V14H11V22" fill="#5c3818" stroke="#5c3818" strokeWidth="1.2" />
          
          {/* Right House (Room B - Shared Wall) */}
          <path 
            d="M15 10L21 4L27 10V22H15V10Z" 
            fill={isRoomB ? '#bfa07a' : '#f0e6d8'} 
            stroke="#5c3818" 
            strokeWidth="1.8" 
            strokeLinejoin="round"
          />
          <path d="M19 22V14H23V22" fill="#5c3818" stroke="#5c3818" strokeWidth="1.2" />
        </svg>
      ) : (
        // Custom Standalone Japanese Minimalist Villa
        <svg 
          width={svgSize} 
          height={svgSize * 0.8} 
          viewBox="0 0 24 20" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Gable Roof & Wooden Base */}
          <path 
            d="M1 9.5L12 2L23 9.5V19.5H1V9.5Z" 
            fill="#ede1d1" 
            stroke="#5c3818" 
            strokeWidth="1.8" 
            strokeLinejoin="round"
          />
          {/* Wooden Door & Pillars */}
          <path d="M9 19.5V11.5H15V19.5" fill="#784720" stroke="#5c3818" strokeWidth="1.4" />
          <path d="M4 11.5H6.5" stroke="#5c3818" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M17.5 11.5H20" stroke="#5c3818" strokeWidth="1.4" strokeLinecap="round" />
          {/* Minimalist Roof Line */}
          <path d="M0.5 9.5L12 1.5L23.5 9.5" stroke="#5c3818" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
};
