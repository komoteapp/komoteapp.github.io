import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  Bookmark,
  Sun,
  Moon,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Vibrate,
  ArrowUpDown,
  Timer,
  Zap,
  BookOpen,
  FolderOpen,
  ExternalLink,
  List,
} from 'lucide-react';
import {
  DeviceProfile,
  RemotePreferences,
  BookAirplayState,
} from '../types/koreader';

interface LibraryBook {
  id: string;
  title: string;
  author: string;
  format: string;
  currentPage: number;
  totalPages: number;
}

const SAMPLE_LIBRARY: LibraryBook[] = [
  {
    id: 'book-1',
    title: 'Flatland: A Romance of Many Dimensions',
    author: 'Edwin A. Abbott',
    format: 'EPUB',
    currentPage: 14,
    totalPages: 120,
  },
  {
    id: 'book-2',
    title: 'Dune',
    author: 'Frank Herbert',
    format: 'EPUB',
    currentPage: 88,
    totalPages: 680,
  },
  {
    id: 'book-3',
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    format: 'EPUB',
    currentPage: 45,
    totalPages: 310,
  },
  {
    id: 'book-4',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    format: 'MOBI',
    currentPage: 1,
    totalPages: 432,
  },
  {
    id: 'book-5',
    title: '1984',
    author: 'George Orwell',
    format: 'EPUB',
    currentPage: 112,
    totalPages: 328,
  },
  {
    id: 'book-6',
    title: 'Frankenstein',
    author: 'Mary Shelley',
    format: 'EPUB',
    currentPage: 24,
    totalPages: 280,
  },
];

interface TactileRemoteDeckProps {
  activeProfile: DeviceProfile;
  preferences: RemotePreferences;
  bookAirplay: BookAirplayState;
  autoTurnActive: boolean;
  autoTurnIntervalSec: number;
  autoTurnRemainingSec: number;
  sessionTurnCount: number;
  lastLatencyMs: number | null;
  onUpdatePreferences: (partial: Partial<RemotePreferences>) => void;
  onUpdateBookAirplay: (partial: Partial<BookAirplayState>) => void;
  onDispatchCommand: (endpoint: string, label: string, feedbackType?: 'next' | 'prev' | 'secondary') => void;
  onToggleAutoTurn: () => void;
  onChangeAutoTurnInterval: (sec: number) => void;
}

export const TactileRemoteDeck: React.FC<TactileRemoteDeckProps> = ({
  activeProfile,
  preferences,
  bookAirplay,
  autoTurnActive,
  autoTurnIntervalSec,
  autoTurnRemainingSec,
  sessionTurnCount,
  lastLatencyMs,
  onUpdatePreferences,
  onUpdateBookAirplay,
  onDispatchCommand,
  onToggleAutoTurn,
  onChangeAutoTurnInterval,
}) => {
  const {
    invertButtons,
    hapticFeedback,
    audioClick,
    oledDarkTheme: darkTheme,
  } = preferences;

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryBooks, setLibraryBooks] = useState<LibraryBook[]>(() => {
    try {
      const saved = localStorage.getItem('koreturn_library_react_v1');
      return saved ? JSON.parse(saved) : SAMPLE_LIBRARY;
    } catch {
      return SAMPLE_LIBRARY;
    }
  });
  const [newTitleInput, setNewTitleInput] = useState('');
  const [loadedToast, setLoadedToast] = useState<string | null>(null);

  const handleNext = () => {
    onDispatchCommand('/koreader/event/GotoViewRel/1', 'Next Page (+1)', 'next');
  };

  const handlePrev = () => {
    onDispatchCommand('/koreader/event/GotoViewRel/-1', 'Previous Page (-1)', 'prev');
  };

  const handleSelectBook = (book: LibraryBook) => {
    onUpdateBookAirplay({
      title: book.title,
      currentPage: book.currentPage,
      totalPages: book.totalPages,
    });
    setIsLibraryOpen(false);

    // Refresh display on device safely without closing document to File Manager
    onDispatchCommand('/koreader/event/FullRefresh', `Switched to ${book.title}`, 'secondary');

    setLoadedToast(`Switched to "${book.title}"`);
    setTimeout(() => setLoadedToast(null), 2500);
  };

  const handleAddCustomBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleInput.trim()) return;
    const newBook: LibraryBook = {
      id: `book-${Date.now()}`,
      title: newTitleInput.trim(),
      author: 'My Kindle Book',
      format: 'EPUB',
      currentPage: 1,
      totalPages: 250,
    };
    const updated = [...libraryBooks, newBook];
    setLibraryBooks(updated);
    try {
      localStorage.setItem('koreturn_library_react_v1', JSON.stringify(updated));
    } catch {}
    setNewTitleInput('');
    handleSelectBook(newBook);
  };

  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((bookAirplay.currentPage / bookAirplay.totalPages) * 100))
  );

  const autoProgressPercent =
    ((autoTurnIntervalSec - autoTurnRemainingSec) / autoTurnIntervalSec) * 100;

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
      {/* 1. AIRPLAY BOOK INFO CARD (Clean & Read-Only, No Popups) */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
          darkTheme
            ? 'bg-[#18181B] border-[#27272A] text-[#F4F3EF]'
            : 'bg-white border-[#DCD9CE] text-[#18181B]'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#D9532F]/10 text-[#D9532F] flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-base sm:text-lg leading-tight truncate select-none">
                {bookAirplay.title}
              </h2>
              <p className="text-xs font-mono opacity-65 flex items-center gap-1.5 mt-0.5">
                <span>Page {bookAirplay.currentPage} of {bookAirplay.totalPages}</span>
                <span>·</span>
                <span className="text-[#D9532F] font-semibold">{progressPercent}% read</span>
                <span>·</span>
                <span>{activeProfile.ip}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsLibraryOpen(true)}
              className="min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition-colors border-[#D9532F] text-[#D9532F] bg-[#D9532F]/10"
              title="Browse all books in library and load on Kindle"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>My Library</span>
            </button>
          </div>
        </div>

        {/* Live Progress Bar */}
        <div className="w-full h-2.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden my-2">
          <div
            className="h-full bg-[#D9532F] transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-mono opacity-70 pt-0.5">
          <span>Start</span>
          <span>Session: {sessionTurnCount} turns</span>
          <span>100%</span>
        </div>
      </div>

      {/* 2. PURE DUAL PADDLE TOUCH DECK (Left: Previous, Right: Next or Swapped) */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
          darkTheme
            ? 'bg-[#18181B] border-[#27272A] text-[#F4F3EF]'
            : 'bg-white border-[#DCD9CE] text-[#18181B]'
        }`}
      >
        {/* Controls Bar */}
        <div className="flex items-center justify-between mb-3.5 pb-3 border-b border-current/10">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-sm">
              Dual Remote Paddles
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#D9532F]/10 text-[#D9532F] font-semibold">
              Pure Dual Mode
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onUpdatePreferences({ invertButtons: !invertButtons })}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                invertButtons
                  ? 'border-[#D9532F] text-[#D9532F] bg-[#D9532F]/10 font-semibold'
                  : darkTheme
                  ? 'border-[#2E2E34] opacity-75 hover:opacity-100'
                  : 'border-[#DCD9CE] opacity-75 hover:opacity-100'
              }`}
              title="Swap Left and Right paddles (useful for one-handed thumb reading)"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Swap Sides</span>
            </button>

            <button
              onClick={() => onUpdatePreferences({ audioClick: !audioClick })}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                audioClick
                  ? 'border-[#D9532F] text-[#D9532F] bg-[#D9532F]/10'
                  : darkTheme
                  ? 'border-[#2E2E34] opacity-75 hover:opacity-100'
                  : 'border-[#DCD9CE] opacity-75 hover:opacity-100'
              }`}
              title="Mechanical switch click audio"
            >
              {audioClick ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              <span>Click</span>
            </button>

            <button
              onClick={() => onUpdatePreferences({ hapticFeedback: !hapticFeedback })}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                hapticFeedback
                  ? 'border-[#D9532F] text-[#D9532F] bg-[#D9532F]/10'
                  : darkTheme
                  ? 'border-[#2E2E34] opacity-75 hover:opacity-100'
                  : 'border-[#DCD9CE] opacity-75 hover:opacity-100'
              }`}
              title="Tactile phone vibration"
            >
              <Vibrate className="w-3.5 h-3.5" />
              <span>Vibe</span>
            </button>
          </div>
        </div>

        {/* Dual Paddles Grid */}
        <div
          className={`grid grid-cols-2 gap-3 min-h-[260px] sm:min-h-[300px] ${
            invertButtons ? 'flex-row-reverse' : ''
          }`}
        >
          {/* Previous Page Paddle */}
          <button
            onClick={invertButtons ? handleNext : handlePrev}
            style={{ order: invertButtons ? 2 : 1 }}
            className={`tactile-key w-full rounded-2xl p-5 border flex flex-col justify-between text-left cursor-pointer transition-transform active:scale-[0.98] select-none ${
              invertButtons
                ? 'bg-[#D9532F] hover:bg-[#C04524] border-[#D9532F] text-white shadow-md'
                : darkTheme
                ? 'bg-[#202025] hover:bg-[#27272D] border-[#323238] text-[#E4E4E7]'
                : 'bg-[#EAE8E1] hover:bg-[#E2DFD5] border-[#D0CDBE] text-[#18181B]'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] font-mono opacity-70">
                {invertButtons ? 'GotoViewRel/1' : 'GotoViewRel/-1'}
              </span>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  invertButtons
                    ? 'bg-white/20 text-white'
                    : darkTheme
                    ? 'bg-[#18181B] text-[#A1A1AA]'
                    : 'bg-white text-[#52525B]'
                }`}
              >
                {invertButtons ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </div>
            </div>

            <div className="my-auto py-4">
              <div className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                {invertButtons ? 'Next Page →' : '← Prev Page'}
              </div>
              <p className="text-xs opacity-75 mt-1 font-sans">
                {invertButtons
                  ? 'Advances book forward +1 page'
                  : 'Rewinds book backward -1 page'}
              </p>
            </div>

            <div className="text-[11px] font-mono opacity-60 border-t border-current/15 pt-2">
              Tap Left Zone · Space / Arrow
            </div>
          </button>

          {/* Next Page Paddle */}
          <button
            onClick={invertButtons ? handlePrev : handleNext}
            style={{ order: invertButtons ? 1 : 2 }}
            className={`tactile-key w-full rounded-2xl p-5 border flex flex-col justify-between text-left cursor-pointer transition-transform active:scale-[0.98] select-none ${
              !invertButtons
                ? 'bg-[#D9532F] hover:bg-[#C04524] border-[#D9532F] text-white shadow-md'
                : darkTheme
                ? 'bg-[#202025] hover:bg-[#27272D] border-[#323238] text-[#E4E4E7]'
                : 'bg-[#EAE8E1] hover:bg-[#E2DFD5] border-[#D0CDBE] text-[#18181B]'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] font-mono opacity-70">
                {!invertButtons ? 'GotoViewRel/1' : 'GotoViewRel/-1'}
              </span>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  !invertButtons
                    ? 'bg-white/20 text-white'
                    : darkTheme
                    ? 'bg-[#18181B] text-[#A1A1AA]'
                    : 'bg-white text-[#52525B]'
                }`}
              >
                {!invertButtons ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </div>
            </div>

            <div className="my-auto py-4">
              <div className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                {!invertButtons ? 'Next Page →' : '← Prev Page'}
              </div>
              <p className="text-xs opacity-75 mt-1 font-sans">
                {!invertButtons
                  ? 'Advances book forward +1 page'
                  : 'Rewinds book backward -1 page'}
              </p>
            </div>

            <div className="text-[11px] font-mono opacity-60 border-t border-current/15 pt-2">
              Tap Right Zone · Primary
            </div>
          </button>
        </div>
      </div>

      {/* 3. EXTENDED ACTIONS: LIBRARY, FILE MANAGER, FLASH, LIGHT, TOC (100% CRASH-FREE) */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
          darkTheme
            ? 'bg-[#18181B] border-[#27272A] text-[#F4F3EF]'
            : 'bg-white border-[#DCD9CE] text-[#18181B]'
        }`}
      >
        <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-current/10">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-[#D9532F]" />
            <h3 className="font-display text-sm font-semibold">
              KOReader Actions
            </h3>
          </div>
          <span className="text-xs font-mono opacity-65">
            Safe Dispatch
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Open Library Bookshelf Modal */}
          <button
            onClick={() => setIsLibraryOpen(true)}
            className="tactile-key min-h-[52px] p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors border-[#D9532F] text-[#D9532F] bg-[#D9532F]/10 hover:bg-[#D9532F]/20"
            title="Browse all library books and load on Kindle"
          >
            <BookOpen className="w-4 h-4" />
            <span>All Books</span>
          </button>

          {/* Navigate to Library / File Manager */}
          <button
            onClick={() =>
              onDispatchCommand('/koreader/event/CloseDocument', 'Exit to Library', 'secondary')
            }
            className={`tactile-key min-h-[52px] p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
              darkTheme
                ? 'bg-[#202025] border-[#2E2E34] hover:bg-[#27272D]'
                : 'bg-[#F4F3EF] border-[#DCD9CE] hover:bg-[#EAE8E1]'
            }`}
            title="Closes the open book and returns to the KOReader Library / File Manager"
          >
            <FolderOpen className="w-4 h-4" />
            <span>To Library</span>
          </button>

          {/* Table of Contents */}
          <button
            onClick={() =>
              onDispatchCommand('/koreader/event/ShowToc', 'Table of Contents', 'secondary')
            }
            className={`tactile-key min-h-[52px] p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
              darkTheme
                ? 'bg-[#202025] border-[#2E2E34] hover:bg-[#27272D]'
                : 'bg-[#F4F3EF] border-[#DCD9CE] hover:bg-[#EAE8E1]'
            }`}
            title="Opens the active document Table of Contents"
          >
            <List className="w-4 h-4 text-emerald-500" />
            <span>Contents</span>
          </button>

          {/* Screen Flash E-Ink */}
          <button
            onClick={() =>
              onDispatchCommand('/koreader/event/FullRefresh', 'Flash Screen', 'secondary')
            }
            className={`tactile-key min-h-[52px] p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
              darkTheme
                ? 'bg-[#202025] border-[#2E2E34] hover:bg-[#27272D]'
                : 'bg-[#F4F3EF] border-[#DCD9CE] hover:bg-[#EAE8E1]'
            }`}
            title="Full waveform E-Ink refresh (clears ghosting & tests connection)"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Flash Screen</span>
          </button>

          {/* Frontlight Toggle */}
          <button
            onClick={() =>
              onDispatchCommand('/koreader/event/ToggleFrontlight', 'Toggle Frontlight', 'secondary')
            }
            className={`tactile-key min-h-[52px] p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
              darkTheme
                ? 'bg-[#202025] border-[#2E2E34] hover:bg-[#27272D]'
                : 'bg-[#F4F3EF] border-[#DCD9CE] hover:bg-[#EAE8E1]'
            }`}
            title="Toggles frontlight LEDs on/off"
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Toggle Light</span>
          </button>

          {/* Night Mode Toggle */}
          <button
            onClick={() =>
              onDispatchCommand('/koreader/event/ToggleNightMode', 'Night Mode', 'secondary')
            }
            className={`tactile-key min-h-[52px] p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
              darkTheme
                ? 'bg-[#202025] border-[#2E2E34] hover:bg-[#27272D]'
                : 'bg-[#F4F3EF] border-[#DCD9CE] hover:bg-[#EAE8E1]'
            }`}
            title="Inverts display white/black"
          >
            <Moon className="w-4 h-4" />
            <span>Night Ink</span>
          </button>

          {/* Toggle Bookmark */}
          <button
            onClick={() =>
              onDispatchCommand('/koreader/event/ToggleBookmark', 'Toggle Bookmark', 'secondary')
            }
            className={`tactile-key min-h-[52px] p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
              darkTheme
                ? 'bg-[#202025] border-[#2E2E34] hover:bg-[#27272D]'
                : 'bg-[#F4F3EF] border-[#DCD9CE] hover:bg-[#EAE8E1]'
            }`}
            title="Bookmarks current page on Kindle"
          >
            <Bookmark className="w-4 h-4 text-[#D9532F]" />
            <span>Bookmark</span>
          </button>

          {/* Skip +10 Pages */}
          <button
            onClick={() =>
              onDispatchCommand('/koreader/event/GotoViewRel/10', 'Jump +10 Pages', 'next')
            }
            className={`tactile-key min-h-[52px] p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
              darkTheme
                ? 'bg-[#202025] border-[#2E2E34] hover:bg-[#27272D]'
                : 'bg-[#F4F3EF] border-[#DCD9CE] hover:bg-[#EAE8E1]'
            }`}
            title="Skips forward 10 pages"
          >
            <ChevronsRight className="w-4 h-4 text-[#D9532F]" />
            <span>Jump +10p</span>
          </button>
        </div>
      </div>

      {/* 4. HANDS-FREE AUTO-TURNER */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
          darkTheme
            ? 'bg-[#18181B] border-[#27272A] text-[#F4F3EF]'
            : 'bg-white border-[#DCD9CE] text-[#18181B]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Timer className="w-4 h-4 text-[#D9532F] shrink-0" />
            <div>
              <h3 className="font-display text-sm font-semibold">
                Hands-Free Auto-Page Turner
              </h3>
              <p className="text-xs opacity-70 font-mono tabular-nums">
                {autoTurnActive
                  ? `Next turn in ${autoTurnRemainingSec}s`
                  : `Configured interval: every ${autoTurnIntervalSec}s`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onChangeAutoTurnInterval(Math.max(5, autoTurnIntervalSec - 5))
              }
              className={`min-h-[38px] px-3 py-1 rounded-lg text-xs font-mono font-semibold border transition-colors cursor-pointer ${
                darkTheme
                  ? 'border-[#2E2E34] hover:bg-[#242429]'
                  : 'border-[#DCD9CE] hover:bg-[#EAE8E1]'
              }`}
            >
              -5s
            </button>
            <span className="font-mono text-xs font-semibold tabular-nums px-1">
              {autoTurnIntervalSec}s
            </span>
            <button
              onClick={() =>
                onChangeAutoTurnInterval(Math.min(300, autoTurnIntervalSec + 5))
              }
              className={`min-h-[38px] px-3 py-1 rounded-lg text-xs font-mono font-semibold border transition-colors cursor-pointer ${
                darkTheme
                  ? 'border-[#2E2E34] hover:bg-[#242429]'
                  : 'border-[#DCD9CE] hover:bg-[#EAE8E1]'
              }`}
            >
              +5s
            </button>

            <button
              onClick={onToggleAutoTurn}
              className={`min-h-[38px] px-4 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                autoTurnActive
                  ? 'bg-[#D9532F] text-white'
                  : darkTheme
                  ? 'bg-[#27272A] text-[#F4F3EF] hover:bg-[#323238]'
                  : 'bg-[#18181B] text-white hover:bg-[#27272A]'
              }`}
            >
              {autoTurnActive ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Auto-Turn</span>
                </>
              )}
            </button>
          </div>
        </div>

        {autoTurnActive && (
          <div className="mt-3.5 w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#D9532F] transition-all duration-300"
              style={{ width: `${autoProgressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* 5. QUICK DIRECT LINK TO KOReader EVENT DIRECTORY */}
      <div
        className={`rounded-xl border p-3 text-xs font-mono flex items-center justify-between transition-colors ${
          darkTheme
            ? 'bg-[#121316] border-[#27272A] text-[#A1A1AA]'
            : 'bg-[#F4F3EF] border-[#E2DFD5] text-[#52525B]'
        }`}
      >
        <span className="truncate">
          Kindle: http://{activeProfile.ip}:{activeProfile.port}/koreader/event
        </span>
        <a
          href={`http://${activeProfile.ip}:${activeProfile.port}/koreader/event`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#D9532F] hover:underline flex items-center gap-1 font-semibold shrink-0 ml-2"
        >
          <span>Browse All Events</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* LIBRARY BOOKSHELF MODAL */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg max-h-[85vh] rounded-2xl border p-5 flex flex-col shadow-2xl transition-colors ${
              darkTheme
                ? 'bg-[#18181B] border-[#27272A] text-[#F4F3EF]'
                : 'bg-white border-[#DCD9CE] text-[#18181B]'
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-current/10">
              <div>
                <h3 className="font-display text-lg font-bold">My Kindle Library</h3>
                <p className="text-xs font-mono opacity-65">
                  Tap any title to switch & load on Kindle
                </p>
              </div>
              <button
                onClick={() => setIsLibraryOpen(false)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                  darkTheme
                    ? 'border-[#2E2E34] hover:bg-[#202025]'
                    : 'border-[#DCD9CE] hover:bg-[#EAE8E1]'
                }`}
              >
                ✕ Close
              </button>
            </div>

            <div className="overflow-y-auto flex flex-col gap-2.5 my-2 pr-1 flex-1">
              {libraryBooks.map((book) => {
                const isCurrent = book.title === bookAirplay.title;
                const pct = Math.round((book.currentPage / book.totalPages) * 100);

                return (
                  <div
                    key={book.id}
                    onClick={() => handleSelectBook(book)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] ${
                      isCurrent
                        ? 'border-[#D9532F] bg-[#D9532F]/10'
                        : darkTheme
                        ? 'border-[#2E2E34] bg-[#121316] hover:border-[#3E3E48]'
                        : 'border-[#EAE8E1] bg-[#F4F3EF] hover:border-[#D0CDBE]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-bold text-sm truncate">
                        {book.title}
                      </div>
                      <div className="text-xs opacity-65 font-sans">
                        {book.author} · {book.format}
                      </div>
                      <div className="text-[11px] font-mono opacity-60 mt-1">
                        Page {book.currentPage} of {book.totalPages} ({pct}%)
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isCurrent ? (
                        <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md bg-[#D9532F]/20 text-[#D9532F] border border-[#D9532F]">
                          Reading Now
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md bg-[#D9532F] text-white">
                          Load Book ↗
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Custom Book */}
            <form
              onSubmit={handleAddCustomBook}
              className="pt-3 border-t border-current/10 flex gap-2"
            >
              <input
                type="text"
                value={newTitleInput}
                onChange={(e) => setNewTitleInput(e.target.value)}
                placeholder="Add book title from your Kindle..."
                className={`flex-1 text-xs rounded-lg px-3 py-2 border outline-none ${
                  darkTheme
                    ? 'bg-[#121316] border-[#2E2E34] text-white'
                    : 'bg-[#F4F3EF] border-[#DCD9CE] text-[#18181B]'
                }`}
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#D9532F] text-white cursor-pointer hover:bg-[#C04524]"
              >
                + Add
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {loadedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#18181B] border border-[#D9532F] text-white px-4 py-2 rounded-full text-xs font-mono shadow-2xl z-50 animate-fade-in">
          {loadedToast}
        </div>
      )}
    </div>
  );
};
