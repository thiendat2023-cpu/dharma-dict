import React, { useState } from 'react';
import {
  X,
  History,
  Trash2,
  Bookmark,
  Calendar,
  ArrowRight,
  Search,
} from 'lucide-react';
import { HistoryItem, ActiveTab } from '../types/buddhist.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onToggleBookmark: (id: string) => void;
}

const TAB_BADGE: Record<ActiveTab, { label: string; color: string }> = {
  'eng-to-vi': { label: 'Anh - Việt', color: 'bg-blue-500/10 text-blue-300 border-blue-500/30' },
  'vi-to-eng': { label: 'Việt - Anh', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
  'sentence-eng-to-vi': { label: 'Dịch đoạn văn', color: 'bg-purple-500/10 text-purple-300 border-purple-500/30' },
  'compare-eng-pali': { label: 'So sánh Anh - Pāḷi', color: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
};

export const HistoryDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  items,
  onSelectItem,
  onRemoveItem,
  onClearAll,
  onToggleBookmark,
}) => {
  const [filterBookmarkedOnly, setFilterBookmarkedOnly] = useState(false);

  if (!isOpen) return null;

  const displayItems = filterBookmarkedOnly
    ? items.filter((item) => item.bookmarked)
    : items;

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} - ${d.getDate()}/${d.getMonth() + 1}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-8">
        <div className="w-screen max-w-full sm:max-w-md bg-[#12141c] border-l border-stone-800 text-stone-200 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" />
              <h2 className="text-base sm:text-lg font-bold text-amber-100">
                Lịch sử tra cứu
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-400">
                {items.length}/10
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Bar */}
          <div className="px-4 py-2.5 bg-[#0e1017] border-b border-stone-800 flex items-center justify-between text-xs">
            <button
              onClick={() => setFilterBookmarkedOnly(!filterBookmarkedOnly)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
                filterBookmarkedOnly
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${filterBookmarkedOnly ? 'fill-amber-400' : ''}`} />
              <span>Chỉ hiện đã lưu</span>
            </button>

            {items.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-stone-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                title="Xóa toàn bộ lịch sử"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa hết</span>
              </button>
            )}
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {displayItems.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-stone-500 space-y-2">
                <Search className="w-8 h-8 opacity-40" />
                <p className="text-sm">
                  {filterBookmarkedOnly
                    ? 'Chưa có mục nào được đánh dấu lưu.'
                    : 'Chưa có lịch sử tra cứu nào.'}
                </p>
                <p className="text-xs text-stone-600">
                  Lịch sử lưu tối đa 10 lượt tra cứu gần nhất (FIFO).
                </p>
              </div>
            ) : (
              displayItems.map((item) => {
                const badge = TAB_BADGE[item.mode] || {
                  label: item.mode,
                  color: 'bg-stone-800 text-stone-300 border-stone-700',
                };
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-[#151824] hover:bg-[#1a1e2d] border border-stone-800/80 transition-all group relative cursor-pointer"
                    onClick={() => {
                      onSelectItem(item);
                      onClose();
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${badge.color}`}
                      >
                        {badge.label}
                      </span>

                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onToggleBookmark(item.id)}
                          className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-amber-300 transition-colors"
                          title="Lưu vào danh sách"
                        >
                          <Bookmark
                            className={`w-3.5 h-3.5 ${
                              item.bookmarked ? 'fill-amber-400 text-amber-400' : ''
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1 rounded hover:bg-stone-800 text-stone-500 hover:text-red-400 transition-colors"
                          title="Xóa mục này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-sm font-semibold text-amber-100 group-hover:text-amber-200 transition-colors truncate">
                      {item.query}
                    </h4>

                    {item.summary && (
                      <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.summary}
                      </p>
                    )}

                    <div className="mt-2.5 pt-2 border-t border-stone-800/60 flex items-center justify-between text-[11px] text-stone-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.timestamp)}
                      </span>
                      <span className="text-amber-400/80 group-hover:text-amber-300 flex items-center gap-0.5">
                        Xem lại <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
