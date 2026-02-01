'use client';

import { useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import type { CityWithGovernor } from '@/lib/types/database';

interface GlobeMapProps {
  cities: CityWithGovernor[];
  onCityClick?: (cityId: string) => void;
}

function latLongToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

function CityMarker({
  city,
  position,
  onCityClick,
}: {
  city: CityWithGovernor;
  position: THREE.Vector3;
  onCityClick?: (cityId: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const color = useMemo(() => {
    switch (city.status) {
      case 'GOVERNED':
        return '#10b981';
      case 'CONTESTED':
        return '#f59e0b';
      case 'FALLEN':
        return '#ef4444';
      default:
        return '#64748b';
    }
  }, [city.status]);

  useFrame((state) => {
    if (meshRef.current && city.status === 'CONTESTED') {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.2);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onCityClick?.(city.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 1.5 : 0.8}
        />
      </mesh>
      {city.status === 'GOVERNED' && (
        <mesh>
          <ringGeometry args={[0.04, 0.06, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}
      {hovered && (
        <Html
          position={[0, 0.1, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div className="px-2 py-1 rounded bg-slate-900/95 backdrop-blur text-xs text-white whitespace-nowrap">
            <div className="font-medium">{city.name}</div>
            <div
              className={cn(
                'text-[10px]',
                city.status === 'GOVERNED' && 'text-emerald-400',
                city.status === 'CONTESTED' && 'text-amber-400',
                city.status === 'OPEN' && 'text-slate-400',
                city.status === 'FALLEN' && 'text-red-400'
              )}
            >
              {city.status === 'GOVERNED' && city.governor?.display_name
                ? `Gov: ${city.governor.display_name}`
                : city.status}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function Globe({ cities, onCityClick }: GlobeMapProps) {
  const globeRef = useRef<THREE.Mesh>(null);

  const cityPositions = useMemo(() => {
    return cities.map((city) => ({
      city,
      position: latLongToVector3(city.latitude ?? 0, city.longitude ?? 0, 1.01),
    }));
  }, [cities]);

  const gridLines = useMemo(() => {
    const lines: [number, number, number][][] = [];
    for (let lat = -60; lat <= 60; lat += 30) {
      const points: [number, number, number][] = [];
      for (let lon = -180; lon <= 180; lon += 5) {
        const v = latLongToVector3(lat, lon, 1.002);
        points.push([v.x, v.y, v.z]);
      }
      lines.push(points);
    }
    for (let lon = -180; lon < 180; lon += 30) {
      const points: [number, number, number][] = [];
      for (let lat = -90; lat <= 90; lat += 5) {
        const v = latLongToVector3(lat, lon, 1.002);
        points.push([v.x, v.y, v.z]);
      }
      lines.push(points);
    }
    return lines;
  }, []);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} />

      <Sphere ref={globeRef} args={[1, 64, 64]}>
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.8}
          metalness={0.2}
        />
      </Sphere>

      {gridLines.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#10b981"
          transparent
          opacity={0.15}
          lineWidth={1}
        />
      ))}

      <Sphere args={[1.001, 64, 64]}>
        <meshBasicMaterial
          color="#10b981"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </Sphere>

      {cityPositions.map(({ city, position }) => (
        <CityMarker
          key={city.id}
          city={city}
          position={position}
          onCityClick={onCityClick}
        />
      ))}

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={1.5}
        maxDistance={4}
        autoRotate
        autoRotateSpeed={0.5}
        rotateSpeed={0.5}
      />
    </>
  );
}

export function GlobeMap({ cities, onCityClick }: GlobeMapProps) {
  return (
    <div className="relative w-full aspect-[16/9] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden border border-slate-700/50">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent pointer-events-none z-10" />

      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center text-slate-500">
            Loading globe...
          </div>
        }
      >
        <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
          <Globe cities={cities} onCityClick={onCityClick} />
        </Canvas>
      </Suspense>

      <div className="absolute bottom-3 right-3 flex gap-3 text-[10px] pointer-events-none z-20">
        {[
          { status: 'GOVERNED', color: 'bg-emerald-500', label: 'Governed' },
          { status: 'CONTESTED', color: 'bg-amber-500', label: 'Contested' },
          { status: 'OPEN', color: 'bg-slate-500', label: 'Open' },
        ].map((item) => (
          <div key={item.status} className="flex items-center gap-1.5 text-slate-400">
            <div className={cn('w-2 h-2 rounded-full', item.color)} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="absolute top-3 left-3 text-xs text-slate-500 font-mono pointer-events-none z-20">
        CIVITAS REALM
      </div>
    </div>
  );
}
