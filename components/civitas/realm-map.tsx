'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { Map, Globe2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorldMap } from './world-map';
import type { CityWithGovernor } from '@/lib/types/database';

const GlobeMap = lazy(() => import('./globe-map').then(mod => ({ default: mod.GlobeMap })));

type ViewMode = 'flat' | 'globe';

interface CityStats {
  governed: number;
  contested: number;
  open: number;
}

interface RealmMapProps {
  cities: CityWithGovernor[];
  stats?: CityStats;
  onCityClick?: (cityId: string) => void;
}

export function RealmMap({ cities, stats, onCityClick }: RealmMapProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('flat');

  useEffect(() => {
    const saved = localStorage.getItem('realm-map-view');
    if (saved === 'flat' || saved === 'globe') {
      setViewMode(saved);
    }
  }, []);

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('realm-map-view', mode);
  };

  return (
    <div className="relative">
      <div className="absolute top-3 right-3 z-30 flex gap-1 bg-slate-800/80 backdrop-blur rounded-lg p-1 border border-slate-700/50">
        <button
          onClick={() => handleViewChange('flat')}
          className={cn(
            'p-1.5 rounded transition-all duration-200',
            viewMode === 'flat'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          )}
          title="Flat View"
        >
          <Map className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleViewChange('globe')}
          className={cn(
            'p-1.5 rounded transition-all duration-200',
            viewMode === 'globe'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          )}
          title="Globe View"
        >
          <Globe2 className="w-4 h-4" />
        </button>
      </div>

      {viewMode === 'flat' ? (
        <WorldMap cities={cities} stats={stats} onCityClick={onCityClick} />
      ) : (
        <Suspense
          fallback={
            <div className="relative w-full aspect-[4/3] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden border border-slate-700/50 flex items-center justify-center">
              <div className="text-slate-500">Loading globe...</div>
            </div>
          }
        >
          <GlobeMap cities={cities} stats={stats} onCityClick={onCityClick} />
        </Suspense>
      )}
    </div>
  );
}
