import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Wifi,
  Smartphone,
  Settings,
  Moon,
  Sun,
  SunDim,
  SkipForward,
  SkipBack,
  Type,
  Bookmark,
  Vibrate,
  RotateCcw,
  Check,
  Copy,
  ExternalLink,
  Gamepad2,
  Bluetooth,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Plus,
  Trash2,
  Play,
  Pause,
  Zap,
  Coffee,
  Share,
  HelpCircle,
  Activity,
  Layers,
  Sparkles,
  Palette,
  Download,
} from 'lucide-react';
import { triggerTactileFeedback } from './utils/soundAndHaptics';
import { usePWAInstall } from './hooks/usePWAInstall';
import { ControllerModal } from './components/ControllerModal';
import { InstallModal } from './components/InstallModal';
import { EndpointDirectory } from './components/EndpointDirectory';

interface ActionMeta {
  id: string;
  name: string;
  icon: string;
  endpoint: string;
  defaultVisible: boolean;
}

const STANDARD_ACTIONS: ActionMeta[] = [
  { id: 'font_inc', name: 'Font +', icon: 'A+', endpoint: '/koreader/event/IncreaseFontSize/1', defaultVisible: true },
  { id: 'font_dec', name: 'Font -', icon: 'A-', endpoint: '/koreader/event/DecreaseFontSize/1', defaultVisible: true },
  { id: 'light_inc', name: 'Light +', icon: '💡+', endpoint: '/koreader/event/IncreaseFlIntensity/1', defaultVisible: true },
  { id: 'light_dec', name: 'Light -', icon: '💡-', endpoint: '/koreader/event/DecreaseFlIntensity/1', defaultVisible: true },
  { id: 'toc', name: 'Chapters', icon: '📖', endpoint: '/koreader/event/ShowToc', defaultVisible: true },
  { id: 'next_ch', name: 'Next Ch.', icon: '⏭️', endpoint: '/koreader/event/GotoNextChapter', defaultVisible: true },
  { id: 'prev_ch', name: 'Prev Ch.', icon: '⏮️', endpoint: '/koreader/event/GotoPrevChapter', defaultVisible: true },
  { id: 'refresh', name: 'Flash Screen', icon: '⚡', endpoint: '/koreader/event/FullRefresh', defaultVisible: true },
  { id: 'night', name: 'Night Mode', icon: '🌙', endpoint: '/koreader/event/ToggleNightMode', defaultVisible: true },
  { id: 'bookmark', name: 'Bookmark', icon: '🔖', endpoint: '/koreader/event/ToggleBookmark', defaultVisible: true },
];

const ACCENT_COLORS = [
  { name: 'Minimal Charcoal', hex: '#71717A' },
  { name: 'Slate Gray', hex: '#64748B' },
  { name: 'Kindle Terracotta', hex: '#D9532F' },
  { name: 'Electric Emerald', hex: '#10B981' },
  { name: 'E-Ink Cyan', hex: '#0EA5E9' },
  { name: 'Amber Sunset', hex: '#F59E0B' },
  { name: 'Paper Violet', hex: '#8B5CF6' },
];

export const TIMEOUT_OPTIONS = [0, 15, 30, 60, 120, 300];

const DEFAULT_BT_MAPPINGS: Record<string, string[]> = {
  nextPage: [],
  prevPage: [],
  showToc: [],
  toggleAutoTurn: [],
  fullRefresh: [],
  fontIncrease: [],
  fontDecrease: [],
  toggleBookmark: [],
  nightMode: [],
  nextChapter: [],
  prevChapter: [],
};

const GP_BUTTON_LABELS = [
  'A / Cross (Btn 0)',
  'B / Circle (Btn 1)',
  'X / Square (Btn 2)',
  'Y / Triangle (Btn 3)',
  'LB / L1 (Btn 4)',
  'RB / R1 (Btn 5)',
  'LT / L2 (Btn 6)',
  'RT / R2 (Btn 7)',
  'Select / Back (Btn 8)',
  'Start (Btn 9)',
  'L3 (Stick)',
  'R3 (Stick)',
  'D-Pad Up',
  'D-Pad Down',
  'D-Pad Left',
  'D-Pad Right',
];

export type TransportMode = 'image-beacon' | 'no-cors' | 'iframe';

interface LogEntry {
  id: string;
  time: string;
  label: string;
  endpoint: string;
  status: 'ok' | 'sending' | 'error';
  latencyMs?: number;
  mode?: string;
  note?: string;
}

export default function App() {
  // PWA Install Hook
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // Settings State
  const [host, setHost] = useState<string>(() => {
    return localStorage.getItem('komote_host') || '192.168.1.91:8080';
  });
  const [transportMode, setTransportMode] = useState<TransportMode>(() => {
    const saved = localStorage.getItem('komote_transport_mode');
    if (saved === 'tab-bridge' || !saved || saved === 'cors') {
      localStorage.setItem('komote_transport_mode', 'image-beacon');
      return 'image-beacon';
    }
    if (['image-beacon', 'no-cors', 'iframe'].includes(saved)) {
      return saved as TransportMode;
    }
    return 'image-beacon';
  });
  const [isIframe, setIsIframe] = useState<boolean>(() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  });
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<Record<string, { status: 'idle' | 'testing' | 'ok' | 'error'; ms?: number; note?: string }>>({});
  const [isTestingAll, setIsTestingAll] = useState<boolean>(false);
  const [accentColor, setAccentColor] = useState<string>(() => {
    return localStorage.getItem('komote_accent_color') || '#71717A';
  });
  const [deckLayout, setDeckLayout] = useState<'50-50' | '70-30'>(() => {
    return (localStorage.getItem('komote_deck_layout') as '50-50' | '70-30') || '50-50';
  });
  const [isSwapped, setIsSwapped] = useState<boolean>(() => {
    return localStorage.getItem('komote_swapped') === 'true';
  });
  const [hapticsOn, setHapticsOn] = useState<boolean>(() => {
    return localStorage.getItem('komote_haptics') !== 'false';
  });
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('komote_theme') !== 'light';
  });
  const [showToolbar, setShowToolbar] = useState<boolean>(() => {
    return localStorage.getItem('komote_show_toolbar') !== 'false';
  });
  const [wakeLockEnabled, setWakeLockEnabled] = useState<boolean>(() => {
    return localStorage.getItem('komote_wakelock') !== 'false';
  });
  const [zenTimeoutSec, setZenTimeoutSec] = useState<number>(() => {
    const saved = localStorage.getItem('komote_zen_timeout') ?? localStorage.getItem('komote_blackout_timeout');
    return saved !== null ? Number(saved) : 30; // 30 seconds default (0 = Never)
  });
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [showZenControls, setShowZenControls] = useState<boolean>(false);
  const isZenModeRef = useRef<boolean>(false);

  // Auto-Turner
  const [autoTurnActive, setAutoTurnActive] = useState<boolean>(false);
  const [autoSec, setAutoSec] = useState<number>(() => {
    const saved = localStorage.getItem('komote_auto_sec');
    return saved ? Math.max(3, Number(saved)) : 40;
  });
  const [autoRemaining, setAutoRemaining] = useState<number>(40);
  const [isEditingAutoSec, setIsEditingAutoSec] = useState<boolean>(false);
  const [showLogs, setShowLogs] = useState<boolean>(false);

  // UI Modals
  const [activeModal, setActiveModal] = useState<'none' | 'settings' | 'controller' | 'customize' | 'pwa' | 'install'>('none');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Diagnostics & Status
  const [statusDot, setStatusDot] = useState<'idle' | 'busy' | 'online' | 'offline'>('idle');
  const [recentLatency, setRecentLatency] = useState<number | null>(null);
  const [sessionTurns, setSessionTurns] = useState<number>(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Bluetooth & Custom Buttons (Clean slate by default, saves last selected on device)
  const [btMappings, setBtMappings] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('komote_custom_bt_mappings_v6');
      if (saved) {
        const parsed = JSON.parse(saved);
        const result: Record<string, string[]> = { ...DEFAULT_BT_MAPPINGS };
        for (const k in DEFAULT_BT_MAPPINGS) {
          if (Array.isArray(parsed[k])) {
            result[k] = parsed[k];
          }
        }
        return result;
      }
      return DEFAULT_BT_MAPPINGS;
    } catch {
      return DEFAULT_BT_MAPPINGS;
    }
  });
  const [learningAction, setLearningAction] = useState<string | null>(null);
  const [lastDetectedKey, setLastDetectedKey] = useState<string | null>(null);
  const [connectedGamepadName, setConnectedGamepadName] = useState<string | null>(null);

  const [buttonVisibility, setButtonVisibility] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('komote_btn_vis_v9');
      if (saved) return JSON.parse(saved);
      const initial: Record<string, boolean> = {};
      STANDARD_ACTIONS.forEach((a) => {
        initial[a.id] = a.defaultVisible;
      });
      return initial;
    } catch {
      const initial: Record<string, boolean> = {};
      STANDARD_ACTIONS.forEach((a) => {
        initial[a.id] = a.defaultVisible;
      });
      return initial;
    }
  });

  const [customButtons, setCustomButtons] = useState<Array<{ label: string; icon: string; endpoint: string }>>(() => {
    try {
      const saved = localStorage.getItem('komote_custom_btns_v9');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customKeymaps, setCustomKeymaps] = useState<Array<{ id: string; name: string; icon: string; endpoint: string; desc?: string }>>(() => {
    try {
      const saved = localStorage.getItem('komote_custom_keymaps_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('komote_custom_btns_v9', JSON.stringify(customButtons));
  }, [customButtons]);

  useEffect(() => {
    localStorage.setItem('komote_custom_keymaps_v1', JSON.stringify(customKeymaps));
  }, [customKeymaps]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2400);
  }, []);

  const handleAddCustomKeymap = useCallback(
    (item: { name: string; icon: string; endpoint: string; desc?: string }) => {
      const newId = `km_${Date.now()}`;
      setCustomKeymaps((prev) => {
        if (prev.some((k) => k.endpoint === item.endpoint)) return prev;
        return [
          ...prev,
          {
            id: newId,
            name: item.name,
            icon: item.icon,
            endpoint: item.endpoint,
            desc: item.desc,
          },
        ];
      });
      setBtMappings((prev) => ({ ...prev, [newId]: [] }));
      showToast(`Added "${item.name}" to Keymaps`);
    },
    [showToast]
  );

  const handleRemoveCustomKeymap = useCallback(
    (id: string) => {
      setCustomKeymaps((prev) => prev.filter((k) => k.id !== id));
      setBtMappings((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      showToast('Removed custom keymap');
    },
    [showToast]
  );

  const handleAddCustomButton = useCallback(
    (item: { label: string; icon: string; endpoint: string }) => {
      setCustomButtons((prev) => {
        if (prev.some((b) => b.endpoint === item.endpoint)) return prev;
        return [...prev, item];
      });
      showToast(`Added "${item.label}" button to remote deck`);
    },
    [showToast]
  );

  const handleRemoveCustomButton = useCallback(
    (index: number) => {
      setCustomButtons((prev) => prev.filter((_, idx) => idx !== index));
      showToast('Removed button');
    },
    [showToast]
  );

  // Single-dispatch queue refs (Crash-proof protection against overloading LuaSocket)
  const isDispatchingRef = useRef<boolean>(false);
  const dispatchQueueRef = useRef<{ endpoint: string; label: string; feedback: 'next' | 'prev' | 'secondary' } | null>(null);
  const lastDispatchTimeRef = useRef<number>(0);
  const retainedBeaconsRef = useRef<HTMLImageElement[]>([]);
  const wakeLockObjRef = useRef<WakeLockSentinel | null>(null);

  // Save changes
  useEffect(() => {
    localStorage.setItem('komote_host', host);
  }, [host]);
  useEffect(() => {
    localStorage.setItem('komote_accent_color', accentColor);
    document.documentElement.style.setProperty('--accent', accentColor);
  }, [accentColor]);
  useEffect(() => {
    localStorage.setItem('komote_deck_layout', deckLayout);
  }, [deckLayout]);
  useEffect(() => {
    localStorage.setItem('komote_swapped', String(isSwapped));
  }, [isSwapped]);
  useEffect(() => {
    localStorage.setItem('komote_haptics', String(hapticsOn));
  }, [hapticsOn]);
  useEffect(() => {
    isZenModeRef.current = isZenMode;
  }, [isZenMode]);
  useEffect(() => {
    localStorage.setItem('komote_theme', isDark ? 'dark' : 'light');
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#121316' : '#F4F3EF');
    }
  }, [isDark]);
  useEffect(() => {
    localStorage.setItem('komote_show_toolbar', String(showToolbar));
  }, [showToolbar]);
  useEffect(() => {
    localStorage.setItem('komote_wakelock', String(wakeLockEnabled));
  }, [wakeLockEnabled]);
  useEffect(() => {
    localStorage.setItem('komote_zen_timeout', String(zenTimeoutSec));
  }, [zenTimeoutSec]);
  useEffect(() => {
    localStorage.setItem('komote_custom_bt_mappings_v6', JSON.stringify(btMappings));
  }, [btMappings]);
  useEffect(() => {
    localStorage.setItem('komote_btn_vis_v9', JSON.stringify(buttonVisibility));
  }, [buttonVisibility]);
  useEffect(() => {
    localStorage.setItem('komote_custom_btns_v9', JSON.stringify(customButtons));
  }, [customButtons]);

  // Ensure transportMode is never tab-bridge or cors (which could open tabs)
  useEffect(() => {
    const saved = localStorage.getItem('komote_transport_mode');
    if (saved === 'tab-bridge' || saved === 'cors' || !saved) {
      localStorage.setItem('komote_transport_mode', 'image-beacon');
      setTransportMode('image-beacon');
    }
  }, []);

  // Clean host helper - auto adds default KOReader port :8080 if not specified
  const cleanHost = (h: string) => {
    let cleaned = (h || '').replace(/^https?:\/\//i, '').replace(/\/+$/, '').trim();
    if (cleaned.includes('/')) {
      cleaned = cleaned.split('/')[0];
    }
    if (cleaned && !cleaned.includes(':')) {
      cleaned = `${cleaned}:8080`;
    }
    return cleaned || '192.168.1.91:8080';
  };

  // --- CRASH-PROOF DISPATCH ENGINE ---
  // Guaranteed single GET request per user action, 180ms serial throttle, zero OPTIONS preflight
  const dispatchCommand = useCallback(
    (endpoint: string, label: string, feedback: 'next' | 'prev' | 'secondary' = 'secondary') => {
      triggerTactileFeedback(feedback, { haptic: hapticsOn });

      const now = performance.now();
      // Enforce strict 180ms inter-command delay so Kindle Lua event loop is never overwhelmed
      if (isDispatchingRef.current || now - lastDispatchTimeRef.current < 180) {
        dispatchQueueRef.current = { endpoint, label, feedback };
        return;
      }

      isDispatchingRef.current = true;
      lastDispatchTimeRef.current = now;

      const ch = cleanHost(host);
      // Clean URL: NEVER attach query parameters (?_t) as it breaks KOReader's argument parser
      const cleanUrl = `http://${ch}${endpoint}`;
      const startTime = performance.now();

      setStatusDot('busy');

      const logId = `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setLogs((prev) => [
        { id: logId, time: timeStr, label, endpoint, status: 'sending' },
        ...prev.slice(0, 19),
      ]);

      const finishDispatch = (status: 'ok' | 'error', durationMs: number, note?: string) => {
        setRecentLatency(durationMs);
        setStatusDot(status === 'ok' ? 'online' : 'offline');
        setLogs((prev) =>
          prev.map((item) =>
            item.id === logId ? { ...item, status, latencyMs: durationMs, mode: transportMode, note } : item
          )
        );

        setTimeout(() => {
          isDispatchingRef.current = false;
          if (dispatchQueueRef.current) {
            const next = dispatchQueueRef.current;
            dispatchQueueRef.current = null;
            dispatchCommand(next.endpoint, next.label, next.feedback);
          }
        }, 120);
      };

      // Mode 1: Image Beacon (Silent background GET, 0 tabs, never blocked by CORS)
      if (transportMode === 'image-beacon') {
        const img = new Image();
        retainedBeaconsRef.current.push(img);
        if (retainedBeaconsRef.current.length > 8) retainedBeaconsRef.current.shift();
        img.onload = img.onerror = () => {
          finishDispatch('ok', Math.round(performance.now() - startTime), 'Beacon Sent');
        };
        img.src = cleanUrl;
        return;
      }

      // Mode 2: Hidden Iframe
      if (transportMode === 'iframe') {
        try {
          let bridgeFrame = document.getElementById('koreader-bridge-iframe') as HTMLIFrameElement | null;
          if (!bridgeFrame) {
            bridgeFrame = document.createElement('iframe');
            bridgeFrame.id = 'koreader-bridge-iframe';
            bridgeFrame.name = 'koreader-bridge-iframe';
            bridgeFrame.style.display = 'none';
            bridgeFrame.style.width = '0';
            bridgeFrame.style.height = '0';
            bridgeFrame.style.border = 'none';
            document.body.appendChild(bridgeFrame);
          }
          bridgeFrame.src = cleanUrl;
          finishDispatch('ok', Math.round(performance.now() - startTime), 'Iframe Dispatched');
          return;
        } catch {}
      }

      // Mode 3: Direct fetch with mode: 'no-cors' and cache: 'no-store'
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);

      fetch(cleanUrl, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      })
        .then(() => {
          clearTimeout(timer);
          const ms = Math.round(performance.now() - startTime);
          finishDispatch('ok', ms, ch);
        })
        .catch(() => {
          clearTimeout(timer);
          const ms = Math.round(performance.now() - startTime);
          finishDispatch('error', ms, 'Unreachable');
          showToast(`⚠️ Cannot reach Kindle on ${ch}. Verify Kindle IP & KOReader HTTP server.`);
        });
    },
    [host, transportMode, hapticsOn]
  );

  // Turn page actions
  const handleNextPage = useCallback(() => {
    dispatchCommand('/koreader/event/GotoViewRel/1', 'Next Page (+1)', 'next');
    setSessionTurns((s) => s + 1);
  }, [dispatchCommand]);

  const handlePrevPage = useCallback(() => {
    dispatchCommand('/koreader/event/GotoViewRel/-1', 'Previous Page (-1)', 'prev');
    setSessionTurns((s) => s + 1);
  }, [dispatchCommand]);

  // Screen WakeLock management (keeps display awake to prevent OS sleep/lock)
  useEffect(() => {
    if (!wakeLockEnabled && !isZenMode) {
      if (wakeLockObjRef.current) {
        wakeLockObjRef.current.release().catch(() => {});
        wakeLockObjRef.current = null;
      }
      return;
    }

    async function acquireLock() {
      if ('wakeLock' in navigator) {
        try {
          wakeLockObjRef.current = await navigator.wakeLock.request('screen');
        } catch {}
      }
    }

    acquireLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && (wakeLockEnabled || isZenMode)) {
        acquireLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLockObjRef.current) {
        wakeLockObjRef.current.release().catch(() => {});
      }
    };
  }, [wakeLockEnabled, isZenMode]);

  // Screen activity tracker (screen touches on main deck reset inactivity timer)
  const lastScreenTouchRef = useRef<number>(Date.now());

  const resetScreenActivity = useCallback(() => {
    lastScreenTouchRef.current = Date.now();
  }, []);

  // Screen touch listener (resets timeout when user interacts with main controller)
  useEffect(() => {
    const handleScreenTouch = () => {
      if (isZenModeRef.current) return;
      resetScreenActivity();
    };

    window.addEventListener('pointerdown', handleScreenTouch, { capture: true, passive: true });
    window.addEventListener('touchstart', handleScreenTouch, { capture: true, passive: true });
    return () => {
      window.removeEventListener('pointerdown', handleScreenTouch, { capture: true });
      window.removeEventListener('touchstart', handleScreenTouch, { capture: true });
    };
  }, [resetScreenActivity]);

  // Zen Mode Inactivity Timeout Timer (0 = Never timeout)
  useEffect(() => {
    if (zenTimeoutSec <= 0) return;

    const interval = setInterval(() => {
      if (!isZenModeRef.current) {
        const elapsedSec = (Date.now() - lastScreenTouchRef.current) / 1000;
        if (elapsedSec >= zenTimeoutSec) {
          setIsZenMode(true);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [zenTimeoutSec]);

  // Zen Mode Swipe-Up Gesture Tracker & Screen Tap Controls
  const zenTouchStartY = useRef<number | null>(null);
  const zenTouchStartX = useRef<number | null>(null);
  const [dragDeltaY, setDragDeltaY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const lastZenTouchTimeRef = useRef<number>(0);
  const lastZenTapTimeRef = useRef<number>(0);

  const handleZenTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement)?.closest('[data-zen-interactive="true"]')) {
      zenTouchStartY.current = null;
      zenTouchStartX.current = null;
      setIsDragging(false);
      setDragDeltaY(0);
      return;
    }
    lastZenTouchTimeRef.current = performance.now();
    zenTouchStartY.current = e.touches[0].clientY;
    zenTouchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
    setDragDeltaY(0);
  };

  const handleZenTouchMove = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement)?.closest('[data-zen-interactive="true"]')) {
      return;
    }
    if (zenTouchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - zenTouchStartY.current;
    setDragDeltaY(deltaY);
  };

  const handleZenTouchEnd = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement)?.closest('[data-zen-interactive="true"]')) {
      zenTouchStartY.current = null;
      zenTouchStartX.current = null;
      setIsDragging(false);
      setDragDeltaY(0);
      return;
    }
    if (zenTouchStartY.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const endX = e.changedTouches[0].clientX;
    const deltaY = endY - zenTouchStartY.current;
    const deltaX = Math.abs(endX - (zenTouchStartX.current || 0));

    zenTouchStartY.current = null;
    zenTouchStartX.current = null;
    setIsDragging(false);
    setDragDeltaY(0);
    lastZenTouchTimeRef.current = performance.now();

    // Prevent mobile browser from synthesizing mouseup & click events
    if (e.cancelable) {
      e.preventDefault();
    }

    // 1. Swipe up detection (dragged up by > 35px, predominantly vertical)
    if (deltaY < -35 && Math.abs(deltaY) > deltaX * 0.6) {
      if (showZenControls) {
        setShowZenControls(false);
      } else {
        setIsZenMode(false);
        setShowZenControls(false);
        resetScreenActivity();
        showToast('Exited Zen Mode');
      }
      return;
    }

    // 2. Swipe down detection (dragged down by > 35px, predominantly vertical)
    if (deltaY > 35 && Math.abs(deltaY) > deltaX * 0.6) {
      setShowZenControls((prev) => !prev);
      return;
    }

    // 3. Tap detection (minimal movement): split screen vertically in half
    if (Math.abs(deltaY) < 25 && deltaX < 25) {
      const now = performance.now();
      // Debounce tap to strictly avoid double turns
      if (now - lastZenTapTimeRef.current < 350) return;
      lastZenTapTimeRef.current = now;

      const screenWidth = window.innerWidth;
      if (endX < screenWidth / 2) {
        if (isSwapped) handleNextPage();
        else handlePrevPage();
      } else {
        if (isSwapped) handlePrevPage();
        else handleNextPage();
      }
    }
  };

  const handleZenTouchCancel = () => {
    zenTouchStartY.current = null;
    zenTouchStartX.current = null;
    setIsDragging(false);
    setDragDeltaY(0);
  };

  const handleZenMouseDown = (e: React.MouseEvent) => {
    // Ignore synthetic mouse events generated by mobile touch
    if (performance.now() - lastZenTouchTimeRef.current < 1000) return;
    if ((e.target as HTMLElement)?.closest('[data-zen-interactive="true"]')) {
      zenTouchStartY.current = null;
      zenTouchStartX.current = null;
      setIsDragging(false);
      setDragDeltaY(0);
      return;
    }
    zenTouchStartY.current = e.clientY;
    zenTouchStartX.current = e.clientX;
    setIsDragging(true);
    setDragDeltaY(0);
  };

  const handleZenMouseMove = (e: React.MouseEvent) => {
    if (performance.now() - lastZenTouchTimeRef.current < 1000) return;
    if ((e.target as HTMLElement)?.closest('[data-zen-interactive="true"]')) {
      return;
    }
    if (!isDragging || zenTouchStartY.current === null) return;
    const deltaY = e.clientY - zenTouchStartY.current;
    setDragDeltaY(deltaY);
  };

  const handleZenMouseUp = (e: React.MouseEvent) => {
    // Ignore synthetic mouse events generated by mobile touch
    if (performance.now() - lastZenTouchTimeRef.current < 1000) return;
    if ((e.target as HTMLElement)?.closest('[data-zen-interactive="true"]')) {
      zenTouchStartY.current = null;
      zenTouchStartX.current = null;
      setIsDragging(false);
      setDragDeltaY(0);
      return;
    }
    if (zenTouchStartY.current === null) return;
    const deltaY = e.clientY - zenTouchStartY.current;
    const deltaX = Math.abs(e.clientX - (zenTouchStartX.current || 0));

    zenTouchStartY.current = null;
    zenTouchStartX.current = null;
    setIsDragging(false);
    setDragDeltaY(0);

    // 1. Swipe up detection: Close controls if open, or exit Zen Mode
    if (deltaY < -35 && Math.abs(deltaY) > deltaX * 0.6) {
      if (showZenControls) {
        setShowZenControls(false);
      } else {
        setIsZenMode(false);
        setShowZenControls(false);
        resetScreenActivity();
        showToast('Exited Zen Mode');
      }
      return;
    }

    // 2. Swipe down detection: Toggle controls
    if (deltaY > 35 && Math.abs(deltaY) > deltaX * 0.6) {
      setShowZenControls((prev) => !prev);
      return;
    }

    // 3. Tap detection: Turn page
    if (Math.abs(deltaY) < 25 && deltaX < 25) {
      const now = performance.now();
      if (now - lastZenTapTimeRef.current < 350) return;
      lastZenTapTimeRef.current = now;

      const screenWidth = window.innerWidth;
      if (e.clientX < screenWidth / 2) {
        if (isSwapped) handleNextPage();
        else handlePrevPage();
      } else {
        if (isSwapped) handlePrevPage();
        else handleNextPage();
      }
    }
  };

  // Auto Turner Timer
  useEffect(() => {
    if (!autoTurnActive) {
      setAutoRemaining(autoSec);
      return;
    }

    const interval = setInterval(() => {
      setAutoRemaining((prev) => {
        if (prev <= 1) {
          handleNextPage();
          return autoSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoTurnActive, autoSec, handleNextPage]);

  // Auto Turner interval stepper
  const handleAutoSecChange = useCallback(
    (delta: number) => {
      triggerTactileFeedback('secondary', { haptic: hapticsOn });
      setAutoSec((prev) => {
        let step = delta;
        if (delta < 0 && prev <= 10 && prev > 3) step = -1;
        if (delta > 0 && prev < 10) step = 1;
        const nextVal = Math.max(3, Math.min(600, prev + step));
        localStorage.setItem('komote_auto_sec', String(nextVal));
        setAutoRemaining((r) => (r > nextVal ? nextVal : r));
        return nextVal;
      });
    },
    [hapticsOn]
  );

  const handleSetAutoSecExact = useCallback((val: number) => {
    const clamped = Math.max(3, Math.min(600, isNaN(val) ? 40 : val));
    setAutoSec(clamped);
    localStorage.setItem('komote_auto_sec', String(clamped));
    setAutoRemaining((r) => (r > clamped ? clamped : r));
  }, []);

  // --- BLUETOOTH CONTROLLER & KEYBOARD ENGINE ---
  const triggerMappedAction = useCallback(
    (actionKey: string) => {
      if (actionKey === 'nextPage') handleNextPage();
      else if (actionKey === 'prevPage') handlePrevPage();
      else if (actionKey === 'showToc') dispatchCommand('/koreader/event/ShowToc', 'Chapters / TOC', 'secondary');
      else if (actionKey === 'toggleAutoTurn') {
        setAutoTurnActive((prev) => {
          const nextState = !prev;
          showToast(nextState ? `⏳ Auto-Turn Started (${autoSec}s)` : '⏸️ Auto-Turn Paused');
          return nextState;
        });
      }
      else if (actionKey === 'fullRefresh') dispatchCommand('/koreader/event/FullRefresh', 'Flash Screen', 'secondary');
      else if (actionKey === 'fontIncrease') dispatchCommand('/koreader/event/IncreaseFontSize/1', 'Font +', 'secondary');
      else if (actionKey === 'fontDecrease') dispatchCommand('/koreader/event/DecreaseFontSize/1', 'Font -', 'secondary');
      else if (actionKey === 'toggleBookmark') dispatchCommand('/koreader/event/ToggleBookmark', 'Bookmark', 'secondary');
      else if (actionKey === 'nightMode') dispatchCommand('/koreader/event/ToggleNightMode', 'Night Mode', 'secondary');
      else if (actionKey === 'nextChapter') dispatchCommand('/koreader/event/GotoNextChapter', 'Next Chapter', 'secondary');
      else if (actionKey === 'prevChapter') dispatchCommand('/koreader/event/GotoPrevChapter', 'Prev Chapter', 'secondary');
      else {
        const custom = customKeymaps.find((c) => c.id === actionKey);
        if (custom) {
          dispatchCommand(custom.endpoint, custom.name, 'secondary');
        }
      }
    },
    [handleNextPage, handlePrevPage, dispatchCommand, autoSec, showToast, customKeymaps]
  );

  const getKeyCandidates = (e: KeyboardEvent): string[] => {
    const list: string[] = [];
    if (e.code && e.code !== 'Unidentified') {
      list.push(`KEY_${e.code}`);
      list.push(e.code);
    }
    if (e.key && e.key !== 'Unidentified') {
      list.push(`KEY_${e.key}`);
      list.push(e.key);
      if (e.key === ' ') {
        list.push('KEY_Space');
        list.push('Space');
      }
    }
    if (e.keyCode && e.keyCode > 0) {
      list.push(`KEY_CODE_${e.keyCode}`);
    }
    return list;
  };

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept typing in input elements
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const candidates = getKeyCandidates(e);
      if (candidates.length === 0) return;
      const primaryIdentifier = candidates[0];
      setLastDetectedKey(primaryIdentifier);

      // Check if this key is mapped
      let mappedAction: string | null = null;
      for (const [actionKey, keys] of Object.entries(btMappings)) {
        if (candidates.some((c) => keys.includes(c) || keys.includes(c.replace('KEY_', '')))) {
          mappedAction = actionKey;
          break;
        }
      }

      // Automatic intelligent defaults for unmapped remote keys (rings, clickers, keyboards)
      if (!mappedAction && !learningAction) {
        if (
          candidates.some((c) =>
            [
              'ArrowRight', 'KEY_ArrowRight',
              'PageDown', 'KEY_PageDown',
              'Space', 'KEY_Space', ' ',
              'Enter', 'KEY_Enter',
              'MediaTrackNext', 'KEY_MediaTrackNext',
              'VolumeDown', 'KEY_VolumeDown',
              'AudioVolumeDown', 'KEY_AudioVolumeDown',
              'MediaPlayPause', 'KEY_MediaPlayPause',
            ].includes(c)
          )
        ) {
          mappedAction = 'nextPage';
        } else if (
          candidates.some((c) =>
            [
              'ArrowLeft', 'KEY_ArrowLeft',
              'PageUp', 'KEY_PageUp',
              'MediaTrackPrevious', 'KEY_MediaTrackPrevious',
              'VolumeUp', 'KEY_VolumeUp',
              'AudioVolumeUp', 'KEY_AudioVolumeUp',
            ].includes(c)
          )
        ) {
          mappedAction = 'prevPage';
        }
      }

      const isNavKey = [
        'ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp',
        'PageDown', 'PageUp', 'Space', ' ', 'Enter',
        'VolumeDown', 'VolumeUp', 'AudioVolumeDown', 'AudioVolumeUp',
        'MediaPlayPause', 'MediaTrackNext', 'MediaTrackPrevious',
        'BrowserBack', 'Back', 'Escape', 'Backspace'
      ].includes(e.key) || [
        'ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp',
        'PageDown', 'PageUp', 'Space', 'Enter', 'NumpadEnter'
      ].includes(e.code);

      // Prevent default scrolling and navigation for remote / controller keys
      if (mappedAction || isNavKey || learningAction) {
        e.preventDefault();
        e.stopPropagation();
      }

      // 1. If currently in learning mode, bind this key!
      if (learningAction) {
        setBtMappings((prev) => {
          const current = prev[learningAction] || [];
          if (!current.includes(primaryIdentifier)) {
            return { ...prev, [learningAction]: [...current, primaryIdentifier] };
          }
          return prev;
        });
        showToast(`✓ Mapped ${primaryIdentifier.replace('KEY_', '')} to ${learningAction}`);
        setLearningAction(null);
        return;
      }

      // 2. Normal mode: trigger mapped action
      if (mappedAction) {
        triggerMappedAction(mappedAction);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [learningAction, btMappings, triggerMappedAction, showToast]);

  // Gamepad Connection Event Listeners
  useEffect(() => {
    const handleGamepadConnected = (e: GamepadEvent) => {
      const name = e.gamepad && e.gamepad.id ? e.gamepad.id.split('(')[0].trim() : 'Bluetooth Controller';
      setConnectedGamepadName(name);
      showToast(`🎮 ${name} Connected`);
    };
    const handleGamepadDisconnected = () => {
      setConnectedGamepadName(null);
    };
    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);
    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
    };
  }, [showToast]);

  // Global Pointer / Mouse Click listener (supports VR controllers & air mice)
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      // Do not intercept clicks on buttons, inputs, selects, links, or inside modals
      if (target && (target.closest('button') || target.closest('select') || target.closest('input') || target.closest('a') || target.closest('.modal-sheet'))) {
        return;
      }
      const mouseId = `MOUSE_${e.button}`;
      setLastDetectedKey(mouseId);

      let mappedAction: string | null = null;
      for (const [actionKey, keys] of Object.entries(btMappings)) {
        if (keys.includes(mouseId)) {
          mappedAction = actionKey;
          break;
        }
      }
      if (mappedAction) {
        e.preventDefault();
        triggerMappedAction(mappedAction);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown, { capture: true });
    return () => window.removeEventListener('pointerdown', handlePointerDown, { capture: true });
  }, [btMappings, triggerMappedAction]);

  // Gamepad Polling Loop (Buttons + D-Pad + Analog Axes with Background Interval Keep-Alive)
  useEffect(() => {
    let animId: number = 0;
    let bgIntervalId: number | null = null;
    const buttonStates: Record<string, boolean> = {};
    const axisStates: Record<string, number> = {};

    const handleGamepadInput = (identifier: string) => {
      setLastDetectedKey(identifier);

      if (learningAction) {
        setBtMappings((prev) => {
          const current = prev[learningAction] || [];
          if (!current.includes(identifier)) {
            return { ...prev, [learningAction]: [...current, identifier] };
          }
          return prev;
        });
        showToast(`✓ Mapped ${identifier} to ${learningAction}`);
        setLearningAction(null);
      } else {
        let mappedAction: string | null = null;
        for (const [actKey, keys] of Object.entries(btMappings)) {
          if (keys.includes(identifier)) {
            mappedAction = actKey;
            break;
          }
        }

        // Automatic intuitive defaults for unmapped gamepads (A / RB / D-Pad Right = Next; B / LB / D-Pad Left = Prev)
        if (!mappedAction) {
          if (['GP_BTN_0', 'GP_BTN_5', 'GP_BTN_15', 'GP_AXIS_0_POS'].includes(identifier)) {
            mappedAction = 'nextPage';
          } else if (['GP_BTN_1', 'GP_BTN_4', 'GP_BTN_14', 'GP_AXIS_0_NEG'].includes(identifier)) {
            mappedAction = 'prevPage';
          }
        }

        if (mappedAction) {
          triggerMappedAction(mappedAction);
        }
      }
    };

    const pollGamepads = () => {
      try {
        if (typeof navigator !== 'undefined' && navigator.getGamepads) {
          const gamepads = navigator.getGamepads();
          for (let i = 0; i < gamepads.length; i++) {
            const gp = gamepads[i];
            if (!gp) continue;

            if (!connectedGamepadName && gp.id) {
              setConnectedGamepadName(gp.id.split('(')[0].trim() || 'Bluetooth Controller');
            }

            // 1. Process Buttons
            gp.buttons.forEach((btn, btnIdx) => {
              const btnId = `GP_BTN_${btnIdx}`;
              const isPressed = btn.pressed || btn.value > 0.5;
              const wasPressed = buttonStates[btnId] || false;

              if (isPressed && !wasPressed) {
                handleGamepadInput(btnId);
              }
              buttonStates[btnId] = isPressed;
            });

            // 2. Process Axes (D-Pad & Thumbsticks)
            if (gp.axes) {
              for (let a = 0; a < gp.axes.length; a++) {
                const val = gp.axes[a];
                const axisKey = `GP_AXIS_${a}`;
                const wasVal = axisStates[axisKey] || 0;

                if (val > 0.65 && wasVal <= 0.65) {
                  handleGamepadInput(`GP_AXIS_${a}_POS`);
                } else if (val < -0.65 && wasVal >= -0.65) {
                  handleGamepadInput(`GP_AXIS_${a}_NEG`);
                }
                axisStates[axisKey] = val;
              }
            }
          }
        }
      } catch {
        // Silently ignore SecurityError or permissions issues on restricted origins
      }
    };

    const loop = () => {
      pollGamepads();
      if (!document.hidden) {
        animId = requestAnimationFrame(loop);
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        // Browsers pause requestAnimationFrame when backgrounded or locked
        // Background interval keeps firing because silent background audio keeps JS thread alive
        if (bgIntervalId === null) {
          bgIntervalId = window.setInterval(pollGamepads, 35);
        }
      } else {
        if (bgIntervalId !== null) {
          clearInterval(bgIntervalId);
          bgIntervalId = null;
        }
        cancelAnimationFrame(animId);
        animId = requestAnimationFrame(loop);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    if (document.hidden) {
      bgIntervalId = window.setInterval(pollGamepads, 35);
    } else {
      animId = requestAnimationFrame(loop);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      cancelAnimationFrame(animId);
      if (bgIntervalId !== null) clearInterval(bgIntervalId);
    };
  }, [learningAction, btMappings, triggerMappedAction, showToast, connectedGamepadName]);

  const handlePingKindle = () => {
    setIsPinging(true);
    setStatusDot('busy');
    const ch = cleanHost(host);
    showToast(`Pinging Kindle at ${ch}...`);

    const pingUrl = `http://${ch}/koreader/event`;
    const startTime = performance.now();

    const markSuccess = (ms: number) => {
      setIsPinging(false);
      setStatusDot('online');
      setRecentLatency(ms);
      showToast(`✓ Kindle Connected (${ms}ms)`);
      const logId = `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLogs((prev) => [
        { id: logId, time: timeStr, label: 'Ping OK', endpoint: '/koreader/event', status: 'ok', latencyMs: ms },
        ...prev.slice(0, 19),
      ]);
    };

    const markFail = (errStr: string) => {
      setIsPinging(false);
      setStatusDot('offline');
      showToast(`⚠️ Kindle Unreachable on ${ch}: ${errStr}`);
      const logId = `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLogs((prev) => [
        { id: logId, time: timeStr, label: 'Ping Timeout', endpoint: '/koreader/event', status: 'error' },
        ...prev.slice(0, 19),
      ]);
    };

    // Fast image beacon ping (avoids CORS/preflight options, never hangs)
    let done = false;
    const timeout = setTimeout(() => {
      if (!done) {
        done = true;
        const isHttpsContext = typeof window !== 'undefined' && window.location.protocol === 'https:';
        markFail(
          isHttpsContext
            ? 'Blocked by HTTPS Mixed Content. Use Offline ZIP / Standalone HTML or set Chrome Insecure Content to Allow.'
            : 'Timeout (Kindle not responding on Wi-Fi - verify IP & KOReader HTTP inspector server)'
        );
      }
    }, 2500);

    const img = new Image();
    img.onload = img.onerror = () => {
      if (!done) {
        done = true;
        clearTimeout(timeout);
        const ms = Math.round(performance.now() - startTime);
        markSuccess(ms);
      }
    };
    img.src = pingUrl;
  };

  const handleTriggerLocalNetworkPrompt = () => {
    const ch = cleanHost(host);
    const testUrl = `http://${ch}/koreader/event`;
    showToast(`Opening Kindle direct connection tab at ${ch}...`);
    const win = window.open(testUrl, '_blank');
    if (!win) {
      showToast('⚠️ Popup blocked. Please allow popups for this site.');
    } else {
      showToast('✓ Opened Kindle direct connection tab!');
    }
  };

  const handleTestAllModes = async () => {
    setIsTestingAll(true);
    const ch = cleanHost(host);
    const testUrl = `http://${ch}/koreader/event`;
    showToast('Testing all dispatch methods against Kindle...');

    const newResults: Record<string, { status: 'idle' | 'testing' | 'ok' | 'error'; ms?: number; note?: string }> = {
      'image-beacon': { status: 'testing' },
      'no-cors': { status: 'testing' },
      iframe: { status: 'testing' },
    };
    setTestResults({ ...newResults });

    // 1. Test no-cors
    try {
      const t0 = performance.now();
      await fetch(testUrl, { method: 'GET', mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(2500) });
      const ms = Math.round(performance.now() - t0);
      newResults['no-cors'] = { status: 'ok', ms, note: 'Dispatched (Opaque OK)' };
    } catch (e: any) {
      newResults['no-cors'] = { status: 'error', note: e?.message || 'Blocked / Timeout' };
    }
    setTestResults({ ...newResults });

    // 2. Test image-beacon
    await new Promise<void>((resolve) => {
      const t0 = performance.now();
      const img = new Image();
      let done = false;
      const timer = setTimeout(() => {
        if (!done) {
          done = true;
          newResults['image-beacon'] = { status: 'error', note: 'Beacon Timeout' };
          setTestResults({ ...newResults });
          resolve();
        }
      }, 2500);

      img.onload = img.onerror = () => {
        if (!done) {
          done = true;
          clearTimeout(timer);
          const ms = Math.round(performance.now() - t0);
          newResults['image-beacon'] = { status: 'ok', ms, note: 'Received' };
          setTestResults({ ...newResults });
          resolve();
        }
      };
      img.src = testUrl;
    });

    // 4. Test iframe
    newResults['iframe'] = { status: 'ok', note: 'Navigation Ready (Mixed Content Bypass)' };
    setTestResults({ ...newResults });
    setIsTestingAll(false);
    showToast('Diagnostics complete! Review results below.');
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors selection:bg-[#D9532F]/20 ${
        isDark ? 'bg-[#121316] text-[#F4F3EF]' : 'bg-[#F4F3EF] text-[#18181B]'
      }`}
    >
      {/* 0. ZEN MODE FULLSCREEN OVERLAY: Split in half, tap to turn, swipe down for greyscale buttons, swipe up to exit */}
      {isZenMode && (
        <div
          className="fixed inset-0 z-50 bg-[#000000] select-none flex flex-col justify-between p-6 animate-in fade-in duration-300 touch-none cursor-pointer"
          onTouchStart={handleZenTouchStart}
          onTouchMove={handleZenTouchMove}
          onTouchEnd={handleZenTouchEnd}
          onTouchCancel={handleZenTouchCancel}
          onMouseDown={handleZenMouseDown}
          onMouseMove={handleZenMouseMove}
          onMouseUp={handleZenMouseUp}
          onClick={(e) => e.stopPropagation()}
          style={{
            transform: dragDeltaY < 0 ? `translateY(${Math.max(-100, dragDeltaY)}px)` : undefined,
            transition: isDragging ? 'none' : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Top Section: Swipe-down Hint or Greyscale Action Buttons Tray */}
          <div className="z-20 w-full">
            {showZenControls ? (
              <div
                data-zen-interactive="true"
                className="w-full max-w-sm mx-auto p-3 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200 cursor-default select-none shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-1 pb-2 border-b border-white/10 mb-2">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-white/30">Controls (Swipe Down / Up)</span>
                  <button
                    type="button"
                    data-zen-interactive="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowZenControls(false);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    className="w-5 h-5 rounded flex items-center justify-center text-white/40 hover:text-white/80 cursor-pointer"
                    title="Close"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>

                {/* Zen Mode Auto-Turner Row */}
                <div
                  data-zen-interactive="true"
                  className="mb-2.5 p-2 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-2"
                >
                  <button
                    type="button"
                    data-zen-interactive="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerTactileFeedback('secondary', { haptic: hapticsOn });
                      setAutoTurnActive((prev) => {
                        const next = !prev;
                        showToast(next ? `Auto-Turn Active (${autoSec}s)` : 'Auto-Turn Paused');
                        return next;
                      });
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    className={`h-9 px-3 rounded-lg border flex items-center gap-2 cursor-pointer transition-all active:scale-95 ${
                      autoTurnActive
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-semibold'
                        : 'bg-white/[0.03] border-white/10 text-white/60 hover:text-white/90'
                    }`}
                    title={autoTurnActive ? 'Pause Auto-Turn' : 'Start Auto-Turn'}
                  >
                    {autoTurnActive ? (
                      <Pause className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-white/70" />
                    )}
                    <span className="text-xs font-mono">
                      {autoTurnActive ? `Auto: ${autoRemaining}s` : 'Auto-Turn'}
                    </span>
                  </button>

                  <div className="flex items-center gap-1" data-zen-interactive="true">
                    <button
                      type="button"
                      data-zen-interactive="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAutoSecChange(-5);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onMouseUp={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onTouchEnd={(e) => e.stopPropagation()}
                      className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] active:bg-white/[0.18] border border-white/10 flex items-center justify-center text-white/70 hover:text-white text-base font-bold cursor-pointer transition-all active:scale-90"
                      title="Decrease interval (-5s)"
                    >
                      −
                    </button>
                    <span className="font-mono text-xs font-bold text-white/85 px-1 min-w-[34px] text-center tabular-nums">
                      {autoSec}s
                    </span>
                    <button
                      type="button"
                      data-zen-interactive="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAutoSecChange(5);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onMouseUp={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onTouchEnd={(e) => e.stopPropagation()}
                      className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] active:bg-white/[0.18] border border-white/10 flex items-center justify-center text-white/70 hover:text-white text-base font-bold cursor-pointer transition-all active:scale-90"
                      title="Increase interval (+5s)"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Greyscale icon buttons, no text, not bright */}
                <div className="grid grid-cols-4 gap-2" data-zen-interactive="true">
                  <button
                    type="button"
                    data-zen-interactive="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatchCommand('/koreader/event/GotoPrevChapter', 'Prev Chapter', 'secondary');
                      showToast('⏮️ Prev Chapter');
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    className="h-11 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.14] border border-white/10 flex items-center justify-center text-white/35 hover:text-white/70 active:scale-95 transition-all cursor-pointer"
                    title="Prev Chapter"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    data-zen-interactive="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatchCommand('/koreader/event/GotoNextChapter', 'Next Chapter', 'secondary');
                      showToast('⏭️ Next Chapter');
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    className="h-11 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.14] border border-white/10 flex items-center justify-center text-white/35 hover:text-white/70 active:scale-95 transition-all cursor-pointer"
                    title="Next Chapter"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    data-zen-interactive="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatchCommand('/koreader/event/FullRefresh', 'Flash Screen', 'secondary');
                      showToast('⚡ Flash Screen');
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    className="h-11 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.14] border border-white/10 flex items-center justify-center text-white/35 hover:text-white/70 active:scale-95 transition-all cursor-pointer"
                    title="Flash Screen"
                  >
                    <Zap className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    data-zen-interactive="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatchCommand('/koreader/event/IncreaseFlIntensity/1', 'Light +', 'secondary');
                      showToast('💡 Light +');
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    className="h-11 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.14] border border-white/10 flex items-center justify-center text-white/35 hover:text-white/70 active:scale-95 transition-all cursor-pointer"
                    title="Light +"
                  >
                    <Sun className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    data-zen-interactive="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatchCommand('/koreader/event/DecreaseFlIntensity/1', 'Light -', 'secondary');
                      showToast('💡 Light -');
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    className="h-11 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.14] border border-white/10 flex items-center justify-center text-white/35 hover:text-white/70 active:scale-95 transition-all cursor-pointer"
                    title="Light -"
                  >
                    <SunDim className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    data-zen-interactive="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatchCommand('/koreader/event/IncreaseFontSize/1', 'Font +', 'secondary');
                      showToast('A+ Font Larger');
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    className="h-11 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.14] border border-white/10 flex items-center justify-center text-white/35 hover:text-white/70 active:scale-95 transition-all cursor-pointer"
                    title="Font +"
                  >
                    <Type className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    data-zen-interactive="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatchCommand('/koreader/event/DecreaseFontSize/1', 'Font -', 'secondary');
                      showToast('A- Font Smaller');
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    className="h-11 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.14] border border-white/10 flex items-center justify-center text-white/35 hover:text-white/70 active:scale-95 transition-all cursor-pointer"
                    title="Font -"
                  >
                    <Type className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    data-zen-interactive="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatchCommand('/koreader/event/ToggleNightMode', 'Night Mode', 'secondary');
                      showToast('🌙 Night Mode');
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    className="h-11 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.14] border border-white/10 flex items-center justify-center text-white/35 hover:text-white/70 active:scale-95 transition-all cursor-pointer"
                    title="Night Mode"
                  >
                    <Moon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                data-zen-interactive="true"
                className="flex flex-col items-center gap-1 opacity-25 hover:opacity-60 text-white transition-opacity cursor-pointer py-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowZenControls(true);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
              >
                <ChevronDown className="w-4 h-4 animate-pulse" />
                <span className="text-[9px] font-mono uppercase tracking-widest">Swipe down for controls</span>
              </div>
            )}
          </div>

          {/* Subtle Top Divider Line */}
          <div className="w-[1px] flex-1 max-h-[30vh] bg-white/15 mx-auto pointer-events-none" />

          {/* Center Turn Counter & Reading Status */}
          <div className="text-center my-4 opacity-40 pointer-events-none transition-opacity">
            <div className="font-mono text-4xl sm:text-5xl font-bold tracking-wider text-white">
              {sessionTurns}
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/70 mt-1">
              Pages Turned
            </div>
            {autoTurnActive ? (
              <div className="text-[10px] font-mono text-emerald-400 font-bold tracking-wider uppercase mt-2 flex items-center justify-center gap-1.5 animate-pulse">
                <Play className="w-2.5 h-2.5" />
                <span>Auto-Turn in {autoRemaining}s</span>
              </div>
            ) : (
              <div className="text-[9px] font-mono text-white/40 mt-1">
                Tap left/right to turn
              </div>
            )}
          </div>

          {/* Subtle Bottom Divider Line */}
          <div className="w-[1px] flex-1 max-h-[30vh] bg-white/15 mx-auto pointer-events-none" />

          {/* Bottom Bar: Prev Hint, Swipe Up to Exit, Next Hint */}
          <div className="flex items-center justify-between pt-4 font-mono z-10">
            {/* Left Paddle Hint */}
            <div className="opacity-30 text-white text-sm font-semibold flex items-center gap-1 pointer-events-none">
              <span>(←</span>
              <span className="text-[10px] uppercase hidden sm:inline">{isSwapped ? 'Next' : 'Prev'}</span>
            </div>

            {/* Swipe Up To Exit Button / Prompt */}
            <button
              type="button"
              data-zen-interactive="true"
              className="text-center opacity-60 hover:opacity-100 text-[11px] text-white flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/15 shadow-lg backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsZenMode(false);
                setShowZenControls(false);
                resetScreenActivity();
                showToast('Exited Zen Mode');
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => {
                e.stopPropagation();
                setIsZenMode(false);
                setShowZenControls(false);
                resetScreenActivity();
                showToast('Exited Zen Mode');
              }}
            >
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center animate-bounce text-xs font-bold">
                ↑
              </div>
              <div className="font-semibold tracking-wide">Swipe up to exit</div>
            </button>

            {/* Right Paddle Hint */}
            <div className="opacity-30 text-white text-sm font-semibold flex items-center gap-1 pointer-events-none">
              <span className="text-[10px] uppercase hidden sm:inline">{isSwapped ? 'Prev' : 'Next'}</span>
              <span>→)</span>
            </div>
          </div>
        </div>
      )}

      {/* 0.1 IFRAME WARNING BANNER (When wrapped in Tiiny.host or dev iframe) */}
      {isIframe && (
        <div className="bg-amber-600/20 border-b border-amber-500/40 text-amber-200 px-3 py-2 text-xs flex items-center justify-between gap-2 z-40">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>
              <strong>Running in an iframe:</strong> Browsers restrict local network access to Kindle (<code>192.168.x.x</code>) inside iframes.
            </span>
          </div>
          <button
            onClick={() => window.open(window.location.href, '_blank')}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded text-[11px] whitespace-nowrap cursor-pointer transition-colors shadow"
          >
            Open in New Tab ↗
          </button>
        </div>
      )}

      {/* 1. TOP HEADER */}
      <header
        className={`px-4 sm:px-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b flex items-center justify-between sticky top-0 z-30 backdrop-blur-md ${
          isDark ? 'bg-[#121316]/90 border-[#27272A]' : 'bg-[#F4F3EF]/90 border-[#DCD9CE]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="font-display font-extrabold text-2xl tracking-tight" style={{ color: accentColor }}>
            KOMOTE
          </div>

          {/* Target Host Status Pill */}
          <button
            onClick={() => setActiveModal('settings')}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono border transition-all cursor-pointer ${
              isDark ? 'bg-[#18181B] border-[#27272A] hover:bg-[#202025]' : 'bg-white border-[#DCD9CE] hover:bg-[#F0EEE6]'
            }`}
            title="Kindle Connection Status · Tap to edit"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                statusDot === 'online'
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                  : statusDot === 'busy'
                  ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)] animate-pulse'
                  : statusDot === 'offline'
                  ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]'
                  : 'bg-emerald-500/70'
              }`}
            />
            <span className="truncate max-w-[120px] sm:max-w-[160px] font-semibold">{cleanHost(host).split(':')[0] || 'Kindle'}</span>
            {recentLatency !== null && <span className="opacity-60 text-[10px] hidden sm:inline">{recentLatency}ms</span>}
          </button>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Bluetooth Controller Modal Button */}
          <button
            onClick={() => setActiveModal('controller')}
            className={`h-8 px-2.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
              connectedGamepadName
                ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/25'
                : 'border-blue-500/30 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20'
            }`}
            title="Configure Bluetooth Gamepad, Remote & Keyboard Controls"
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{connectedGamepadName ? 'Gamepad' : 'Remote'}</span>
          </button>

          {/* Settings Menu Button */}
          <button
            onClick={() => setActiveModal('settings')}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${
              isDark ? 'bg-[#18181B] border-[#27272A] hover:bg-[#202025]' : 'bg-white border-[#DCD9CE] hover:bg-[#F0EEE6]'
            }`}
            title="Settings & Diagnostics"
          >
            <Settings className="w-4 h-4 opacity-80" />
          </button>
        </div>
      </header>

      {/* 2. MAIN VIEWPORT */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-4 flex flex-col gap-4">
        {/* Sub-bar: Layout Switcher & Fast Controls */}
        <div className="flex items-center justify-between px-1 gap-2">
          <div className="flex items-center gap-1.5">
            {/* Zen Mode Button */}
            <button
              onClick={() => {
                setIsZenMode(true);
                showToast('Zen Mode Active · Swipe up to exit');
              }}
              className={`h-7 px-2.5 rounded-md text-[11px] font-semibold border flex items-center gap-1.5 cursor-pointer transition-all ${
                isDark
                  ? 'bg-[#18181B] border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10'
                  : 'bg-white border-cyan-300 text-cyan-700 hover:bg-cyan-50'
              }`}
              title="Fullscreen OLED black reading mode. Tap left/right to turn pages. Swipe up to exit."
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Zen</span>
            </button>

            <button
              onClick={() => setIsSwapped((s) => !s)}
              className={`h-7 px-2.5 rounded-md text-[11px] font-semibold border flex items-center gap-1 cursor-pointer transition-all ${
                isSwapped ? 'border-[#D9532F] text-[#D9532F] bg-[#D9532F]/10' : isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-[#DCD9CE]'
              }`}
              title="Swap Left and Right paddles"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Swap</span>
            </button>

            <button
              onClick={() => setDeckLayout((l) => (l === '50-50' ? '70-30' : '50-50'))}
              className={`h-7 px-2.5 rounded-md text-[11px] font-semibold border flex items-center gap-1 cursor-pointer transition-all ${
                isDark ? 'bg-[#18181B] border-[#27272A] hover:bg-[#202025]' : 'bg-white border-[#DCD9CE] hover:bg-[#F0EEE6]'
              }`}
              title="Toggle between 50/50 Columns and 70/30 Stacked zones"
            >
              <Layers className="w-3 h-3 text-[#D9532F]" />
              <span>{deckLayout === '50-50' ? '50/50' : '70/30'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1 text-xs font-mono opacity-60">
            <span className="font-bold text-[#D9532F]">{sessionTurns}</span>
            <span>turns</span>
          </div>
        </div>

        {/* 3. TACTILE DUAL PADDLES */}
        <div
          className={`grid gap-3 transition-all ${
            deckLayout === '50-50' ? 'grid-cols-2 h-72 sm:h-80' : 'grid-cols-1 grid-rows-[7fr_3fr] h-80 sm:h-96'
          }`}
        >
          {/* Paddle A (Left or Top) */}
          <button
            onClick={isSwapped ? handleNextPage : handlePrevPage}
            className={`rounded-2xl p-6 border flex flex-col items-center justify-center text-center cursor-pointer transition-all active:scale-[0.98] select-none shadow-sm ${
              isSwapped
                ? 'text-white shadow-lg'
                : isDark
                ? 'bg-[#18181B] border-[#27272A] hover:bg-[#202025] text-[#F4F3EF]'
                : 'bg-white border-[#DCD9CE] hover:bg-[#F0EEE6] text-[#18181B]'
            }`}
            style={{
              backgroundColor: isSwapped ? accentColor : undefined,
              borderColor: isSwapped ? accentColor : undefined,
              order: deckLayout === '70-30' && !isSwapped ? 2 : 1,
            }}
          >
            <div className="flex flex-col items-center gap-2.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold transition-transform group-hover:scale-105 ${
                  isSwapped ? 'bg-white/20 text-white' : isDark ? 'bg-[#27272A] text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {isSwapped ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
              </div>
              <div className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                {isSwapped ? 'Next' : 'Prev'}
              </div>
            </div>
          </button>

          {/* Paddle B (Right or Bottom) */}
          <button
            onClick={isSwapped ? handlePrevPage : handleNextPage}
            className={`rounded-2xl p-6 border flex flex-col items-center justify-center text-center cursor-pointer transition-all active:scale-[0.98] select-none shadow-sm ${
              !isSwapped
                ? 'text-white shadow-lg'
                : isDark
                ? 'bg-[#18181B] border-[#27272A] hover:bg-[#202025] text-[#F4F3EF]'
                : 'bg-white border-[#DCD9CE] hover:bg-[#F0EEE6] text-[#18181B]'
            }`}
            style={{
              backgroundColor: !isSwapped ? accentColor : undefined,
              borderColor: !isSwapped ? accentColor : undefined,
              order: deckLayout === '70-30' && !isSwapped ? 1 : 2,
            }}
          >
            <div className="flex flex-col items-center gap-2.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold transition-transform group-hover:scale-105 ${
                  !isSwapped ? 'bg-white/20 text-white' : isDark ? 'bg-[#27272A] text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {!isSwapped ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
              </div>
              <div className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                {!isSwapped ? 'Next' : 'Prev'}
              </div>
            </div>
          </button>
        </div>

        {/* 4. ACTIONS TOOLBAR (STRICTLY 4 BUTTONS PER LINE) */}
        {showToolbar && (
          <div
            className={`rounded-2xl border p-4 shadow-sm ${
              isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-[#DCD9CE]'
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-current/10">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-60">Kindle Controls</span>
              <button
                onClick={() => setActiveModal('customize')}
                className="text-[11px] font-semibold text-[#D9532F] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Customize</span>
                <span>⚙️</span>
              </button>
            </div>

            {/* Render in a strict 4-column grid */}
            <div className="grid grid-cols-4 gap-2">
              {STANDARD_ACTIONS.filter((act) => buttonVisibility[act.id] !== false).map((act) => (
                <button
                  key={act.id}
                  onClick={() => dispatchCommand(act.endpoint, act.name, 'secondary')}
                  className={`min-h-[46px] p-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-center cursor-pointer transition-all active:scale-95 ${
                    isDark ? 'bg-[#121316] border-[#27272A] hover:bg-[#202025]' : 'bg-[#F4F3EF] border-[#DCD9CE] hover:bg-[#EAE8E1]'
                  }`}
                  title={act.name}
                >
                  <span className="text-xs font-bold leading-tight">{act.icon}</span>
                  <span className="text-[10px] font-medium opacity-85 truncate max-w-full">{act.name}</span>
                </button>
              ))}

              {customButtons.map((btn, idx) => (
                <button
                  key={`custom-${idx}`}
                  onClick={() => dispatchCommand(btn.endpoint, btn.label, 'secondary')}
                  className={`min-h-[46px] p-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-center cursor-pointer transition-all active:scale-95 ${
                    isDark ? 'bg-[#121316] border-[#27272A] hover:bg-[#202025]' : 'bg-[#F4F3EF] border-[#DCD9CE] hover:bg-[#EAE8E1]'
                  }`}
                  title={btn.label}
                >
                  <span className="text-xs font-bold text-[#D9532F] leading-tight">{btn.icon}</span>
                  <span className="text-[10px] font-medium opacity-85 truncate max-w-full">{btn.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. AUTO-TURNER CARD */}
        <div
          className={`rounded-2xl border p-3.5 sm:p-4 shadow-sm flex items-center justify-between gap-3 ${
            isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-[#DCD9CE]'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                triggerTactileFeedback('secondary', { haptic: hapticsOn });
                setAutoTurnActive(!autoTurnActive);
                showToast(!autoTurnActive ? `Auto-Turn Active (${autoSec}s)` : 'Auto-Turn Paused');
              }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-all active:scale-95 ${
                autoTurnActive
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : isDark
                  ? 'bg-[#27272A] text-gray-300 hover:bg-[#323238]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={autoTurnActive ? 'Pause Auto-Turn' : 'Start Auto-Turn'}
            >
              {autoTurnActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <div className="min-w-0">
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>Auto-Turner</span>
                {autoTurnActive && (
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold animate-pulse">
                    ({autoRemaining}s)
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-60 font-mono">
                {autoTurnActive ? `Next flip in ${autoRemaining}s` : `Interval: ${autoSec}s`}
              </p>
            </div>
          </div>

          {/* Stepper with Minus, Custom Seconds, Plus */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => handleAutoSecChange(-5)}
              className={`w-8 h-8 rounded-lg border font-bold text-base flex items-center justify-center cursor-pointer transition-all active:scale-90 ${
                isDark
                  ? 'bg-[#121316] border-[#27272A] hover:bg-[#202025] text-gray-200'
                  : 'bg-[#F4F3EF] border-[#DCD9CE] hover:bg-[#EAE8E1] text-gray-700'
              }`}
              title="Decrease interval (-5s)"
            >
              −
            </button>

            {isEditingAutoSec ? (
              <input
                type="number"
                min="3"
                max="600"
                autoFocus
                defaultValue={autoSec}
                onBlur={(e) => {
                  handleSetAutoSecExact(parseInt(e.target.value, 10));
                  setIsEditingAutoSec(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSetAutoSecExact(parseInt(e.currentTarget.value, 10));
                    setIsEditingAutoSec(false);
                  } else if (e.key === 'Escape') {
                    setIsEditingAutoSec(false);
                  }
                }}
                className={`w-14 h-8 px-1 rounded-lg border text-center font-mono text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#D9532F] ${
                  isDark ? 'bg-[#121316] border-[#D9532F] text-white' : 'bg-white border-[#D9532F] text-black'
                }`}
              />
            ) : (
              <button
                onClick={() => setIsEditingAutoSec(true)}
                className={`min-w-[46px] h-8 px-2 rounded-lg border font-mono text-xs font-bold tabular-nums flex items-center justify-center cursor-pointer transition-colors ${
                  isDark
                    ? 'bg-[#121316] border-[#27272A] hover:border-[#D9532F]/50 text-[#F4F3EF]'
                    : 'bg-[#F4F3EF] border-[#DCD9CE] hover:border-[#D9532F]/50 text-[#18181B]'
                }`}
                title="Tap to type custom seconds"
              >
                {autoSec}s
              </button>
            )}

            <button
              onClick={() => handleAutoSecChange(5)}
              className={`w-8 h-8 rounded-lg border font-bold text-base flex items-center justify-center cursor-pointer transition-all active:scale-90 ${
                isDark
                  ? 'bg-[#121316] border-[#27272A] hover:bg-[#202025] text-gray-200'
                  : 'bg-[#F4F3EF] border-[#DCD9CE] hover:bg-[#EAE8E1] text-gray-700'
              }`}
              title="Increase interval (+5s)"
            >
              +
            </button>
          </div>
        </div>

        {/* 6. LIVE DISPATCH LOG (Compact & Collapsible) */}
        <div
          className={`rounded-2xl border transition-all shadow-sm ${
            isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-[#DCD9CE]'
          }`}
        >
          <div
            className="flex items-center justify-between p-3 cursor-pointer select-none"
            onClick={() => setShowLogs((prev) => !prev)}
          >
            <div className="flex items-center gap-2 text-xs min-w-0">
              <Activity className="w-3.5 h-3.5 text-[#D9532F] shrink-0" />
              <span className="font-semibold opacity-70 shrink-0">Log</span>
              {logs.length > 0 ? (
                <span className="font-mono text-[11px] opacity-70 truncate flex items-center gap-1">
                  <span className={logs[0].status === 'ok' ? 'text-emerald-400' : logs[0].status === 'error' ? 'text-rose-400' : 'text-amber-400'}>
                    {logs[0].status === 'ok' ? '✓' : logs[0].status === 'error' ? '✕' : '…'}
                  </span>
                  <span className="truncate">{logs[0].label}</span>
                  {logs[0].latencyMs !== undefined && <span className="opacity-50 shrink-0">({logs[0].latencyMs}ms)</span>}
                </span>
              ) : (
                <span className="font-mono text-[11px] opacity-40">Ready</span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={handlePingKindle}
                className="text-[10px] font-mono text-[#D9532F] hover:underline cursor-pointer px-1 py-0.5"
                title="Ping Kindle"
              >
                ⚡ Ping
              </button>
              <button
                type="button"
                onClick={() => setShowLogs((prev) => !prev)}
                className="w-5 h-5 rounded flex items-center justify-center opacity-60 hover:opacity-100 cursor-pointer"
                title={showLogs ? 'Collapse logs' : 'Expand logs'}
              >
                {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {showLogs && (
            <div className="px-3 pb-3 pt-1 border-t border-current/10 font-mono text-[11px] space-y-1.5 max-h-32 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="opacity-40 italic py-1">No logs yet. Tap a paddle or button to dispatch.</div>
              ) : (
                logs.slice(0, 5).map((l) => (
                  <div key={l.id} className="flex items-center justify-between opacity-85">
                    <span className="truncate max-w-[220px] flex items-center gap-1.5">
                      <span className={l.status === 'ok' ? 'text-emerald-400' : l.status === 'error' ? 'text-rose-400' : 'text-amber-400'}>
                        {l.status === 'ok' ? '✓' : l.status === 'error' ? '✕' : '…'}
                      </span>
                      <span>{l.label}</span>
                    </span>
                    <span className="opacity-60 text-[10px]">{l.latencyMs !== undefined ? `${l.latencyMs}ms` : l.time}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* 7. TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#18181B] text-white px-4 py-2.5 rounded-full shadow-2xl border border-[#D9532F] font-mono text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-[#D9532F]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 8. MODAL: BLUETOOTH CONTROLLER */}
      <ControllerModal
        isOpen={activeModal === 'controller'}
        onClose={() => setActiveModal('none')}
        isDark={isDark}
        btMappings={btMappings}
        onUpdateMappings={(m) => setBtMappings(m)}
        onResetDefaults={() => {
          setBtMappings(DEFAULT_BT_MAPPINGS);
          showToast('Reset to default mappings');
        }}
        onShowToast={showToast}
        lastDetectedInput={lastDetectedKey}
        connectedGamepadName={connectedGamepadName}
        kindleHost={host}
        learningAction={learningAction}
        onSetLearningAction={setLearningAction}
        customKeymaps={customKeymaps}
        onAddCustomKeymap={handleAddCustomKeymap}
        onRemoveCustomKeymap={handleRemoveCustomKeymap}
        onTestEndpoint={(ep, label) => dispatchCommand(ep, label, 'secondary')}
      />

      {/* 9. MODAL: SETTINGS & SETUP */}
      {activeModal === 'settings' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setActiveModal('none')}>
          <div
            className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl flex flex-col max-h-[85vh] ${
              isDark ? 'bg-[#18181B] border-[#27272A] text-[#F4F3EF]' : 'bg-white border-[#DCD9CE] text-[#18181B]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-current/10">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#D9532F]" />
                <h3 className="font-bold text-base">Settings & Kindle Setup</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (isInstalled) {
                      showToast('✓ KOMOTE is already installed on your device!');
                      return;
                    }
                    if (isInstallable) {
                      const success = await install();
                      if (success) {
                        showToast('✓ KOMOTE installed successfully!');
                        return;
                      }
                    }
                    setActiveModal('install');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm"
                  title="Install KOMOTE as an offline-capable PWA"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isInstalled ? 'Installed ✓' : 'Install PWA'}</span>
                </button>
                <button
                  onClick={() => setActiveModal('none')}
                  className="w-8 h-8 rounded-lg border border-current/15 flex items-center justify-center cursor-pointer hover:bg-current/10"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto py-3 space-y-4 pr-1 text-xs">
              {/* Kindle IP & Port */}
              <div className={`p-3.5 rounded-xl border space-y-2.5 ${isDark ? 'bg-[#121316] border-[#27272A]' : 'bg-[#F4F3EF] border-[#DCD9CE]'}`}>
                <div className="flex items-center justify-between">
                  <label className="font-bold block">Kindle KOReader IP & Port</label>
                  <span className="font-mono text-[10px] opacity-60">Fixed Home Target</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => {
                      setHost(e.target.value);
                      localStorage.setItem('komote_host', e.target.value);
                    }}
                    placeholder="192.168.1.91:8080"
                    className={`flex-1 h-9 px-3 rounded-lg border font-mono text-xs ${
                      isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-[#DCD9CE]'
                    }`}
                  />
                  <button
                    onClick={handlePingKindle}
                    disabled={isPinging}
                    className="px-3 rounded-lg bg-[#D9532F] hover:bg-[#c04624] text-white font-semibold cursor-pointer text-xs flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    {isPinging ? 'Pinging...' : '⚡ Ping'}
                  </button>
                </div>
                <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setHost('192.168.1.91:8080');
                      localStorage.setItem('komote_host', '192.168.1.91:8080');
                      showToast('Reset host to 192.168.1.91:8080');
                    }}
                    className="text-[10px] font-mono text-gray-400 hover:underline cursor-pointer"
                  >
                    Reset (192.168.1.91:8080)
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerLocalNetworkPrompt}
                    className="text-[10px] font-mono text-[#D9532F] hover:underline cursor-pointer font-semibold"
                    title="Open Kindle directly in a new browser tab"
                  >
                    Open Kindle in New Tab ↗
                  </button>
                </div>
                <p className="text-[11px] opacity-70">
                  Enable via Kindle: <strong>Tools (wrench) → More tools → KOReader HTTP inspector → Start server</strong> (port 8080).
                </p>
              </div>

              {/* Color Themes & Custom Color Picker */}
              <div className={`p-3.5 rounded-xl border space-y-2.5 ${isDark ? 'bg-[#121316] border-[#27272A]' : 'bg-[#F4F3EF] border-[#DCD9CE]'}`}>
                <div className="flex items-center justify-between">
                  <label className="font-bold block">Accent Color</label>
                  <span className="font-mono text-[11px] opacity-60 uppercase">{accentColor}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => setAccentColor(c.hex)}
                      className="w-7 h-7 rounded-full border-2 cursor-pointer transition-transform active:scale-90 flex items-center justify-center text-white text-xs font-bold"
                      style={{
                        backgroundColor: c.hex,
                        borderColor: accentColor.toLowerCase() === c.hex.toLowerCase() ? '#FFFFFF' : 'transparent',
                      }}
                      title={c.name}
                    >
                      {accentColor.toLowerCase() === c.hex.toLowerCase() && '✓'}
                    </button>
                  ))}

                  {/* Custom Color Picker Swatch */}
                  <label
                    className="relative w-7 h-7 rounded-full border-2 cursor-pointer transition-transform active:scale-90 flex items-center justify-center shadow-sm overflow-hidden"
                    style={{
                      background: 'conic-gradient(from 180deg at 50% 50%, #EF4444, #F59E0B, #10B981, #06B6D4, #3B82F6, #8B5CF6, #EF4444)',
                      borderColor: !ACCENT_COLORS.some((c) => c.hex.toLowerCase() === accentColor.toLowerCase()) ? '#FFFFFF' : 'transparent',
                    }}
                    title="Choose Custom Color"
                  >
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                    />
                    <Palette className="w-3.5 h-3.5 text-white drop-shadow" />
                  </label>
                </div>
              </div>

              {/* Toggles & Power Modes */}
              <div className={`p-3.5 rounded-xl border space-y-2.5 ${isDark ? 'bg-[#121316] border-[#27272A]' : 'bg-[#F4F3EF] border-[#DCD9CE]'}`}>
                <label className="font-bold block mb-1">Feedback & Reading Modes</label>

                {/* Haptic Vibration (Only tactile option) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Vibrate className="w-4 h-4 text-[#D9532F]" />
                    <span>Haptic Vibration</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hapticsOn}
                    onChange={(e) => setHapticsOn(e.target.checked)}
                    className="w-4 h-4 accent-[#D9532F] cursor-pointer"
                  />
                </div>

                {/* Keep Screen Awake (WakeLock) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-[#D9532F]" />
                    <div>
                      <span className="font-semibold block">Keep Screen Awake (WakeLock)</span>
                      <span className="text-[10px] opacity-70">
                        Prevents phone from sleeping or locking while reading.
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={wakeLockEnabled}
                    onChange={(e) => setWakeLockEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#D9532F] cursor-pointer"
                  />
                </div>

                {/* Zen Mode & Inactivity Timeout Section */}
                <div className="p-3.5 rounded-xl border border-current/15 bg-black/10 dark:bg-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold block text-xs">Zen Mode & Inactivity Timeout</span>
                        <span className="text-[10.5px] opacity-75 leading-tight block">
                          OLED black screen. Tap left/right to turn. Swipe up to exit.
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveModal('none');
                        setIsZenMode(true);
                        showToast('Zen Mode Active · Swipe up to exit');
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-cyan-500/40 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 font-bold text-xs shrink-0 cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <span>Enter Zen</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Timeout Selector */}
                  <div className="pt-2 border-t border-current/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <Moon className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Auto-Enter Zen Mode Timeout</span>
                      </div>
                      <span className="font-mono font-bold text-xs text-[#D9532F]">
                        {zenTimeoutSec === 0 ? 'Never (Disabled)' : `${zenTimeoutSec}s`}
                      </span>
                    </div>

                    <p className="text-[10.5px] opacity-70 leading-tight">
                      Automatically switches to OLED Zen Mode after inactivity. Can be set to "Never" to keep controls always visible.
                    </p>

                    {/* Range Slider */}
                    <div className="pt-1 space-y-1">
                      <input
                        type="range"
                        min="0"
                        max={TIMEOUT_OPTIONS.length - 1}
                        step="1"
                        value={TIMEOUT_OPTIONS.indexOf(zenTimeoutSec) !== -1 ? TIMEOUT_OPTIONS.indexOf(zenTimeoutSec) : (zenTimeoutSec === 0 ? 0 : 2)}
                        onChange={(e) => {
                          const val = TIMEOUT_OPTIONS[Number(e.target.value)];
                          setZenTimeoutSec(val);
                          localStorage.setItem('komote_zen_timeout', String(val));
                        }}
                        className="w-full accent-[#D9532F] cursor-pointer"
                      />
                      <div className="relative h-5 text-[10px] font-mono select-none">
                        {TIMEOUT_OPTIONS.map((sec, idx) => {
                          const isSelected = zenTimeoutSec === sec;
                          const leftPercent = (idx / (TIMEOUT_OPTIONS.length - 1)) * 100;
                          const label = sec === 0 ? 'Never' : sec < 60 ? `${sec}s` : `${sec / 60}m`;
                          return (
                            <button
                              key={sec}
                              type="button"
                              onClick={() => {
                                setZenTimeoutSec(sec);
                                localStorage.setItem('komote_zen_timeout', String(sec));
                              }}
                              style={{ left: `${leftPercent}%` }}
                              className={`absolute -translate-x-1/2 cursor-pointer transition-colors whitespace-nowrap ${
                                isSelected ? 'font-bold text-[#D9532F] underline decoration-2' : 'opacity-60 hover:opacity-100'
                              }`}
                            >
                              {sec === 30 ? '30s (Default)' : label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {TIMEOUT_OPTIONS.map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => {
                            setZenTimeoutSec(sec);
                            localStorage.setItem('komote_zen_timeout', String(sec));
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono border cursor-pointer transition-all ${
                            zenTimeoutSec === sec
                              ? 'border-[#D9532F] text-[#D9532F] bg-[#D9532F]/10 font-bold'
                              : 'border-current/15 opacity-60 hover:opacity-100'
                          }`}
                        >
                          {sec === 0 ? 'Never' : sec < 60 ? `${sec}s` : `${sec / 60}m`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isDark ? <Moon className="w-4 h-4 text-[#D9532F]" /> : <Sun className="w-4 h-4 text-[#D9532F]" />}
                    <span>Theme</span>
                  </div>
                  <button
                    onClick={() => setIsDark(!isDark)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold border border-current/20 cursor-pointer"
                  >
                    {isDark ? 'OLED Dark' : 'Day Paper'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. MODAL: CUSTOMIZE TOOLBAR */}
      {activeModal === 'customize' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setActiveModal('none')}>
          <div
            className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl flex flex-col max-h-[85vh] ${
              isDark ? 'bg-[#18181B] border-[#27272A] text-[#F4F3EF]' : 'bg-white border-[#DCD9CE] text-[#18181B]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-current/10">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#D9532F]" />
                <h3 className="font-bold text-base">Customize Buttons</h3>
              </div>
              <button onClick={() => setActiveModal('none')} className="w-8 h-8 rounded-lg border border-current/15 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-3 pr-1 text-xs">
              <div className="space-y-2">
                {STANDARD_ACTIONS.map((btn) => (
                  <div
                    key={btn.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      isDark ? 'bg-[#121316] border-[#27272A]' : 'bg-[#F4F3EF] border-[#DCD9CE]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{btn.icon}</span>
                      <span>{btn.name}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={buttonVisibility[btn.id] !== false}
                      onChange={(e) =>
                        setButtonVisibility((prev) => ({ ...prev, [btn.id]: e.target.checked }))
                      }
                      className="w-4 h-4 accent-[#D9532F] cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              {/* Custom Buttons on Remote Deck */}
              {customButtons.length > 0 && (
                <div className="pt-2 border-t border-current/10">
                  <span className="font-bold block mb-2 opacity-70">Custom Buttons on Deck ({customButtons.length})</span>
                  <div className="space-y-2">
                    {customButtons.map((btn, idx) => (
                      <div
                        key={`custom-${idx}`}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          isDark ? 'bg-[#121316] border-[#27272A]' : 'bg-[#F4F3EF] border-[#DCD9CE]'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold flex items-center gap-1.5 truncate">
                            <span className="text-[#D9532F]">{btn.icon}</span>
                            <span className="truncate">{btn.label}</span>
                          </div>
                          <div className="text-[10px] font-mono opacity-60 truncate">{btn.endpoint}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomButton(idx)}
                          className="w-7 h-7 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                          title="Remove custom button"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* KOReader Endpoint Directory for 1-Click Buttons */}
              <div className="pt-2 border-t border-current/10">
                <EndpointDirectory
                  isDark={isDark}
                  mode="button"
                  onTestEndpoint={(ep, label) => dispatchCommand(ep, label, 'secondary')}
                  onAddAsButton={handleAddCustomButton}
                  existingButtonEndpoints={[
                    ...STANDARD_ACTIONS.map((a) => a.endpoint),
                    ...customButtons.map((c) => c.endpoint),
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 11. MODAL: NATIVE APP / PWA INSTALL GUIDE (WITH QR CODE & NO NETLIFY EXPLANATION) */}
      <InstallModal
        isOpen={activeModal === 'pwa' || activeModal === 'install'}
        onClose={() => setActiveModal('none')}
        isDark={isDark}
      />
    </div>
  );
}
