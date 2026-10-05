import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle2, X, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  darkTheme: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ darkTheme }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
          darkTheme
            ? 'bg-[#27272A] text-[#F4F3EF] hover:bg-[#3F3F46] border border-[#3F3F46]'
            : 'bg-[#EAE8E1] text-[#18181B] hover:bg-[#DFDDD4] border border-[#D5D2C6]'
        }`}
        title="Install to your phone Home Screen for 100% offline Wi-Fi operation"
      >
        <Download className="w-3.5 h-3.5 text-[#D9532F]" />
        <span>{isIOS ? 'Install on iOS' : 'Install Offline App'}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            className={`w-full max-w-md rounded-2xl p-6 shadow-xl border ${
              darkTheme
                ? 'bg-[#18181B] text-[#F4F3EF] border-[#27272A]'
                : 'bg-[#F4F3EF] text-[#18181B] border-[#DCD9CE]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-current/10">
              <div>
                <h3 className="font-display text-lg font-semibold">
                  Install for Offline Local Wi-Fi Use
                </h3>
                <p className="text-xs opacity-70 mt-1">
                  Works without internet—only requires local Wi-Fi or a phone hotspot shared with your Kindle.
                </p>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg opacity-70 hover:opacity-100 cursor-pointer"
                aria-label="Close install guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div
                className={`p-3.5 rounded-xl border ${
                  darkTheme
                    ? 'bg-[#202024] border-[#2E2E34]'
                    : 'bg-white border-[#E2DFD5]'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-xs mb-2">
                  <Share className="w-3.5 h-3.5 text-[#D9532F]" />
                  <span>iPhone / iPad (Safari)</span>
                </div>
                <ol className="text-xs space-y-1.5 opacity-85 list-decimal list-inside">
                  <li>
                    Tap the <strong>Share</strong> button in Safari toolbar.
                  </li>
                  <li>
                    Scroll down and tap <strong>Add to Home Screen</strong>.
                  </li>
                  <li>
                    Launch <strong>Page Turner</strong> from your Home Screen.
                  </li>
                </ol>
              </div>

              <div
                className={`p-3.5 rounded-xl border ${
                  darkTheme
                    ? 'bg-[#202024] border-[#2E2E34]'
                    : 'bg-white border-[#E2DFD5]'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-xs mb-2">
                  <Smartphone className="w-3.5 h-3.5 text-[#D9532F]" />
                  <span>Android (Chrome / Edge / Brave)</span>
                </div>
                <ol className="text-xs space-y-1.5 opacity-85 list-decimal list-inside">
                  <li>
                    Open this page in your phone browser tab.
                  </li>
                  <li>
                    Tap the browser menu (<strong>⋮</strong>) and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                  </li>
                </ol>
              </div>

              <div className="flex items-start gap-2.5 text-xs opacity-80 pt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Service Worker caching is active. All controls and KOReader HTTP endpoints work 100% offline.
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowGuide(false)}
                className="min-h-[44px] w-full rounded-xl bg-[#D9532F] text-white text-xs font-semibold hover:bg-[#C04524] transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
