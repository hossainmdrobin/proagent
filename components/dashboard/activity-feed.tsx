'use client';

import { ActivityItem } from '@/lib/dashboard/mock-data';
import { cn } from '@/lib/utils';

interface ActivityFeedProps {
  activities: ActivityItem[];
  limit?: number;
}

const typeIcons: Record<ActivityItem['type'], React.ReactNode> = {
  commit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  pr: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  issue: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  deploy: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  review: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
};

const typeColors: Record<ActivityItem['type'], string> = {
  commit: '#6366f1',
  pr: '#8b5cf6',
  issue: '#f97316',
  deploy: '#22c55e',
  review: '#06b6d4',
};

export function ActivityFeed({ activities, limit = 5 }: ActivityFeedProps) {
  const displayActivities = activities.slice(0, limit);

  return (
    <div className="glass-card p-0 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-semibold text-white">Recent Activity</h3>
        <a href="/dashboard/activity" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          View all
        </a>
      </div>
      <div className="divide-y divide-white/5">
        {displayActivities.map((activity, index) => (
          <div
            key={activity.id}
            className={cn(
              'p-4 flex items-start gap-4 transition-colors',
              'hover:bg-white/5'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${typeColors[activity.type]}20`, color: typeColors[activity.type] }}
              aria-hidden="true"
            >
              {typeIcons[activity.type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium text-white truncate">{activity.title}</h4>
                <span
                  className="px-2 py-0.5 text-xs font-medium rounded-full bg-white/5 text-zinc-400"
                >
                  {activity.type}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-400 line-clamp-1">{activity.description}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                <div className="flex items-center gap-1">
                  <img
                    src={activity.avatar}
                    alt=""
                    className="w-5 h-5 rounded-full"
                    aria-hidden="true"
                  />
                  <span>{activity.author}</span>
                </div>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {activity.repo}
                </span>
                <span>{activity.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}