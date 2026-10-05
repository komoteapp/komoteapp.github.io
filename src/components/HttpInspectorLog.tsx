import React from 'react';
import { Trash2, RotateCw, Terminal } from 'lucide-react';
import { RequestLogEntry } from '../types/koreader';

interface HttpInspectorLogProps {
  logs: RequestLogEntry[];
  darkTheme: boolean;
  onClearLogs: () => void;
  onReplayCommand: (endpoint: string, label: string) => void;
}

export const HttpInspectorLog: React.FC<HttpInspectorLogProps> = ({
  logs,
  darkTheme,
  onClearLogs,
  onReplayCommand,
}) => {
  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-colors ${
        darkTheme
          ? 'bg-[#18181B] border-[#27272A] text-[#F4F3EF]'
          : 'bg-white border-[#DCD9CE] text-[#18181B]'
      }`}
    >
      <div className="flex items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-current/10">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#D9532F]" />
          <div>
            <h3 className="font-display text-base font-semibold">
              Outgoing KOReader HTTP Log
            </h3>
            <p className="text-xs opacity-65 font-mono tabular-nums">
              {logs.length} {logs.length === 1 ? 'packet' : 'packets'} recorded
            </p>
          </div>
        </div>

        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              darkTheme
                ? 'border-[#2E2E34] hover:bg-[#242429]'
                : 'border-[#DCD9CE] hover:bg-[#EAE8E1]'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Log</span>
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="py-8 text-center text-xs opacity-65 font-mono">
          No HTTP packets dispatched yet. Tap Next Page or Previous Page to send your first event.
        </div>
      ) : (
        <div className="divide-y divide-current/10 max-h-[300px] overflow-y-auto pr-1">
          {logs.map((entry) => (
            <div
              key={entry.id}
              className="py-2.5 flex items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 font-medium">
                  <span className="truncate">{entry.label}</span>
                  <span aria-hidden="true" className="opacity-40">·</span>
                  <span className="font-mono text-[11px] opacity-75 truncate">
                    {entry.endpoint}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono opacity-65 tabular-nums mt-0.5">
                  <span>{entry.timestamp}</span>
                  <span aria-hidden="true">·</span>
                  <span>{entry.durationMs}ms</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {entry.status === 'ok-200'
                      ? '200 OK'
                      : entry.status === 'dispatched-opaque'
                      ? 'Dispatched (no-cors)'
                      : entry.status === 'iframe-nav'
                      ? 'Iframe Nav'
                      : entry.status === 'simulated'
                      ? 'Simulated'
                      : 'Local Timeout / Blocked'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onReplayCommand(entry.endpoint, entry.label)}
                className="min-h-[36px] px-2.5 py-1 rounded-lg border border-current/15 hover:bg-current/5 font-mono text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
                title={`Re-send ${entry.url}`}
              >
                <RotateCw className="w-3 h-3" />
                <span>Resend</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
