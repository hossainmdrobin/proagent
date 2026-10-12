'use client';

import { cn } from '@/lib/utils';

interface QuickAction {
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    label: 'New Project',
    description: 'Create a new repository',
    href: '/dashboard/projects/new',
    color: '#6366f1',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    label: 'New Sandbox',
    description: 'Spin up a dev environment',
    href: '/dashboard/sandbox/new',
    color: '#06b6d4',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    label: 'Deploy App',
    description: 'Deploy to production',
    href: '/dashboard/deploy',
    color: '#22c55e',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    label: 'Invite Member',
    description: 'Add team member',
    href: '/dashboard/team/invite',
    color: '#8b5cf6',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
];

export function QuickActions() {
  return (
    <div className="glass-card p-0 overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <h3 className="font-semibold text-white">Quick Actions</h3>
      </div>
      <div className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <a
              key={action.label}
              href={action.href}
              className={cn(
                'glass p-4 rounded-xl flex flex-col items-center text-center gap-3 transition-all duration-300 animate-fade-in',
                'hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${action.color}20`, color: action.color }}
                aria-hidden="true"
              >
                {action.icon}
              </div>
              <div>
                <p className="font-medium text-white">{action.label}</p>
                <p className="text-xs text-zinc-500">{action.description}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}