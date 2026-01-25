'use client';

import { useState } from 'react';
import { Eye, EyeOff, Copy, Pencil, Trash2, ExternalLink } from 'lucide-react';

interface Credential {
  id: string;
  label: string;
  username: string | null;
  password: string | null;
  url: string | null;
  notes: string | null;
}

interface CredentialCardProps {
  credential: Credential;
  onEdit: (credential: Credential) => void;
  onDelete: (id: string) => void;
}

export default function CredentialCard({ credential, onEdit, onDelete }: CredentialCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-white">{credential.label}</h4>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(credential)}
            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-white transition-colors"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onDelete(credential.id)}
            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-red-400 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {credential.url && (
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">URL:</span>
            <a
              href={credential.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              {credential.url.replace(/^https?:\/\//, '').slice(0, 30)}
              {credential.url.length > 30 && '...'}
              <ExternalLink size={12} />
            </a>
          </div>
        )}

        {credential.username && (
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Username:</span>
            <div className="flex items-center gap-2">
              <span className="text-zinc-300">{credential.username}</span>
              <button
                onClick={() => copyToClipboard(credential.username!, 'username')}
                className="p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-white"
              >
                <Copy size={14} />
              </button>
              {copied === 'username' && (
                <span className="text-xs text-green-400">Copied!</span>
              )}
            </div>
          </div>
        )}

        {credential.password && (
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Password:</span>
            <div className="flex items-center gap-2">
              <span className="text-zinc-300 font-mono">
                {showPassword ? credential.password : '••••••••'}
              </span>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                onClick={() => copyToClipboard(credential.password!, 'password')}
                className="p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-white"
              >
                <Copy size={14} />
              </button>
              {copied === 'password' && (
                <span className="text-xs text-green-400">Copied!</span>
              )}
            </div>
          </div>
        )}

        {credential.notes && (
          <div className="pt-2 border-t border-zinc-700/50">
            <span className="text-zinc-500 text-xs block mb-1">Notes:</span>
            <p className="text-zinc-400 text-xs">{credential.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
