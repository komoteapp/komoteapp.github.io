import React from 'react';
import { ShieldAlert, ExternalLink, RefreshCw, X, Check, Sliders, Layers } from 'lucide-react';

interface HttpsFixModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  host: string;
  onEnableTabBridge: () => void;
}

export const HttpsFixModal: React.FC<HttpsFixModalProps> = ({
  isOpen,
  onClose,
  isDark,
  host,
  onEnableTabBridge,
}) => {
  if (!isOpen) return null;

  const cleanHost = host.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const kindleUrl = `http://${cleanHost}/koreader/event`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg rounded-2xl border p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto ${
          isDark
            ? 'bg-[#18181B] border-[#27272A] text-[#F4F3EF]'
            : 'bg-white border-[#DCD9CE] text-[#18181B]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-current/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Unblock Local Kindle Wi-Fi</h3>
              <p className="text-[11px] opacity-70">Overcome Chrome's HTTPS Mixed Content Restriction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-current/15 flex items-center justify-center cursor-pointer hover:bg-current/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Explanation */}
        <div className="py-3 space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11.5px] leading-relaxed">
            Because KOMOTE is hosted securely over HTTPS (<strong>komoteapp.github.io</strong>), modern browsers block background requests to local HTTP devices (like your Kindle at <code>{cleanHost}</code>) by default. Choose one of the two solutions below:
          </div>

          {/* Solution 1: Chrome Site Settings (Recommended) */}
          <div
            className={`p-3.5 rounded-xl border space-y-2.5 ${
              isDark ? 'bg-[#121316] border-[#27272A]' : 'bg-[#F4F3EF] border-[#DCD9CE]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-400">
                <Sliders className="w-4 h-4" />
                <span>Method 1: Allow Insecure Content in Chrome (Recommended)</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-semibold">
                0 Tabs · Background
              </span>
            </div>
            <p className="text-[11px] opacity-80 leading-relaxed">
              Enables native background fetch so page turns happen instantly with zero extra tabs:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] opacity-90 pl-1 leading-snug">
              <li>
                In your browser's address bar, tap the <strong>🎛️ Tune / Lock icon</strong> (left of <code>komoteapp.github.io</code>).
              </li>
              <li>
                Tap <strong>Site settings</strong>.
              </li>
              <li>
                Find <strong>Insecure content</strong> (defaults to <em>Block</em>) and change it to <strong>Allow</strong>.
              </li>
              <li>Return to this page and reload!</li>
            </ol>
            <button
              onClick={() => window.location.reload()}
              className="w-full mt-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>I've Enabled It — Reload Page</span>
            </button>
          </div>

          {/* Solution 2: Tab Bridge */}
          <div
            className={`p-3.5 rounded-xl border space-y-2.5 ${
              isDark ? 'bg-[#121316] border-[#27272A]' : 'bg-[#F4F3EF] border-[#DCD9CE]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-400">
                <Layers className="w-4 h-4" />
                <span>Method 2: Use Kindle Bridge Tab</span>
              </div>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-mono font-semibold">
                No Settings Needed
              </span>
            </div>
            <p className="text-[11px] opacity-80 leading-relaxed">
              Opens a background bridge window to your Kindle. Top-level window navigation is never blocked by Mixed Content!
            </p>
            <button
              onClick={() => {
                onEnableTabBridge();
                onClose();
              }}
              className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Bridge Tab & Switch to Bridge Mode</span>
            </button>
          </div>

          {/* Solution 3: Direct Kindle Test Link */}
          <div className="pt-2 border-t border-current/10 flex items-center justify-between gap-2">
            <span className="text-[11px] opacity-75">Test if Kindle HTTP Inspector is running:</span>
            <a
              href={kindleUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-mono font-semibold text-[#D9532F] hover:underline flex items-center gap-1"
            >
              <span>Open http://{cleanHost} ↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
