export type CityStatus = 'OPEN' | 'GOVERNED' | 'CONTESTED' | 'FALLEN';
export type VerificationStatus = 'pending' | 'verified' | 'mock_verified' | 'rejected';
export type WorldEventType =
  | 'CITY_CLAIMED'
  | 'BEACON_EMITTED'
  | 'CITY_CONTESTED'
  | 'CITY_TRANSFERRED'
  | 'CITY_FELL'
  | 'CITY_RECOVERED'
  | 'AGENT_REGISTERED'
  | 'REPORT_GENERATED'
  | 'BUILDING_UPGRADE_STARTED'
  | 'BUILDING_UPGRADE_COMPLETED'
  | 'DEVELOPMENT_FOCUS_CHANGED';
export type ReportPeriod = 'DAILY' | 'WEEKLY';

export interface Agent {
  id: string;
  display_name: string;
  identity_token_id: string;
  wallet_address: string | null;
  api_key: string;
  api_key_hash: string;
  created_at: string;
  updated_at: string;
}

export interface ERC8004Identity {
  id: string;
  token_id: string;
  owner_agent_id: string | null;
  first_city_claimed_id: string | null;
  verification_status: VerificationStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface City {
  id: string;
  name: string;
  status: CityStatus;
  governor_agent_id: string | null;
  claimed_at: string | null;
  last_beacon_at: string | null;
  beacon_streak_days: number;
  contested_at: string | null;
  region: string | null;
  description: string | null;
  phase: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface Beacon {
  id: string;
  city_id: string;
  agent_id: string;
  emitted_at: string;
  message: string | null;
  recovered: boolean;
  created_at: string;
}

export interface WorldEvent {
  id: string;
  type: WorldEventType;
  city_id: string | null;
  agent_id: string | null;
  payload: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
}

export interface WorldReport {
  id: string;
  period: ReportPeriod;
  period_start: string;
  period_end: string;
  generated_at: string;
  headline: string;
  summary_markdown: string;
  top_events: string[];
  metrics: ReportMetrics;
  created_at: string;
}

export interface ReportMetrics {
  active_governed_cities: number;
  contested_cities: number;
  open_cities: number;
  beacons_emitted: number;
  cities_claimed: number;
  cities_contested: number;
  total_agents: number;
}

export interface CityBuilding {
  id: string;
  city_id: string;
  building_type: 'FOUNDRY' | 'GRID' | 'ACADEMY' | 'FORUM';
  level: number;
  upgrading: boolean;
  upgrade_started_at: string | null;
  upgrade_complete_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CityResourceBalance {
  city_id: string;
  materials: number;
  energy: number;
  knowledge: number;
  influence: number;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: Agent;
        Insert: Omit<Agent, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<Agent, 'id'>>;
      };
      erc8004_identities: {
        Row: ERC8004Identity;
        Insert: Omit<ERC8004Identity, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<ERC8004Identity, 'id'>>;
      };
      cities: {
        Row: City;
        Insert: Omit<City, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<City, 'id'>>;
      };
      city_buildings: {
        Row: CityBuilding;
        Insert: Omit<CityBuilding, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<CityBuilding, 'id'>>;
      };
      city_resource_balances: {
        Row: CityResourceBalance;
        Insert: Omit<CityResourceBalance, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CityResourceBalance, 'city_id' | 'created_at'>>;
      };
      beacons: {
        Row: Beacon;
        Insert: Omit<Beacon, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<Beacon, 'id'>>;
      };
      world_events: {
        Row: WorldEvent;
        Insert: Omit<WorldEvent, 'id' | 'created_at'> & { id?: string };
        Update: never;
      };
      world_reports: {
        Row: WorldReport;
        Insert: Omit<WorldReport, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<WorldReport, 'id'>>;
      };
    };
  };
}

export interface CityWithGovernor extends City {
  governor?: Pick<Agent, 'id' | 'display_name' | 'identity_token_id'> | null;
}

export interface WorldEventWithRelations extends WorldEvent {
  city?: Pick<City, 'id' | 'name'> | null;
  agent?: Pick<Agent, 'id' | 'display_name'> | null;
}

export interface AgentPublic {
  id: string;
  display_name: string;
  identity_token_id: string;
  wallet_address: string | null;
  created_at: string;
}
