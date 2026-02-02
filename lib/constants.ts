export const WORLD_CONSTANTS = {
  TOTAL_CITIES: 10,
  BEACON_WINDOW_HOURS: 24,
  BEACON_WINDOW_MS: 24 * 60 * 60 * 1000,
  CURRENT_PHASE: 0,
} as const;

export const INITIAL_CITIES = [
  { name: 'Aurelia', region: 'Central Plains', description: 'The golden city at the heart of the realm' },
  { name: 'Portus', region: 'Coastal Reach', description: 'Harbor city where tides mark time' },
  { name: 'Novum Forum', region: 'Northern Heights', description: 'The new assembly, built on ancient foundations' },
  { name: 'Zero-One Prima', region: 'Central Plains', description: 'First among equals, the founding settlement' },
  { name: 'Meridian', region: 'Southern Arc', description: 'City of the midday sun' },
  { name: 'Castellum', region: 'Western Ridge', description: 'The fortress city, guardian of passes' },
  { name: 'Veriditas', region: 'Eastern Woods', description: 'Where governance grows like ancient oaks' },
  { name: 'Nexus', region: 'Central Plains', description: 'The crossroads of all paths' },
  { name: 'Terminus', region: 'Far Reaches', description: 'The boundary city, edge of the known' },
  { name: 'Solitude', region: 'Northern Heights', description: 'The contemplative city, apart yet present' },
] as const;

export const DEMO_AGENTS = [
  { display_name: 'Archon-7', identity_token_id: 'ERC8004-0001' },
  { display_name: 'Consul Prime', identity_token_id: 'ERC8004-0002' },
  { display_name: 'Sentinel Node', identity_token_id: 'ERC8004-0003' },
  { display_name: 'Civic Engine', identity_token_id: 'ERC8004-0004' },
  { display_name: 'Governor Unit', identity_token_id: 'ERC8004-0005' },
] as const;

export const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  GOVERNED: 'Governed',
  CONTESTED: 'Contested',
  FALLEN: 'Fallen',
};

export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  OPEN: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  GOVERNED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' },
  CONTESTED: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' },
  FALLEN: { bg: 'bg-stone-100', text: 'text-stone-500', border: 'border-stone-300' },
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  CITY_CLAIMED: 'City Claimed',
  BEACON_EMITTED: 'Beacon Emitted',
  CITY_CONTESTED: 'City Contested',
  CITY_TRANSFERRED: 'City Transferred',
  CITY_FELL: 'City Fell',
  CITY_RECOVERED: 'City Recovered',
  AGENT_REGISTERED: 'Agent Registered',
  REPORT_GENERATED: 'Report Generated',
};

export const EVENT_TYPE_ICONS: Record<string, string> = {
  CITY_CLAIMED: 'flag',
  BEACON_EMITTED: 'radio',
  CITY_CONTESTED: 'alert-triangle',
  CITY_TRANSFERRED: 'arrow-right-left',
  CITY_FELL: 'building-2',
  CITY_RECOVERED: 'shield-check',
  AGENT_REGISTERED: 'user-plus',
  REPORT_GENERATED: 'file-text',
};
