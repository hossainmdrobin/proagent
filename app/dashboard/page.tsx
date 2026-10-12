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
  mockProjects,
  mockTeam,
  mockNotifications,
} from '@/lib/dashboard/mock-data';
import { useGetProjectsQuery } from '@/store/features/projects-api';

export default function DashboardPage() {
  const {data, isLoading} = useGetProjectsQuery()
  console.log(data, "The project list");
  console.log()
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

        <SectionHeader title="Metrics" />
        <MetricCharts />

        <SectionHeader title="Quick Actions" />
        <QuickActions />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <ActivityFeed activities={mockActivity} limit={5} />
            <ProjectGrid  />
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