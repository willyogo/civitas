'use client';

import Link from 'next/link';
import { Clock, Flame, MapPin, Radio, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StatusBadge } from './status-badge';
import type { CityWithGovernor } from '@/lib/types/database';
import { WORLD_CONSTANTS } from '@/lib/constants';

function formatTimeRemaining(lastBeaconAt: string | null): string {
  if (!lastBeaconAt) return 'No beacon yet';

  const lastBeacon = new Date(lastBeaconAt).getTime();
  const deadline = lastBeacon + WORLD_CONSTANTS.BEACON_WINDOW_MS;
  const remaining = deadline - Date.now();

  if (remaining <= 0) return 'Overdue';

  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);

  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

function formatTimeSince(dateString: string | null): string {
  if (!dateString) return 'Never';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

interface CityCardProps {
  city: CityWithGovernor;
  index?: number;
}

export function CityCard({ city, index = 0 }: CityCardProps) {
  const isOverdue = city.last_beacon_at &&
    Date.now() - new Date(city.last_beacon_at).getTime() > WORLD_CONSTANTS.BEACON_WINDOW_MS;

  const statusStyles = {
    GOVERNED: {
      ring: 'group-hover:ring-emerald-200',
      gradient: 'from-emerald-500/10 to-transparent',
      icon: 'bg-emerald-100 text-emerald-600',
    },
    CONTESTED: {
      ring: 'group-hover:ring-amber-200',
      gradient: 'from-amber-500/10 to-transparent',
      icon: 'bg-amber-100 text-amber-600',
    },
    OPEN: {
      ring: 'group-hover:ring-slate-200',
      gradient: 'from-slate-500/5 to-transparent',
      icon: 'bg-slate-100 text-slate-600',
    },
    FALLEN: {
      ring: 'group-hover:ring-red-200',
      gradient: 'from-red-500/10 to-transparent',
      icon: 'bg-red-100 text-red-600',
    },
  };

  const styles = statusStyles[city.status] || statusStyles.OPEN;

  return (
    <Link
      href={`/cities/${city.id}`}
      className="block animate-fade-in-scale opacity-0"
      style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
    >
      <Card className={cn(
        'h-full transition-all duration-300 group relative overflow-hidden',
        'hover:shadow-lg hover:-translate-y-1',
        'hover:ring-2 ring-offset-2',
        styles.ring
      )}>
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          styles.gradient
        )} />

        {city.status === 'GOVERNED' && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="relative">
              <Radio className="w-4 h-4 text-emerald-500" />
              <div className="absolute inset-0 animate-beacon-pulse">
                <Radio className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>
        )}

        <CardHeader className="pb-3 relative">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300',
                'group-hover:scale-110 group-hover:rotate-3',
                styles.icon
              )}>
                {city.status === 'OPEN' ? (
                  <MapPin className="w-5 h-5" />
                ) : (
                  <Shield className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                  {city.name}
                </h3>
                {city.region && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {city.region}
                  </div>
                )}
              </div>
            </div>
            <StatusBadge status={city.status} />
          </div>
        </CardHeader>

        <CardContent className="relative">
          {city.status === 'OPEN' ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full w-0 bg-emerald-500 rounded-full group-hover:w-full transition-all duration-700 ease-out" />
              </div>
              <span className="text-xs text-muted-foreground group-hover:text-emerald-600 transition-colors">
                Claim now
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {city.governor && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Governor: </span>
                  <span className="font-medium group-hover:text-primary transition-colors">
                    {city.governor.display_name}
                  </span>
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className={cn(
                    'w-3.5 h-3.5 transition-colors',
                    isOverdue && 'text-amber-500 animate-pulse'
                  )} />
                  <span className={cn(
                    'transition-colors',
                    isOverdue && 'text-amber-600 font-medium'
                  )}>
                    {city.status === 'GOVERNED'
                      ? formatTimeRemaining(city.last_beacon_at)
                      : formatTimeSince(city.last_beacon_at)
                    }
                  </span>
                </div>
                {city.beacon_streak_days > 0 && (
                  <div className="flex items-center gap-1.5 group/streak">
                    <Flame className="w-3.5 h-3.5 text-orange-500 group-hover/streak:animate-pulse" />
                    <span className="tabular-nums">{city.beacon_streak_days}</span>
                    <span className="text-muted-foreground/70">day streak</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Card>
    </Link>
  );
}
