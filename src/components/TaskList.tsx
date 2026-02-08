'use client';

import { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  Calendar,
  Clock,
  Filter,
  X,
} from 'lucide-react';
import { cn, formatDate, parseJsonArray } from '@/lib/utils';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TASK_STATUSES,
  TASK_PRIORITIES,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
} from '@/lib/types';

interface TaskListProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

type SortField = 'priority' | 'dueDate' | 'createdAt' | 'title';
type SortDir = 'asc' | 'desc';

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export default function TaskList({ tasks, onTaskClick, onStatusChange, onEdit }: TaskListProps) {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | ''>('');
  const [filterLabel, setFilterLabel] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...tasks];

    if (filterStatus) {
      result = result.filter((t) => t.status === filterStatus);
    }
    if (filterPriority) {
      result = result.filter((t) => t.priority === filterPriority);
    }
    if (filterLabel) {
      result = result.filter((t) => {
        const labels = parseJsonArray(t.labels);
        return labels.some((l) => l.toLowerCase().includes(filterLabel.toLowerCase()));
      });
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'priority':
          cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
          break;
        case 'dueDate': {
          const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          cmp = da - db;
          break;
        }
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [tasks, sortField, sortDir, filterStatus, filterPriority, filterLabel]);

  const hasActiveFilters = filterStatus || filterPriority || filterLabel;

  return (
    <div>
      {/* Filter Bar */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
            hasActiveFilters
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-zinc-800 text-zinc-400 hover:text-white'
          )}
        >
          <Filter size={14} />
          Filters
          {hasActiveFilters && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFilterStatus('');
                setFilterPriority('');
                setFilterLabel('');
              }}
              className="ml-1 hover:text-white"
            >
              <X size={12} />
            </button>
          )}
        </button>
        <span className="text-xs text-zinc-500">
          {filteredAndSorted.length} task{filteredAndSorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {showFilters && (
        <div className="flex gap-3 mb-4 p-3 bg-zinc-900 rounded-lg border border-zinc-800">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TaskStatus | '')}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as TaskPriority | '')}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priorities</option>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
            ))}
          </select>
          <input
            type="text"
            value={filterLabel}
            onChange={(e) => setFilterLabel(e.target.value)}
            placeholder="Filter by label..."
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Table */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => toggleSort('title')}
                  className="flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white uppercase tracking-wider"
                >
                  Title
                  {sortField === 'title' && <ArrowUpDown size={12} />}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Status
                </span>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => toggleSort('priority')}
                  className="flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white uppercase tracking-wider"
                >
                  Priority
                  {sortField === 'priority' && <ArrowUpDown size={12} />}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Labels
                </span>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => toggleSort('dueDate')}
                  className="flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white uppercase tracking-wider"
                >
                  Due Date
                  {sortField === 'dueDate' && <ArrowUpDown size={12} />}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => toggleSort('createdAt')}
                  className="flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white uppercase tracking-wider"
                >
                  Created
                  {sortField === 'createdAt' && <ArrowUpDown size={12} />}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map((task) => {
              const statusConfig = STATUS_CONFIG[task.status];
              const priorityConfig = PRIORITY_CONFIG[task.priority];
              const labels = parseJsonArray(task.labels);
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

              return (
                <tr
                  key={task.id}
                  onClick={() => (onEdit || onTaskClick)?.(task)}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm text-white">{task.title}</span>
                    {task.project && (
                      <span className="block text-xs text-zinc-500 mt-0.5">
                        {task.project.name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        statusConfig.bgColor,
                        statusConfig.color
                      )}
                    >
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        priorityConfig.bgColor,
                        priorityConfig.color
                      )}
                    >
                      {priorityConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {labels.slice(0, 2).map((label) => (
                        <span
                          key={label}
                          className="text-xs px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded"
                        >
                          {label}
                        </span>
                      ))}
                      {labels.length > 2 && (
                        <span className="text-xs text-zinc-500">
                          +{labels.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {task.dueDate ? (
                      <span
                        className={cn(
                          'flex items-center gap-1 text-xs',
                          isOverdue ? 'text-red-400' : 'text-zinc-400'
                        )}
                      >
                        <Calendar size={12} />
                        {formatDate(task.dueDate)}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-600">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-zinc-500">
                      {formatDate(task.createdAt)}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filteredAndSorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-500">
                  No tasks found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
