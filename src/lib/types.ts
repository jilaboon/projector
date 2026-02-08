// Task types

export const TASK_STATUSES = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_EVENT_TYPES = [
  'TASK_CREATED',
  'STATUS_CHANGED',
  'DESCRIPTION_UPDATED',
  'COMPLETED',
  'REOPENED',
] as const;
export type TaskEventType = (typeof TASK_EVENT_TYPES)[number];

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  labels: string | null; // JSON array
  dueDate: string | null;
  completedAt: string | null;
  estimateHours: number | null;
  blockedReason: string | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
}

export interface TaskActivityLog {
  id: string;
  taskId: string;
  eventType: TaskEventType;
  payload: string | null;
  timestamp: string;
}

export interface TaskWithActivity extends Task {
  activityLog: TaskActivityLog[];
}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  labels?: string[];
  dueDate?: string;
  estimateHours?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  labels?: string[];
  dueDate?: string | null;
  estimateHours?: number | null;
  blockedReason?: string | null;
}

export interface ProjectWithTaskCounts {
  id: string;
  name: string;
  description: string | null;
  productionUrl: string | null;
  stagingUrl: string | null;
  vercelProjectUrl: string | null;
  githubRepoUrl: string | null;
  status: string;
  techStack: string | null;
  tags: string | null;
  updatedAt: string;
  credentials: { id: string }[];
  _taskCounts?: {
    total: number;
    open: number;
    inProgress: number;
    blocked: number;
    overdue: number;
    lastActivityAt: string | null;
  };
}

// Status display config
export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bgColor: string }> = {
  BACKLOG: { label: 'Backlog', color: 'text-zinc-400', bgColor: 'bg-zinc-500/20' },
  TODO: { label: 'To Do', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  BLOCKED: { label: 'Blocked', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  DONE: { label: 'Done', color: 'text-green-400', bgColor: 'bg-green-500/20' },
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  LOW: { label: 'Low', color: 'text-zinc-400', bgColor: 'bg-zinc-500/20' },
  MEDIUM: { label: 'Medium', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  HIGH: { label: 'High', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  CRITICAL: { label: 'Critical', color: 'text-red-400', bgColor: 'bg-red-500/20' },
};
