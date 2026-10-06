import React, { useState, useMemo } from 'react';
import {
  Search,
  Copy,
  Check,
  Send,
  Plus,
  Compass,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ALL_KOREADER_ENDPOINTS, KoreaderEndpointInfo } from '../data/koreaderEndpoints';

interface EndpointDirectoryProps {
  isDark: boolean;
  onTestEndpoint?: (endpoint: string, label: string) => void;
  onAddAsKeymap?: (item: { name: string; icon: string; endpoint: string; desc?: string }) => void;
  onAddAsButton?: (item: { label: string; icon: string; endpoint: string }) => void;
  existingKeymapEndpoints?: string[];
  existingButtonEndpoints?: string[];
  mode?: 'keymap' | 'button' | 'all';
  initialExpanded?: boolean;
}

export const EndpointDirectory: React.FC<EndpointDirectoryProps> = ({
  isDark,
  onTestEndpoint,
  onAddAsKeymap,
  onAddAsButton,
  existingKeymapEndpoints = [],
  existingButtonEndpoints = [],
  mode = 'all',
  initialExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(initialExpanded);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  // Custom endpoint input form
  const [showCustomForm, setShowCustomForm] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [customIcon, setCustomIcon] = useState<string>('⚡');
  const [customPath, setCustomPath] = useState<string>('/koreader/event/');

  const categories = useMemo(() => {
    const set = new Set<string>();
    ALL_KOREADER_ENDPOINTS.forEach((e) => set.add(e.category));
    return ['All', ...Array.from(set)];
  }, []);

  const filteredEndpoints = useMemo(() => {
    return ALL_KOREADER_ENDPOINTS.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.endpoint.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleCopy = (endpoint: string) => {
    navigator.clipboard.writeText(endpoint).catch(() => {});
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(null), 1800);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customPath.trim()) return;

    if (onAddAsKeymap && (mode === 'keymap' || mode === 'all')) {
      onAddAsKeymap({
        name: customName.trim(),
        icon: customIcon.trim() || '⚡',
        endpoint: customPath.trim(),
        desc: 'Custom KOReader endpoint',
      });
    }

    if (onAddAsButton && (mode === 'button' || mode === 'all')) {
      onAddAsButton({
        label: customName.trim(),
        icon: customIcon.trim() || '⚡',
        endpoint: customPath.trim(),
      });
    }

    setCustomName('');
    setCustomPath('/koreader/event/');
    setShowCustomForm(false);
  };

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${
        isDark ? 'bg-[#141518] border-[#27272A]' : 'bg-[#F9F8F5] border-[#DCD9CE]'
      }`}
    >
      {/* Directory Header Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:opacity-90 transition-opacity"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#D9532F]/15 text-[#D9532F] flex items-center justify-center font-bold text-sm">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm flex items-center gap-2">
              <span>KOReader Endpoint Directory</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-current/10 opacity-70">
                {ALL_KOREADER_ENDPOINTS.length} Endpoints
              </span>
            </div>
            <p className="text-[10.5px] opacity-60 mt-0.5">
              Browse, test on Kindle, and 1-click map any KOReader event to your buttons or controller.
            </p>
          </div>
        </div>
        <div className="w-6 h-6 rounded-md border border-current/10 flex items-center justify-center shrink-0 opacity-70">
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Directory Content */}
      {isExpanded && (
        <div className="p-3.5 pt-0 border-t border-current/10 space-y-3">
          {/* Search & Custom Button Row */}
          <div className="flex flex-col sm:flex-row gap-2 pt-3">
            <div
              className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-[#DCD9CE]'
              }`}
            >
              <Search className="w-3.5 h-3.5 opacity-50 shrink-0" />
              <input
                type="text"
                placeholder="Search endpoints (e.g. Toc, Light, Chapter, Font)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs opacity-50 hover:opacity-100"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowCustomForm(!showCustomForm)}
              className="px-3 py-1.5 rounded-xl border border-dashed border-[#D9532F]/50 text-[#D9532F] bg-[#D9532F]/5 hover:bg-[#D9532F]/10 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showCustomForm ? 'Cancel Custom' : 'Custom Endpoint'}</span>
            </button>
          </div>

          {/* Custom Endpoint Form */}
          {showCustomForm && (
            <form
              onSubmit={handleAddCustom}
              className={`p-3 rounded-xl border space-y-2 text-xs ${
                isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-[#DCD9CE]'
              }`}
            >
              <div className="font-bold text-[11px] text-[#D9532F] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Add Custom KOReader Event</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] opacity-70 block mb-0.5">Label / Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Toggle Header"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none ${
                      isDark ? 'bg-[#121316] border-[#27272A]' : 'bg-[#F4F3EF] border-[#DCD9CE]'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] opacity-70 block mb-0.5">Emoji / Icon</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="e.g. 📑"
                    value={customIcon}
                    onChange={(e) => setCustomIcon(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none text-center ${
                      isDark ? 'bg-[#121316] border-[#27272A]' : 'bg-[#F4F3EF] border-[#DCD9CE]'
                    }`}
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="text-[10px] opacity-70 block mb-0.5">Event Path</label>
                  <input
                    type="text"
                    required
                    placeholder="/koreader/event/..."
                    value={customPath}
                    onChange={(e) => setCustomPath(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono outline-none ${
                      isDark ? 'bg-[#121316] border-[#27272A]' : 'bg-[#F4F3EF] border-[#DCD9CE]'
                    }`}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-[#D9532F] text-white font-bold text-xs cursor-pointer hover:bg-[#C04524]"
                >
                  + Add to {mode === 'keymap' ? 'Keymaps' : mode === 'button' ? 'Buttons' : 'Remote'}
                </button>
              </div>
            </form>
          )}

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer whitespace-nowrap transition-colors shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#D9532F] text-white font-semibold'
                    : isDark
                    ? 'bg-[#18181B] text-gray-300 hover:bg-[#222]'
                    : 'bg-white text-gray-700 hover:bg-[#EAE8E1]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Endpoints List */}
          <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
            {filteredEndpoints.length === 0 ? (
              <div className="text-center py-6 text-xs opacity-50">
                No matching endpoints found for &quot;{searchQuery}&quot;.
              </div>
            ) : (
              filteredEndpoints.map((item) => {
                const isKeymapAdded = existingKeymapEndpoints.includes(item.endpoint);
                const isButtonAdded = existingButtonEndpoints.includes(item.endpoint);

                return (
                  <div
                    key={item.endpoint}
                    className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                      isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-[#DCD9CE]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.icon}</span>
                        <span className="font-bold text-xs truncate">{item.name}</span>
                        <span className="text-[9.5px] px-1.5 py-0.5 rounded-md font-mono opacity-60 bg-current/5">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-[10.5px] opacity-65 mt-0.5 line-clamp-1">{item.desc}</div>
                      <div className="flex items-center gap-1.5 mt-1 font-mono text-[10px] opacity-75">
                        <span className="truncate">{item.endpoint}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.endpoint)}
                          className="hover:opacity-100 opacity-60 cursor-pointer p-0.5 shrink-0"
                          title="Copy endpoint"
                        >
                          {copiedEndpoint === item.endpoint ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Live Test on Kindle */}
                      {onTestEndpoint && (
                        <button
                          type="button"
                          onClick={() => onTestEndpoint(item.endpoint, item.name)}
                          className={`h-7 px-2 rounded-lg text-[11px] font-medium border flex items-center gap-1 cursor-pointer transition-colors ${
                            isDark
                              ? 'border-[#27272A] hover:bg-[#27272A] text-gray-300'
                              : 'border-[#DCD9CE] hover:bg-[#EAE8E1] text-gray-700'
                          }`}
                          title="Test dispatch to Kindle"
                        >
                          <Send className="w-3 h-3 text-blue-400" />
                          <span>Test</span>
                        </button>
                      )}

                      {/* Add as Keymap Button */}
                      {onAddAsKeymap && (mode === 'keymap' || mode === 'all') && (
                        <button
                          type="button"
                          disabled={isKeymapAdded}
                          onClick={() =>
                            onAddAsKeymap({
                              name: item.name,
                              icon: item.icon,
                              endpoint: item.endpoint,
                              desc: item.desc,
                            })
                          }
                          className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold border cursor-pointer flex items-center gap-1 transition-colors ${
                            isKeymapAdded
                              ? 'opacity-40 cursor-not-allowed border-current/15'
                              : 'border-[#D9532F] text-[#D9532F] bg-[#D9532F]/10 hover:bg-[#D9532F]/20'
                          }`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>{isKeymapAdded ? 'Mapped' : '+ Keymap'}</span>
                        </button>
                      )}

                      {/* Add as Quick Button */}
                      {onAddAsButton && (mode === 'button' || mode === 'all') && (
                        <button
                          type="button"
                          disabled={isButtonAdded}
                          onClick={() =>
                            onAddAsButton({
                              label: item.name,
                              icon: item.icon,
                              endpoint: item.endpoint,
                            })
                          }
                          className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold border cursor-pointer flex items-center gap-1 transition-colors ${
                            isButtonAdded
                              ? 'opacity-40 cursor-not-allowed border-current/15'
                              : 'border-emerald-500 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20'
                          }`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>{isButtonAdded ? 'On Deck' : '+ Button'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
