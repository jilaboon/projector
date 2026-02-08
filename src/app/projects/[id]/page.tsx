'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Globe,
  Github,
  ExternalLink,
  Pencil,
  Key,
  Plus,
  FileText,
  Code,
  Server,
  Save,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  CheckSquare,
  LayoutGrid,
  List,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import ProjectForm from '@/components/ProjectForm';
import CredentialCard from '@/components/CredentialCard';
import CredentialForm from '@/components/CredentialForm';
import EnvVariableForm from '@/components/EnvVariableForm';
import TaskBoard from '@/components/TaskBoard';
import TaskList from '@/components/TaskList';
import TaskForm from '@/components/TaskForm';
import { parseJsonArray, cn } from '@/lib/utils';
import { Task, TaskStatus, CreateTaskInput, UpdateTaskInput } from '@/lib/types';
import LoadingBar from '@/components/LoadingBar';

interface Credential {
  id: string;
  label: string;
  username: string | null;
  password: string | null;
  url: string | null;
  notes: string | null;
}

interface EnvVariable {
  id: string;
  environment: string;
  key: string;
  value: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  productionUrl: string | null;
  stagingUrl: string | null;
  vercelProjectUrl: string | null;
  githubRepoUrl: string | null;
  readme: string | null;
  architecture: string | null;
  notes: string | null;
  techStack: string | null;
  tags: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

type Tab = 'overview' | 'readme' | 'architecture' | 'credentials' | 'env' | 'tasks';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [envVariables, setEnvVariables] = useState<EnvVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [editingEnv, setEditingEnv] = useState<EnvVariable | null>(null);
  const [saving, setSaving] = useState(false);

  // Task state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskView, setTaskView] = useState<'board' | 'list'>('board');

  // Documentation editing state
  const [editingReadme, setEditingReadme] = useState(false);
  const [editingArch, setEditingArch] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [readmeContent, setReadmeContent] = useState('');
  const [archContent, setArchContent] = useState('');
  const [notesContent, setNotesContent] = useState('');

  useEffect(() => {
    const minDelay = new Promise(r => setTimeout(r, 600));
    Promise.all([fetchProject(), fetchCredentials(), fetchEnvVariables(), fetchTasks(), minDelay])
      .finally(() => setLoading(false));
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        setReadmeContent(data.readme || '');
        setArchContent(data.architecture || '');
        setNotesContent(data.notes || '');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchCredentials = async () => {
    try {
      const res = await fetch(`/api/projects/${id}/credentials`);
      if (res.ok) {
        const data = await res.json();
        setCredentials(data);
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
    }
  };

  const fetchEnvVariables = async () => {
    try {
      const res = await fetch(`/api/projects/${id}/env`);
      if (res.ok) {
        const data = await res.json();
        setEnvVariables(data);
      }
    } catch (error) {
      console.error('Error fetching env variables:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/projects/${id}/tasks`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleCreateTask = async (data: CreateTaskInput) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowTaskModal(false);
        fetchTasks();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTask = async (taskId: string, data: UpdateTaskInput) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowTaskModal(false);
        setEditingTask(null);
        fetchTasks();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleTaskStatusChange = async (taskId: string, status: TaskStatus) => {
    await handleUpdateTask(taskId, { status });
  };

  const handleUpdateProject = async (data: {
    name: string;
    description: string;
    productionUrl: string;
    stagingUrl: string;
    vercelProjectUrl: string;
    githubRepoUrl: string;
    techStack: string[];
    tags: string[];
    status: string;
  }) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          readme: project?.readme,
          architecture: project?.architecture,
          notes: project?.notes,
        }),
      });
      if (res.ok) {
        setShowEditModal(false);
        fetchProject();
      }
    } catch (error) {
      console.error('Error updating project:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDocumentation = async (field: 'readme' | 'architecture' | 'notes', content: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...project,
          techStack: parseJsonArray(project?.techStack || null),
          tags: parseJsonArray(project?.tags || null),
          [field]: content,
        }),
      });
      if (res.ok) {
        fetchProject();
        if (field === 'readme') setEditingReadme(false);
        if (field === 'architecture') setEditingArch(false);
        if (field === 'notes') setEditingNotes(false);
      }
    } catch (error) {
      console.error('Error saving documentation:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCredential = async (data: {
    id?: string;
    label: string;
    username: string;
    password: string;
    url: string;
    notes: string;
  }) => {
    setSaving(true);
    try {
      const method = data.id ? 'PUT' : 'POST';
      const res = await fetch(`/api/projects/${id}/credentials`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowCredentialModal(false);
        setEditingCredential(null);
        fetchCredentials();
      }
    } catch (error) {
      console.error('Error saving credential:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCredential = async (credentialId: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) return;
    try {
      await fetch(`/api/projects/${id}/credentials?credentialId=${credentialId}`, {
        method: 'DELETE',
      });
      fetchCredentials();
    } catch (error) {
      console.error('Error deleting credential:', error);
    }
  };

  const handleSaveEnvVariable = async (data: {
    id?: string;
    environment: string;
    key: string;
    value: string;
  }) => {
    setSaving(true);
    try {
      const method = data.id ? 'PUT' : 'POST';
      const res = await fetch(`/api/projects/${id}/env`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowEnvModal(false);
        setEditingEnv(null);
        fetchEnvVariables();
      }
    } catch (error) {
      console.error('Error saving env variable:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEnvVariable = async (envId: string) => {
    if (!confirm('Are you sure you want to delete this environment variable?')) return;
    try {
      await fetch(`/api/projects/${id}/env?envId=${envId}`, {
        method: 'DELETE',
      });
      fetchEnvVariables();
    } catch (error) {
      console.error('Error deleting env variable:', error);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <FileText size={16} /> },
    { id: 'readme', label: 'README', icon: <FileText size={16} /> },
    { id: 'architecture', label: 'Architecture', icon: <Code size={16} /> },
    { id: 'credentials', label: 'Credentials', icon: <Key size={16} /> },
    { id: 'env', label: 'Environment', icon: <Server size={16} /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={16} /> },
  ];

  if (loading) {
    return (
      <div className="flex h-screen bg-zinc-950">
        <Sidebar onNewProject={() => router.push('/')} />
        <main className="flex-1 flex items-center justify-center">
          <LoadingBar label="Loading project..." />
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen bg-zinc-950">
        <Sidebar onNewProject={() => router.push('/')} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-zinc-500">Project not found</div>
        </main>
      </div>
    );
  }

  const techStack = parseJsonArray(project.techStack);
  const tags = parseJsonArray(project.tags);

  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar onNewProject={() => router.push('/')} />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800">
          <div className="px-8 py-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm mb-4 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                {project.description && (
                  <p className="text-zinc-500 mt-1">{project.description}</p>
                )}
                <div className="flex items-center gap-3 mt-3">
                  {project.productionUrl && (
                    <a
                      href={project.productionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                      <Globe size={14} />
                      Live
                    </a>
                  )}
                  {project.githubRepoUrl && (
                    <a
                      href={project.githubRepoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                      <Github size={14} />
                      GitHub
                    </a>
                  )}
                  {project.vercelProjectUrl && (
                    <a
                      href={project.vercelProjectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                      <ExternalLink size={14} />
                      Vercel
                    </a>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
              >
                <Pencil size={16} />
                Edit
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-8 flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-zinc-500 hover:text-white'
                )}
              >
                {tab.icon}
                {tab.label}
                {tab.id === 'credentials' && credentials.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-zinc-800 rounded">
                    {credentials.length}
                  </span>
                )}
                {tab.id === 'env' && envVariables.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-zinc-800 rounded">
                    {envVariables.length}
                  </span>
                )}
                {tab.id === 'tasks' && tasks.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-zinc-800 rounded">
                    {tasks.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </header>

        <div className="p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Tech Stack */}
              {techStack.length > 0 && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                    Tech Stack
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Notes */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                    Quick Notes
                  </h3>
                  {!editingNotes ? (
                    <button
                      onClick={() => setEditingNotes(true)}
                      className="text-zinc-500 hover:text-white transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSaveDocumentation('notes', notesContent)}
                      disabled={saving}
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Save size={16} />
                      Save
                    </button>
                  )}
                </div>
                {editingNotes ? (
                  <textarea
                    value={notesContent}
                    onChange={(e) => setNotesContent(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] font-mono text-sm"
                    placeholder="Add quick notes about this project..."
                  />
                ) : (
                  <div className="text-zinc-400 whitespace-pre-wrap">
                    {project.notes || 'No notes yet. Click edit to add some.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* README Tab */}
          {activeTab === 'readme' && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                  README
                </h3>
                {!editingReadme ? (
                  <button
                    onClick={() => setEditingReadme(true)}
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingReadme(false);
                        setReadmeContent(project.readme || '');
                      }}
                      className="text-zinc-500 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveDocumentation('readme', readmeContent)}
                      disabled={saving}
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Save size={16} />
                      Save
                    </button>
                  </div>
                )}
              </div>
              {editingReadme ? (
                <textarea
                  value={readmeContent}
                  onChange={(e) => setReadmeContent(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[400px] font-mono text-sm"
                  placeholder="# Project README&#10;&#10;Add your project documentation here..."
                />
              ) : (
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-zinc-300 font-mono text-sm">
                    {project.readme || 'No README yet. Click edit to add documentation.'}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Architecture Tab */}
          {activeTab === 'architecture' && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                  Architecture
                </h3>
                {!editingArch ? (
                  <button
                    onClick={() => setEditingArch(true)}
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingArch(false);
                        setArchContent(project.architecture || '');
                      }}
                      className="text-zinc-500 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveDocumentation('architecture', archContent)}
                      disabled={saving}
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Save size={16} />
                      Save
                    </button>
                  </div>
                )}
              </div>
              {editingArch ? (
                <textarea
                  value={archContent}
                  onChange={(e) => setArchContent(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[400px] font-mono text-sm"
                  placeholder="Describe your project architecture...&#10;&#10;- Frontend: Next.js&#10;- Backend: API Routes&#10;- Database: PostgreSQL&#10;- Hosting: Vercel"
                />
              ) : (
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-zinc-300 font-mono text-sm">
                    {project.architecture || 'No architecture documentation yet. Click edit to add.'}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Credentials Tab */}
          {activeTab === 'credentials' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Stored Credentials</h3>
                <button
                  onClick={() => {
                    setEditingCredential(null);
                    setShowCredentialModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  Add Credential
                </button>
              </div>

              {credentials.length === 0 ? (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8 text-center">
                  <Key size={32} className="text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">No credentials stored yet.</p>
                  <p className="text-zinc-600 text-sm">
                    Add login details, API keys, and other secrets.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {credentials.map((cred) => (
                    <CredentialCard
                      key={cred.id}
                      credential={cred}
                      onEdit={(c) => {
                        setEditingCredential(c);
                        setShowCredentialModal(true);
                      }}
                      onDelete={handleDeleteCredential}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">Tasks</h3>
                  <div className="flex items-center bg-zinc-800 rounded-lg p-0.5">
                    <button
                      onClick={() => setTaskView('board')}
                      className={cn(
                        'p-1.5 rounded transition-colors',
                        taskView === 'board' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'
                      )}
                    >
                      <LayoutGrid size={16} />
                    </button>
                    <button
                      onClick={() => setTaskView('list')}
                      className={cn(
                        'p-1.5 rounded transition-colors',
                        taskView === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'
                      )}
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setShowTaskModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  New Task
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8 text-center">
                  <CheckSquare size={32} className="text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">No tasks yet.</p>
                  <p className="text-zinc-600 text-sm">
                    Create tasks to track work for this project.
                  </p>
                </div>
              ) : taskView === 'board' ? (
                <TaskBoard
                  tasks={tasks}
                  onStatusChange={handleTaskStatusChange}
                  onEdit={(task) => {
                    setEditingTask(task);
                    setShowTaskModal(true);
                  }}
                  onDelete={handleDeleteTask}
                />
              ) : (
                <TaskList
                  tasks={tasks}
                  onStatusChange={handleTaskStatusChange}
                  onEdit={(task) => {
                    setEditingTask(task);
                    setShowTaskModal(true);
                  }}
                  onDelete={handleDeleteTask}
                />
              )}
            </div>
          )}

          {/* Environment Variables Tab */}
          {activeTab === 'env' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Environment Variables</h3>
                <button
                  onClick={() => {
                    setEditingEnv(null);
                    setShowEnvModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  Add Variable
                </button>
              </div>

              {envVariables.length === 0 ? (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8 text-center">
                  <Server size={32} className="text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">No environment variables stored yet.</p>
                  <p className="text-zinc-600 text-sm">
                    Store your .env files content securely.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {['production', 'staging', 'development'].map((env) => {
                    const vars = envVariables.filter((v) => v.environment === env);
                    if (vars.length === 0) return null;
                    return (
                      <div key={env} className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                        <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 capitalize">
                          {env}
                        </h4>
                        <div className="space-y-2">
                          {vars.map((v) => (
                            <EnvVariableRow
                              key={v.id}
                              variable={v}
                              onEdit={() => {
                                setEditingEnv(v);
                                setShowEnvModal(true);
                              }}
                              onDelete={() => handleDeleteEnvVariable(v.id)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Edit Project Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Project"
        size="lg"
      >
        <ProjectForm
          initialData={{
            name: project.name,
            description: project.description || '',
            productionUrl: project.productionUrl || '',
            stagingUrl: project.stagingUrl || '',
            vercelProjectUrl: project.vercelProjectUrl || '',
            githubRepoUrl: project.githubRepoUrl || '',
            techStack,
            tags,
            status: project.status,
          }}
          onSubmit={handleUpdateProject}
          onCancel={() => setShowEditModal(false)}
          isLoading={saving}
        />
      </Modal>

      {/* Credential Modal */}
      <Modal
        isOpen={showCredentialModal}
        onClose={() => {
          setShowCredentialModal(false);
          setEditingCredential(null);
        }}
        title={editingCredential ? 'Edit Credential' : 'Add Credential'}
      >
        <CredentialForm
          initialData={
            editingCredential
              ? {
                  id: editingCredential.id,
                  label: editingCredential.label,
                  username: editingCredential.username || '',
                  password: editingCredential.password || '',
                  url: editingCredential.url || '',
                  notes: editingCredential.notes || '',
                }
              : undefined
          }
          onSubmit={handleSaveCredential}
          onCancel={() => {
            setShowCredentialModal(false);
            setEditingCredential(null);
          }}
          isLoading={saving}
        />
      </Modal>

      {/* Env Variable Modal */}
      <Modal
        isOpen={showEnvModal}
        onClose={() => {
          setShowEnvModal(false);
          setEditingEnv(null);
        }}
        title={editingEnv ? 'Edit Variable' : 'Add Variable'}
      >
        <EnvVariableForm
          initialData={editingEnv || undefined}
          onSubmit={handleSaveEnvVariable}
          onCancel={() => {
            setShowEnvModal(false);
            setEditingEnv(null);
          }}
          isLoading={saving}
        />
      </Modal>

      {/* Task Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        title={editingTask ? 'Edit Task' : 'New Task'}
        size="lg"
      >
        <TaskForm
          projectId={id}
          initialData={editingTask || undefined}
          onSubmit={(data) => {
            if (editingTask) {
              handleUpdateTask(editingTask.id, data);
            } else {
              handleCreateTask({ ...data, projectId: id });
            }
          }}
          onCancel={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          isLoading={saving}
        />
      </Modal>
    </div>
  );
}

function EnvVariableRow({
  variable,
  onEdit,
  onDelete,
}: {
  variable: EnvVariable;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showValue, setShowValue] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(variable.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-zinc-800/50 rounded-lg">
      <div className="flex items-center gap-4 flex-1">
        <span className="font-mono text-sm text-zinc-300 w-48">{variable.key}</span>
        <span className="font-mono text-sm text-zinc-500">=</span>
        <span className="font-mono text-sm text-zinc-400 flex-1">
          {showValue ? variable.value : '••••••••••••'}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowValue(!showValue)}
          className="p-1.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-white transition-colors"
        >
          {showValue ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        <button
          onClick={copyToClipboard}
          className="p-1.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-white transition-colors"
        >
          <Copy size={16} />
        </button>
        {copied && <span className="text-xs text-green-400 mr-2">Copied!</span>}
        <button
          onClick={onEdit}
          className="p-1.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-white transition-colors"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-red-400 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
