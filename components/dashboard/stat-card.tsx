'use client';

import { StatCard as StatCardType } from '@/lib/dashboard/mock-data';
import { cn } from '@/lib/utils';

interface StatCardProps {
  stat: StatCardType;
  index?: number;
}

const icons: Record<string, React.ReactNode> = {
  folder: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  code: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  users: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  rocket: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
};

export function StatCard({ stat, index = 0 }: StatCardProps) {
  const changeColor = stat.changeType === 'increase' ? 'text-emerald-400' :
    stat.changeType === 'decrease' ? 'text-red-400' : 'text-zinc-400';
  
  const changeIcon = stat.changeType === 'increase' ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  ) : stat.changeType === 'decrease' ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
    </svg>
  );

  return (
    <div
      className={cn('glass-card animate-fade-in', `style="animation-delay: ${index * 100}ms"`)}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-400">{stat.label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
            `bg-[${stat.color}]/20 text-[${stat.color}]`
          )}
          aria-hidden="true"
        >
          {icons[stat.icon] || icons.folder}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1">
        <span className={cn('text-sm font-medium flex items-center gap-1', changeColor)}>
          {changeIcon}
          {stat.change}
        </span>
        <span className="text-sm text-zinc-500">vs last period</span>
      </div>
    </div>
  );
}