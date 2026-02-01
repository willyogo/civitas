'use client';

import { useRouter } from 'next/navigation';
import { RealmMap } from './realm-map';
import type { CityWithGovernor } from '@/lib/types/database';

interface CityStats {
  governed: number;
  contested: number;
  open: number;
}

interface DashboardMapProps {
  cities: CityWithGovernor[];
  stats?: CityStats;
}

export function DashboardMap({ cities, stats }: DashboardMapProps) {
  const router = useRouter();

  const handleCityClick = (cityId: string) => {
    router.push(`/cities/${cityId}`);
  };

  return <RealmMap cities={cities} stats={stats} onCityClick={handleCityClick} />;
}
