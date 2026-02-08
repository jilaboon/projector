'use client';

import { useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';

// Global loader state outside React to avoid race conditions
let loaderState = { loading: false, progress: 0, visible: false };
let listeners: Array<() => void> = [];
let progressTimer: ReturnType<typeof setInterval> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let activeFetches = 0;
let fetchPatched = false;

function notify() {
  loaderState = { ...loaderState };
  listeners.forEach((l) => l());
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

// Patch fetch globally ONCE, immediately (not in useEffect)
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

export default function TopLoader() {
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Patch fetch on first render (synchronous, before effects)
  patchFetch();

  // Detect route changes via link clicks
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

  // Complete on pathname change
  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;
      if (activeFetches === 0 && !state.loading) {
        // Quick flash for instant navigations
        startLoading();
        setTimeout(completeLoading, 400);
      }
    }
  }, [pathname, state.loading]);

  if (!state.visible) return null;

  return (
    <div className="top-loader-container" aria-hidden="true">
      <div
        className="top-loader-bar"
        style={{
          transform: `scaleX(${state.progress / 100})`,
          opacity: state.loading ? 1 : 0,
        }}
      />
      <div
        className="top-loader-glow"
        style={{
          transform: `scaleX(${state.progress / 100})`,
          opacity: state.loading ? 0.7 : 0,
        }}
      />
      {state.loading && state.progress > 3 && (
        <div
          className="top-loader-pulse"
          style={{ left: `${state.progress}%` }}
        />
      )}
    </div>
  );
}
