'use client';

import { TeamMember } from '@/lib/dashboard/mock-data';

interface TeamMembersProps {
  members: TeamMember[];
  limit?: number;
}

const statusColors: Record<TeamMember['status'], string> = {
  online: '#22c55e',
  away: '#f97316',
  offline: '#71717a',
};

export function TeamMembers({ members, limit = 5 }: TeamMembersProps) {
  const displayMembers = members.slice(0, limit);

  return (
    <div className="glass-card p-0 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-semibold text-white">Team Members</h3>
        <a href="/dashboard/team" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          View all
        </a>
      </div>
      <div className="divide-y divide-white/5">
        {displayMembers.map((member, index) => (
          <div
            key={member.id}
            className="p-4 flex items-center gap-4 transition-colors hover:bg-white/5 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="relative flex-shrink-0">
              <img
                src={member.avatar}
                alt={member.name}
                className="w-10 h-10 rounded-full border-2 border-white/10"
              />
              <span
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background"
                style={{ backgroundColor: statusColors[member.status] }}
                aria-label={`${member.name} is ${member.status}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-white truncate">{member.name}</p>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-white/5 text-zinc-400">
                  {member.role}
                </span>
              </div>
              <p className="text-sm text-zinc-500">{member.contributions} contributions this month</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-white">{member.contributions}</p>
              <p className="text-xs text-zinc-500">commits</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}