'use client';

import { Building2, Users, Radio, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCounter } from './animated-counter';
import { cn } from '@/lib/utils';

interface DashboardStatsProps {
  stats: {
    total: number;
    governed: number;
    contested: number;
    open: number;
  };
  agentCount: number;
  beaconsLast24h: number;
}

const statCards = [
  {
    key: 'governed',
    title: 'Governed Cities',
    icon: Building2,
    color: 'emerald',
    showTotal: true,
  },
  {
    key: 'contested',
    title: 'Contested',
    icon: AlertTriangle,
    color: 'amber',
    subtitle: 'awaiting recovery',
  },
  {
    key: 'beacons',
    title: 'Beacons (24h)',
    icon: Radio,
    color: 'blue',
    subtitle: 'presence signals',
  },
  {
    key: 'agents',
    title: 'Active Agents',
    icon: Users,
    color: 'sky',
    subtitle: 'registered identities',
  },
];

const colorClasses: Record<string, { icon: string; bg: string; ring: string; glow: string }> = {
  emerald: {
    icon: 'text-emerald-600',
    bg: 'bg-emerald-50 group-hover:bg-emerald-100',
    ring: 'group-hover:ring-emerald-200',
    glow: 'group-hover:shadow-emerald-100/50',
  },
  amber: {
    icon: 'text-amber-600',
    bg: 'bg-amber-50 group-hover:bg-amber-100',
    ring: 'group-hover:ring-amber-200',
    glow: 'group-hover:shadow-amber-100/50',
  },
  blue: {
    icon: 'text-blue-600',
    bg: 'bg-blue-50 group-hover:bg-blue-100',
    ring: 'group-hover:ring-blue-200',
    glow: 'group-hover:shadow-blue-100/50',
  },
  sky: {
    icon: 'text-sky-600',
    bg: 'bg-sky-50 group-hover:bg-sky-100',
    ring: 'group-hover:ring-sky-200',
    glow: 'group-hover:shadow-sky-100/50',
  },
};

export function DashboardStats({ stats, agentCount, beaconsLast24h }: DashboardStatsProps) {
  const values: Record<string, number> = {
    governed: stats.governed,
    contested: stats.contested,
    beacons: beaconsLast24h,
    agents: agentCount,
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        const colors = colorClasses[card.color];

        return (
          <Card
            key={card.key}
            className={cn(
              'group transition-all duration-300 cursor-default',
              'hover:shadow-lg hover:-translate-y-1',
              'hover:ring-2 ring-offset-2',
              colors.ring,
              colors.glow,
              'animate-fade-in-scale opacity-0'
            )}
            style={{
              animationDelay: `${index * 0.1}s`,
              animationFillMode: 'forwards',
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300',
                'group-hover:scale-110 group-hover:rotate-6',
                colors.bg
              )}>
                <Icon className={cn('h-4 w-4', colors.icon)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                <AnimatedCounter
                  value={values[card.key]}
                  duration={1500 + index * 200}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.showTotal ? (
                  <>of {stats.total} total cities</>
                ) : (
                  card.subtitle
                )}
              </p>

              {card.key === 'governed' && stats.total > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-1000"
                      style={{ width: `${(stats.governed / stats.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
