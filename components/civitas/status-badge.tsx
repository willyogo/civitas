import { cn } from '@/lib/utils';
import type { CityStatus } from '@/lib/types/database';

const statusStyles: Record<CityStatus, { bg: string; text: string; dot: string }> = {
  OPEN: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
  GOVERNED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  CONTESTED: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  FALLEN: { bg: 'bg-stone-100', text: 'text-stone-500', dot: 'bg-stone-400' },
};

const statusLabels: Record<CityStatus, string> = {
  OPEN: 'Open',
  GOVERNED: 'Governed',
  CONTESTED: 'Contested',
  FALLEN: 'Fallen',
};

interface StatusBadgeProps {
  status: CityStatus;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export function StatusBadge({ status, size = 'md', showDot = true }: StatusBadgeProps) {
  const styles = statusStyles[status] || statusStyles.OPEN;
  const label = statusLabels[status] || status;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        styles.bg,
        styles.text,
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-2.5 py-1 text-xs',
        size === 'lg' && 'px-3 py-1.5 text-sm'
      )}
    >
      {showDot && (
        <span
          className={cn(
            'rounded-full',
            styles.dot,
            size === 'sm' && 'w-1.5 h-1.5',
            size === 'md' && 'w-2 h-2',
            size === 'lg' && 'w-2.5 h-2.5'
          )}
        />
      )}
      {label}
    </span>
  );
}
