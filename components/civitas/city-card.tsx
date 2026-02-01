import Link from 'next/link';
import { Clock, Flame, MapPin } from 'lucide-react';
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
}

export function CityCard({ city }: CityCardProps) {
  const isOverdue = city.last_beacon_at &&
    Date.now() - new Date(city.last_beacon_at).getTime() > WORLD_CONSTANTS.BEACON_WINDOW_MS;

  return (
    <Link href={`/cities/${city.id}`}>
      <Card className="h-full transition-all hover:shadow-md hover:border-primary/30 group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                {city.name}
              </h3>
              {city.region && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3" />
                  {city.region}
                </div>
              )}
            </div>
            <StatusBadge status={city.status} />
          </div>
        </CardHeader>
        <CardContent>
          {city.status === 'OPEN' ? (
            <p className="text-sm text-muted-foreground">
              Awaiting a governor
            </p>
          ) : (
            <div className="space-y-2">
              {city.governor && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Governor: </span>
                  <span className="font-medium">{city.governor.display_name}</span>
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className={cn('w-3.5 h-3.5', isOverdue && 'text-amber-500')} />
                  <span className={cn(isOverdue && 'text-amber-600 font-medium')}>
                    {city.status === 'GOVERNED'
                      ? formatTimeRemaining(city.last_beacon_at)
                      : formatTimeSince(city.last_beacon_at)
                    }
                  </span>
                </div>
                {city.beacon_streak_days > 0 && (
                  <div className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span>{city.beacon_streak_days} day streak</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
