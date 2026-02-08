'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ProjectCard from '@/components/ProjectCard';
import Modal from '@/components/Modal';
import ProjectForm from '@/components/ProjectForm';
import { FolderKanban, Plus, Filter } from 'lucide-react';
import { parseJsonArray } from '@/lib/utils';
import LoadingBar from '@/components/LoadingBar';

interface Project {
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
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (data: {
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
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowNewProjectModal(false);
        fetchProjects();
      }
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleArchiveProject = async (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    try {
      await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...project,
          techStack: parseJsonArray(project.techStack),
          tags: parseJsonArray(project.tags),
          status: project.status === 'archived' ? 'active' : 'archived',
        }),
      });
      fetchProjects();
    } catch (error) {
      console.error('Error archiving project:', error);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === 'active').length,
    inDevelopment: projects.filter((p) => p.status === 'in-development').length,
    archived: projects.filter((p) => p.status === 'archived').length,
  };

  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar onNewProject={() => setShowNewProjectModal(true)} />

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">All Projects</h1>
              <p className="text-zinc-500 text-sm mt-1">
                {stats.total} projects &middot; {stats.active} active
              </p>
            </div>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus size={20} />
              New Project
            </button>
          </div>
        </header>

        <div className="p-8">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <FolderKanban className="text-blue-400" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-xs text-zinc-500">Total</p>
                </div>
              </div>
            </div>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <div className="w-5 h-5 rounded-full bg-green-500/50" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.active}</p>
                  <p className="text-xs text-zinc-500">Active</p>
                </div>
              </div>
            </div>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <div className="w-5 h-5 rounded-full bg-yellow-500/50" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.inDevelopment}</p>
                  <p className="text-xs text-zinc-500">In Development</p>
                </div>
              </div>
            </div>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-500/10 rounded-lg">
                  <div className="w-5 h-5 rounded-full bg-zinc-500/50" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.archived}</p>
                  <p className="text-xs text-zinc-500">Archived</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 mb-6">
            <Filter size={16} className="text-zinc-500" />
            <div className="flex gap-2">
              {['all', 'active', 'in-development', 'archived'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filter === status
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {status === 'all' ? 'All' : status.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingBar />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FolderKanban size={48} className="text-zinc-700 mb-4" />
              <h3 className="text-lg font-medium text-zinc-400 mb-2">No projects yet</h3>
              <p className="text-zinc-600 mb-4">Create your first project to get started</p>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus size={20} />
                New Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDelete={handleDeleteProject}
                  onArchive={handleArchiveProject}
                />
              ))}
            </div>
          )}
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
