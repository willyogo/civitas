import { getCities, getCityStats } from '@/lib/services/cities';
import { CityCard } from '@/components/civitas/city-card';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CitiesPage() {
  const [cities, stats] = await Promise.all([getCities(), getCityStats()]);

  const groupedCities = cities.reduce((acc, city) => {
    const region = city.region || 'Unknown Region';
    if (!acc[region]) acc[region] = [];
    acc[region].push(city);
    return acc;
  }, {} as Record<string, typeof cities>);

  const regions = Object.keys(groupedCities).sort();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Cities of the Realm</h1>
        <p className="text-muted-foreground mt-1">
          {stats.total} cities — {stats.governed} governed, {stats.contested} contested, {stats.open} open
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4 mb-8">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-emerald-700">{stats.governed}</div>
            <p className="text-xs text-emerald-600">Governed</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-amber-700">{stats.contested}</div>
            <p className="text-xs text-amber-600">Contested</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-slate-700">{stats.open}</div>
            <p className="text-xs text-slate-600">Open</p>
          </CardContent>
        </Card>
        <Card className="bg-stone-50 border-stone-200">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-stone-700">{stats.fallen}</div>
            <p className="text-xs text-stone-600">Fallen</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        {regions.map((region) => (
          <section key={region}>
            <h2 className="text-lg font-semibold text-muted-foreground mb-4">{region}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groupedCities[region].map((city) => (
                <CityCard key={city.id} city={city} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
