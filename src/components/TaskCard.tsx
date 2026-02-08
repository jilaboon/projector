'use client';

import { useState } from 'react';
import {
  Calendar,
  Clock,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import { cn, formatDate, parseJsonArray } from '@/lib/utils';
import {
  Task,
  TaskStatus,
  TASK_STATUSES,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
} from '@/lib/types';

interface TaskCardProps {
  task: Task;
  onClick?: (task: Task) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  showProject?: boolean;
}

export default function TaskCard({ task, onClick, onStatusChange, showProject = true }: TaskCardProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const labels = parseJsonArray(task.labels);
  const statusConfig = STATUS_CONFIG[task.status];
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div
      className="bg-zinc-900 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all p-4 cursor-pointer group"
      onClick={() => onClick?.(task)}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('taskId', task.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
    >
      {/* Header: Title + Status dropdown */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-2 flex-1">
          {task.title}
        </h4>
        <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={cn(
              'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
              statusConfig.bgColor,
              statusConfig.color
            )}
          >
            {statusConfig.label}
            <ChevronDown size={12} />
          </button>
          {showStatusMenu && (
            <div className="absolute right-0 mt-1 w-36 bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 py-1 z-20">
              {TASK_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onStatusChange?.(task.id, s);
                    setShowStatusMenu(false);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-700 transition-colors',
                    s === task.status ? STATUS_CONFIG[s].color : 'text-zinc-300'
                  )}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Priority badge */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full',
            priorityConfig.bgColor,
            priorityConfig.color
          )}
        >
          {priorityConfig.label}
        </span>
        {showProject && task.project && (
          <span className="text-xs text-zinc-500 truncate">
            {task.project.name}
          </span>
        )}
      </div>

      {/* Blocked reason */}
      {task.status === 'BLOCKED' && task.blockedReason && (
        <div className="flex items-start gap-1.5 mb-2 text-xs text-red-400 bg-red-500/10 rounded px-2 py-1.5">
          <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{task.blockedReason}</span>
        </div>
      )}

      {/* Labels */}
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {labels.slice(0, 3).map((label) => (
            <span
              key={label}
              className="text-xs px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded"
            >
              {label}
            </span>
          ))}
          {labels.length > 3 && (
            <span className="text-xs px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded">
              +{labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer: Due date + estimate */}
      <div className="flex items-center gap-3 pt-2 border-t border-zinc-800">
        {task.dueDate && (
          <span
            className={cn(
              'flex items-center gap-1 text-xs',
              isOverdue ? 'text-red-400' : 'text-zinc-500'
            )}
          >
            <Calendar size={12} />
            {formatDate(task.dueDate)}
          </span>
        )}
        {task.estimateHours && (
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            <Clock size={12} />
            {task.estimateHours}h
          </span>
        )}
      </div>
    </div>
  );
}
