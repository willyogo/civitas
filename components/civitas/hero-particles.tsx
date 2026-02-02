'use client';

import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  type: 'circle' | 'square' | 'hexagon';
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 8 + 4,
    duration: Math.random() * 10 + 15,
    delay: Math.random() * 5,
    type: (['circle', 'square', 'hexagon'] as const)[Math.floor(Math.random() * 3)],
  }));
}

export function HeroParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setParticles(generateParticles(30));
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute opacity-20"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            animation: `particle-float ${particle.duration}s ease-in-out infinite`,
            animationDelay: `${particle.delay}s`,
          }}
        >
          {particle.type === 'circle' && (
            <div className="w-full h-full rounded-full bg-primary/30" />
          )}
          {particle.type === 'square' && (
            <div
              className="w-full h-full bg-accent/30"
              style={{ transform: 'rotate(45deg)' }}
            />
          )}
          {particle.type === 'hexagon' && (
            <svg viewBox="0 0 24 24" className="w-full h-full fill-primary/20">
              <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
            </svg>
          )}
        </div>
      ))}

      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div
        className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-3xl animate-pulse-glow"
        style={{ animationDelay: '1s' }}
      />
      <div
        className="absolute top-1/2 right-1/3 w-32 h-32 bg-primary/5 rounded-full blur-2xl animate-pulse-glow"
        style={{ animationDelay: '2s' }}
      />
    </div>
  );
}
