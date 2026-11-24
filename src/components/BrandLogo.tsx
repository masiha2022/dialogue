import React, { useState } from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<BrandLogoProps['size']>, string> = {
  sm: 'w-9 h-9 rounded-xl p-1',
  md: 'w-11 h-11 rounded-xl p-1',
  lg: 'w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-2',
};

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'sm', className = '' }) => {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`bg-white border border-slate-200 dark:border-white/20 shadow-sm flex items-center justify-center overflow-hidden shrink-0 ${SIZE_CLASSES[size]} ${className}`}
    >
      {!failed ? (
        <img
          src="/assets/aistudio/image_83_94a76e37.png"
          alt="لوگوی دیالوگ — Dialogue"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full h-full object-contain select-none"
        />
      ) : (
        <span className="font-extrabold text-[#C4161C] text-sm sm:text-base tracking-tight">
          D
        </span>
      )}
    </div>
  );
};
