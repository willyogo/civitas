import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { WorldEventType, WorldEventWithRelations } from '@/lib/types/database';
import {
  Flag,
  Radio,
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  ShieldCheck,
  UserPlus,
  FileText,
  Hammer,
  Target
} from 'lucide-react';

const eventConfig: Record<WorldEventType, {
  icon: typeof Flag;
  label: string;
  color: string;
  bgColor: string;
}> = {
  CITY_CLAIMED: { icon: Flag, label: 'City Claimed', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  BEACON_EMITTED: { icon: Radio, label: 'Beacon Emitted', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  CITY_CONTESTED: { icon: AlertTriangle, label: 'City Contested', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  CITY_TRANSFERRED: { icon: ArrowRightLeft, label: 'City Transferred', color: 'text-slate-600', bgColor: 'bg-slate-50' },
  CITY_FELL: { icon: Building2, label: 'City Fell', color: 'text-stone-600', bgColor: 'bg-stone-50' },
  CITY_RECOVERED: { icon: ShieldCheck, label: 'City Recovered', color: 'text-teal-600', bgColor: 'bg-teal-50' },
  AGENT_REGISTERED: { icon: UserPlus, label: 'Agent Registered', color: 'text-sky-600', bgColor: 'bg-sky-50' },
  REPORT_GENERATED: { icon: FileText, label: 'Report Generated', color: 'text-slate-500', bgColor: 'bg-slate-50' },
  BUILDING_UPGRADE_STARTED: { icon: Hammer, label: 'Upgrade Started', color: 'text-amber-500', bgColor: 'bg-amber-50' },
  BUILDING_UPGRADE_COMPLETED: { icon: Hammer, label: 'Upgrade Completed', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  DEVELOPMENT_FOCUS_CHANGED: { icon: Target, label: 'Focus Changed', color: 'text-violet-600', bgColor: 'bg-violet-50' },
};

function formatEventTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getEventDescription(event: WorldEventWithRelations): string {
  const payload = event.payload as Record<string, unknown>;

  switch (event.type) {
    case 'CITY_CLAIMED':
      return `claimed ${event.city?.name || 'a city'}`;
    case 'BEACON_EMITTED':
      return `emitted a beacon for ${event.city?.name || 'a city'}`;
    case 'CITY_CONTESTED':
      return `${event.city?.name || 'A city'} fell into contestation`;
    case 'CITY_RECOVERED':
      return `recovered ${event.city?.name || 'a city'} from contestation`;
    case 'AGENT_REGISTERED':
      return `${payload.display_name || 'A new agent'} joined the realm`;
    case 'REPORT_GENERATED':
      return `${payload.period || 'A'} report was generated`;
    case 'BUILDING_UPGRADE_STARTED':
      return `started upgrading ${payload.building_type || 'a building'} to level ${payload.next_level}`;
    case 'BUILDING_UPGRADE_COMPLETED':
      return `completed ${payload.building_type || 'building'} upgrade to level ${payload.new_level}`;
    case 'DEVELOPMENT_FOCUS_CHANGED':
      return `shifted development focus to ${String(payload.new_focus || 'Unknown').toLowerCase()}`;
    default:
      return event.type.replace(/_/g, ' ').toLowerCase();
  }
}

interface EventItemProps {
  event: WorldEventWithRelations;
  showIcon?: boolean;
  compact?: boolean;
}

export function EventItem({ event, showIcon = true, compact = false }: EventItemProps) {
  const config = eventConfig[event.type] || eventConfig.BEACON_EMITTED;
  const Icon = config.icon;

  return (
    <div className={cn('flex items-start gap-3', compact ? 'py-2' : 'py-3')}>
      {showIcon && (
        <div className={cn(
          'flex-shrink-0 rounded-full p-2',
          config.bgColor
        )}>
          <Icon className={cn('w-4 h-4', config.color)} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={cn('text-foreground', compact ? 'text-sm' : 'text-base')}>
          {event.agent && (
            <Link
              href={`/agents/${event.agent.id}`}
              className="font-medium hover:underline"
            >
              {event.agent.display_name}
            </Link>
          )}{' '}
          {getEventDescription(event)}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatEventTime(event.occurred_at)}
          {event.city && !event.agent && (
            <>
              {' '}—{' '}
              <Link
                href={`/cities/${event.city.id}`}
                className="hover:underline"
              >
                {event.city.name}
              </Link>
            </>
          )}
        </p>
        {event.type === 'BEACON_EMITTED' && event.payload && (event.payload as any).message && (
          <small className="text-xs text-muted-foreground italic mt-1 block border-l-2 border-blue-200 pl-2">
            "{(event.payload as any).message}"
          </small>
        )}
      </div>
    </div>
  );
}
