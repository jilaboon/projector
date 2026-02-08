'use client';

import { useState, useEffect, ReactNode } from 'react';
import { QuickCapture } from '@/components/QuickCapture';
import { TaskSearch } from '@/components/TaskSearch';

interface KeyboardShortcutsProps {
  children: ReactNode;
}

export function KeyboardShortcuts({ children }: KeyboardShortcutsProps) {
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [showTaskSearch, setShowTaskSearch] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        setShowQuickCapture((prev) => !prev);
        setShowTaskSearch(false);
      }

      if (mod && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setShowTaskSearch((prev) => !prev);
        setShowQuickCapture(false);
      }

      if (e.key === 'Escape') {
        setShowQuickCapture(false);
        setShowTaskSearch(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {children}
      <QuickCapture
        isOpen={showQuickCapture}
        onClose={() => setShowQuickCapture(false)}
      />
      <TaskSearch
        isOpen={showTaskSearch}
        onClose={() => setShowTaskSearch(false)}
      />
    </>
  );
}
