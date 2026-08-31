import React from 'react';

interface HouseLogoProps {
  roomNumber: string;
  size?: 'sm' | 'md' | 'lg';
}

export const HouseLogo: React.FC<HouseLogoProps> = ({ roomNumber, size = 'md' }) => {
  const isTwin = roomNumber.includes('5');
  const isRoomA = roomNumber.includes('A');
  const isRoomB = roomNumber.includes('B');

  // Extract short number
  let shortCode = '1';
  if (roomNumber.includes('1')) shortCode = '1';
  else if (roomNumber.includes('2')) shortCode = '2';
  else if (roomNumber.includes('3')) shortCode = '3';
  else if (roomNumber.includes('4')) shortCode = '4';
  else if (isTwin) shortCode = isRoomA ? '5A' : (isRoomB ? '5B' : '5');

  const dimensionClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  }[size];

  const svgSize = size === 'sm' ? 18 : 22;

  return (
    <div className={`${dimensionClasses} rounded-2xl flex flex-col items-center justify-center border shadow-xs select-none shrink-0 transition-transform ${
      isTwin 
        ? 'bg-gradient-to-b from-teal-50 to-emerald-50 border-teal-300 text-teal-900' 
        : 'bg-gradient-to-b from-emerald-50 to-teal-50 border-emerald-300 text-emerald-950'
    }`}>
      {/* Custom Vector SVG Logo */}
      {isTwin ? (
        // Custom Twin Houses Logo (2 connected houses)
        <svg 
          width={svgSize} 
          height={svgSize * 0.75} 
          viewBox="0 0 32 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="text-teal-700"
        >
          {/* Left House */}
          <path 
            d="M3 10L9 4L15 10V22H3V10Z" 
            fill={isRoomA ? '#0d9488' : '#99f6e4'} 
            stroke="#0f766e" 
            strokeWidth="1.8" 
            strokeLinejoin="round"
          />
          <path d="M7 22V14H11V22" stroke="#0f766e" strokeWidth="1.5" />
          
          {/* Right House (Connected / Sharing wall) */}
          <path 
            d="M15 10L21 4L27 10V22H15V10Z" 
            fill={isRoomB ? '#0d9488' : '#99f6e4'} 
            stroke="#0f766e" 
            strokeWidth="1.8" 
            strokeLinejoin="round"
          />
          <path d="M19 22V14H23V22" stroke="#0f766e" strokeWidth="1.5" />
        </svg>
      ) : (
        // Custom Single Standalone Villa Logo
        <svg 
          width={svgSize} 
          height={svgSize * 0.8} 
          viewBox="0 0 24 20" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="text-emerald-700"
        >
          <path 
            d="M2 9L12 2L22 9V19H2V9Z" 
            fill="#a7f3d0" 
            stroke="#047857" 
            strokeWidth="1.8" 
            strokeLinejoin="round"
          />
          <path d="M9 19V11H15V19" fill="#047857" stroke="#047857" strokeWidth="1.5" />
          {/* Chimney / Modern accent */}
          <path d="M17 5V3H19V6.5" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}

      {/* House Number Label */}
      <span className="text-[11px] font-black tracking-tight leading-none mt-0.5">
        บ้าน {shortCode}
      </span>
    </div>
  );
};
