'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Task,
  TaskStatus,
  TASK_STATUSES,
  STATUS_CONFIG,
} from '@/lib/types';
import TaskCard from './TaskCard';

interface TaskBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onTaskClick?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskBoard({ tasks, onStatusChange, onTaskClick, onEdit }: TaskBoardProps) {
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const tasksByStatus = TASK_STATUSES.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status);
      return acc;
    },
    {} as Record<TaskStatus, Task[]>
  );

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onStatusChange(taskId, status);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {TASK_STATUSES.map((status) => {
        const config = STATUS_CONFIG[status];
        const columnTasks = tasksByStatus[status];

        return (
          <div
            key={status}
            className={cn(
              'flex-shrink-0 w-72 bg-zinc-950 rounded-xl border transition-colors',
              dragOverColumn === status
                ? 'border-blue-500/50 bg-blue-500/5'
                : 'border-zinc-800'
            )}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-sm font-medium',
                    config.color
                  )}
                >
                  {config.label}
                </span>
              </div>
              <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                {columnTasks.length}
              </span>
            </div>

            {/* Column Body */}
            <div className="p-2 space-y-2 min-h-[200px]">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={onEdit || onTaskClick}
                  onStatusChange={onStatusChange}
                />
              ))}
              {columnTasks.length === 0 && (
                <div className="text-center text-xs text-zinc-600 py-8">
                  No tasks
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
