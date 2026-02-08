'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';

// Global state outside React to avoid race conditions
let loaderState = { loading: false, progress: 0, visible: false };
let listeners: Array<() => void> = [];
let progressTimer: ReturnType<typeof setInterval> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let activeFetches = 0;
let fetchPatched = false;

function notify() {
  loaderState = { ...loaderState };
  for (const l of listeners) l();
}

function startLoading() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  loaderState.visible = true;
  loaderState.loading = true;
  loaderState.progress = 0;
  notify();

  if (progressTimer) clearInterval(progressTimer);
  let p = 0;
  progressTimer = setInterval(() => {
    p += Math.random() * (p < 20 ? 18 : p < 50 ? 8 : p < 80 ? 3 : 0.5);
    if (p > 92) p = 92;
    loaderState.progress = p;
    notify();
  }, 60);
}

function completeLoading() {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
  loaderState.progress = 100;
  notify();

  setTimeout(() => {
    loaderState.loading = false;
    notify();
    hideTimer = setTimeout(() => {
      loaderState.visible = false;
      loaderState.progress = 0;
      notify();
    }, 400);
  }, 250);
}

function patchFetch() {
  if (fetchPatched || typeof window === 'undefined') return;
  fetchPatched = true;
  const originalFetch = window.fetch;

  window.fetch = async function (...args: Parameters<typeof fetch>) {
    const url =
      typeof args[0] === 'string'
        ? args[0]
        : args[0] instanceof Request
          ? args[0].url
          : '';
    const isApi = url.startsWith('/api/');

    if (isApi) {
      activeFetches++;
      if (activeFetches === 1) startLoading();
    }

    try {
      return await originalFetch.apply(this, args);
    } finally {
      if (isApi) {
        activeFetches = Math.max(0, activeFetches - 1);
        if (activeFetches === 0) completeLoading();
      }
    }
  };
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot() {
  return loaderState;
}

const GRADIENT =
  'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #f97316, #ec4899, #8b5cf6, #3b82f6)';

export default function TopLoader() {
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  patchFetch();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('/') && href !== pathname) {
        startLoading();
      }
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;
      if (activeFetches === 0 && !state.loading) {
        startLoading();
        setTimeout(completeLoading, 400);
      }
    }
  }, [pathname, state.loading]);

  if (!state.visible) return null;

  return (
    <>
      <style>{`
        @keyframes topLoaderGradient {
          0% { background-position: 0% 50%; }
          100% { background-position: 400% 50%; }
        }
        @keyframes topLoaderShimmer {
          0% { opacity: 0.5; transform: translateX(-50%) scaleX(0.6); }
          100% { opacity: 1; transform: translateX(-50%) scaleX(1.8); }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          zIndex: 99999,
          pointerEvents: 'none',
        }}
      >
        {/* Main bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: GRADIENT,
            backgroundSize: '400% 100%',
            animation: 'topLoaderGradient 1.2s linear infinite',
            transformOrigin: 'left',
            transform: `scaleX(${state.progress / 100})`,
            opacity: state.loading ? 1 : 0,
            transition: 'transform 0.15s ease-out, opacity 0.4s ease',
            boxShadow:
              '0 0 10px rgba(139, 92, 246, 0.6), 0 0 24px rgba(236, 72, 153, 0.4)',
          }}
        />
        {/* Glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '18px',
            background: GRADIENT,
            backgroundSize: '400% 100%',
            animation: 'topLoaderGradient 1.2s linear infinite',
            transformOrigin: 'left',
            transform: `scaleX(${state.progress / 100})`,
            opacity: state.loading ? 0.6 : 0,
            filter: 'blur(12px)',
            transition: 'transform 0.15s ease-out, opacity 0.4s ease',
          }}
        />
        {/* Pulse at leading edge */}
        {state.loading && state.progress > 3 && (
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              left: `${state.progress}%`,
              width: '120px',
              height: '12px',
              borderRadius: '50%',
              background:
                'radial-gradient(ellipse, rgba(236, 72, 153, 0.9), rgba(139, 92, 246, 0.4), transparent)',
              filter: 'blur(4px)',
              animation: 'topLoaderShimmer 0.6s ease-in-out infinite alternate',
              transform: 'translateX(-50%)',
            }}
          />
        )}
      </div>
    </>
  );
}
