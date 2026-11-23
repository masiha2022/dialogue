import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center justify-center gap-2"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
      <span>حالت آفلاین فعال است — تمام سناریوها و توزیع نقش‌ها بدون نیاز به اینترنت در دسترس هستند.</span>
    </div>
  );
};
