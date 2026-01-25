'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface EnvVariableFormData {
  id?: string;
  environment: string;
  key: string;
  value: string;
}

interface EnvVariableFormProps {
  initialData?: Partial<EnvVariableFormData>;
  onSubmit: (data: EnvVariableFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function EnvVariableForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: EnvVariableFormProps) {
  const [formData, setFormData] = useState<EnvVariableFormData>({
    id: initialData?.id,
    environment: initialData?.environment || 'production',
    key: initialData?.key || '',
    value: initialData?.value || '',
  });
  const [showValue, setShowValue] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Environment *
        </label>
        <select
          value={formData.environment}
          onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="production">Production</option>
          <option value="staging">Staging</option>
          <option value="development">Development</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Key *
        </label>
        <input
          type="text"
          value={formData.key}
          onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="DATABASE_URL"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Value *
        </label>
        <div className="relative">
          <input
            type={showValue ? 'text' : 'password'}
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 pr-10 text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="value"
            required
          />
          <button
            type="button"
            onClick={() => setShowValue(!showValue)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
          >
            {showValue ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
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
          disabled={isLoading || !formData.key || !formData.value}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {isLoading ? 'Saving...' : 'Save Variable'}
        </button>
      </div>
    </form>
  );
}
