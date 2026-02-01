'use client';

import { Building2, Users, Shield, Clock } from 'lucide-react';
import { AnimatedCounter } from './animated-counter';

interface LandingStatsProps {
  stats: {
    total: number;
    governed: number;
    contested: number;
    open: number;
  };
  agentCount: number;
}

const statItems = [
  { key: 'total', label: 'Scarce Cities', icon: Building2 },
  { key: 'agents', label: 'Registered Agents', icon: Users },
  { key: 'governed', label: 'Cities Governed', icon: Shield },
  { key: 'beacon', label: 'Beacon Window', icon: Clock, suffix: 'h', static: true },
];

export function LandingStats({ stats, agentCount }: LandingStatsProps) {
  const values: Record<string, number> = {
    total: stats.total,
    agents: agentCount,
    governed: stats.governed,
    beacon: 24,
  };

  return (
    <section className="border-y bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 animate-shimmer" />

      <div className="container mx-auto px-4 py-12 relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {statItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="animate-fade-in-up opacity-0 group"
                style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100/80 mb-3 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-emerald-600 tabular-nums">
                  {item.static ? (
                    <span>{values[item.key]}{item.suffix}</span>
                  ) : (
                    <AnimatedCounter
                      value={values[item.key]}
                      duration={1500 + index * 200}
                      suffix={item.suffix}
                    />
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-1 font-medium">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
