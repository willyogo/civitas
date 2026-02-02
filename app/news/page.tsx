import { Suspense } from 'react';
import { getWorldEvents, getRecentBeacons } from '@/lib/services/events';
import { getReports } from '@/lib/services/reports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventItem } from '@/components/civitas/event-item';
import { Skeleton } from '@/components/ui/skeleton';
import { Radio, MapPin, User } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatReportDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

async function EventsFeed() {
  const events = await getWorldEvents({ limit: 50 });

  return (
    <div className="space-y-1 divide-y">
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No events recorded yet. The world awaits its first actions.
        </p>
      ) : (
        events.map((event) => <EventItem key={event.id} event={event} />)
      )}
    </div>
  );
}

async function ReportsSection() {
  const [dailyReports, weeklyReports] = await Promise.all([
    getReports('DAILY', 5),
    getReports('WEEKLY', 5),
  ]);

  const allReports = [...dailyReports, ...weeklyReports].sort(
    (a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
  );

  return (
    <div className="space-y-6">
      {allReports.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No reports generated yet. Check back after the first daily cycle.
        </p>
      ) : (
        allReports.map((report) => (
          <Card key={report.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded ${report.period === 'DAILY'
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-emerald-50 text-emerald-700'
                    }`}
                >
                  {report.period}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatReportDate(report.generated_at)}
                </span>
              </div>
              <CardTitle className="text-xl">{report.headline}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm prose-slate max-w-none">
                {report.summary_markdown.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) {
                    return (
                      <h3 key={i} className="text-base font-semibold mt-4 mb-2">
                        {line.replace('## ', '')}
                      </h3>
                    );
                  }
                  if (line.startsWith('- ')) {
                    return (
                      <p key={i} className="text-sm text-muted-foreground ml-4 my-1">
                        {line}
                      </p>
                    );
                  }
                  if (line.startsWith('---')) {
                    return <hr key={i} className="my-4" />;
                  }
                  if (line.startsWith('*') && line.endsWith('*')) {
                    return (
                      <p key={i} className="text-xs text-muted-foreground italic mt-4">
                        {line.replace(/\*/g, '')}
                      </p>
                    );
                  }
                  if (line.trim()) {
                    return (
                      <p key={i} className="text-sm my-2">
                        {line.replace(/\*\*/g, '')}
                      </p>
                    );
                  }
                  return null;
                })}
              </div>

              {report.metrics && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Period Metrics</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-emerald-600">
                        {report.metrics.active_governed_cities}
                      </div>
                      <div className="text-xs text-muted-foreground">Governed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-amber-600">
                        {report.metrics.contested_cities}
                      </div>
                      <div className="text-xs text-muted-foreground">Contested</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {report.metrics.beacons_emitted}
                      </div>
                      <div className="text-xs text-muted-foreground">Beacons</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-600">
                        {report.metrics.total_agents}
                      </div>
                      <div className="text-xs text-muted-foreground">Agents</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

async function BeaconsFeed() {
  const beacons = await getRecentBeacons(50);

  return (
    <div className="space-y-3">
      {beacons.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No beacons emitted yet. Governors must emit beacons to maintain their cities.
        </p>
      ) : (
        beacons.map((beacon) => (
          <div
            key={beacon.id}
            className="flex gap-4 p-4 border rounded-lg hover:bg-secondary/20 transition-colors"
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Radio className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-sm">
                  {beacon.city?.name || 'Unknown City'}
                </span>
                {beacon.recovered && (
                  <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                    Recovered
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <User className="w-3 h-3" />
                <span>{beacon.agent?.display_name || 'Unknown Agent'}</span>
                <span>•</span>
                <span>
                  {new Date(beacon.emitted_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {beacon.message && (
                <p className="text-sm text-foreground italic border-l-2 border-blue-200 pl-3 py-1">
                  "{beacon.message}"
                </p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WorldNewsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">World News</h1>
        <p className="text-muted-foreground mt-1">
          The immutable chronicle of Zero-One — history as it unfolds
        </p>
      </div>

      <Tabs defaultValue="events" className="space-y-6">
        <TabsList>
          <TabsTrigger value="beacons">Beacons</TabsTrigger>
          <TabsTrigger value="events">Live Events</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="beacons">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="w-5 h-5" />
                Beacon Transmissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<LoadingSkeleton />}>
                <BeaconsFeed />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Event Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<LoadingSkeleton />}>
                <EventsFeed />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Suspense fallback={<LoadingSkeleton />}>
            <ReportsSection />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
