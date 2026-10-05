import React, { useState, useEffect, useRef } from 'react';
import {
  Gamepad2,
  X,
  RotateCcw,
  Check,
  Sparkles,
  Bluetooth,
  Info,
} from 'lucide-react';

export const GP_BUTTON_LABELS: Record<number, string> = {
  0: 'A / Cross (Btn 0)',
  1: 'B / Circle (Btn 1)',
  2: 'X / Square (Btn 2)',
  3: 'Y / Triangle (Btn 3)',
  4: 'LB / L1 Shoulder (Btn 4)',
  5: 'RB / R1 Shoulder (Btn 5)',
  6: 'LT / L2 Trigger (Btn 6)',
  7: 'RT / R2 Trigger (Btn 7)',
  8: 'Select / Back (Btn 8)',
  9: 'Start (Btn 9)',
  10: 'L3 Stick Press (Btn 10)',
  11: 'R3 Stick Press (Btn 11)',
  12: 'D-Pad Up (Btn 12)',
  13: 'D-Pad Down (Btn 13)',
  14: 'D-Pad Left (Btn 14)',
  15: 'D-Pad Right (Btn 15)',
};

export const COMMON_BUTTONS = [
  { label: '🎮 Gamepad A / Cross (Btn 0)', value: 'GP_BTN_0' },
  { label: '🎮 Gamepad B / Circle (Btn 1)', value: 'GP_BTN_1' },
  { label: '🎮 Gamepad X / Square (Btn 2)', value: 'GP_BTN_2' },
  { label: '🎮 Gamepad Y / Triangle (Btn 3)', value: 'GP_BTN_3' },
  { label: '🎮 Gamepad LB / L1 Shoulder (Btn 4)', value: 'GP_BTN_4' },
  { label: '🎮 Gamepad RB / R1 Shoulder (Btn 5)', value: 'GP_BTN_5' },
  { label: '🎮 Gamepad LT / L2 Trigger (Btn 6)', value: 'GP_BTN_6' },
  { label: '🎮 Gamepad RT / R2 Trigger (Btn 7)', value: 'GP_BTN_7' },
  { label: '🎮 Gamepad D-Pad Right', value: 'GP_BTN_15' },
  { label: '🎮 Gamepad D-Pad Left', value: 'GP_BTN_14' },
  { label: '🎮 Gamepad D-Pad Down', value: 'GP_BTN_13' },
  { label: '🎮 Gamepad D-Pad Up', value: 'GP_BTN_12' },
  { label: '👉 Arrow Right (Key)', value: 'KEY_ArrowRight' },
  { label: '👇 Arrow Down (Key)', value: 'KEY_ArrowDown' },
  { label: '👈 Arrow Left (Key)', value: 'KEY_ArrowLeft' },
  { label: '👆 Arrow Up (Key)', value: 'KEY_ArrowUp' },
  { label: '␣ Spacebar', value: 'KEY_Space' },
  { label: '↵ Enter / Return', value: 'KEY_Enter' },
  { label: '📄 Page Down', value: 'KEY_PageDown' },
  { label: '📄 Page Up', value: 'KEY_PageUp' },
  { label: '🔉 Volume Down (Remote/Ring)', value: 'KEY_VolumeDown' },
  { label: '🔊 Volume Up (Remote/Ring)', value: 'KEY_VolumeUp' },
  { label: '🔉 AudioVolumeDown (Android)', value: 'KEY_AudioVolumeDown' },
  { label: '🔊 AudioVolumeUp (Android)', value: 'KEY_AudioVolumeUp' },
  { label: '⏯️ Media Play/Pause', value: 'KEY_MediaPlayPause' },
  { label: '⏭️ Media Next Track', value: 'KEY_MediaTrackNext' },
  { label: '⏮️ Media Prev Track', value: 'KEY_MediaTrackPrevious' },
  { label: '🖱️ Mouse Left Click (Air Mouse)', value: 'MOUSE_0' },
  { label: '🖱️ Mouse Right Click (Air Mouse)', value: 'MOUSE_2' },
];

export const ACTIONS_LIST = [
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

export const formatButtonName = (btn: string): string => {
  if (btn.startsWith('GP_BTN_')) {
    const idx = parseInt(btn.replace('GP_BTN_', ''), 10);
    const label = GP_BUTTON_LABELS[idx];
    return label ? `🎮 ${label}` : `🎮 Btn ${idx}`;
  }
  if (btn.startsWith('GP_AXIS_')) {
    const match = btn.match(/GP_AXIS_(\d+)_(POS|NEG)/);
    if (match) {
      const axisNum = match[1];
      const dir = match[2] === 'POS' ? '+' : '-';
      return `🕹️ Stick Axis ${axisNum} (${dir})`;
    }
    return `🕹️ Stick ${btn.replace('GP_AXIS_', '')}`;
  }
  if (btn.startsWith('KEY_CODE_')) return `⌨️ KeyCode ${btn.replace('KEY_CODE_', '')}`;
  if (btn.startsWith('MOUSE_')) return `🖱️ Mouse ${btn === 'MOUSE_0' ? 'Left' : btn === 'MOUSE_2' ? 'Right' : btn.replace('MOUSE_', 'Btn ')}`;
  return `⌨️ ${btn.replace('KEY_', '').replace('Key', '')}`;
};

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
  learningAction?: string | null;
  onSetLearningAction?: (action: string | null) => void;
}

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
  learningAction = null,
  onSetLearningAction = () => {},
}) => {
  const [learnTimer, setLearnTimer] = useState<number>(15);
  const focusTrapRef = useRef<HTMLInputElement>(null);

  // Auto-focus the hidden input whenever modal opens to capture mobile Bluetooth HID keys
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        focusTrapRef.current?.focus();
      }, 100);
    } else {
      onSetLearningAction(null);
    }
  }, [isOpen, onSetLearningAction]);

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
          onSetLearningAction(null);
          onShowToast('Learn mode timed out (no button received)');
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [learningAction, onSetLearningAction, onShowToast]);

  if (!isOpen) return null;

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
              Connect your phone to any Bluetooth controller, clicker, or gamepad in device settings.
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

        {/* KEY MAPPING */}
        <div className="py-3 space-y-4 text-xs">
          {/* Hardware & OS Connection Status */}
          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0 animate-pulse" />
                <span className="truncate">
                  {connectedGamepadName
                    ? `🎮 Gamepad Connected: ${connectedGamepadName}`
                    : '🎮 Controller & Remote Input Active'}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono shrink-0">
                OS Bluetooth
              </span>
            </div>
            <div className="flex items-start gap-1.5 text-[11px] opacity-80 leading-relaxed text-blue-200/90">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />
              <span>
                Connect your Bluetooth controller, ring, clicker, or remote via your <strong>Windows Bluetooth Settings</strong> or <strong>Android Connected Devices</strong>. KOMOTE receives the button presses directly from your system without needing any in-app pairing!
              </span>
            </div>
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
                    <strong className="font-bold">Last Detected Input:</strong> {formatButtonName(lastDetectedInput)}
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
                  Listening... auto-cancels in {learnTimer}s or tap Cancel
                </div>
              </div>
              <button
                onClick={() => onSetLearningAction(null)}
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
                              onSetLearningAction(null);
                            } else {
                              onSetLearningAction(act.id);
                              focusTrapRef.current?.focus();
                            }
                          }}
                          className={`h-7 px-2.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all flex items-center gap-1 ${
                            isLearning
                              ? 'bg-[#D9532F] text-white border-[#D9532F] animate-pulse'
                              : 'border-[#D9532F] text-[#D9532F] bg-[#D9532F]/10 hover:bg-[#D9532F]/20'
                          }`}
                        >
                          <span>{isLearning ? `Listening (${learnTimer}s)...` : '🎯 Map Button'}</span>
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
                        title="Pick from standard keys"
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
