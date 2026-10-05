import React, { useState, useEffect, useRef } from 'react';
import {
  Gamepad2,
  X,
  Plus,
  AlertCircle,
  RotateCcw,
  Check,
  Sparkles,
  Bluetooth,
  Download,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { downloadKeyMapperFile } from '../utils/keyMapperExporter';
import { isWebBluetoothSupported, BLEDeviceState } from '../utils/webBluetooth';

export interface ControllerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  btMappings: Record<string, string[]>;
  onUpdateMappings: (mappings: Record<string, string[]>) => void;
  onResetDefaults: () => void;
  onShowToast: (msg: string) => void;
  lastDetectedInput: string | null;
  connectedGamepadName: string | null;
  kindleHost: string;
  bleState: BLEDeviceState;
  onConnectWebBluetooth: () => Promise<void>;
  onDisconnectWebBluetooth: () => void;
}

const COMMON_BUTTONS = [
  { label: '👉 Arrow Right (Key)', value: 'KEY_ArrowRight' },
  { label: '👇 Arrow Down (Key)', value: 'KEY_ArrowDown' },
  { label: '👈 Arrow Left (Key)', value: 'KEY_ArrowLeft' },
  { label: '👆 Arrow Up (Key)', value: 'KEY_ArrowUp' },
  { label: '␣ Spacebar', value: 'KEY_Space' },
  { label: '↵ Enter / Return', value: 'KEY_Enter' },
  { label: '📄 Page Down', value: 'KEY_PageDown' },
  { label: '📄 Page Up', value: 'KEY_PageUp' },
  { label: '⏯️ Media Play/Pause', value: 'KEY_MediaPlayPause' },
  { label: '⏭️ Media Next Track', value: 'KEY_MediaTrackNext' },
  { label: '⏮️ Media Prev Track', value: 'KEY_MediaTrackPrevious' },
  { label: '🔉 Volume Down (Ring / Remote)', value: 'KEY_VolumeDown' },
  { label: '🔊 Volume Up (Ring / Remote)', value: 'KEY_VolumeUp' },
  { label: '🔉 AudioVolumeDown (Android)', value: 'KEY_AudioVolumeDown' },
  { label: '🔊 AudioVolumeUp (Android)', value: 'KEY_AudioVolumeUp' },
  { label: '🎮 Gamepad A / Cross (Btn 0)', value: 'GP_BTN_0' },
  { label: '🎮 Gamepad B / Circle (Btn 1)', value: 'GP_BTN_1' },
  { label: '🎮 Gamepad X / Square (Btn 2)', value: 'GP_BTN_2' },
  { label: '🎮 Gamepad Y / Triangle (Btn 3)', value: 'GP_BTN_3' },
  { label: '🎮 Gamepad LB / L1 Shoulder (Btn 4)', value: 'GP_BTN_4' },
  { label: '🎮 Gamepad RB / R1 Shoulder (Btn 5)', value: 'GP_BTN_5' },
  { label: '🎮 Gamepad D-Pad Right', value: 'GP_BTN_15' },
  { label: '🎮 Gamepad D-Pad Left', value: 'GP_BTN_14' },
  { label: '🎮 Gamepad D-Pad Down', value: 'GP_BTN_13' },
  { label: '🎮 Gamepad D-Pad Up', value: 'GP_BTN_12' },
  { label: '🖱️ Mouse Left Click (VR/Air Mouse)', value: 'MOUSE_0' },
  { label: '🖱️ Mouse Right Click (VR/Air Mouse)', value: 'MOUSE_2' },
];

const ACTIONS_LIST = [
  { id: 'nextPage', name: 'Next Page (Advance)', icon: '→', desc: 'Flipping forward +1 page' },
  { id: 'prevPage', name: 'Previous Page (Rewind)', icon: '←', desc: 'Flipping back -1 page' },
  { id: 'fullRefresh', name: 'Full Refresh (Flash)', icon: '⚡', desc: 'Clears E-Ink ghosting' },
  { id: 'fontIncrease', name: 'Font Larger (A+)', icon: 'A+', desc: 'Increases font size by 1' },
  { id: 'fontDecrease', name: 'Font Smaller (A-)', icon: 'A-', desc: 'Decreases font size by 1' },
  { id: 'toggleBookmark', name: 'Toggle Bookmark', icon: '🔖', desc: 'Bookmarks current page' },
  { id: 'nightMode', name: 'Night Mode', icon: '🌙', desc: 'Inverts colors for dark reading' },
  { id: 'nextChapter', name: 'Next Chapter', icon: '⏭️', desc: 'Skips to next chapter' },
  { id: 'prevChapter', name: 'Prev Chapter', icon: '⏮️', desc: 'Rewinds to previous chapter' },
];

export const ControllerModal: React.FC<ControllerModalProps> = ({
  isOpen,
  onClose,
  isDark,
  btMappings,
  onUpdateMappings,
  onResetDefaults,
  onShowToast,
  lastDetectedInput,
  connectedGamepadName,
  kindleHost,
  bleState,
  onConnectWebBluetooth,
  onDisconnectWebBluetooth,
}) => {
  const [activeTab, setActiveTab] = useState<'mapping' | 'android'>('mapping');
  const [learningAction, setLearningAction] = useState<string | null>(null);
  const [learnTimer, setLearnTimer] = useState<number>(15);
  const [isConnectingBle, setIsConnectingBle] = useState<boolean>(false);
  const focusTrapRef = useRef<HTMLInputElement>(null);

  // Auto-focus the hidden input whenever modal opens to capture mobile Bluetooth HID keys
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        focusTrapRef.current?.focus();
      }, 100);
    } else {
      setLearningAction(null);
    }
  }, [isOpen]);

  // Handle countdown during learn mode
  useEffect(() => {
    if (!learningAction) {
      setLearnTimer(15);
      return;
    }

    setLearnTimer(15);
    const interval = setInterval(() => {
      setLearnTimer((prev) => {
        if (prev <= 1) {
          setLearningAction(null);
          onShowToast('Learn mode timed out (no button received)');
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [learningAction, onShowToast]);

  // Global listener while modal is open to learn buttons
  useEffect(() => {
    if (!isOpen || !learningAction) return;

    const registerLearnedInput = (identifier: string) => {
      onUpdateMappings({
        ...btMappings,
        [learningAction]: Array.from(new Set([...(btMappings[learningAction] || []), identifier])),
      });
      const act = ACTIONS_LIST.find((a) => a.id === learningAction);
      onShowToast(`✓ Mapped ${formatButtonName(identifier)} to ${act?.name || learningAction}`);
      setLearningAction(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'SELECT') return;

      const code = e.code && e.code !== 'Unidentified' ? `KEY_${e.code}` : null;
      const key = e.key && e.key !== 'Unidentified' ? `KEY_${e.key}` : null;
      const keyCode = e.keyCode > 0 ? `KEY_CODE_${e.keyCode}` : null;
      const identifier = code || key || keyCode;

      if (identifier) {
        e.preventDefault();
        e.stopPropagation();
        registerLearnedInput(identifier);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('select')) return;

      e.preventDefault();
      e.stopPropagation();
      registerLearnedInput(`MOUSE_${e.button}`);
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
    window.addEventListener('pointerdown', handlePointerDown, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('pointerdown', handlePointerDown, { capture: true });
    };
  }, [isOpen, learningAction, btMappings, onUpdateMappings, onShowToast]);

  if (!isOpen) return null;

  const formatButtonName = (btn: string): string => {
    if (btn.startsWith('GP_BTN_')) return `🎮 Btn ${btn.replace('GP_BTN_', '')}`;
    if (btn.startsWith('GP_AXIS_')) return `🕹️ Stick ${btn.replace('GP_AXIS_', '')}`;
    if (btn.startsWith('KEY_CODE_')) return `⌨️ KeyCode ${btn.replace('KEY_CODE_', '')}`;
    if (btn.startsWith('MOUSE_')) return `🖱️ Mouse ${btn === 'MOUSE_0' ? 'Left' : btn === 'MOUSE_2' ? 'Right' : btn.replace('MOUSE_', 'Btn ')}`;
    return `⌨️ ${btn.replace('KEY_', '').replace('Key', '')}`;
  };

  const handleAddFromDropdown = (actionId: string, value: string) => {
    if (!value) return;
    const current = btMappings[actionId] || [];
    if (!current.includes(value)) {
      onUpdateMappings({
        ...btMappings,
        [actionId]: [...current, value],
      });
      onShowToast(`Added ${formatButtonName(value)}`);
    }
  };

  const handleRemoveButton = (actionId: string, btnIndex: number) => {
    const current = [...(btMappings[actionId] || [])];
    current.splice(btnIndex, 1);
    onUpdateMappings({
      ...btMappings,
      [actionId]: current,
    });
  };

  const handleWebBluetoothClick = async () => {
    if (bleState.connected) {
      onDisconnectWebBluetooth();
    } else {
      setIsConnectingBle(true);
      try {
        await onConnectWebBluetooth();
      } finally {
        setIsConnectingBle(false);
      }
    }
  };

  const handleDownloadKeyMapper = () => {
    downloadKeyMapperFile(kindleHost);
    onShowToast('✓ Downloaded Key Mapper profile with your Kindle IP!');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Hidden focus trap for capturing mobile Bluetooth HID remotes */}
      <input
        ref={focusTrapRef}
        type="text"
        className="opacity-0 fixed -top-40 -left-40 pointer-events-none w-1 h-1"
        tabIndex={-1}
        autoComplete="off"
        readOnly
      />

      <div
        className={`w-full max-w-lg rounded-3xl border p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto ${
          isDark ? 'bg-[#18181B] border-[#27272A] text-[#F4F3EF]' : 'bg-white border-[#DCD9CE] text-[#18181B]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-current/10">
          <div>
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-base sm:text-lg">Bluetooth Controller Bridge</h3>
            </div>
            <p className="text-xs opacity-70 mt-0.5">
              Connect Bluetooth page-turn rings, selfie remotes, or gamepads to your Kindle over Wi-Fi.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-current/15 flex items-center justify-center cursor-pointer shrink-0 hover:opacity-100 opacity-70"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-current/10 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('mapping')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'mapping'
                ? 'border-[#D9532F] text-[#D9532F]'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Key Mapping</span>
          </button>
          <button
            onClick={() => setActiveTab('android')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'android'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Android Background & Accessibility</span>
          </button>
        </div>

        {/* TAB 1: KEY MAPPING */}
        {activeTab === 'mapping' && (
          <div className="py-3 space-y-4 text-xs">
            {/* Hardware Status + Web Bluetooth Quick Action */}
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                <span>
                  {bleState.connected
                    ? `🔗 Web Bluetooth: ${bleState.name}`
                    : connectedGamepadName
                    ? `🎮 Gamepad: ${connectedGamepadName}`
                    : '🎮 Listening for Bluetooth Keys & Gamepads'}
                </span>
              </div>

              {isWebBluetoothSupported() && (
                <button
                  onClick={handleWebBluetoothClick}
                  disabled={isConnectingBle}
                  className={`h-7 px-2.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 cursor-pointer shrink-0 transition-all ${
                    bleState.connected
                      ? 'border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
                      : 'border-blue-500/30 text-blue-300 bg-blue-500/20 hover:bg-blue-500/30'
                  }`}
                  title="Directly connect Bluetooth ring/clicker via Web Bluetooth so clicks bypass Android keyboard"
                >
                  <Bluetooth className="w-3.5 h-3.5" />
                  <span>
                    {isConnectingBle
                      ? 'Pairing...'
                      : bleState.connected
                      ? 'Disconnect BLE'
                      : 'Pair via Web Bluetooth'}
                  </span>
                </button>
              )}
            </div>

            {/* Live Input Diagnostic Box */}
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between font-mono text-xs transition-all ${
                lastDetectedInput
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : isDark
                  ? 'bg-[#121316] border-[#27272A] opacity-70'
                  : 'bg-[#F4F3EF] border-[#DCD9CE] opacity-70'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {lastDetectedInput ? (
                    <>
                      <strong className="font-bold">Last Received Input:</strong> {formatButtonName(lastDetectedInput)}
                    </>
                  ) : (
                    'Press any controller button or click to test input detection...'
                  )}
                </span>
              </div>
              {lastDetectedInput && <Check className="w-4 h-4 shrink-0 text-emerald-400" />}
            </div>

            {/* Active Learning Banner */}
            {learningAction && (
              <div className="p-3.5 rounded-2xl bg-[#D9532F]/15 border border-[#D9532F] text-white flex items-center justify-between animate-pulse">
                <div>
                  <div className="font-bold text-xs">
                    🎯 Press any button on your controller for &quot;
                    {ACTIONS_LIST.find((a) => a.id === learningAction)?.name}&quot;
                  </div>
                  <div className="text-[10px] opacity-80 mt-0.5 font-mono">
                    Auto-cancels in {learnTimer}s or tap Cancel
                  </div>
                </div>
                <button
                  onClick={() => setLearningAction(null)}
                  className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xs cursor-pointer"
                >
                  ✕ Cancel
                </button>
              </div>
            )}

            {/* Action Mappings List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold opacity-80">
                <span>Configured Actions</span>
                <button
                  onClick={onResetDefaults}
                  className="text-[11px] font-mono text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                  title="Wipe all controller mappings clean"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              </div>

              <div className="space-y-2">
                {ACTIONS_LIST.map((act) => {
                  const mappedButtons = btMappings[act.id] || [];
                  const isLearning = learningAction === act.id;

                  return (
                    <div
                      key={act.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isLearning
                          ? 'border-[#D9532F] bg-[#D9532F]/5 shadow-sm'
                          : isDark
                          ? 'bg-[#121316] border-[#27272A]'
                          : 'bg-[#F4F3EF] border-[#DCD9CE]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1.5">
                            <span className="text-[#D9532F]">{act.icon}</span>
                            <span>{act.name}</span>
                          </div>
                          <div className="text-[10.5px] opacity-60 mt-0.5">{act.desc}</div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Map Button (Learning Mode) */}
                          <button
                            onClick={() => {
                              if (isLearning) {
                                setLearningAction(null);
                              } else {
                                setLearningAction(act.id);
                                focusTrapRef.current?.focus();
                              }
                            }}
                            className={`h-7 px-2.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all flex items-center gap-1 ${
                              isLearning
                                ? 'bg-[#D9532F] text-white border-[#D9532F] animate-pulse'
                                : 'border-[#D9532F] text-[#D9532F] bg-[#D9532F]/10 hover:bg-[#D9532F]/20'
                            }`}
                          >
                            <span>{isLearning ? `Listening (${learnTimer}s)...` : '🎯 Map'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Mapped Button Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {mappedButtons.length === 0 ? (
                          <span className="text-[10.5px] opacity-40 italic">No buttons bound yet.</span>
                        ) : (
                          mappedButtons.map((btn, idx) => (
                            <span
                              key={btn}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] border ${
                                isDark
                                  ? 'bg-[#18181B] border-[#27272A] text-gray-200'
                                  : 'bg-white border-[#DCD9CE] text-gray-800'
                              }`}
                            >
                              <span>{formatButtonName(btn)}</span>
                              <button
                                onClick={() => handleRemoveButton(act.id, idx)}
                                className="opacity-50 hover:opacity-100 hover:text-rose-500 cursor-pointer text-[11px] ml-0.5"
                                title="Remove button"
                              >
                                ✕
                              </button>
                            </span>
                          ))
                        )}

                        {/* Dropdown Quick Pick Button */}
                        <select
                          onChange={(e) => {
                            handleAddFromDropdown(act.id, e.target.value);
                            e.target.value = '';
                          }}
                          defaultValue=""
                          className={`h-6 px-1.5 rounded-md text-[10px] font-mono border cursor-pointer ${
                            isDark
                              ? 'bg-[#18181B] border-[#27272A] text-gray-300'
                              : 'bg-white border-[#DCD9CE] text-gray-700'
                          }`}
                          title="Pick from standard keys without waiting for button detection"
                        >
                          <option value="" disabled>
                            + Pick Key...
                          </option>
                          {COMMON_BUTTONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ANDROID BACKGROUND & ACCESSIBILITY */}
        {activeTab === 'android' && (
          <div className="py-3 space-y-4 text-xs">
            {/* The Core Explanation */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1.5 text-amber-300 text-[11.5px] leading-relaxed">
              <div className="font-bold flex items-center gap-2 text-amber-200 text-xs">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Why standard Bluetooth clickers leak into other apps on Android</span>
              </div>
              <p className="opacity-90">
                When you connect a Bluetooth ring or clicker to Android as an HID Keyboard, Android sends those keys (Space, Enter, Arrows) <strong>strictly to whatever app is active on your screen</strong> (scrolling Instagram, typing in WhatsApp, etc.). Android OS security blocks web browsers from being background keyloggers across other apps.
              </p>
              <p className="font-semibold text-amber-200 pt-0.5">
                Here are the 3 ways to tie your controller exclusively to your Kindle without clicks leaking into other apps:
              </p>
            </div>

            {/* Method 1: Web Bluetooth GATT (Built right into KOMOTE) */}
            <div className={`p-4 rounded-2xl border space-y-2.5 ${isDark ? 'bg-[#121316] border-[#27272A]' : 'bg-[#F4F3EF] border-[#DCD9CE]'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-blue-400">
                  <Bluetooth className="w-4 h-4" />
                  <span>Method 1: Direct Web Bluetooth (Zero Extra Apps)</span>
                </div>
                {bleState.connected && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Connected ✓
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-80 leading-relaxed">
                Connect your Bluetooth LE ring or clicker directly inside KOMOTE via Web Bluetooth GATT. Because it connects directly to KOMOTE, <strong>signals bypass Android&apos;s OS keyboard completely</strong> — your clicks will NEVER type spaces or scroll inside other apps!
              </p>
              <div className="pt-1 flex items-center gap-2">
                <button
                  onClick={handleWebBluetoothClick}
                  disabled={isConnectingBle}
                  className={`h-8 px-4 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                    bleState.connected
                      ? 'border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
                      : 'border-blue-500/40 text-white bg-blue-600 hover:bg-blue-500 shadow-md'
                  }`}
                >
                  <Bluetooth className="w-3.5 h-3.5" />
                  <span>
                    {isConnectingBle
                      ? 'Searching BLE devices...'
                      : bleState.connected
                      ? `Disconnect ${bleState.name}`
                      : '🔗 Pair via Web Bluetooth'}
                  </span>
                </button>
                {bleState.connected && (
                  <span className="text-[10px] font-mono opacity-70">
                    Ready! Clicks go directly to Kindle.
                  </span>
                )}
              </div>
            </div>

            {/* Method 2: Android Accessibility Service via Key Mapper */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-3 text-emerald-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Method 2: Android Accessibility Service (Key Mapper)</span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-300">
                  100% Background
                </span>
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed">
                Android allows apps with <strong>Accessibility Permission</strong> (<code>BIND_ACCESSIBILITY_SERVICE</code>) to intercept hardware keys from specific Bluetooth controllers, <strong>consume them completely</strong> (so other apps never see them), and trigger HTTP requests in the background 24/7.
              </p>

              <div className="space-y-1.5 text-[11px] bg-black/20 p-3 rounded-xl border border-emerald-500/20">
                <div className="font-bold text-emerald-200">Quick 60-Second Setup:</div>
                <ol className="list-decimal list-inside space-y-1 opacity-90 text-[10.5px]">
                  <li>
                    Install the free, open-source <strong>Key Mapper</strong> app from Google Play Store or F-Droid.
                  </li>
                  <li>
                    Open Key Mapper → Tap <em>Enable Accessibility Service</em> when prompted.
                  </li>
                  <li>
                    Tap the button below to download the pre-configured KOMOTE profile.
                  </li>
                  <li>
                    In Key Mapper, tap Menu (⋮) → <strong>Restore Backup / Import</strong> → Select the downloaded file.
                  </li>
                  <li>
                    Press your Bluetooth remote buttons to bind them. Done! Now your remote is 100% tied to your Kindle and runs silently in the background across all apps.
                  </li>
                </ol>
              </div>

              <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <button
                  onClick={handleDownloadKeyMapper}
                  className="h-8 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>📥 Download Key Mapper Profile for KOMOTE</span>
                </button>
                <span className="text-[10px] font-mono opacity-80">
                  Pre-filled with: {kindleHost || 'Kindle IP'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-current/10 flex items-center justify-between">
          <span className="text-[11px] opacity-60">Auto-saves to browser storage</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#D9532F] text-white font-bold text-xs cursor-pointer hover:bg-[#C04524] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
