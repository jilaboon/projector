'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface CredentialFormData {
  id?: string;
  label: string;
  username: string;
  password: string;
  url: string;
  notes: string;
}

interface CredentialFormProps {
  initialData?: Partial<CredentialFormData>;
  onSubmit: (data: CredentialFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function CredentialForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: CredentialFormProps) {
  const [formData, setFormData] = useState<CredentialFormData>({
    id: initialData?.id,
    label: initialData?.label || '',
    username: initialData?.username || '',
    password: initialData?.password || '',
    url: initialData?.url || '',
    notes: initialData?.notes || '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Label *
        </label>
        <input
          type="text"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Admin Login, API Key, Database"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          URL
        </label>
        <input
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://example.com/login"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Username / Email
        </label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="username or email"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Password / Secret
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="password or API key"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
          placeholder="Additional notes..."
        />
      </div>

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
          disabled={isLoading || !formData.label}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {isLoading ? 'Saving...' : 'Save Credential'}
        </button>
      </div>
    </form>
  );
}
