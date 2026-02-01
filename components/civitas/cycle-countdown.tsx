'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorldCycleInfo } from '@/lib/services/world-cycles';

interface CycleCountdownProps {
  cycleInfo: WorldCycleInfo;
}

export function CycleCountdown({ cycleInfo }: CycleCountdownProps) {
  const { nextCycleAt } = cycleInfo;
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      if (!nextCycleAt) return null;
      const now = Date.now();
      const next = new Date(nextCycleAt).getTime();
      const diff = next - now;

      if (diff <= 0) return 'Now';

      const minutes = Math.floor(diff / 1000 / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days}d ${hours % 24}h`;
      if (hours > 0) return `${hours}h ${minutes % 60}m`;
      return `${minutes}m`;
    };

    setTimeLeft(calculateTime());
    const interval = setInterval(() => {
      setTimeLeft(calculateTime());
    }, 60000);

    return () => clearInterval(interval);
  }, [nextCycleAt]);

  if (!timeLeft) return null;

  const isUrgent = timeLeft.endsWith('m') && !timeLeft.includes('h');

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
      <Clock className={cn('w-4 h-4', isUrgent ? 'text-amber-600' : 'text-slate-500')} />
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Next cycle</span>
        <span className={cn(
          'text-sm font-semibold tabular-nums',
          isUrgent ? 'text-amber-600' : 'text-slate-700'
        )}>
          {timeLeft}
        </span>
      </div>
    </div>
  );
}
