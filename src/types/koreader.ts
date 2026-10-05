export type TransportMode = 'no-cors' | 'iframe' | 'image-beacon' | 'cors';

export interface DeviceProfile {
  id: string;
  name: string;
  ip: string;
  port: number;
  transportMode: TransportMode;
  networkType: 'Home Wi-Fi' | 'Phone Hotspot' | 'Custom LAN';
  notes: string;
}

export interface KoreaderCommand {
  id: string;
  label: string;
  shortLabel: string;
  endpoint: string;
  category: 'navigation' | 'display' | 'book' | 'diagnostic';
  description: string;
  hotkey?: string;
}

export interface RequestLogEntry {
  id: string;
  timestamp: string;
  method: 'GET';
  url: string;
  endpoint: string;
  label: string;
  durationMs: number;
  status: 'dispatched-opaque' | 'ok-200' | 'simulated' | 'network-error' | 'iframe-nav';
  dispatchTarget: 'wifi+sim' | 'wifi-only' | 'sim-only';
}

export interface BookAirplayState {
  title: string;
  currentPage: number;
  totalPages: number;
  readingPace: number; // pages/hour
  lastTurnTime: number | null;
}

export type PadLayout = 'side-by-side';

export interface RemotePreferences {
  padLayout: PadLayout;
  invertButtons: boolean;
  hapticFeedback: boolean;
  audioClick: boolean;
  oledDarkTheme: boolean;
  liveWifiEnabled: boolean;
}
