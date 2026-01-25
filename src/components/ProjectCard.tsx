'use client';

import Link from 'next/link';
import {
  ExternalLink,
  Github,
  Globe,
  Key,
  MoreVertical,
  Archive,
  Trash2,
} from 'lucide-react';
import { cn, formatDate, parseJsonArray } from '@/lib/utils';
import { useState } from 'react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  productionUrl: string | null;
  githubRepoUrl: string | null;
  vercelProjectUrl: string | null;
  status: string;
  techStack: string | null;
  tags: string | null;
  updatedAt: string;
  credentials: { id: string }[];
}

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}

export default function ProjectCard({ project, onDelete, onArchive }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const techStack = parseJsonArray(project.techStack);
  const tags = parseJsonArray(project.tags);

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    'in-development': 'bg-yellow-500/20 text-yellow-400',
    archived: 'bg-zinc-500/20 text-zinc-400',
  };

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all group">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <Link href={`/projects/${project.id}`} className="flex-1">
            <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
              {project.name}
            </h3>
          </Link>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-500"
            >
              <MoreVertical size={18} />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 py-1 z-10">
                <button
                  onClick={() => {
                    onArchive(project.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
                >
                  <Archive size={16} />
                  {project.status === 'archived' ? 'Unarchive' : 'Archive'}
                </button>
                <button
                  onClick={() => {
                    onDelete(project.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-700"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full capitalize',
              statusColors[project.status] || statusColors.active
            )}
          >
            {project.status.replace('-', ' ')}
          </span>
          {project.credentials.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 flex items-center gap-1">
              <Key size={12} />
              {project.credentials.length}
            </span>
          )}
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{project.description}</p>
        )}

        {/* Tech Stack */}
        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {techStack.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded"
              >
                {tech}
              </span>
            ))}
            {techStack.length > 4 && (
              <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded">
                +{techStack.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Links */}
        <div className="flex items-center gap-3 pt-3 border-t border-zinc-800">
          {project.productionUrl && (
            <a
              href={project.productionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors"
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
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors"
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
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors"
            >
              <ExternalLink size={14} />
              Vercel
            </a>
          )}
          <span className="ml-auto text-xs text-zinc-600">
            {formatDate(project.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
