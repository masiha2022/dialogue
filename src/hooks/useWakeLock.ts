import { useEffect, useRef, useState } from 'react';

interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
  addEventListener?: (type: 'release', listener: () => void) => void;
}

interface NavigatorWithWakeLock {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinelLike>;
  };
}

/**
 * Keeps the mobile screen awake during Role Reveal and Moderator Console sessions
 * using the standard Screen Wake Lock API, gracefully ignoring unsupported browsers.
 */
export function useWakeLock(enabled: boolean) {
  const [isActive, setIsActive] = useState(false);
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    const nav = typeof navigator !== 'undefined' ? (navigator as unknown as NavigatorWithWakeLock) : null;
    if (!enabled || !nav?.wakeLock?.request) {
      if (sentinelRef.current && !sentinelRef.current.released) {
        sentinelRef.current.release().catch(() => {});
      }
      sentinelRef.current = null;
      setIsActive(false);
      return;
    }

    let cancelled = false;

    const acquire = async () => {
      try {
        if (document.visibilityState !== 'visible' || cancelled) return;
        const sentinel = await nav.wakeLock!.request('screen');
        if (cancelled) {
          sentinel.release().catch(() => {});
          return;
        }
        sentinelRef.current = sentinel;
        setIsActive(true);
        sentinel.addEventListener?.('release', () => {
          if (!cancelled) setIsActive(false);
        });
      } catch {
        if (!cancelled) setIsActive(false);
      }
    };

    void acquire();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && enabled && !cancelled) {
        void acquire();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      if (sentinelRef.current && !sentinelRef.current.released) {
        sentinelRef.current.release().catch(() => {});
      }
      sentinelRef.current = null;
      setIsActive(false);
    };
  }, [enabled]);

  return isActive;
}
