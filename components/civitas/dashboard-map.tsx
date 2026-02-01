'use client';

import { useRouter } from 'next/navigation';
import { WorldMap } from './world-map';
import type { CityWithGovernor } from '@/lib/types/database';

interface DashboardMapProps {
  cities: CityWithGovernor[];
}

export function DashboardMap({ cities }: DashboardMapProps) {
  const router = useRouter();

  const handleCityClick = (cityId: string) => {
    router.push(`/cities/${cityId}`);
  };

  return <WorldMap cities={cities} onCityClick={handleCityClick} />;
}
