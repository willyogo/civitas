'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WORLD_CONSTANTS } from '@/lib/constants';

interface BeaconCountdownProps {
  lastBeaconAt: string;
}

export function BeaconCountdown({ lastBeaconAt }: BeaconCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    const calculateRemaining = () => {
      const lastBeacon = new Date(lastBeaconAt).getTime();
      const deadline = lastBeacon + WORLD_CONSTANTS.BEACON_WINDOW_MS;
      return Math.max(0, deadline - Date.now());
    };

    setTimeRemaining(calculateRemaining());

    const interval = setInterval(() => {
      setTimeRemaining(calculateRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [lastBeaconAt]);

  if (timeRemaining === null) {
    return null;
  }

  const isOverdue = timeRemaining === 0;
  const isUrgent = timeRemaining < 3600000 && timeRemaining > 0;

  const hours = Math.floor(timeRemaining / 3600000);
  const minutes = Math.floor((timeRemaining % 3600000) / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border',
        isOverdue && 'bg-red-50 border-red-200',
        isUrgent && !isOverdue && 'bg-amber-50 border-amber-200',
        !isOverdue && !isUrgent && 'bg-emerald-50 border-emerald-200'
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        {isOverdue ? (
          <AlertTriangle className="w-4 h-4 text-red-600" />
        ) : (
          <Clock className={cn('w-4 h-4', isUrgent ? 'text-amber-600' : 'text-emerald-600')} />
        )}
        <span
          className={cn(
            'text-sm font-medium',
            isOverdue && 'text-red-700',
            isUrgent && !isOverdue && 'text-amber-700',
            !isOverdue && !isUrgent && 'text-emerald-700'
          )}
        >
          {isOverdue ? 'Beacon Overdue' : 'Next Beacon Due'}
        </span>
      </div>
      <div
        className={cn(
          'text-2xl font-mono font-bold tabular-nums',
          isOverdue && 'text-red-700',
          isUrgent && !isOverdue && 'text-amber-700',
          !isOverdue && !isUrgent && 'text-emerald-700'
        )}
      >
        {isOverdue ? (
          'OVERDUE'
        ) : (
          <>
            {hours.toString().padStart(2, '0')}:
            {minutes.toString().padStart(2, '0')}:
            {seconds.toString().padStart(2, '0')}
          </>
        )}
      </div>
    </div>
  );
}
