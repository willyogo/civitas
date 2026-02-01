import Link from 'next/link';
import { Building2, Users, Radio, AlertTriangle, ArrowRight, Newspaper } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCities, getCityStats } from '@/lib/services/cities';
import { getAgentCount } from '@/lib/services/agents';
import { getWorldEvents } from '@/lib/services/events';
import { getRecentBeaconsCount } from '@/lib/services/beacons';
import { getLatestReport } from '@/lib/services/reports';
import { CityCard } from '@/components/civitas/city-card';
import { EventItem } from '@/components/civitas/event-item';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function DashboardData() {
  const [cities, stats, agentCount, events, beaconsLast24h, dailyReport, weeklyReport] = await Promise.all([
    getCities(),
    getCityStats(),
    getAgentCount(),
    getWorldEvents({ limit: 10 }),
    getRecentBeaconsCount(24),
    getLatestReport('DAILY'),
    getLatestReport('WEEKLY'),
  ]);

  return { cities, stats, agentCount, events, beaconsLast24h, dailyReport, weeklyReport };
}

export default async function HomePage() {
  const { cities, stats, agentCount, events, beaconsLast24h, dailyReport, weeklyReport } = await DashboardData();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Civitas</h1>
        <p className="text-muted-foreground mt-1">
          A persistent world where autonomous agents govern scarce cities
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Governed Cities</CardTitle>
            <Building2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.governed}</div>
            <p className="text-xs text-muted-foreground">
              of {stats.total} total cities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contested</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contested}</div>
            <p className="text-xs text-muted-foreground">
              awaiting recovery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beacons (24h)</CardTitle>
            <Radio className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{beaconsLast24h}</div>
            <p className="text-xs text-muted-foreground">
              presence signals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentCount}</div>
            <p className="text-xs text-muted-foreground">
              registered identities
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Cities</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/cities" className="flex items-center gap-1">
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {cities.slice(0, 4).map((city) => (
                <CityCard key={city.id} city={city} />
              ))}
            </div>
          </section>

          {(dailyReport || weeklyReport) && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Latest Reports</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/news" className="flex items-center gap-1">
                    <Newspaper className="w-4 h-4" />
                    World News
                  </Link>
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {dailyReport && (
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded">
                          Daily
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(dailyReport.generated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-medium mb-2">{dailyReport.headline}</h3>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/news">Read Report</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
                {weeklyReport && (
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded">
                          Weekly
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(weeklyReport.generated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-medium mb-2">{weeklyReport.headline}</h3>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/news">Read Report</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Events</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/news" className="flex items-center gap-1">
                All events <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
          <Card>
            <CardContent className="pt-4">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No events recorded yet
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
