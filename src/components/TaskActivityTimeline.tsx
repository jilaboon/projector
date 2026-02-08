'use client';

import { Plus, ArrowRight, Pencil, CheckCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskActivityLog } from '@/lib/types';

interface TaskActivityTimelineProps {
  activities: TaskActivityLog[];
}

function getEventConfig(eventType: string) {
  switch (eventType) {
    case 'TASK_CREATED':
      return { icon: Plus, description: 'Task created', color: 'text-blue-400' };
    case 'STATUS_CHANGED':
      return { icon: ArrowRight, description: 'Status changed', color: 'text-yellow-400' };
    case 'DESCRIPTION_UPDATED':
      return { icon: Pencil, description: 'Description updated', color: 'text-purple-400' };
    case 'COMPLETED':
      return { icon: CheckCircle, description: 'Task completed', color: 'text-green-400' };
    case 'REOPENED':
      return { icon: RefreshCw, description: 'Task reopened', color: 'text-orange-400' };
    default:
      return { icon: Plus, description: eventType, color: 'text-zinc-400' };
  }
}

function getDescription(eventType: string, payload: string | null): string {
  const config = getEventConfig(eventType);

  if (eventType === 'STATUS_CHANGED' && payload) {
    try {
      const parsed = JSON.parse(payload);
      if (parsed.from && parsed.to) {
        return `Status changed from ${parsed.from} to ${parsed.to}`;
      }
    } catch {
      // fall through to default
    }
  }

  return config.description;
}

function relativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TaskActivityTimeline({ activities }: TaskActivityTimelineProps) {
  const sorted = [...activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-zinc-500 italic">No activity yet.</p>
    );
  }

  return (
    <div className="space-y-0">
      {sorted.map((activity, index) => {
        const config = getEventConfig(activity.eventType);
        const Icon = config.icon;
        const isLast = index === sorted.length - 1;

        return (
          <div key={activity.id} className="flex gap-3">
            {/* Timeline line and dot */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800',
                  config.color
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-zinc-700" />
              )}
            </div>

            {/* Content */}
            <div className={cn('pb-4', isLast && 'pb-0')}>
              <p className="text-sm text-zinc-300">
                {getDescription(activity.eventType, activity.payload)}
              </p>
              <p className="text-xs text-zinc-500">
                {relativeTime(activity.timestamp)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
