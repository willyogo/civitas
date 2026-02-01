'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { CityWithGovernor } from '@/lib/types/database';

interface CityPosition {
  id: string;
  name: string;
  x: number;
  y: number;
  status: string;
  governor?: string;
}

const cityPositions: Record<string, { x: number; y: number }> = {
  'Athens': { x: 58, y: 38 },
  'Rome': { x: 52, y: 35 },
  'Cairo': { x: 60, y: 48 },
  'Constantinople': { x: 62, y: 34 },
  'Carthage': { x: 48, y: 42 },
  'Alexandria': { x: 62, y: 46 },
  'Babylon': { x: 70, y: 42 },
  'Jerusalem': { x: 64, y: 44 },
  'Damascus': { x: 66, y: 40 },
  'Memphis': { x: 60, y: 50 },
};

interface WorldMapProps {
  cities: CityWithGovernor[];
  onCityClick?: (cityId: string) => void;
}

export function WorldMap({ cities, onCityClick }: WorldMapProps) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [beaconPulses, setBeaconPulses] = useState<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      const governedCities = cities.filter(c => c.status === 'GOVERNED');
      if (governedCities.length > 0) {
        const randomCity = governedCities[Math.floor(Math.random() * governedCities.length)];
        setBeaconPulses(prev => {
          const arr = Array.from(prev);
          arr.push(randomCity.id);
          return new Set(arr);
        });
        setTimeout(() => {
          setBeaconPulses(prev => {
            const next = new Set(Array.from(prev));
            next.delete(randomCity.id);
            return next;
          });
        }, 2000);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [cities]);

  const mappedCities: CityPosition[] = cities.map(city => ({
    id: city.id,
    name: city.name,
    x: cityPositions[city.name]?.x || 50,
    y: cityPositions[city.name]?.y || 50,
    status: city.status,
    governor: city.governor?.display_name,
  }));

  return (
    <div className="relative w-full aspect-[16/9] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden border border-slate-700/50">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />

      <svg
        viewBox="0 0 100 60"
        className="absolute inset-0 w-full h-full opacity-30"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M 5 0 L 0 0 0 5" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-emerald-500/30" />
          </pattern>
        </defs>
        <rect width="100" height="60" fill="url(#grid)" />

        {mappedCities.map((city, i) =>
          mappedCities.slice(i + 1).map(otherCity => {
            if (city.status !== 'OPEN' && otherCity.status !== 'OPEN') {
              return (
                <line
                  key={`${city.id}-${otherCity.id}`}
                  x1={city.x}
                  y1={city.y}
                  x2={otherCity.x}
                  y2={otherCity.y}
                  className="stroke-emerald-500/10"
                  strokeWidth="0.15"
                  strokeDasharray="0.5 0.5"
                />
              );
            }
            return null;
          })
        )}
      </svg>

      <div className="absolute inset-0">
        {mappedCities.map((city) => (
          <div
            key={city.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{ left: `${city.x}%`, top: `${city.y}%` }}
            onMouseEnter={() => setHoveredCity(city.id)}
            onMouseLeave={() => setHoveredCity(null)}
            onClick={() => onCityClick?.(city.id)}
          >
            {beaconPulses.has(city.id) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-8 h-8 rounded-full bg-emerald-400 animate-beacon-pulse" />
                <div
                  className="absolute w-8 h-8 rounded-full bg-emerald-400 animate-beacon-pulse"
                  style={{ animationDelay: '0.5s' }}
                />
              </div>
            )}

            <div
              className={cn(
                'relative w-4 h-4 rounded-full transition-all duration-300',
                city.status === 'GOVERNED' && 'bg-emerald-500 shadow-lg shadow-emerald-500/50',
                city.status === 'CONTESTED' && 'bg-amber-500 shadow-lg shadow-amber-500/50 animate-pulse',
                city.status === 'OPEN' && 'bg-slate-500 shadow-lg shadow-slate-500/30',
                city.status === 'FALLEN' && 'bg-red-500 shadow-lg shadow-red-500/50',
                'group-hover:scale-150 group-hover:ring-2 group-hover:ring-white/30'
              )}
            >
              <div className="absolute inset-1 rounded-full bg-white/30" />
            </div>

            <div
              className={cn(
                'absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded bg-slate-900/90 backdrop-blur text-xs text-white whitespace-nowrap transition-all duration-200',
                'opacity-0 translate-y-1',
                hoveredCity === city.id && 'opacity-100 translate-y-0'
              )}
            >
              <div className="font-medium">{city.name}</div>
              <div className={cn(
                'text-[10px]',
                city.status === 'GOVERNED' && 'text-emerald-400',
                city.status === 'CONTESTED' && 'text-amber-400',
                city.status === 'OPEN' && 'text-slate-400',
                city.status === 'FALLEN' && 'text-red-400',
              )}>
                {city.status === 'GOVERNED' && city.governor
                  ? `Gov: ${city.governor}`
                  : city.status}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 right-3 flex gap-3 text-[10px]">
        {[
          { status: 'GOVERNED', color: 'bg-emerald-500', label: 'Governed' },
          { status: 'CONTESTED', color: 'bg-amber-500', label: 'Contested' },
          { status: 'OPEN', color: 'bg-slate-500', label: 'Open' },
        ].map(item => (
          <div key={item.status} className="flex items-center gap-1.5 text-slate-400">
            <div className={cn('w-2 h-2 rounded-full', item.color)} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="absolute top-3 left-3 text-xs text-slate-500 font-mono">
        CIVITAS REALM
      </div>
    </div>
  );
}
