'use client';

import {
  WorkspaceLayout,
  PageHeader,
  SectionHeader,
} from '@/components/dashboard/workspace-layout';
import { StatCard } from '@/components/dashboard/stat-card';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { ProjectGrid } from '@/components/dashboard/project-grid';
import { TeamMembers } from '@/components/dashboard/team-members';
import { NotificationsPanel } from '@/components/dashboard/notifications-panel';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { MetricCharts } from '@/components/dashboard/metric-charts';
import {
  mockStats,
  mockActivity,
  mockTeam,
  mockNotifications,
} from '@/lib/dashboard/mock-data';
import { useCreateProjectMutation } from '@/store/features/projects-api';
import { PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';

export default function DashboardPage() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [createProject, { data, isLoading }] = useCreateProjectMutation();
  console.log(data)
  useEffect(() => {
    if (data) redirect(`/pronects/${data._id}`)
  }, [data])


  return (
    <WorkspaceLayout
      header={
        <PageHeader
          title="Dashboard"
          description="Overview of your projects, team activity, and metrics"
        />
      }
    >
      <div className="space-y-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <SectionHeader title="Overview" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mockStats.map((stat, index) => (
            <StatCard key={stat.id} stat={stat} index={index} />
          ))}
        </div>

        <div className='flex items-center justify-center min-h-48 border rounded-lg'>
          <div
            onClick={() => setOpen(true)}
            className="h-20 flex flex-column items-center justify-center rounded-lg border p-4 cursor-pointer border-black hover:bg-gray-400">
            <div><PlusIcon /></div>
            <span>New Project</span>
          </div>
          {open && <div className='fixed bg-black/70 backdrop-blur-xl flex items-center justify-center border h-44 flex-col p-4 rounded'>
            <h1 className='mb-3'>Enter Your Project Name</h1>
            <div className='w-full'>
              <input type="text"
                onChange={(e) => setName(e.target.value)}
                placeholder='Project Name'
                name="name" className='rounded outline-none border border-green-200 p-2 block w-full' />
            </div>

            <div className='flex justify-between mt-3'>
              <button
                disabled={Boolean(!name || isLoading)}
                onClick={() => createProject({ name })}
                className='bg-green-700 px-4 py-1 rounded mr-4'>save</button>
              <button onClick={() => setOpen(false)} className='text-yellow-300 outline-1 px-4 py-1 rounded'>Cancel</button>
            </div>
          </div>}

        </div>
        <ProjectGrid />


        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <ActivityFeed activities={mockActivity} limit={5} />
            <div></div>
          </div>
          <div className="space-y-6">
            <TeamMembers members={mockTeam} limit={5} />
            <NotificationsPanel notifications={mockNotifications} limit={4} />
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}