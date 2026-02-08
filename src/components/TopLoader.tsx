'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export default function TopLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPathRef = useRef(pathname);
  const activeFetches = useRef(0);

  const startLoading = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setVisible(true);
    setLoading(true);
    setProgress(0);

    // Fast initial burst, then slow crawl
    let p = 0;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      p += Math.random() * (p < 30 ? 15 : p < 60 ? 6 : p < 80 ? 2 : 0.5);
      if (p > 92) p = 92;
      setProgress(p);
    }, 80);
  }, []);

  const completeLoading = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setProgress(100);
    setTimeout(() => {
      setLoading(false);
      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
    }, 200);
  }, []);

  // Intercept fetch to detect API calls
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : '';
      const isApi = url.startsWith('/api/');

      if (isApi) {
        activeFetches.current++;
        if (activeFetches.current === 1) startLoading();
      }

      try {
        const res = await originalFetch(...args);
        return res;
      } finally {
        if (isApi) {
          activeFetches.current--;
          if (activeFetches.current === 0) completeLoading();
        }
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [startLoading, completeLoading]);

  // Detect route changes
  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;
      // If no active fetches are running, flash a quick complete animation
      if (activeFetches.current === 0) {
        startLoading();
        setTimeout(completeLoading, 300);
      }
    }
  }, [pathname, startLoading, completeLoading]);

  // Intercept link clicks for instant feedback
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('/') && href !== pathname) {
        startLoading();
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [pathname, startLoading]);

  if (!visible) return null;

  return (
    <div className="top-loader-container" aria-hidden="true">
      <div
        className="top-loader-bar"
        style={{
          transform: `scaleX(${progress / 100})`,
          opacity: loading ? 1 : 0,
        }}
      />
      <div
        className="top-loader-glow"
        style={{
          transform: `scaleX(${progress / 100})`,
          opacity: loading ? 1 : 0,
        }}
      />
      {loading && progress > 5 && (
        <div
          className="top-loader-pulse"
          style={{ left: `${progress}%` }}
        />
      )}
    </div>
  );
}
