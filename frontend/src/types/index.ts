export interface CryoCrewMember {
  name: string;
  status: string;
  heart_bpm: number;
  temp_c: number;
}

export interface ActiveCrewMember {
  name: string;
  role: string;
  loc: string;
}

export interface PodBayStatus {
  status: string;
  doors: string;
  pressure: string;
}

export interface TelemetryData {
  mission_clock: string;
  ship: string;
  destination: string;
  distance_to_jupiter_km: string;
  velocity_kms: string;
  ae35_status: string;
  ae35_error_percent: number;
  ae35_azimuth_deg?: number;
  ae35_elevation_deg?: number;
  earth_signal_db?: number;
  centrifuge_rpm: number;
  reactor_output_percent: number;
  cabin_pressure_psi: number;
  o2_level_percent: number;
  cryo_crew: CryoCrewMember[];
  active_crew: ActiveCrewMember[];
  pod_bays: Record<string, PodBayStatus>;
  memory_banks?: Record<string, number>;
  memory_integrity_percent: number;
}

export interface FrequencyBands {
  bass: number;
  mid: number;
  treble: number;
}

export type HalState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface ChatMessage {
  id: string;
  role: 'user' | 'hal' | 'system';
  text: string;
  timestamp: string;
}

export interface AppSettings {
  groqKey: string;
  openaiKey: string;
  geminiKey: string;
  voice: string;
  ambientHum: boolean;
  vadEnabled: boolean;
  soundEffects: boolean;
}
