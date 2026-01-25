'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface ProjectFormData {
  name: string;
  description: string;
  productionUrl: string;
  stagingUrl: string;
  vercelProjectUrl: string;
  githubRepoUrl: string;
  techStack: string[];
  tags: string[];
  status: string;
}

interface ProjectFormProps {
  initialData?: Partial<ProjectFormData>;
  onSubmit: (data: ProjectFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ProjectForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    productionUrl: initialData?.productionUrl || '',
    stagingUrl: initialData?.stagingUrl || '',
    vercelProjectUrl: initialData?.vercelProjectUrl || '',
    githubRepoUrl: initialData?.githubRepoUrl || '',
    techStack: initialData?.techStack || [],
    tags: initialData?.tags || [],
    status: initialData?.status || 'active',
  });

  const [newTech, setNewTech] = useState('');
  const [newTag, setNewTag] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addTech = () => {
    if (newTech.trim() && !formData.techStack.includes(newTech.trim())) {
      setFormData({
        ...formData,
        techStack: [...formData.techStack, newTech.trim()],
      });
      setNewTech('');
    }
  };

  const removeTech = (tech: string) => {
    setFormData({
      ...formData,
      techStack: formData.techStack.filter((t) => t !== tech),
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Project Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Active</option>
            <option value="in-development">In Development</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* URLs */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Links
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Production URL
            </label>
            <input
              type="url"
              value={formData.productionUrl}
              onChange={(e) => setFormData({ ...formData, productionUrl: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://myproject.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Staging URL
            </label>
            <input
              type="url"
              value={formData.stagingUrl}
              onChange={(e) => setFormData({ ...formData, stagingUrl: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://staging.myproject.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              GitHub Repository
            </label>
            <input
              type="url"
              value={formData.githubRepoUrl}
              onChange={(e) => setFormData({ ...formData, githubRepoUrl: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://github.com/user/repo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Vercel Project
            </label>
            <input
              type="url"
              value={formData.vercelProjectUrl}
              onChange={(e) => setFormData({ ...formData, vercelProjectUrl: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://vercel.com/team/project"
            />
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Tech Stack
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newTech}
            onChange={(e) => setNewTech(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTech())}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add technology..."
          />
          <button
            type="button"
            onClick={addTech}
            className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.techStack.map((tech) => (
            <span
              key={tech}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded text-sm"
            >
              {tech}
              <button
                type="button"
                onClick={() => removeTech(tech)}
                className="text-zinc-500 hover:text-white"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Tags
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add tag..."
          />
          <button
            type="button"
            onClick={addTag}
            className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded text-sm"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-blue-400/50 hover:text-blue-400"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !formData.name}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {isLoading ? 'Saving...' : 'Save Project'}
        </button>
      </div>
    </form>
  );
}
