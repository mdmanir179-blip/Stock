import React from 'react';

interface BrandLogoProps {
  collapsed?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  collapsed = false,
  className = '',
  size = 'md',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Precision Geometric Warehouse / Pallet / Cube Logo Icon */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white shadow-md shadow-amber-500/20 shrink-0 ring-1 ring-amber-400/40`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 text-neutral-950"
        >
          {/* Warehouse Rack & 3D Isometric Cargo Block */}
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
          {/* Inner inventory pulse dot */}
          <circle cx="12" cy="7" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </div>

      {!collapsed && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-extrabold tracking-tight text-neutral-900 dark:text-white font-sans">
              WH <span className="text-amber-600 dark:text-amber-500">stock</span>
            </span>
            <span className="text-xs uppercase font-bold tracking-widest text-neutral-500 dark:text-neutral-400">
              Tracker
            </span>
          </div>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium tracking-tight">
            Inventory & Supply Hub
          </span>
        </div>
      )}
    </div>
  );
};
