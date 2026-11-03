'use client';

import { NotificationItem } from '@/lib/dashboard/mock-data';
import { cn } from '@/lib/utils';

interface NotificationsPanelProps {
  notifications: NotificationItem[];
  limit?: number;
}

const typeStyles: Record<NotificationItem['type'], { bg: string; text: string; icon: React.ReactNode }> = {
  success: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  info: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  warning: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  error: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export function NotificationsPanel({ notifications, limit = 4 }: NotificationsPanelProps) {
  const displayNotifications = notifications.slice(0, limit);

  return (
    <div className="glass-card p-0 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-semibold text-white">Notifications</h3>
        <a href="/dashboard/notifications" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          View all
        </a>
      </div>
      <div className="divide-y divide-white/5">
        {displayNotifications.map((notification, index) => (
          <div
            key={notification.id}
            className={cn(
              'p-4 flex items-start gap-3 transition-colors animate-fade-in',
              notification.read ? 'opacity-60' : 'bg-white/5',
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                typeStyles[notification.type].bg,
                typeStyles[notification.type].text
              )}
              aria-hidden="true"
            >
              {typeStyles[notification.type].icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-white">{notification.title}</h4>
                {!notification.read && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400" aria-label="Unread" />
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-400">{notification.message}</p>
              <p className="mt-2 text-xs text-zinc-500">{notification.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}