'use client';

import { ReactNode } from 'react';
import { Sidebar } from './sidebar';

interface WorkspaceLayoutProps {
  children: ReactNode;
  header?: ReactNode;
}

export function WorkspaceLayout({ children, header }: WorkspaceLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="glass-main lg:ml-64">
        <div className="p-6 lg:p-8">
          {header && (
            <header className="mb-8 animate-fade-in">
              {header}
            </header>
          )}
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
        {description && (
          <p className="mt-1 text-zinc-400">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {description && (
          <p className="text-sm text-zinc-500">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}