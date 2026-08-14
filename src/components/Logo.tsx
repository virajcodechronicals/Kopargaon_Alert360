import React from 'react';

export const Logo = ({ size = 120, className = '', showText = true }: { size?: number, className?: string, showText?: boolean }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Arcs */}
        <path d="M 50 15 A 35 35 0 0 1 74.7 25.2" stroke="#378ADD" strokeWidth="6" strokeLinecap="round" />
        <path d="M 85 50 A 35 35 0 0 1 74.7 74.7" stroke="#BA7517" strokeWidth="6" strokeLinecap="round" />
        <path d="M 50 85 A 35 35 0 0 1 25.2 74.7" stroke="#D85A30" strokeWidth="6" strokeLinecap="round" />
        <path d="M 15 50 A 35 35 0 0 1 25.2 25.2" stroke="#7F77DD" strokeWidth="6" strokeLinecap="round" />
        
        {/* Map-pin merged with shield */}
        <path 
          d="M 50 25 C 38.95 25 30 33.95 30 45 C 30 52 35 60 50 72 C 65 60 70 52 70 45 C 70 33.95 61.05 25 50 25 Z" 
          fill="#E6F1FB" 
          stroke="#185FA5" 
          strokeWidth="4" 
        />
        {/* Inner dot */}
        <circle cx="50" cy="42" r="5" fill="#185FA5" />
      </svg>
      {showText && (
        <div className="mt-4 text-center">
          <h1 className="text-xl font-medium text-slate-900 tracking-tight leading-none" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            KoparAlert 360
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kopargaon Taluka early warning
          </p>
        </div>
      )}
    </div>
  );
};
