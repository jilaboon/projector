'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  CreditCard,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onNewProject: () => void;
}

export default function Sidebar({ onNewProject }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/projects', icon: FolderKanban, label: 'All Projects' },
    { href: '/services', icon: CreditCard, label: 'Services' },
    { href: '/proposals', icon: FileText, label: 'Proposals' },
  ];

  return (
    <aside
      className={cn(
        'h-screen bg-zinc-900 text-white flex flex-col transition-all duration-300 border-r border-zinc-800',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Projector
            </h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        {!collapsed && (
          <p className="text-xs text-zinc-500 mt-1">Gil&apos;s Projects</p>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full bg-zinc-800 text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* New Project Button */}
      <div className="px-4 mb-4">
        <button
          onClick={onNewProject}
          className={cn(
            'w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 px-4 transition-colors',
            collapsed && 'justify-center px-2'
          )}
        >
          <Plus size={20} />
          {!collapsed && <span>New Project</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors',
                isActive
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white',
                collapsed && 'justify-center'
              )}
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <Settings size={20} />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  );
}
