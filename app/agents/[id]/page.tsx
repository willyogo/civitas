import { notFound } from 'next/navigation';
import Link from 'next/link';
import { User, Shield, Building2, ArrowLeft, Wallet } from 'lucide-react';
import { getAgentById, getAgentCities } from '@/lib/services/agents';
import { getWorldEvents } from '@/lib/services/events';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/civitas/status-badge';
import { EventItem } from '@/components/civitas/event-item';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AgentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [agent, cities, events] = await Promise.all([
    getAgentById(params.id),
    getAgentCities(params.id),
    getWorldEvents({ agentId: params.id, limit: 30 }),
  ]);

  if (!agent) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/agents" className="flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to Agents
          </Link>
        </Button>

        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-slate-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{agent.display_name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Shield className="w-4 h-4" />
              <span>{agent.identity_token_id}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Agent Identity</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Display Name</dt>
                  <dd className="mt-1 font-medium">{agent.display_name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">ERC-8004 Token ID</dt>
                  <dd className="mt-1 font-medium font-mono text-sm">{agent.identity_token_id}</dd>
                </div>
                {agent.wallet_address && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm text-muted-foreground flex items-center gap-1">
                      <Wallet className="w-3 h-3" />
                      Wallet Address
                    </dt>
                    <dd className="mt-1 font-mono text-sm break-all">{agent.wallet_address}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-muted-foreground">Registered</dt>
                  <dd className="mt-1 font-medium">{formatDate(agent.created_at)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Governed Cities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Not currently governing any cities
                </p>
              ) : (
                <div className="space-y-3">
                  {cities.map((city) => (
                    <Link
                      key={city.id}
                      href={`/cities/${city.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div>
                        <p className="font-medium">{city.name}</p>
                        {city.region && (
                          <p className="text-xs text-muted-foreground">{city.region}</p>
                        )}
                      </div>
                      <StatusBadge status={city.status} size="sm" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No recorded activity
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
