import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// 1. ที่นอนเสริม (Extra Bed / Mattress Icon)
export const ExtraBedIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Headboard */}
    <path d="M2 4V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    {/* Footboard */}
    <path d="M22 10V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    {/* Bed Frame & Mattress */}
    <path d="M2 13H22V17H2V13Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    {/* Soft Pillow */}
    <path d="M5 8.5C5 7.67 5.67 7 6.5 7H10.5C11.33 7 12 7.67 12 8.5V13H5V8.5Z" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" />
    {/* Blanket Fold */}
    <path d="M12 13V10H20C21.1 10 22 10.9 22 12V13H12Z" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

// 2. หมูกระทะชุดเล็ก (Small Mookata BBQ Pan - ฿350)
export const MookataSmallIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Skillet Pan Base */}
    <ellipse cx="12" cy="15" rx="9.5" ry="4.5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.8" />
    {/* Pan Handles */}
    <path d="M2.5 15H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M23 15H21.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Central Grilling Dome */}
    <path d="M6.5 14C6.5 9.5 17.5 9.5 17.5 14" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    {/* Grill Slits on Dome */}
    <path d="M10 11.5L14 11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M11 9.5L13 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    {/* Steam / Aroma */}
    <path d="M10 6C10 4.5 11 4.5 11 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M14 6C14 4.5 15 4.5 15 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

// 3. หมูกระทะชุดใหญ่ (Deluxe Large Mookata BBQ Pan with Flame - ฿500)
export const MookataLargeIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Skillet Pan Base with Gold/Amber Accents */}
    <ellipse cx="12" cy="16" rx="10" ry="4.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8" />
    {/* Pan Handles */}
    <path d="M2 16H0.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M23.2 16H22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    {/* Elevated Dome */}
    <path d="M5.5 15C5.5 9 18.5 9 18.5 15" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1.8" />
    {/* Grill Lines */}
    <path d="M9 12.5H15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M10 10.5H14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    {/* Large Flame / Heat Sensation */}
    <path d="M12 2C10.5 4 11 5.5 12 7C13 5.5 13.5 4 12 2Z" fill="currentColor" />
    <path d="M7.5 5.5C6.5 7 7 8 7.5 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M16.5 5.5C17.5 7 17 8 16.5 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

// 4. อาหารเช้า (Breakfast Set - ฿60)
export const BreakfastIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Plate */}
    <circle cx="12" cy="12" r="9.5" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
    {/* Fried Egg White */}
    <path d="M8.5 10C7.5 11 8 13.5 10 14.5C12 15.5 14.5 14 15 12C15.5 10 14 8.5 12 8.5C10 8.5 9.5 9 8.5 10Z" fill="currentColor" fillOpacity="0.25" />
    {/* Egg Yolk */}
    <circle cx="11.5" cy="11.5" r="2.2" fill="currentColor" stroke="currentColor" strokeWidth="1.2" />
    {/* Morning Sunshine / Toast Accent */}
    <path d="M17 7L18.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 5. เครื่องดื่ม & น้ำดื่ม (Drinks / Refreshment)
export const DrinkIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Glass */}
    <path d="M5 4L7 19C7.2 20.1 8.1 21 9.2 21H14.8C15.9 21 16.8 20.1 17 19L19 4H5Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    {/* Liquid Line */}
    <path d="M6.3 10H17.7" stroke="currentColor" strokeWidth="1.5" />
    {/* Ice Cube */}
    <rect x="9" y="12" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
    {/* Straw */}
    <path d="M15 2L13 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 6. อาหารตามสั่ง (Custom Dish / A La Carte)
export const CustomDishIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Platter Base */}
    <path d="M2 19H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Cloche Dome */}
    <path d="M4 17C4 10.5 8 7 12 7C16 7 20 10.5 20 17H4Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.8" />
    {/* Handle on top */}
    <circle cx="12" cy="5" r="1.8" fill="currentColor" stroke="currentColor" strokeWidth="1" />
  </svg>
);
