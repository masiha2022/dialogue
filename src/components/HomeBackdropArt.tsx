import React from 'react';
import { HomeBackdropId } from '../types/game';

interface HomeBackdropArtProps {
  backdropId: HomeBackdropId;
  customDataUrl?: string;
  isDark?: boolean;
  compact?: boolean;
}

export const HomeBackdropArt: React.FC<HomeBackdropArtProps> = ({
  backdropId,
  customDataUrl,
  isDark = true,
  compact = false,
}) => {
  if (backdropId === 'custom' && customDataUrl) {
    return (
      <img
        src={customDataUrl}
        alt="تصویر پس‌زمینه انتخابی صفحه اصلی"
        className="w-full h-full object-cover select-none"
      />
    );
  }

  if (backdropId === 'crimson-moon') {
    return (
      <div
        className={`w-full h-full relative overflow-hidden ${
          isDark
            ? 'bg-gradient-to-b from-[#17090D] via-[#1B0D14] to-[#0D1018]'
            : 'bg-gradient-to-b from-[#FDECEC] via-[#F9D8DA] to-[#EDEFF4]'
        }`}
      >
        <svg
          viewBox="0 0 800 420"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full select-none"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="crimsonMoonGlow" cx="50%" cy="42%" r="48%">
              <stop offset="0%" stopColor="#C4161C" stopOpacity={isDark ? '0.45' : '0.32'} />
              <stop offset="100%" stopColor="#C4161C" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="800" height="420" fill="url(#crimsonMoonGlow)" />
          <circle
            cx="400"
            cy="165"
            r="84"
            fill={isDark ? '#C4161C' : '#DC2626'}
            fillOpacity={isDark ? '0.78' : '0.72'}
          />
          <circle
            cx="426"
            cy="150"
            r="68"
            fill={isDark ? '#190A10' : '#FADCDD'}
            fillOpacity="0.4"
          />
          {/* Distant horizon silhouettes */}
          <path
            d="M0 420 L0 315 L70 315 L70 280 L125 280 L125 325 L190 325 L190 250 L255 250 L255 310 L330 310 L330 270 L395 270 L395 318 L475 318 L475 242 L545 242 L545 305 L620 305 L620 268 L690 268 L690 322 L750 322 L750 288 L800 288 L800 420 Z"
            fill={isDark ? '#090B10' : '#334155'}
            fillOpacity={isDark ? '0.88' : '0.28'}
          />
        </svg>
      </div>
    );
  }

  if (backdropId === 'city-noir') {
    return (
      <div
        className={`w-full h-full relative overflow-hidden ${
          isDark
            ? 'bg-gradient-to-b from-[#0C1322] via-[#111A2D] to-[#090B10]'
            : 'bg-gradient-to-b from-[#E2E8F0] via-[#CBD5E1] to-[#F1F5F9]'
        }`}
      >
        <svg
          viewBox="0 0 800 420"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full select-none"
          aria-hidden="true"
        >
          <circle
            cx="590"
            cy="110"
            r="46"
            fill={isDark ? '#F59E0B' : '#F59E0B'}
            fillOpacity={isDark ? '0.25' : '0.35'}
          />
          <path
            d="M0 420 L0 275 L55 275 L55 205 L130 205 L130 290 L175 290 L175 160 L255 160 L255 265 L315 265 L315 190 L385 190 L385 285 L440 285 L440 135 L535 135 L535 270 L605 270 L605 210 L685 210 L685 295 L745 295 L745 235 L800 235 L800 420 Z"
            fill={isDark ? '#07090E' : '#1E293B'}
            fillOpacity={isDark ? '0.92' : '0.32'}
          />
          {/* Subtle lit windows */}
          <g fill="#FBBF24" fillOpacity={isDark ? '0.55' : '0.7'}>
            <rect x="195" y="185" width="12" height="16" rx="2" />
            <rect x="220" y="185" width="12" height="16" rx="2" />
            <rect x="195" y="218" width="12" height="16" rx="2" />
            <rect x="462" y="162" width="14" height="18" rx="2" />
            <rect x="492" y="162" width="14" height="18" rx="2" />
            <rect x="492" y="198" width="14" height="18" rx="2" />
            <rect x="630" y="232" width="12" height="16" rx="2" />
          </g>
        </svg>
      </div>
    );
  }

  if (backdropId === 'spotlight') {
    return (
      <div
        className={`w-full h-full relative overflow-hidden ${
          isDark ? 'bg-[#0D111A]' : 'bg-[#EEF1F6]'
        }`}
      >
        <svg
          viewBox="0 0 800 420"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full select-none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="spotBeam" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity={isDark ? '0.4' : '0.32'} />
              <stop offset="100%" stopColor="#C4161C" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <polygon points="340,0 460,0 660,420 140,420" fill="url(#spotBeam)" />
          <ellipse
            cx="400"
            cy="355"
            rx="210"
            ry="34"
            fill={isDark ? '#F59E0B' : '#C4161C'}
            fillOpacity={isDark ? '0.16' : '0.12'}
          />
        </svg>
      </div>
    );
  }

  // Default: faint pervasive watermark of Dialogue logo
  return (
    <div
      className={`w-full h-full flex items-center justify-center select-none ${
        compact ? 'p-2' : 'p-6 pb-28 sm:pb-24'
      }`}
    >
      <img
        src="/assets/aistudio/image84_3003da6f.png"
        alt="لوگوی دیالوگ"
        referrerPolicy="no-referrer"
        className={`${
          compact ? 'max-h-14' : 'max-h-56 sm:max-h-72'
        } w-auto object-contain transition-opacity opacity-20`}
      />
    </div>
  );
};
