'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import TaskCard from '@/components/TaskCard';
import { CheckSquare, Filter, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, TASK_STATUSES, TASK_PRIORITIES, STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/types';
import LoadingBar from '@/components/LoadingBar';

interface GroupedTasks {
  [projectName: string]: Task[];
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data: Task[] = await res.json();
        // Filter out DONE tasks - this is the "Open Work" view
        setTasks(data.filter((t) => t.status !== 'DONE'));
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  const stats = {
    open: tasks.filter((t) => t.status === 'BACKLOG' || t.status === 'TODO').length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    blocked: tasks.filter((t) => t.status === 'BLOCKED').length,
    overdue: tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE').length,
  };

  // Group tasks by project name
  const grouped: GroupedTasks = {};
  for (const task of filteredTasks) {
    const projectName = task.project?.name || 'Unknown Project';
    if (!grouped[projectName]) grouped[projectName] = [];
    grouped[projectName].push(task);
  }

  const toggleGroup = (name: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar onNewProject={() => {}} />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Open Work</h1>
              <p className="text-zinc-500 text-sm mt-1">
                All active tasks across your projects
              </p>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <CheckSquare className="text-blue-400" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.open}</p>
                  <p className="text-xs text-zinc-500">Open Tasks</p>
                </div>
              </div>
            </div>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Clock className="text-yellow-400" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
                  <p className="text-xs text-zinc-500">In Progress</p>
                </div>
              </div>
            </div>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <AlertTriangle className="text-red-400" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.blocked}</p>
                  <p className="text-xs text-zinc-500">Blocked</p>
                </div>
              </div>
            </div>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Clock className="text-orange-400" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.overdue}</p>
                  <p className="text-xs text-zinc-500">Overdue</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-4 mb-6">
            <Filter size={16} className="text-zinc-500" />
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
                className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                {TASK_STATUSES.filter((s) => s !== 'DONE').map((s) => (
                  <option key={s} value={s}>
                    {STATUS_CONFIG[s].label}
                  </option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
                className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priorities</option>
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_CONFIG[p].label}
                  </option>
                ))}
              </select>
            </div>
            {(statusFilter !== 'all' || priorityFilter !== 'all') && (
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setPriorityFilter('all');
                }}
                className="text-sm text-zinc-500 hover:text-white transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Tasks grouped by project */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingBar />
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <CheckSquare size={48} className="text-zinc-700 mb-4" />
              <h3 className="text-lg font-medium text-zinc-400 mb-2">
                No open tasks
              </h3>
              <p className="text-zinc-600">
                All caught up! Create tasks from individual project pages.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([projectName, projectTasks]) => (
                <div key={projectName} className="bg-zinc-900 rounded-xl border border-zinc-800">
                  <button
                    onClick={() => toggleGroup(projectName)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-800/50 transition-colors rounded-t-xl"
                  >
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-white">{projectName}</h3>
                      <span className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded-full">
                        {projectTasks.length}
                      </span>
                    </div>
                    <span className="text-zinc-500 text-sm">
                      {collapsedGroups.has(projectName) ? 'Show' : 'Hide'}
                    </span>
                  </button>
                  {!collapsedGroups.has(projectName) && (
                    <div className="px-6 pb-4 space-y-2">
                      {projectTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onStatusChange={handleStatusChange}
                          showProject={false}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
