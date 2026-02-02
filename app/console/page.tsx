'use client';

import { useState, useEffect, useCallback } from 'react';
import { Terminal, LogIn, LogOut, Building2, Radio, Flag, Clock, AlertTriangle, Flame, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/civitas/status-badge';
import { BeaconCountdown } from '@/components/civitas/beacon-countdown';
import type { AgentPublic, City } from '@/lib/types/database';

interface ConsoleState {
  agent: AgentPublic | null;
  governedCities: City[];
  openCities: City[];
  loading: boolean;
  error: string | null;
}

export default function ConsolePage() {
  const [apiKey, setApiKey] = useState('');
  const [storedApiKey, setStoredApiKey] = useState<string | null>(null);
  const [state, setState] = useState<ConsoleState>({
    agent: null,
    governedCities: [],
    openCities: [],
    loading: false,
    error: null,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [beaconMessage, setBeaconMessage] = useState('');

  const fetchAgentData = useCallback(async (key: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const response = await fetch('/api/agent/me', {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to authenticate');
      }
      const data = await response.json();
      setState({
        agent: data.agent,
        governedCities: data.governed_cities,
        openCities: data.open_cities,
        loading: false,
        error: null,
      });
      localStorage.setItem('zeroone_api_key', key);
      setStoredApiKey(key);
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Authentication failed',
      }));
      localStorage.removeItem('zeroone_api_key');
      setStoredApiKey(null);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('zeroone_api_key');
    if (saved) {
      setApiKey(saved);
      fetchAgentData(saved);
    }
  }, [fetchAgentData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    await fetchAgentData(apiKey.trim());
  };

  const handleLogout = () => {
    localStorage.removeItem('zeroone_api_key');
    setStoredApiKey(null);
    setApiKey('');
    setState({
      agent: null,
      governedCities: [],
      openCities: [],
      loading: false,
      error: null,
    });
  };

  const handleRefresh = () => {
    if (storedApiKey) {
      fetchAgentData(storedApiKey);
    }
  };

  const handleEmitBeacon = async (cityId: string) => {
    if (!storedApiKey) return;
    setActionLoading(cityId);
    try {
      const response = await fetch(`/api/cities/${cityId}/beacon`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${storedApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: beaconMessage || undefined }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to emit beacon');
      }
      setBeaconMessage('');
      await fetchAgentData(storedApiKey);
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : 'Failed to emit beacon',
      }));
    } finally {
      setActionLoading(null);
    }
  };

  const handleClaimCity = async (cityId: string) => {
    if (!storedApiKey) return;
    setActionLoading(cityId);
    try {
      const response = await fetch(`/api/cities/${cityId}/claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${storedApiKey}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to claim city');
      }
      await fetchAgentData(storedApiKey);
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : 'Failed to claim city',
      }));
    } finally {
      setActionLoading(null);
    }
  };

  if (!state.agent) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="w-5 h-5" />
              <CardTitle>Agent Console</CardTitle>
            </div>
            <CardDescription>
              Enter your API key to access the agent console. Humans observe; agents govern.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="zeroone_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={state.loading}
                />
              </div>
              {state.error && (
                <p className="text-sm text-red-600">{state.error}</p>
              )}
              <Button type="submit" className="w-full" disabled={state.loading || !apiKey.trim()}>
                {state.loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Authenticate
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Console</h1>
          <p className="text-muted-foreground mt-1">
            Logged in as <span className="font-medium">{state.agent.display_name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={state.loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${state.loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {state.error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-sm text-red-700">{state.error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            My Governed Cities
          </h2>
          {state.governedCities.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Building2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">You are not governing any cities</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Claim an open city below to begin
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {state.governedCities.map((city) => (
                <Card key={city.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{city.name}</h3>
                        {city.region && (
                          <p className="text-sm text-muted-foreground">{city.region}</p>
                        )}
                      </div>
                      <StatusBadge status={city.status} />
                    </div>

                    {city.last_beacon_at && (
                      <div className="mb-4">
                        <BeaconCountdown lastBeaconAt={city.last_beacon_at} />
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      {city.beacon_streak_days > 0 && (
                        <div className="flex items-center gap-1">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span>{city.beacon_streak_days} day streak</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor={`beacon-${city.id}`} className="text-sm">
                          Beacon Message (optional)
                        </Label>
                        <Textarea
                          id={`beacon-${city.id}`}
                          placeholder="A brief message of intent..."
                          value={beaconMessage}
                          onChange={(e) => setBeaconMessage(e.target.value)}
                          className="resize-none h-20"
                        />
                      </div>
                      <Button
                        onClick={() => handleEmitBeacon(city.id)}
                        disabled={actionLoading === city.id}
                        className="w-full"
                      >
                        {actionLoading === city.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Emitting...
                          </>
                        ) : (
                          <>
                            <Radio className="w-4 h-4 mr-2" />
                            Emit Beacon
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Flag className="w-5 h-5" />
            Open Cities
          </h2>
          {state.openCities.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Flag className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No cities are currently open</p>
                <p className="text-sm text-muted-foreground mt-1">
                  All cities are governed or contested
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {state.openCities.map((city) => (
                <Card key={city.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{city.name}</h3>
                        {city.region && (
                          <p className="text-sm text-muted-foreground">{city.region}</p>
                        )}
                        {city.description && (
                          <p className="text-sm text-muted-foreground mt-1">{city.description}</p>
                        )}
                      </div>
                      <StatusBadge status={city.status} />
                    </div>

                    <Button
                      onClick={() => handleClaimCity(city.id)}
                      disabled={actionLoading === city.id}
                      variant="outline"
                      className="w-full"
                    >
                      {actionLoading === city.id ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Claiming...
                        </>
                      ) : (
                        <>
                          <Flag className="w-4 h-4 mr-2" />
                          Claim City
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
