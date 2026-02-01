'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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

function latLongToXY(lat: number | null, long: number | null): { x: number; y: number } {
  if (lat === null || long === null) {
    return { x: 50, y: 50 };
  }
  const x = ((long + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return { x, y };
}

interface CityStats {
  governed: number;
  contested: number;
  open: number;
}

interface WorldMapProps {
  cities: CityWithGovernor[];
  stats?: CityStats;
  onCityClick?: (cityId: string) => void;
}

export function WorldMap({ cities, stats, onCityClick }: WorldMapProps) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [beaconPulses, setBeaconPulses] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => {
      const newScale = Math.min(Math.max(prev.scale * delta, 0.5), 5);
      return { ...prev, scale: newScale };
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).closest('svg')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  }, [transform.x, transform.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const mappedCities: CityPosition[] = cities.map(city => {
    const pos = latLongToXY(city.latitude, city.longitude);
    return {
      id: city.id,
      name: city.name,
      x: pos.x,
      y: pos.y,
      status: city.status,
      governor: city.governor?.display_name,
    };
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden border border-slate-700/50 cursor-grab active:cursor-grabbing"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent pointer-events-none" />

      <div
        className="absolute inset-0 origin-center transition-transform duration-75"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
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
                    y1={(city.y / 100) * 60}
                    x2={otherCity.x}
                    y2={(otherCity.y / 100) * 60}
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
              onClick={(e) => {
                e.stopPropagation();
                onCityClick?.(city.id);
              }}
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
                  'absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded bg-slate-900/90 backdrop-blur text-xs text-white whitespace-nowrap transition-all duration-200 z-50',
                  'opacity-0 translate-y-1',
                  hoveredCity === city.id && 'opacity-100 translate-y-0'
                )}
                style={{ transform: `translateX(-50%) scale(${1 / transform.scale})` }}
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
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-slate-900/90 to-transparent pointer-events-none">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="text-slate-300">Governed</span>
            {stats && <span className="text-emerald-400 font-semibold ml-1">{stats.governed}</span>}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <span className="text-slate-300">Contested</span>
            {stats && <span className="text-amber-400 font-semibold ml-1">{stats.contested}</span>}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-500 shadow-sm shadow-slate-500/50" />
            <span className="text-slate-300">Open</span>
            {stats && <span className="text-slate-400 font-semibold ml-1">{stats.open}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
