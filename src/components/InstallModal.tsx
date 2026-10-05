import React, { useState, useEffect } from 'react';
import { Smartphone, Check, Copy, X, QrCode, Wifi, AlertTriangle, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose, isDark }) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [appUrl, setAppUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.href.split('?')[0].replace(/\/+$/, '');
      setAppUrl(url);

      QRCode.toDataURL(url, {
        width: 220,
        margin: 1,
        color: {
          dark: '#121316',
          light: '#FFFFFF',
        },
      })
        .then((dataUri) => setQrDataUrl(dataUri))
        .catch((err) => console.error('QR code generation failed:', err));
    }
  }, []);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (appUrl) {
      navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
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
              <Smartphone className="w-5 h-5 text-[#D9532F]" />
              <h3 className="font-bold text-base sm:text-lg">Install KOMOTE as Native Offline App</h3>
            </div>
            <p className="text-xs opacity-70 mt-0.5">
              No Netlify or GitHub hosting needed — works 100% offline on your local Wi-Fi!
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

        {/* Content */}
        <div className="py-3 space-y-4 text-xs">
          {/* Answer Box: Why Netlify is NOT needed */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1.5 text-emerald-400">
            <div className="font-bold flex items-center gap-2 text-[13px] text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
              <span>You Do NOT Need to Host on Netlify or Upload Anywhere!</span>
            </div>
            <p className="opacity-90 leading-relaxed text-[11.5px]">
              KOMOTE is already live right here. When you open this link in Chrome on your phone, Chrome builds and installs an official <strong>Android WebAPK</strong> directly to your home screen. Once loaded, our built-in <strong>Service Worker</strong> caches everything permanently — you can turn off internet completely and it will still work offline over your local Wi-Fi network!
            </p>
          </div>

          {/* Explanation of Why opening index.html from zip failed */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1 text-amber-300 text-[11px] leading-relaxed">
            <div className="font-bold flex items-center gap-1.5 text-amber-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Why opening index.html as a file failed & broke Bluetooth:</span>
            </div>
            <p className="opacity-85">
              When you double-click <code className="px-1 py-0.5 rounded bg-black/20 font-mono text-[10px]">index.html</code> from a file manager, Android runs it under a restricted <code className="px-1 py-0.5 rounded bg-black/20 font-mono text-[10px]">file:///</code> sandbox. Android OS strictly blocks installing apps from <code className="px-1 py-0.5 rounded bg-black/20 font-mono text-[10px]">file:///</code> (causing <em>&quot;No directory found after splash screen&quot;</em>) and disables the <strong>Gamepad & Bluetooth API</strong>.
            </p>
          </div>

          {/* QR Code & Direct URL Box */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center gap-4 ${
            isDark ? 'bg-[#121316] border-[#27272A]' : 'bg-[#F4F3EF] border-[#DCD9CE]'
          }`}>
            {qrDataUrl && (
              <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm shrink-0">
                <img src={qrDataUrl} alt="KOMOTE QR Code" className="w-36 h-36 rounded-lg" />
              </div>
            )}
            <div className="flex-1 w-full space-y-2 text-center sm:text-left">
              <div className="font-bold text-xs flex items-center justify-center sm:justify-start gap-1.5">
                <QrCode className="w-4 h-4 text-[#D9532F]" />
                <span>Scan with your phone camera</span>
              </div>
              <p className="text-[11px] opacity-70">
                Point your phone camera at the QR code to open KOMOTE directly in Chrome or Safari.
              </p>
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={appUrl}
                  className={`flex-1 h-8 px-2.5 rounded-lg border font-mono text-[10.5px] truncate select-all ${
                    isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-[#DCD9CE]'
                  }`}
                />
                <button
                  onClick={handleCopy}
                  className="h-8 px-3 rounded-lg bg-[#D9532F] text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-[#C04524] transition-colors shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Steps to Install in Chrome */}
          <div className="space-y-2">
            <span className="font-bold block text-xs opacity-75">3 Quick Steps on Android:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#121316] border-[#27272A]' : 'bg-white border-[#DCD9CE]'}`}>
                <div className="font-bold text-[#D9532F] mb-1">1. Open in Chrome</div>
                <div className="opacity-75">Scan the QR code above or paste the link into Chrome.</div>
              </div>
              <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#121316] border-[#27272A]' : 'bg-white border-[#DCD9CE]'}`}>
                <div className="font-bold text-[#D9532F] mb-1">2. Tap Install</div>
                <div className="opacity-75">Tap Chrome menu (<strong>⋮</strong>) → <strong>Install app</strong> or <strong>Add to Home screen</strong>.</div>
              </div>
              <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#121316] border-[#27272A]' : 'bg-white border-[#DCD9CE]'}`}>
                <div className="font-bold text-[#D9532F] mb-1">3. Works 100% Offline</div>
                <div className="opacity-75">Chrome builds your WebAPK. Bluetooth, Gamepads, and local Wi-Fi work without internet!</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 font-mono text-[11px] opacity-70">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>Connect your phone and Kindle to the same local Wi-Fi or phone hotspot.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-current/10 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#D9532F] text-white font-bold text-xs cursor-pointer hover:bg-[#C04524] transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
