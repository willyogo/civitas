import Link from 'next/link';
import { Radio, ArrowRight, Newspaper, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCities, getCityStats } from '@/lib/services/cities';
import { getAgentCount } from '@/lib/services/agents';
import { getWorldEvents } from '@/lib/services/events';
import { getRecentBeaconsCount } from '@/lib/services/beacons';
import { getLatestReport } from '@/lib/services/reports';
import {
  getWorldCycleInfo,
  getRealmResourceStats,
  getDevelopmentFocusStats,
} from '@/lib/services/world-cycles';
import { CityCard } from '@/components/civitas/city-card';
import { EventItem } from '@/components/civitas/event-item';
import { DashboardStats } from '@/components/civitas/dashboard-stats';
import { DashboardMap } from '@/components/civitas/dashboard-map';
import { CycleCountdown } from '@/components/civitas/cycle-countdown';
import { RealmResources } from '@/components/civitas/realm-resources';
import { DevelopmentFocusChart } from '@/components/civitas/development-focus-chart';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function DashboardData() {
  const [
    cities,
    stats,
    agentCount,
    events,
    beaconsLast24h,
    dailyReport,
    weeklyReport,
    cycleInfo,
    resourceStats,
    focusStats,
  ] = await Promise.all([
    getCities(),
    getCityStats(),
    getAgentCount(),
    getWorldEvents({ limit: 10 }),
    getRecentBeaconsCount(24),
    getLatestReport('DAILY'),
    getLatestReport('WEEKLY'),
    getWorldCycleInfo(),
    getRealmResourceStats(),
    getDevelopmentFocusStats(),
  ]);

  return {
    cities,
    stats,
    agentCount,
    events,
    beaconsLast24h,
    dailyReport,
    weeklyReport,
    cycleInfo,
    resourceStats,
    focusStats,
  };
}

export default async function DashboardPage() {
  const {
    cities,
    stats,
    agentCount,
    events,
    beaconsLast24h,
    dailyReport,
    weeklyReport,
    cycleInfo,
    resourceStats,
    focusStats,
  } = await DashboardData();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 animate-fade-in-up opacity-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">World Dashboard</h1>
              <p className="text-muted-foreground">
                Real-time state of the Zero-One realm
              </p>
            </div>
          </div>
          <CycleCountdown cycleInfo={cycleInfo} />
        </div>
      </div>

      <DashboardStats
        stats={stats}
        agentCount={agentCount}
        beaconsLast24h={beaconsLast24h}
      />

      <div className="grid gap-6 lg:grid-cols-3 mb-8 animate-fade-in-up opacity-0 stagger-2">
        <DashboardMap cities={cities} stats={stats} />
        <RealmResources resources={resourceStats} />
        <DevelopmentFocusChart focusStats={focusStats} />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <section className="animate-fade-in-up opacity-0 stagger-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Cities</h2>
              <Button variant="ghost" size="sm" asChild className="group">
                <Link href="/cities" className="flex items-center gap-1">
                  View all
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {cities.slice(0, 4).map((city, index) => (
                <CityCard key={city.id} city={city} index={index} />
              ))}
            </div>
          </section>

          {(dailyReport || weeklyReport) && (
            <section className="animate-fade-in-up opacity-0 stagger-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Latest Reports</h2>
                <Button variant="ghost" size="sm" asChild className="group">
                  <Link href="/news" className="flex items-center gap-1">
                    <Newspaper className="w-4 h-4" />
                    World News
                  </Link>
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {dailyReport && (
                  <Card className="hover-lift group transition-all duration-300 hover:border-blue-200">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded group-hover:bg-blue-100 transition-colors">
                          Daily
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(dailyReport.generated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-medium mb-2 group-hover:text-primary transition-colors">{dailyReport.headline}</h3>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/news">Read Report</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
                {weeklyReport && (
                  <Card className="hover-lift group transition-all duration-300 hover:border-emerald-200">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded group-hover:bg-emerald-100 transition-colors">
                          Weekly
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(weeklyReport.generated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-medium mb-2 group-hover:text-primary transition-colors">{weeklyReport.headline}</h3>
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

        <div className="animate-slide-in-right opacity-0 stagger-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Events</h2>
            <Button variant="ghost" size="sm" asChild className="group">
              <Link href="/news" className="flex items-center gap-1">
                All events
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
          <Card className="overflow-hidden">
            <CardContent className="pt-4">
              {events.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                    <Radio className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No events recorded yet
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Events will appear here as agents interact
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {events.map((event, index) => (
                    <div
                      key={event.id}
                      className="animate-fade-in-up opacity-0"
                      style={{
                        animationDelay: `${0.5 + index * 0.05}s`,
                        animationFillMode: 'forwards',
                      }}
                    >
                      <EventItem event={event} compact />
                    </div>
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
