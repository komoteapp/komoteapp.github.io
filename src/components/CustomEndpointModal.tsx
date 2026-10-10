import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Link,
  Check,
} from 'lucide-react';

interface CustomEndpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  defaultTarget?: 'both' | 'keymap' | 'button';
  onSubmit: (data: {
    name: string;
    icon: string;
    endpoint: string;
    addToKeymap: boolean;
    addToButton: boolean;
  }) => void;
}

const COMMON_REFERENCE_ENDPOINTS = [
  { name: 'Exit to Library', icon: '📚', endpoint: '/koreader/event/CloseDocument' },
  { name: 'Back in History', icon: '↩️', endpoint: '/koreader/event/Back' },
  { name: 'Reset Line Space (100%)', icon: '↕️', endpoint: '/koreader/event/ConfigChange/line_spacing/100/&/SetLineSpace/100' },
  { name: 'Forward 10 Pages', icon: '⏩', endpoint: '/koreader/event/GotoViewRel/10' },
  { name: 'Back 10 Pages', icon: '⏪', endpoint: '/koreader/event/GotoViewRel/-10' },
  { name: 'First Page / Cover', icon: '⏮️', endpoint: '/koreader/event/GotoFirstPage' },
  { name: 'Last Page', icon: '⏭️', endpoint: '/koreader/event/GotoLastPage' },
  { name: 'View All Bookmarks', icon: '📑', endpoint: '/koreader/event/ShowBookmarks' },
  { name: 'Book Info & Stats', icon: 'ℹ️', endpoint: '/koreader/event/ShowBookInfo' },
  { name: 'Sleep / Suspend', icon: '💤', endpoint: '/koreader/event/SuspendDevice' },
  { name: 'Battery Status', icon: '🔋', endpoint: '/koreader/event/DeviceStatus' },
  { name: 'Toggle Wi-Fi', icon: '📶', endpoint: '/koreader/event/ToggleWifi' },
];

const QUICK_EMOJIS = ['⚡', '📚', '📑', '💡', '🌅', '🔋', '💤', '↩️', '⏩', '⏪', 'ℹ️'];

export const CustomEndpointModal: React.FC<CustomEndpointModalProps> = ({
  isOpen,
  onClose,
  isDark,
  defaultTarget = 'both',
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('⚡');
  const [endpoint, setEndpoint] = useState('/koreader/event/');
  const [addToKeymap, setAddToKeymap] = useState(defaultTarget === 'both' || defaultTarget === 'keymap');
  const [addToButton, setAddToButton] = useState(defaultTarget === 'both' || defaultTarget === 'button');
  const [showReferenceList, setShowReferenceList] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEndpoint = endpoint.trim();
    if (!cleanName || !cleanEndpoint) return;

    onSubmit({
      name: cleanName,
      icon: icon.trim() || '⚡',
      endpoint: cleanEndpoint,
      addToKeymap,
      addToButton,
    });

    // Reset and close
    setName('');
    setIcon('⚡');
    setEndpoint('/koreader/event/');
    onClose();
  };

  const handlePickReference = (item: { name: string; icon: string; endpoint: string }) => {
    setName(item.name);
    setIcon(item.icon);
    setEndpoint(item.endpoint);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-3xl border p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto ${
          isDark ? 'bg-[#18181B] border-[#27272A] text-[#F4F3EF]' : 'bg-white border-[#DCD9CE] text-[#18181B]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-current/10">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D9532F]" />
              <h3 className="font-bold text-base sm:text-lg">Add Custom Endpoint</h3>
            </div>
            <p className="text-xs opacity-70 mt-0.5">
              Set any KOReader event URL to map to your controller or buttons.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="py-4 space-y-4 text-xs">
          {/* Action Name */}
          <div>
            <label className="block text-xs font-semibold mb-1 opacity-80">
              Button / Action Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Exit to Library"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-[#D9532F] transition-colors ${
                isDark ? 'bg-[#121316] border-[#27272A]' : 'bg-[#F4F3EF] border-[#DCD9CE]'
              }`}
            />
          </div>

          {/* Icon & Quick Selection */}
          <div>
            <label className="block text-xs font-semibold mb-1 opacity-80">
              Icon / Emoji
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={4}
                required
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className={`w-14 h-10 px-2 rounded-xl border text-base text-center outline-none focus:border-[#D9532F] ${
                  isDark ? 'bg-[#121316] border-[#27272A]' : 'bg-[#F4F3EF] border-[#DCD9CE]'
                }`}
              />
              <div className="flex-1 flex flex-wrap gap-1 items-center">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center cursor-pointer text-sm hover:scale-110 transition-transform ${
                      icon === emoji
                        ? 'border-[#D9532F] bg-[#D9532F]/15 font-bold'
                        : isDark
                        ? 'border-[#27272A] bg-[#121316]'
                        : 'border-[#DCD9CE] bg-[#F4F3EF]'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Endpoint URL Path */}
          <div>
            <label className="block text-xs font-semibold mb-1 opacity-80">
              KOReader Endpoint URL / Event Path
            </label>
            <input
              type="text"
              required
              placeholder="/koreader/event/YourEvent"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border font-mono text-xs outline-none focus:border-[#D9532F] transition-colors ${
                isDark ? 'bg-[#121316] border-[#27272A]' : 'bg-[#F4F3EF] border-[#DCD9CE]'
              }`}
            />
          </div>

          {/* Destination Selection */}
          <div className="p-3 rounded-2xl border bg-current/5 space-y-2">
            <span className="block font-semibold text-[11px] opacity-80">Add this endpoint to:</span>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={addToKeymap}
                onChange={(e) => setAddToKeymap(e.target.checked)}
                className="w-4 h-4 accent-[#D9532F] rounded cursor-pointer"
              />
              <span>🎮 Bluetooth Controller Keymaps (Map to remote buttons)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={addToButton}
                onChange={(e) => setAddToButton(e.target.checked)}
                className="w-4 h-4 accent-[#D9532F] rounded cursor-pointer"
              />
              <span>📱 Kindle Controls Deck & Zen Mode</span>
            </label>
          </div>

          {/* Link to Open All Endpoint URLs */}
          <div className="pt-1 border-t border-current/10 space-y-2">
            <a
              href="https://github.com/koreader/koreader/wiki/Dispatcher"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#D9532F] hover:underline font-semibold text-xs"
            >
              <Link className="w-3.5 h-3.5" />
              <span>Link to View All KOReader Endpoint URLs (Official Wiki)</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
            </a>

            {/* Quick Reference Collapsible */}
            <div>
              <button
                type="button"
                onClick={() => setShowReferenceList(!showReferenceList)}
                className="w-full flex items-center justify-between py-1.5 text-[11px] font-semibold opacity-75 hover:opacity-100 cursor-pointer"
              >
                <span>Common Event Endpoints Reference</span>
                {showReferenceList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showReferenceList && (
                <div className="mt-1.5 max-h-40 overflow-y-auto space-y-1 pr-1">
                  {COMMON_REFERENCE_ENDPOINTS.map((ref) => (
                    <button
                      key={ref.endpoint}
                      type="button"
                      onClick={() => handlePickReference(ref)}
                      className={`w-full p-2 rounded-lg border text-left flex items-center justify-between gap-2 cursor-pointer hover:border-[#D9532F] transition-colors ${
                        isDark ? 'bg-[#121316] border-[#27272A]' : 'bg-[#F4F3EF] border-[#DCD9CE]'
                      }`}
                    >
                      <div className="truncate">
                        <span className="mr-1.5">{ref.icon}</span>
                        <span className="font-semibold">{ref.name}</span>
                        <div className="font-mono text-[9.5px] opacity-60 truncate">{ref.endpoint}</div>
                      </div>
                      <span className="text-[10px] text-[#D9532F] font-semibold shrink-0">Use</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-current/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-current/20 font-semibold text-xs cursor-pointer hover:bg-current/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!addToKeymap && !addToButton}
              className={`px-5 py-2 rounded-xl bg-[#D9532F] text-white font-bold text-xs cursor-pointer hover:bg-[#C04524] transition-colors ${
                !addToKeymap && !addToButton ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              Add Endpoint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
