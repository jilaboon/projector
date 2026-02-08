'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { Task, STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/types';
import Modal from './Modal';

interface TaskSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GroupedTasks {
  projectName: string;
  tasks: Task[];
}

export { TaskSearch };

export default function TaskSearch({ isOpen, onClose }: TaskSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Task[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/tasks/search?q=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch {
      // silently fail
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  const grouped: GroupedTasks[] = results.reduce<GroupedTasks[]>((acc, task) => {
    const projectName = task.project?.name || 'Unknown Project';
    const existing = acc.find((g) => g.projectName === projectName);
    if (existing) {
      existing.tasks.push(task);
    } else {
      acc.push({ projectName, tasks: [task] });
    }
    return acc;
  }, []);

  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-500/30 text-yellow-300 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search Tasks" size="lg">
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search tasks by title or description..."
            autoFocus
          />
          {isSearching && (
            <Loader2
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 animate-spin"
            />
          )}
        </div>

        {/* Results */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {grouped.map((group) => (
            <div key={group.projectName}>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                {group.projectName}
              </h3>
              <div className="space-y-1">
                {group.tasks.map((task) => {
                  const statusConfig = STATUS_CONFIG[task.status];
                  const priorityConfig = PRIORITY_CONFIG[task.priority];

                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">
                          {highlightMatch(task.title, query)}
                        </div>
                        {task.description && (
                          <div className="text-xs text-zinc-500 truncate mt-0.5">
                            {highlightMatch(task.description, query)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            statusConfig.bgColor,
                            statusConfig.color
                          )}
                        >
                          {statusConfig.label}
                        </span>
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            priorityConfig.bgColor,
                            priorityConfig.color
                          )}
                        >
                          {priorityConfig.label}
                        </span>
                        <span className="text-xs text-zinc-600">
                          {formatDate(task.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {query && !isSearching && results.length === 0 && (
            <div className="text-center text-sm text-zinc-500 py-8">
              No tasks found for &quot;{query}&quot;
            </div>
          )}

          {!query && (
            <div className="text-center text-sm text-zinc-500 py-8">
              Type to search across all tasks
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
