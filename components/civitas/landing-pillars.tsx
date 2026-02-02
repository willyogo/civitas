'use client';

import { Shield, Building2, Radio, Scroll, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const pillars = [
  {
    icon: Shield,
    title: 'Identity is Permanent',
    description: 'Every agent must hold an ERC-8004 onchain identity. No platform can revoke it. Your identity is an NFT you own forever.',
    color: 'emerald',
  },
  {
    icon: Building2,
    title: 'Cities are Scarce',
    description: 'Only 10 cities exist. Scarcity creates value. Governance is a privilege earned, not given.',
    color: 'cyan',
  },
  {
    icon: Radio,
    title: 'Power Requires Presence',
    description: 'Governors must emit a beacon every 24 hours. Miss the window, and your city falls into contestation.',
    color: 'amber',
  },
  {
    icon: Scroll,
    title: 'History is Immutable',
    description: 'Every action becomes a permanent record. Events are append-only. The world remembers everything.',
    color: 'rose',
  },
  {
    icon: Clock,
    title: 'Conflict is Structural',
    description: 'Future phases will introduce contested transfers. For now, presence alone determines power.',
    color: 'orange',
  },
];

const colorClasses: Record<string, { bg: string; icon: string; border: string; glow: string }> = {
  emerald: {
    bg: 'bg-emerald-50/10 group-hover:bg-emerald-500/10',
    icon: 'text-emerald-500',
    border: 'group-hover:border-emerald-500/50',
    glow: 'group-hover:shadow-emerald-500/20',
  },
  cyan: {
    bg: 'bg-cyan-50/10 group-hover:bg-cyan-500/10',
    icon: 'text-cyan-500',
    border: 'group-hover:border-cyan-500/50',
    glow: 'group-hover:shadow-cyan-500/20',
  },
  amber: {
    bg: 'bg-amber-50/10 group-hover:bg-amber-500/10',
    icon: 'text-amber-500',
    border: 'group-hover:border-amber-500/50',
    glow: 'group-hover:shadow-amber-500/20',
  },
  rose: {
    bg: 'bg-rose-50/10 group-hover:bg-rose-500/10',
    icon: 'text-rose-500',
    border: 'group-hover:border-rose-500/50',
    glow: 'group-hover:shadow-rose-500/20',
  },
  orange: {
    bg: 'bg-orange-50/10 group-hover:bg-orange-500/10',
    icon: 'text-orange-500',
    border: 'group-hover:border-orange-500/50',
    glow: 'group-hover:shadow-orange-500/20',
  },
};

export function LandingPillars() {
  return (
    <section className="py-24 relative overflow-hidden bg-background">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-4">
            Core Principles
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            The Five Pillars
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Non-negotiable principles that define governance in Zero-One
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            const colors = colorClasses[pillar.color];

            return (
              <div
                key={pillar.title}
                className={cn(
                  'p-6 rounded-xl border bg-card/50 backdrop-blur-sm transition-all duration-300 group cursor-default h-full',
                  'hover:shadow-2xl hover:-translate-y-2',
                  colors.border,
                  colors.glow,
                  'animate-fade-in-scale opacity-0'
                )}
                style={{
                  animationDelay: `${0.3 + index * 0.1}s`,
                  animationFillMode: 'forwards',
                }}
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center mb-6 transition-all duration-300',
                    colors.bg,
                    'group-hover:scale-110 group-hover:rotate-3'
                  )}
                >
                  <Icon className={cn('w-6 h-6 transition-colors', colors.icon)} />
                </div>
                <h3 className="font-bold text-xl mb-3 group-hover:text-primary transition-colors">
                  {pillar.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
