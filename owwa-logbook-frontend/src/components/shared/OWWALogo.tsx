import React from 'react';

interface OWWALogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
  className?: string;
}

const OWWALogo: React.FC<OWWALogoProps> = ({ size = 'md', variant = 'full', className = '' }) => {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-sm', sub: 'text-xs' },
    md: { icon: 'w-10 h-10', text: 'text-base', sub: 'text-xs' },
    lg: { icon: 'w-14 h-14', text: 'text-xl', sub: 'text-sm' },
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* OWWA Shield Icon */}
      <div className={`${sizes[size].icon} relative flex-shrink-0`}>
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path
            d="M20 2L4 8v12c0 9 7.2 16.4 16 18 8.8-1.6 16-9 16-18V8L20 2z"
            fill="#1e3a8a"
          />
          <path
            d="M20 5L7 10.5v9.5c0 7.2 5.8 13.2 13 14.5 7.2-1.3 13-7.3 13-14.5v-9.5L20 5z"
            fill="#2563eb"
          />
          <text
            x="20"
            y="24"
            textAnchor="middle"
            fill="white"
            fontSize="11"
            fontWeight="bold"
            fontFamily="Inter, sans-serif"
          >
            OWWA
          </text>
        </svg>
      </div>

      {variant === 'full' && (
        <div className="flex flex-col leading-tight">
          <span className={`${sizes[size].text} font-bold text-white`}>OWWA</span>
          <span className={`${sizes[size].sub} text-white font-medium`}>Region IX</span>
        </div>
      )}
    </div>
  );
};

export default OWWALogo;
