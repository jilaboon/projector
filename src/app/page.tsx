'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import ProjectForm from '@/components/ProjectForm';
import {
  FolderKanban,
  CheckSquare,
  CreditCard,
  FileText,
  AlertTriangle,
  Clock,
  ArrowRight,
  DollarSign,
  TrendingUp,
  Calendar,
  Activity,
} from 'lucide-react';
import { Task, STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/types';
import LoadingBar from '@/components/LoadingBar';
import { cn, formatDate, parseJsonArray } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  techStack: string | null;
  tags: string | null;
  updatedAt: string;
  productionUrl: string | null;
  stagingUrl: string | null;
  vercelProjectUrl: string | null;
  githubRepoUrl: string | null;
  credentials: { id: string }[];
}

interface Service {
  id: string;
  name: string;
  category: string | null;
  price: number;
  currency: string;
  billingCycle: string;
  status: string;
  nextBillingDate: string | null;
  remindBeforeRenew: boolean;
  autoRenew: boolean;
}

interface Proposal {
  id: string;
  customerName: string;
  customerCompany: string | null;
  title: string;
  estimatedPrice: number | null;
  currency: string;
  status: string;
  deadline: string | null;
  updatedAt: string;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetchProjects(), fetchTasks(), fetchServices(), fetchProposals()])
      .finally(() => setLoading(false));
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) setProjects(await res.json());
    } catch (e) { console.error(e); }
  };
  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) setTasks(await res.json());
    } catch (e) { console.error(e); }
  };
  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      if (res.ok) setServices(await res.json());
    } catch (e) { console.error(e); }
  };
  const fetchProposals = async () => {
    try {
      const res = await fetch('/api/proposals');
      if (res.ok) setProposals(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleCreateProject = async (data: {
    name: string; description: string; productionUrl: string; stagingUrl: string;
    vercelProjectUrl: string; githubRepoUrl: string; techStack: string[]; tags: string[]; status: string;
  }) => {
    setSaving(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (res.ok) { setShowNewProjectModal(false); fetchProjects(); }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  // Computed stats
  const now = new Date();

  const projectStats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    inDev: projects.filter(p => p.status === 'in-development').length,
  };

  const openTasks = tasks.filter(t => t.status !== 'DONE');
  const taskStats = {
    total: openTasks.length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    blocked: tasks.filter(t => t.status === 'BLOCKED').length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE').length,
    done: tasks.filter(t => t.status === 'DONE').length,
  };

  const activeServices = services.filter(s => s.status === 'active');
  const monthlySpend = activeServices.reduce((sum, s) => {
    if (s.billingCycle === 'monthly') return sum + s.price;
    if (s.billingCycle === 'yearly') return sum + s.price / 12;
    return sum;
  }, 0);
  const renewalAlerts = services.filter(s => s.autoRenew && s.remindBeforeRenew && s.status === 'active');

  const proposalStats = {
    pending: proposals.filter(p => ['draft', 'sent'].includes(p.status)).length,
    accepted: proposals.filter(p => p.status === 'accepted').length,
    inProgress: proposals.filter(p => p.status === 'in-progress').length,
    totalValue: proposals.filter(p => p.status === 'accepted').reduce((s, p) => s + (p.estimatedPrice || 0), 0),
  };

  // Urgent items: overdue tasks + blocked tasks + renewal alerts + pending proposals with deadlines
  const urgentTasks = tasks
    .filter(t => (t.status === 'BLOCKED') || (t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'))
    .sort((a, b) => {
      if (a.status === 'BLOCKED' && b.status !== 'BLOCKED') return -1;
      if (a.status !== 'BLOCKED' && b.status === 'BLOCKED') return 1;
      return 0;
    })
    .slice(0, 5);

  // Recent tasks (most recently updated, non-DONE)
  const recentTasks = [...openTasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  // Upcoming deadlines (tasks + proposals)
  const upcomingDeadlines: { type: string; title: string; date: Date; projectName?: string; link: string }[] = [];
  tasks.filter(t => t.dueDate && t.status !== 'DONE' && new Date(t.dueDate) >= now).forEach(t => {
    upcomingDeadlines.push({
      type: 'task',
      title: t.title,
      date: new Date(t.dueDate!),
      projectName: t.project?.name,
      link: `/projects/${t.projectId}`,
    });
  });
  proposals.filter(p => p.deadline && !['completed', 'rejected'].includes(p.status)).forEach(p => {
    upcomingDeadlines.push({
      type: 'proposal',
      title: p.title,
      date: new Date(p.deadline!),
      projectName: p.customerName,
      link: '/proposals',
    });
  });
  upcomingDeadlines.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Projects with most open tasks
  const projectTaskMap: Record<string, { name: string; open: number; blocked: number; id: string }> = {};
  openTasks.forEach(t => {
    const name = t.project?.name || 'Unknown';
    if (!projectTaskMap[t.projectId]) {
      projectTaskMap[t.projectId] = { name, open: 0, blocked: 0, id: t.projectId };
    }
    projectTaskMap[t.projectId].open++;
    if (t.status === 'BLOCKED') projectTaskMap[t.projectId].blocked++;
  });
  const projectsByWorkload = Object.values(projectTaskMap)
    .sort((a, b) => b.open - a.open)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex h-screen bg-zinc-950">
        <Sidebar onNewProject={() => setShowNewProjectModal(true)} />
        <main className="flex-1 flex items-center justify-center">
          <LoadingBar />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar onNewProject={() => setShowNewProjectModal(true)} />

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Command Center</h1>
              <p className="text-zinc-500 text-sm mt-1">
                360&deg; overview of everything
              </p>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">

          {/* === TOP-LEVEL STATS === */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/projects" className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 hover:border-zinc-700 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <FolderKanban className="text-blue-400" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{projectStats.total}</p>
                  <p className="text-xs text-zinc-500">Projects <span className="text-green-400">({projectStats.active} active)</span></p>
                </div>
              </div>
            </Link>
            <Link href="/tasks" className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 hover:border-zinc-700 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <CheckSquare className="text-yellow-400" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{taskStats.total}</p>
                  <p className="text-xs text-zinc-500">Open Tasks <span className="text-green-400">({taskStats.done} done)</span></p>
                </div>
              </div>
            </Link>
            <Link href="/services" className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 hover:border-zinc-700 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <DollarSign className="text-green-400" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">${monthlySpend.toFixed(0)}<span className="text-sm text-zinc-500">/mo</span></p>
                  <p className="text-xs text-zinc-500">{activeServices.length} active services</p>
                </div>
              </div>
            </Link>
            <Link href="/proposals" className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 hover:border-zinc-700 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <FileText className="text-purple-400" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{proposalStats.pending}</p>
                  <p className="text-xs text-zinc-500">Pending Proposals <span className="text-green-400">({proposalStats.accepted} won)</span></p>
                </div>
              </div>
            </Link>
          </div>

          {/* === ATTENTION REQUIRED === */}
          {(urgentTasks.length > 0 || renewalAlerts.length > 0) && (
            <div className="bg-red-500/5 rounded-xl border border-red-500/20 p-6">
              <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertTriangle size={16} />
                Needs Attention
              </h2>
              <div className="space-y-2">
                {urgentTasks.map(task => (
                  <Link
                    key={task.id}
                    href={`/projects/${task.projectId}`}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        task.status === 'BLOCKED' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                      )}>
                        {task.status === 'BLOCKED' ? 'BLOCKED' : 'OVERDUE'}
                      </span>
                      <span className="text-sm text-white">{task.title}</span>
                      <span className="text-xs text-zinc-500">{task.project?.name}</span>
                    </div>
                    {task.dueDate && (
                      <span className="text-xs text-zinc-500">{formatDate(task.dueDate)}</span>
                    )}
                  </Link>
                ))}
                {renewalAlerts.map(svc => (
                  <Link
                    key={svc.id}
                    href="/services"
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">RENEWAL</span>
                      <span className="text-sm text-white">{svc.name}</span>
                    </div>
                    {svc.nextBillingDate && (
                      <span className="text-xs text-zinc-500">{formatDate(svc.nextBillingDate)}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* === TWO-COLUMN LAYOUT === */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* LEFT: Recent Tasks */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Activity size={16} />
                  Recent Tasks
                </h2>
                <Link href="/tasks" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  View all <ArrowRight size={12} />
                </Link>
              </div>
              {recentTasks.length === 0 ? (
                <p className="text-zinc-500 text-sm">No open tasks yet.</p>
              ) : (
                <div className="space-y-2">
                  {recentTasks.map(task => (
                    <Link
                      key={task.id}
                      href={`/projects/${task.projectId}`}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full whitespace-nowrap',
                          STATUS_CONFIG[task.status]?.bgColor,
                          STATUS_CONFIG[task.status]?.color,
                        )}>
                          {STATUS_CONFIG[task.status]?.label}
                        </span>
                        <span className="text-sm text-white truncate">{task.title}</span>
                      </div>
                      <span className="text-xs text-zinc-500 whitespace-nowrap ml-2">{task.project?.name}</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Task breakdown mini-bar */}
              {tasks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <div className="flex gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> {taskStats.inProgress} in progress</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> {taskStats.blocked} blocked</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" /> {taskStats.overdue} overdue</span>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Upcoming Deadlines */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Calendar size={16} />
                Upcoming Deadlines
              </h2>
              {upcomingDeadlines.length === 0 ? (
                <p className="text-zinc-500 text-sm">No upcoming deadlines.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingDeadlines.slice(0, 8).map((item, i) => {
                    const daysUntil = Math.ceil((item.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <Link
                        key={i}
                        href={item.link}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-800 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full whitespace-nowrap',
                            item.type === 'task' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                          )}>
                            {item.type === 'task' ? 'Task' : 'Proposal'}
                          </span>
                          <span className="text-sm text-white truncate">{item.title}</span>
                          {item.projectName && <span className="text-xs text-zinc-500 hidden md:inline">{item.projectName}</span>}
                        </div>
                        <span className={cn(
                          'text-xs whitespace-nowrap ml-2',
                          daysUntil <= 3 ? 'text-red-400' : daysUntil <= 7 ? 'text-yellow-400' : 'text-zinc-500'
                        )}>
                          {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* LEFT: Projects by Workload */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp size={16} />
                  Projects by Workload
                </h2>
                <Link href="/projects" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  All projects <ArrowRight size={12} />
                </Link>
              </div>
              {projectsByWorkload.length === 0 ? (
                <p className="text-zinc-500 text-sm">No projects with tasks yet.</p>
              ) : (
                <div className="space-y-3">
                  {projectsByWorkload.map(p => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      <span className="text-sm text-white">{p.name}</span>
                      <div className="flex items-center gap-3">
                        {p.blocked > 0 && (
                          <span className="text-xs text-red-400">{p.blocked} blocked</span>
                        )}
                        <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                          {p.open} open
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Financial Snapshot */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign size={16} />
                  Financial Snapshot
                </h2>
                <Link href="/services" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  Services <ArrowRight size={12} />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">Monthly Spend</p>
                  <p className="text-lg font-bold text-white">${monthlySpend.toFixed(0)}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">Yearly Spend</p>
                  <p className="text-lg font-bold text-white">${(monthlySpend * 12).toFixed(0)}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">Proposal Pipeline</p>
                  <p className="text-lg font-bold text-purple-400">
                    {new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(
                      proposals.filter(p => ['draft', 'sent', 'in-progress'].includes(p.status)).reduce((s, p) => s + (p.estimatedPrice || 0), 0)
                    )}
                  </p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">Won Revenue</p>
                  <p className="text-lg font-bold text-green-400">
                    {new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(proposalStats.totalValue)}
                  </p>
                </div>
              </div>
              {activeServices.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 mb-2">Top services by cost:</p>
                  {[...activeServices]
                    .sort((a, b) => {
                      const aMo = a.billingCycle === 'yearly' ? a.price / 12 : a.price;
                      const bMo = b.billingCycle === 'yearly' ? b.price / 12 : b.price;
                      return bMo - aMo;
                    })
                    .slice(0, 3)
                    .map(s => (
                      <div key={s.id} className="flex items-center justify-between text-sm py-1">
                        <span className="text-zinc-400">{s.name}</span>
                        <span className="text-white">
                          ${(s.billingCycle === 'yearly' ? s.price / 12 : s.price).toFixed(0)}/mo
                        </span>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      <Modal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        title="Create New Project"
        size="lg"
      >
        <ProjectForm
          onSubmit={handleCreateProject}
          onCancel={() => setShowNewProjectModal(false)}
          isLoading={saving}
        />
      </Modal>
    </div>
  );
}
