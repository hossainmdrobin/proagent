'use client';

import { ProjectCard } from '@/lib/dashboard/mock-data';
import { cn } from '@/lib/utils';
import { useGetProjectsQuery } from '@/store/features/projects-api';
import Link from 'next/link';


const statusStyles: Record<ProjectCard['status'], string> = {
  active: 'bg-emerald-500/20 text-emerald-400',
  draft: 'bg-amber-500/20 text-amber-400',
  archived: 'bg-zinc-500/20 text-zinc-400',
};

export function ProjectGrid() {
const {data, isLoading, error} = useGetProjectsQuery();

  return (
    <div className="glass-card p-0 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-semibold text-white">Your Projects</h3>
        <a href="/dashboard/projects" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          View all
        </a>
      </div>
      <div className="p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data?.map((project, index) => (
            <Link 
            href={`/project/${String(project._id)}`}
              key={project.name}
              className={cn(
                'glass p-4 rounded-xl transition-all duration-300 animate-fade-in',
                'hover:bg-white/10 hover:border-white/20'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  // style={{ backgroundColor: `${project.color}20`, color: project.color }}
                  aria-hidden="true"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                {/* <span className={cn('px-2 py-1 text-xs font-medium rounded-full', statusStyles[project.status])}>
                  {project.status}
                </span> */}
              </div>
              <h4 className="font-semibold text-white truncate mb-1">{project.name}</h4>
              {/* <p className="text-sm text-zinc-400 line-clamp-2 mb-3">{project.description}</p> */}
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                {/* <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  {project.stars.toLocaleString()}
                </span> */}
                {/* <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  {project.forks.toLocaleString()}
                </span> */}
              </div>
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                {/* <span className="text-xs text-zinc-500 capitalize">{project.language}</span> */}
                {/* <span className="text-xs text-zinc-500">{project.lastCommit}</span> */}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}