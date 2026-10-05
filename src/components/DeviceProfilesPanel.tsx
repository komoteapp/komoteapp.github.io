import React, { useState } from 'react';
import {
  Wifi,
  Plus,
  Trash2,
  Check,
  Radio,
  Send,
  Smartphone,
  Router,
} from 'lucide-react';
import { DeviceProfile, TransportMode } from '../types/koreader';

interface DeviceProfilesPanelProps {
  profiles: DeviceProfile[];
  activeProfileId: string;
  darkTheme: boolean;
  liveWifiEnabled: boolean;
  onSelectProfile: (id: string) => void;
  onUpdateProfile: (profile: DeviceProfile) => void;
  onAddProfile: (profile: DeviceProfile) => void;
  onDeleteProfile: (id: string) => void;
  onToggleLiveWifi: (enabled: boolean) => void;
  onDispatchCommand: (endpoint: string, label: string) => void;
}

export const DeviceProfilesPanel: React.FC<DeviceProfilesPanelProps> = ({
  profiles,
  activeProfileId,
  darkTheme,
  liveWifiEnabled,
  onSelectProfile,
  onUpdateProfile,
  onAddProfile,
  onDeleteProfile,
  onToggleLiveWifi,
  onDispatchCommand,
}) => {
  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];

  const [newName, setNewName] = useState('');
  const [newIp, setNewIp] = useState('192.168.1.91');
  const [newPort, setNewPort] = useState('8080');
  const [newNetworkType, setNewNetworkType] = useState<DeviceProfile['networkType']>('Home Wi-Fi');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.trim()) return;
    const created: DeviceProfile = {
      id: `profile-${Date.now()}`,
      name: newName.trim() || `Kindle (${newIp.trim()})`,
      ip: newIp.trim(),
      port: parseInt(newPort, 10) || 8080,
      transportMode: 'no-cors',
      networkType: newNetworkType,
      notes: 'Custom saved KOReader Wi-Fi endpoint.',
    };
    onAddProfile(created);
    onSelectProfile(created.id);
    setNewName('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Active Endpoint Quick Editor */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 ${
          darkTheme
            ? 'bg-[#18181B] border-[#27272A] text-[#F4F3EF]'
            : 'bg-white border-[#DCD9CE] text-[#18181B]'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 mb-5 border-b border-current/10">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              Target Kindle KOReader Endpoint
            </h2>
            <p className="text-xs opacity-75 mt-1">
              Configure your Kindle’s local Wi-Fi IP address and HTTP-Inspector port.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleLiveWifi(!liveWifiEnabled)}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-colors cursor-pointer whitespace-nowrap ${
                liveWifiEnabled
                  ? 'bg-[#D9532F] text-white border-[#D9532F]'
                  : darkTheme
                  ? 'bg-[#202024] border-[#323238] text-[#A1A1AA]'
                  : 'bg-[#F4F3EF] border-[#DCD9CE] text-[#52525B]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{liveWifiEnabled ? 'Live Wi-Fi HTTP: ON' : 'Simulator Only Mode'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold mb-1.5 opacity-80">
              Kindle Local IPv4 Address
            </label>
            <input
              type="text"
              value={activeProfile.ip}
              onChange={(e) =>
                onUpdateProfile({ ...activeProfile, ip: e.target.value.trim() })
              }
              placeholder="192.168.1.91"
              className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl border font-mono text-sm focus:outline-none focus:border-[#D9532F] ${
                darkTheme
                  ? 'bg-[#121316] border-[#2E2E34] text-[#F4F3EF]'
                  : 'bg-[#F4F3EF] border-[#D5D2C6] text-[#18181B]'
              }`}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold mb-1.5 opacity-80">
              HTTP Port
            </label>
            <input
              type="number"
              value={activeProfile.port}
              onChange={(e) =>
                onUpdateProfile({
                  ...activeProfile,
                  port: parseInt(e.target.value, 10) || 8080,
                })
              }
              placeholder="8080"
              className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl border font-mono text-sm tabular-nums focus:outline-none focus:border-[#D9532F] ${
                darkTheme
                  ? 'bg-[#121316] border-[#2E2E34] text-[#F4F3EF]'
                  : 'bg-[#F4F3EF] border-[#D5D2C6] text-[#18181B]'
              }`}
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold mb-1.5 opacity-80">
              Browser Dispatch Mode
            </label>
            <select
              value={activeProfile.transportMode}
              onChange={(e) =>
                onUpdateProfile({
                  ...activeProfile,
                  transportMode: e.target.value as TransportMode,
                })
              }
              className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:border-[#D9532F] ${
                darkTheme
                  ? 'bg-[#121316] border-[#2E2E34] text-[#F4F3EF]'
                  : 'bg-[#F4F3EF] border-[#D5D2C6] text-[#18181B]'
              }`}
            >
              <option value="no-cors">Opaque Fetch (no-cors)</option>
              <option value="iframe">Hidden Iframe (Bypasses Mixed Content)</option>
              <option value="image-beacon">Image Beacon GET</option>
              <option value="cors">Standard CORS Fetch</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              onClick={() => onDispatchCommand('/koreader/event/GotoViewRel/1', 'Test Next Page')}
              className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#D9532F] hover:bg-[#C04524] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Test Turn</span>
            </button>
          </div>
        </div>

        <div className="mt-4 pt-3.5 border-t border-current/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono opacity-75 tabular-nums">
          <div className="truncate">
            Target URL: http://{activeProfile.ip}:{activeProfile.port}/koreader/event/GotoViewRel/1
          </div>
          <div className="shrink-0">
            Backward: /koreader/event/GotoViewRel/-1
          </div>
        </div>
      </div>

      {/* Multi-Profile List */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 ${
          darkTheme
            ? 'bg-[#18181B] border-[#27272A] text-[#F4F3EF]'
            : 'bg-white border-[#DCD9CE] text-[#18181B]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-current/10">
          <div>
            <h3 className="font-display text-lg font-semibold">
              Saved Wi-Fi & Hotspot Profiles
            </h3>
            <p className="text-xs opacity-75 mt-0.5">
              Switch between Home Wi-Fi and Phone Hotspot with one tap.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap ${
              darkTheme
                ? 'border-[#323238] hover:bg-[#242429]'
                : 'border-[#DCD9CE] hover:bg-[#EAE8E1]'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-[#D9532F]" />
            <span>{showAddForm ? 'Cancel' : 'Add Profile'}</span>
          </button>
        </div>

        {showAddForm && (
          <form
            onSubmit={handleCreateProfile}
            className={`mb-5 p-4 rounded-xl border space-y-3 ${
              darkTheme
                ? 'bg-[#121316] border-[#2E2E34]'
                : 'bg-[#F4F3EF] border-[#DCD9CE]'
            }`}
          >
            <div className="text-xs font-semibold">New Network Profile</div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Profile Name (e.g. Bedside)"
                className="min-h-[42px] px-3 py-1.5 rounded-lg border border-current/20 bg-transparent text-xs"
              />
              <input
                type="text"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                placeholder="Kindle IP (e.g. 192.168.1.91)"
                className="min-h-[42px] px-3 py-1.5 rounded-lg border border-current/20 bg-transparent font-mono text-xs"
                required
              />
              <select
                value={newNetworkType}
                onChange={(e) => setNewNetworkType(e.target.value as DeviceProfile['networkType'])}
                className="min-h-[42px] px-3 py-1.5 rounded-lg border border-current/20 bg-transparent text-xs"
              >
                <option value="Home Wi-Fi">Home Wi-Fi</option>
                <option value="Phone Hotspot">Phone Hotspot</option>
                <option value="Custom LAN">Custom LAN</option>
              </select>
              <button
                type="submit"
                className="min-h-[42px] px-4 py-1.5 rounded-lg bg-[#D9532F] text-white text-xs font-semibold hover:bg-[#C04524] transition-colors cursor-pointer"
              >
                Save Profile
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-current/10">
          {profiles.map((profile) => {
            const isSelected = profile.id === activeProfile.id;
            return (
              <div
                key={profile.id}
                onClick={() => onSelectProfile(profile.id)}
                className={`py-3.5 px-3 flex flex-wrap items-center justify-between gap-3 rounded-xl transition-colors cursor-pointer ${
                  isSelected
                    ? darkTheme
                      ? 'bg-[#242429]'
                      : 'bg-[#F4F3EF]'
                    : 'hover:bg-current/5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-[#D9532F] text-white'
                        : darkTheme
                        ? 'bg-[#27272A] text-[#A1A1AA]'
                        : 'bg-[#EAE8E1] text-[#52525B]'
                    }`}
                  >
                    {profile.networkType === 'Phone Hotspot' ? (
                      <Smartphone className="w-4 h-4" />
                    ) : (
                      <Router className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">
                        {profile.name}
                      </span>
                      {isSelected && (
                        <span className="text-xs font-semibold text-[#D9532F] flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs opacity-70 font-mono tabular-nums mt-0.5">
                      <span>{profile.ip}:{profile.port}</span>
                      <span aria-hidden="true">·</span>
                      <span>{profile.networkType}</span>
                      <span aria-hidden="true">·</span>
                      <span>{profile.transportMode}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {profiles.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProfile(profile.id);
                      }}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg opacity-60 hover:opacity-100 hover:text-red-500 transition-opacity cursor-pointer"
                      title="Delete profile"
                      aria-label={`Delete ${profile.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
