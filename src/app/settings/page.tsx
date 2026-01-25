'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Shield, Database, Download, Upload } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      const res = await fetch('/api/projects');
      const projects = await res.json();

      const dataStr = JSON.stringify(projects, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `projector-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus('Export completed!');
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('Export failed');
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar onNewProject={() => router.push('/')} />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800 px-8 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Manage your Projector configuration
          </p>
        </header>

        <div className="p-8 max-w-2xl">
          {/* Security */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Shield className="text-blue-400" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Security</h2>
                <p className="text-sm text-zinc-500">
                  Encryption and access settings
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-zinc-800">
                <div>
                  <p className="text-sm font-medium text-zinc-300">
                    Credential Encryption
                  </p>
                  <p className="text-xs text-zinc-500">
                    All passwords and secrets are encrypted with AES-256
                  </p>
                </div>
                <span className="px-2 py-1 text-xs bg-green-500/10 text-green-400 rounded">
                  Enabled
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-300">
                    App Password
                  </p>
                  <p className="text-xs text-zinc-500">
                    Require password to access Projector
                  </p>
                </div>
                <span className="px-2 py-1 text-xs bg-zinc-500/10 text-zinc-400 rounded">
                  Not set
                </span>
              </div>
            </div>
          </div>

          {/* Data */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Database className="text-purple-400" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Data</h2>
                <p className="text-sm text-zinc-500">
                  Backup and restore your projects
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-zinc-800">
                <div>
                  <p className="text-sm font-medium text-zinc-300">
                    Export Data
                  </p>
                  <p className="text-xs text-zinc-500">
                    Download all projects as JSON
                  </p>
                </div>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                >
                  <Download size={16} />
                  Export
                </button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-300">
                    Import Data
                  </p>
                  <p className="text-xs text-zinc-500">
                    Restore from a backup file
                  </p>
                </div>
                <button
                  disabled
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-800 text-zinc-500 rounded-lg cursor-not-allowed"
                >
                  <Upload size={16} />
                  Import
                </button>
              </div>
            </div>
            {exportStatus && (
              <div className="mt-4 p-3 bg-zinc-800 rounded-lg text-sm text-zinc-300">
                {exportStatus}
              </div>
            )}
          </div>

          {/* About */}
          <div className="mt-8 text-center text-zinc-600 text-sm">
            <p>Projector - Gil&apos;s Projects</p>
            <p className="mt-1">A central hub for managing all your projects</p>
          </div>
        </div>
      </main>
    </div>
  );
}
