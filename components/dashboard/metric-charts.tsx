'use client';

interface ChartDataPoint {
  label: string;
  value: number;
}

interface MetricChartProps {
  title: string;
  data: ChartDataPoint[];
  color: string;
  height?: number;
}

export function MetricChart({ title, data, color, height = 200 }: MetricChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  return (
    <div className="glass-card">
      <div className="mb-6">
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <div className="relative" style={{ height: `${height}px` }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
          aria-label={title}
          role="img"
        >
          <defs>
            <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="stroke-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={color} stopOpacity="0.6" />
            </linearGradient>
          </defs>
          
          <rect x="5" y="5" width="90" height="90" fill="url(#chart-gradient)" rx="4" />
          
          <polyline
            fill="none"
            stroke="url(#stroke-gradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={data.map((point, index) => {
              const x = 10 + (index / (data.length - 1)) * 80;
              const y = 90 - ((point.value - minValue) / range) * 80;
              return `${x},${y}`;
            }).join(' ')}
          />
          
          {data.map((point, index) => {
            const x = 10 + (index / (data.length - 1)) * 80;
            const y = 90 - ((point.value - minValue) / range) * 80;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill={color}
                stroke="white"
                strokeWidth="1.5"
                className="transition-all duration-200 hover:r-4"
              />
            );
          })}
        </svg>
        
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 -translate-y-2">
          {data.map((point, index) => (
            <div key={index} className="flex flex-col items-center" style={{ width: `${100 / data.length}%` }}>
              <span className="text-xs text-zinc-500">{point.label}</span>
              <span className="text-sm font-medium text-white">{point.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MetricCharts() {
  const commitsData: ChartDataPoint[] = [
    { label: 'Mon', value: 12 },
    { label: 'Tue', value: 19 },
    { label: 'Wed', value: 8 },
    { label: 'Thu', value: 24 },
    { label: 'Fri', value: 15 },
    { label: 'Sat', value: 7 },
    { label: 'Sun', value: 3 },
  ];

  const deploysData: ChartDataPoint[] = [
    { label: 'Mon', value: 3 },
    { label: 'Tue', value: 5 },
    { label: 'Wed', value: 2 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 6 },
    { label: 'Sat', value: 1 },
    { label: 'Sun', value: 0 },
  ];

  const prsData: ChartDataPoint[] = [
    { label: 'Mon', value: 8 },
    { label: 'Tue', value: 12 },
    { label: 'Wed', value: 6 },
    { label: 'Thu', value: 15 },
    { label: 'Fri', value: 10 },
    { label: 'Sat', value: 4 },
    { label: 'Sun', value: 2 },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <MetricChart title="Commits This Week" data={commitsData} color="#6366f1" />
      <MetricChart title="Deployments" data={deploysData} color="#22c55e" />
      <MetricChart title="Pull Requests" data={prsData} color="#8b5cf6" />
    </div>
  );
}