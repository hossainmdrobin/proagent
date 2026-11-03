export interface StatCard {
  id: string;
  label: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: string;
}

export interface ActivityItem {
  id: string;
  type: 'commit' | 'pr' | 'issue' | 'deploy' | 'review';
  title: string;
  description: string;
  timestamp: string;
  author: string;
  avatar: string;
  repo: string;
}

export interface ProjectCard {
  id: string;
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  lastCommit: string;
  status: 'active' | 'archived' | 'draft';
  color: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
  contributions: number;
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export const mockStats: StatCard[] = [
  {
    id: '1',
    label: 'Total Projects',
    value: '42',
    change: '+12%',
    changeType: 'increase',
    icon: 'folder',
    color: '#6366f1',
  },
  {
    id: '2',
    label: 'Lines of Code',
    value: '284K',
    change: '+8.2%',
    changeType: 'increase',
    icon: 'code',
    color: '#06b6d4',
  },
  {
    id: '3',
    label: 'Active Contributors',
    value: '18',
    change: '+3',
    changeType: 'increase',
    icon: 'users',
    color: '#8b5cf6',
  },
  {
    id: '4',
    label: 'Deploy Success Rate',
    value: '99.2%',
    change: '-0.1%',
    changeType: 'decrease',
    icon: 'rocket',
    color: '#22c55e',
  },
];

export const mockActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'commit',
    title: 'Refactor authentication module',
    description: 'Improved token refresh logic and added retry mechanism',
    timestamp: '2 hours ago',
    author: 'Sarah Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    repo: 'saadagent/auth-service',
  },
  {
    id: '2',
    type: 'pr',
    title: 'Add glassmorphism dashboard UI',
    description: 'New dashboard with sidebar, widgets, and modern design',
    timestamp: '4 hours ago',
    author: 'Marcus Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus',
    repo: 'saadagent/frontend',
  },
  {
    id: '3',
    type: 'deploy',
    title: 'Production deploy v2.4.1',
    description: 'Successfully deployed to production environment',
    timestamp: '6 hours ago',
    author: 'CI/CD Bot',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=bot',
    repo: 'saadagent/infra',
  },
  {
    id: '4',
    type: 'review',
    title: 'Code review completed',
    description: 'Approved PR #234 with minor suggestions',
    timestamp: '8 hours ago',
    author: 'Emily Rodriguez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
    repo: 'saadagent/api',
  },
  {
    id: '5',
    type: 'issue',
    title: 'Bug: Memory leak in websocket handler',
    description: 'Investigating connection cleanup on disconnect',
    timestamp: '1 day ago',
    author: 'David Kim',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
    repo: 'saadagent/realtime',
  },
];

export const mockProjects: ProjectCard[] = [
  {
    id: '1',
    name: 'saadagent',
    description: 'AI-powered coding assistant with agent orchestration',
    language: 'TypeScript',
    stars: 1247,
    forks: 89,
    lastCommit: '2 hours ago',
    status: 'active',
    color: '#6366f1',
  },
  {
    id: '2',
    name: 'neural-docs',
    description: 'Automated documentation generator using LLMs',
    language: 'Python',
    stars: 892,
    forks: 56,
    lastCommit: '1 day ago',
    status: 'active',
    color: '#06b6d4',
  },
  {
    id: '3',
    name: 'code-graph',
    description: 'Visual code dependency analyzer and navigator',
    language: 'Rust',
    stars: 563,
    forks: 34,
    lastCommit: '3 days ago',
    status: 'active',
    color: '#f97316',
  },
  {
    id: '4',
    name: 'dev-sandbox',
    description: 'Ephemeral development environments in seconds',
    language: 'Go',
    stars: 421,
    forks: 28,
    lastCommit: '1 week ago',
    status: 'draft',
    color: '#8b5cf6',
  },
];

export const mockTeam: TeamMember[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Tech Lead',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    status: 'online',
    contributions: 234,
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    role: 'Senior Engineer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus',
    status: 'online',
    contributions: 189,
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    role: 'Backend Engineer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
    status: 'away',
    contributions: 156,
  },
  {
    id: '4',
    name: 'David Kim',
    role: 'Full Stack Engineer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
    status: 'online',
    contributions: 142,
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    role: 'DevOps Engineer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa',
    status: 'offline',
    contributions: 98,
  },
];

export const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    type: 'success',
    title: 'Deploy successful',
    message: 'Version 2.4.1 deployed to production',
    timestamp: '6 hours ago',
    read: false,
  },
  {
    id: '2',
    type: 'info',
    title: 'New contributor',
    message: 'Alex joined the saadagent project',
    timestamp: '1 day ago',
    read: false,
  },
  {
    id: '3',
    type: 'warning',
    title: 'Build failing',
    message: 'CI pipeline failed on neural-docs repo',
    timestamp: '2 days ago',
    read: true,
  },
  {
    id: '4',
    type: 'error',
    title: 'Security alert',
    message: 'Dependency vulnerability detected in auth-service',
    timestamp: '3 days ago',
    read: true,
  },
];