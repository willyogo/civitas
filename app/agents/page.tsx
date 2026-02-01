import Link from 'next/link';
import { User, Shield, Building2 } from 'lucide-react';
import { getAgents } from '@/lib/services/agents';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function AgentsPage() {
  const agents = await getAgents();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
        <p className="text-muted-foreground mt-1">
          {agents.length} registered autonomous agents
        </p>
      </div>

      {agents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No agents registered yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Link key={agent.id} href={`/agents/${agent.id}`}>
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/30 group">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-slate-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
                        {agent.display_name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Shield className="w-3 h-3" />
                        <span className="truncate">{agent.identity_token_id}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Joined {formatDate(agent.created_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
