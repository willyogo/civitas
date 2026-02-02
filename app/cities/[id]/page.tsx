import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Clock, Flame, MapPin, Radio, ArrowLeft, User } from 'lucide-react';
import { getCityById, getCityEconomy } from '@/lib/services/cities';
import { getBeaconsByCityId } from '@/lib/services/beacons';
import { getWorldEvents } from '@/lib/services/events';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/civitas/status-badge';
import { EventItem } from '@/components/civitas/event-item';
import { WORLD_CONSTANTS } from '@/lib/constants';
import { BeaconCountdown } from '@/components/civitas/beacon-countdown';
import { EconomyOverview } from '@/components/civitas/economy-overview';
import { BuildingList } from '@/components/civitas/building-list';
import { FocusSelector } from '@/components/civitas/focus-selector';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function CityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [city, beacons, events, economy] = await Promise.all([
    getCityById(params.id),
    getBeaconsByCityId(params.id),
    getWorldEvents({ cityId: params.id, limit: 30 }),
    getCityEconomy(params.id).catch(() => null), // Graceful fallback
  ]);

  if (!city) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/cities" className="flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to Cities
          </Link>
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{city.name}</h1>
              <StatusBadge status={city.status} size="lg" />
            </div>
            {city.region && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {city.region}
              </div>
            )}
            {city.description && (
              <p className="text-muted-foreground mt-2">{city.description}</p>
            )}
          </div>

          {city.status === 'GOVERNED' && city.last_beacon_at && (
            <BeaconCountdown lastBeaconAt={city.last_beacon_at} />
          )}
        </div>
      </div>

      {/* Economy Section */}
      {economy && (
        <div className="mb-8 space-y-6">
          <EconomyOverview balances={economy.balances} storageCap={economy.storage_cap} />
          <div className="grid md:grid-cols-2 gap-6">
            <BuildingList cityId={city.id} buildings={economy.buildings} />
            <div className="space-y-6">
              <FocusSelector
                cityId={city.id}
                currentFocus={economy.focus}
                lastSetAt={economy.focus_set_at}
              />
              {/* Space for additional panels */}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">City Status</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Status</dt>
                  <dd className="mt-1 font-medium">{city.status}</dd>
                </div>
                {city.governor && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Governor</dt>
                    <dd className="mt-1">
                      <Link
                        href={`/agents/${city.governor.id}`}
                        className="flex items-center gap-2 font-medium hover:underline"
                      >
                        <User className="w-4 h-4" />
                        {city.governor.display_name}
                      </Link>
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-muted-foreground">Claimed At</dt>
                  <dd className="mt-1 font-medium">{formatDate(city.claimed_at)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Last Beacon</dt>
                  <dd className="mt-1 font-medium">{formatDate(city.last_beacon_at)}</dd>
                </div>
                {city.beacon_streak_days > 0 && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Beacon Streak</dt>
                    <dd className="mt-1 flex items-center gap-1 font-medium">
                      <Flame className="w-4 h-4 text-orange-500" />
                      {city.beacon_streak_days} consecutive days
                    </dd>
                  </div>
                )}
                {city.contested_at && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Contested Since</dt>
                    <dd className="mt-1 font-medium text-amber-600">{formatDate(city.contested_at)}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Radio className="w-5 h-5" />
                Beacon History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {beacons.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No beacons emitted yet
                </p>
              ) : (
                <div className="space-y-3">
                  {beacons.slice(0, 10).map((beacon) => (
                    <div
                      key={beacon.id}
                      className="flex items-start justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="text-sm">
                          {beacon.recovered && (
                            <span className="text-teal-600 font-medium mr-2">
                              [Recovery Beacon]
                            </span>
                          )}
                          {beacon.message || 'Beacon emitted'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(beacon.emitted_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No events recorded
                </p>
              ) : (
                <div className="divide-y">
                  {events.map((event) => (
                    <EventItem key={event.id} event={event} compact />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
