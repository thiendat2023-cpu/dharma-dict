/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  History as HistoryIcon,
  AlertCircle,
  Loader2,
  X,
  Flame,
  Heart,
  Info,
  Languages,
  BookOpen,
  FileText,
  Scale,
} from 'lucide-react';
import {
  ActiveTab,
  HubResult,
  HistoryItem,
  EngWordAnalysisResult,
  ViToEngAnalysisResult,
  SentenceEngToViResult,
  CompareEngPaliResult,
} from './types/buddhist.ts';
import { EngWordAnalysisResultView } from './components/EngWordAnalysisResult.tsx';
import { ViToEngAnalysisResultView } from './components/ViToEngAnalysisResult.tsx';
import { SentenceEngToViResultView } from './components/SentenceEngToViResult.tsx';
import { CompareEngPaliResultView } from './components/CompareEngPaliResult.tsx';
import { HistoryDrawer } from './components/HistoryDrawer.tsx';
import { SupportModal } from './components/SupportModal.tsx';
import { InfoModal } from './components/InfoModal.tsx';

const STORAGE_KEY = 'buddhist_english_history_v1';
const MAX_HISTORY_ITEMS = 10;

const TAB_CONFIGS: {
  id: ActiveTab;
  label: string;
  shortLabel: string;
  placeholder: string;
  buttonText: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'eng-to-vi',
    label: 'Tra từ Anh - Việt (Phật pháp)',
    shortLabel: 'Tra Anh - Việt',
    placeholder: 'Nhập thuật ngữ tiếng Anh Phật giáo (ví dụ: mindfulness, dependent origination, defilement...)...',
    buttonText: 'Phân tích chuẩn 4 ý',
    icon: Languages,
  },
  {
    id: 'vi-to-eng',
    label: 'Tra từ Việt - Anh (Phật pháp)',
    shortLabel: 'Tra Việt - Anh',
    placeholder: 'Nhập thuật ngữ Phật học tiếng Việt cần tra (ví dụ: chánh niệm, vô ngã, duyên khởi, phiền não...)...',
    buttonText: 'Tra từ chuẩn 3 ý',
    icon: BookOpen,
  },
  {
    id: 'sentence-eng-to-vi',
    label: 'Dịch đoạn văn Anh - Việt',
    shortLabel: 'Dịch đoạn văn',
    placeholder: 'Nhập câu hoặc đoạn văn tiếng Anh Phật học cần phân tích cú pháp & dịch nghĩa...',
    buttonText: 'Phân tích cú pháp & dịch',
    icon: FileText,
  },
  {
    id: 'compare-eng-pali',
    label: 'So sánh thuật ngữ (Anh - Pāḷi)',
    shortLabel: 'So sánh Anh - Pāḷi',
    placeholder: 'Nhập thuật ngữ cần đối chiếu (ví dụ: mindfulness vs sati, suffering vs dukkha, equanimity vs upekkhā...)...',
    buttonText: 'Đối chiếu học thuật',
    icon: Scale,
  },
];

const PRESETS: Record<ActiveTab, { label: string; text: string }[]> = {
  'eng-to-vi': [
    { label: 'mindfulness', text: 'mindfulness' },
    { label: 'dependent origination', text: 'dependent origination' },
    { label: 'impermanence', text: 'impermanence' },
    { label: 'defilement', text: 'defilement' },
    { label: 'equanimity', text: 'equanimity' },
    { label: 'stream-enterer', text: 'stream-enterer' },
  ],
  'vi-to-eng': [
    { label: 'chánh niệm', text: 'chánh niệm' },
    { label: 'vô ngã', text: 'vô ngã' },
    { label: 'duyên khởi', text: 'duyên khởi' },
    { label: 'phiền não', text: 'phiền não' },
    { label: 'tâm từ', text: 'tâm từ' },
    { label: 'Bát Chánh Đạo', text: 'Bát Chánh Đạo' },
  ],
  'sentence-eng-to-vi': [
    {
      label: 'Mind precedes all mental states',
      text: 'Mind precedes all mental states. Mind is their chief; they are all mind-wrought.',
    },
    {
      label: 'Whatever has the nature of arising...',
      text: 'Whatever has the nature of arising, all that has the nature of ceasing.',
    },
    {
      label: 'Monks, develop concentration...',
      text: 'Monks, develop concentration; one who is concentrated sees things as they really are.',
    },
  ],
  'compare-eng-pali': [
    { label: 'mindfulness vs sati', text: 'mindfulness vs sati' },
    { label: 'suffering vs dukkha', text: 'suffering vs dukkha' },
    { label: 'equanimity vs upekkhā', text: 'equanimity vs upekkhā' },
    { label: 'non-self vs anattā', text: 'non-self vs anattā' },
    { label: 'formations vs saṅkhāra', text: 'formations vs saṅkhāra' },
  ],
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('eng-to-vi');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Thêm state cho bộ đếm & trending searches từ Vercel KV
  const [pageViews, setPageViews] = useState<number | string>('...');
  const [searchCount, setSearchCount] = useState<number | string>('...');
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);

  // Results state for each tab
  const [engToViResult, setEngToViResult] = useState<EngWordAnalysisResult | null>(null);
  const [viToEngResult, setViToEngResult] = useState<ViToEngAnalysisResult | null>(null);
  const [sentenceEngToViResult, setSentenceEngToViResult] =
    useState<SentenceEngToViResult | null>(null);
  const [compareEngPaliResult, setCompareEngPaliResult] =
    useState<CompareEngPaliResult | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Load thông số bộ đếm & trending searches từ API
  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setPageViews(data.views || 0);
          setSearchCount(data.searches || 0);
          if (data.trending && Array.isArray(data.trending)) {
            setTrendingSearches(data.trending);
          }
        }
      })
      .catch((err) => console.error("Lỗi tải thông số API:", err));
  }, []);

  // Load history on mount (giới hạn 10 mục FIFO)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, MAX_HISTORY_ITEMS));
        }
      }
    } catch (e) {
      console.warn('Lỗi tải lịch sử:', e);
    }
  }, []);

  const saveHistory = (items: HistoryItem[]) => {
    const trimmed = items.slice(0, MAX_HISTORY_ITEMS);
    setHistory(trimmed);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Lỗi lưu lịch sử:', e);
    }
  };

  const handleTabChange = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setError(null);
    setInputText('');
  };

  const handleSubmit = async (overrideText?: string) => {
    const query = (overrideText ?? inputText).trim();
    if (!query) return;

    setLoading(true);
    setError(null);
    setInputText(query);

    try {
      const response = await fetch('/api/buddhist-hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: activeTab, input: query }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Lỗi máy chủ (${response.status})`);
      }

      const res = await response.json();
      const mode = res.mode as ActiveTab;
      const data = res.data;

      let summary = '';
      let hubResult: HubResult;

      if (mode === 'eng-to-vi') {
        setEngToViResult(data);
        summary = `${data.rootAndType?.wordType || ''} · ${data.directMeaning || ''}`;
        hubResult = { mode: 'eng-to-vi', data };
      } else if (mode === 'vi-to-eng') {
        setViToEngResult(data);
        summary = `➔ ${data.analyzedWord} (${data.rootAndType?.wordType || ''})`;
        hubResult = { mode: 'vi-to-eng', data };
      } else if (mode === 'sentence-eng-to-vi') {
        setSentenceEngToViResult(data);
        summary = data.smoothTranslation || '';
        hubResult = { mode: 'sentence-eng-to-vi', data };
      } else {
        setCompareEngPaliResult(data);
        summary = `${data.englishTerm} ⇋ ${data.paliTerm} (${data.vietnameseTerm})`;
        hubResult = { mode: 'compare-eng-pali', data };
      }

      // Add to history (FIFO mechanism, max 10 items)
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        mode,
        query,
        summary,
        timestamp: Date.now(),
        bookmarked: false,
        result: hubResult,
      };

      const nextHistory = [
        newItem,
        ...history.filter(
          (h) => !(h.query.toLowerCase() === query.toLowerCase() && h.mode === mode)
        ),
      ].slice(0, MAX_HISTORY_ITEMS);

      saveHistory(nextHistory);

      // Tăng biến đếm số từ đã tra trên giao diện
      setSearchCount((prev) => (typeof prev === 'number' ? prev + 1 : prev));
    } catch (err: any) {
      console.error('Lỗi khi gọi API:', err);
      setError(err?.message || 'Không thể thực hiện yêu cầu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setActiveTab(item.mode);
    setInputText(item.query);
    if (item.result.mode === 'eng-to-vi') {
      setEngToViResult(item.result.data);
    } else if (item.result.mode === 'vi-to-eng') {
      setViToEngResult(item.result.data);
    } else if (item.result.mode === 'sentence-eng-to-vi') {
      setSentenceEngToViResult(item.result.data);
    } else if (item.result.mode === 'compare-eng-pali') {
      setCompareEngPaliResult(item.result.data);
    }
  };

  const isCurrentBookmarked = history.some(
    (h) =>
      h.query.toLowerCase() === inputText.trim().toLowerCase() &&
      h.mode === activeTab &&
      h.bookmarked
  );

  const toggleBookmarkCurrent = () => {
    const q = inputText.trim().toLowerCase();
    const updated = history.map((h) =>
      h.query.toLowerCase() === q && h.mode === activeTab
        ? { ...h, bookmarked: !h.bookmarked }
        : h
    );
    saveHistory(updated);
  };

  const currentTabConfig = TAB_CONFIGS.find((t) => t.id === activeTab)!;
  const isSentenceMode =
    activeTab === 'sentence-eng-to-vi' || activeTab === 'compare-eng-pali';

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f14] text-[#e2dfd9] relative selection:bg-amber-600/30 selection:text-amber-200">
      {/* Background Subtle Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(180,120,40,0.12),transparent)] pointer-events-none" />

      {/* Main Header */}
      <header className="border-b border-stone-800/80 bg-[#12141c]/95 sticky top-0 z-30 backdrop-blur-md">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
              <span className="font-pali text-lg sm:text-xl md:text-2xl font-bold leading-none select-none">
                ☸
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="font-pali font-bold text-xs sm:text-base md:text-xl lg:text-2xl text-amber-100 tracking-[0.06em] sm:tracking-[0.14em] uppercase drop-shadow-sm truncate">
                TRA CỨU ANH VĂN PHẬT PHÁP
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Nút [Ủng hộ] */}
            <button
              onClick={() => setIsSupportModalOpen(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-200 border border-stone-800 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              title="Ủng hộ dự án (QR Ngân hàng)"
            >
              <Heart className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20 shrink-0" />
              <span className="hidden min-[380px]:inline">Ủng hộ</span>
            </button>

            {/* Nút [Thông Tin] */}
            <button
              onClick={() => setIsInfoModalOpen(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-200 border border-stone-800 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              title="Thông tin tác giả"
            >
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden min-[380px]:inline">Thông Tin</span>
            </button>

            {/* Nút [Lịch sử] */}
            <button
              onClick={() => setIsHistoryDrawerOpen(true)}
              className="relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-200 border border-stone-800 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              title="Lịch sử tra cứu"
            >
              <HistoryIcon className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="hidden sm:inline">Lịch sử</span>
              {history.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-600/30 text-amber-300 text-[10px] font-bold">
                  {history.length}/10
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 1. THANH NAVIGATION / TABS */}
        <div className="border-t border-stone-800/60 bg-[#0e1017]">
          <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 md:px-8 py-2">
            <nav className="grid grid-cols-2 gap-1.5 sm:flex sm:items-center sm:justify-center sm:gap-2 sm:flex-wrap" aria-label="Tabs">
              {TAB_CONFIGS.map((tab) => {
                const isActive = activeTab === tab.id;
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all select-none cursor-pointer w-full sm:w-auto ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-500/50 shadow-sm shadow-amber-950/40 font-semibold'
                        : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900 border border-transparent'
                    }`}
                  >
                    <TabIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-stone-500'}`} />
                    <span className="sm:hidden text-center truncate">{tab.shortLabel}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-6 sm:space-y-8 relative z-10">
        {/* INPUT BOX */}
        <section className="bg-[#14161f]/80 border border-amber-900/30 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-sm space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-3"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400 pointer-events-none" />

                {isSentenceMode ? (
                  <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    rows={2}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={currentTabConfig.placeholder}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-stone-950/80 border border-stone-800 text-stone-100 placeholder:text-stone-500 text-sm sm:text-base focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-all resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={currentTabConfig.placeholder}
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-stone-950/80 border border-stone-800 text-stone-100 placeholder:text-stone-500 text-base sm:text-lg focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-all"
                    autoFocus
                  />
                )}

                {inputText && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputText('');
                      inputRef.current?.focus();
                    }}
                    className="absolute right-3 top-3.5 p-1 text-stone-400 hover:text-stone-200 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-semibold text-sm transition-all shadow-md shadow-amber-900/20 self-stretch sm:self-auto cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{currentTabConfig.buttonText}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Presets based on active tab */}
          {PRESETS[activeTab] && PRESETS[activeTab].length > 0 && (
            <div className="pt-2 border-t border-stone-800/70">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-stone-400 font-medium flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Top 5 tra nhiều nhất:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(trendingSearches.length > 0
                    ? trendingSearches
                    : PRESETS[activeTab].map((p) => p.text).slice(0, 5)
                  ).map((keyword, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSubmit(keyword)}
                      disabled={loading}
                      className="px-2.5 py-1 rounded-md bg-stone-900/90 hover:bg-amber-600/20 hover:text-amber-200 text-stone-300 border border-stone-800 hover:border-amber-500/40 text-xs transition-colors cursor-pointer"
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Loading Indicator */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-amber-600/20 border-t-amber-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-amber-400 font-bold text-sm">
                ☸
              </div>
            </div>
            <p className="font-pali text-base text-amber-200 font-medium">
              {activeTab === 'eng-to-vi' && 'Đang bóc tách 4 ý ngữ pháp & thuật ngữ Anh văn Phật pháp...'}
              {activeTab === 'vi-to-eng' && 'Đang tra cứu thuật ngữ Anh văn tương ứng & phân tích 3 ý...'}
              {activeTab === 'sentence-eng-to-vi' && 'Đang phân tích cú pháp từng từ & dịch đoạn văn...'}
              {activeTab === 'compare-eng-pali' && 'Đang đối chiếu chuyên sâu thuật ngữ Anh ngữ và nguyên tác Pāḷi...'}
            </p>
            <p className="text-xs text-stone-400 max-w-md">
              Hệ thống xử lý bám sát văn bản kinh tạng và chuẩn mực dịch thuật Phật học quốc tế.
            </p>
          </div>
        )}

        {/* Error Alert */}
        {error && !loading && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm">
              <h4 className="font-semibold text-red-300">Không thể hoàn tất yêu cầu</h4>
              <p className="mt-1 text-red-300/80 leading-relaxed">{error}</p>
              <button
                onClick={() => handleSubmit()}
                className="mt-2.5 px-3 py-1 rounded bg-red-900/60 hover:bg-red-800/80 text-red-100 text-xs font-medium transition-colors"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        {/* RESULT RENDERERS BASED ON ACTIVE TAB */}
        {!loading && (
          <>
            {activeTab === 'eng-to-vi' && engToViResult && (
              <EngWordAnalysisResultView
                data={engToViResult}
                isBookmarked={isCurrentBookmarked}
                onToggleBookmark={toggleBookmarkCurrent}
              />
            )}

            {activeTab === 'vi-to-eng' && viToEngResult && (
              <ViToEngAnalysisResultView
                data={viToEngResult}
                isBookmarked={isCurrentBookmarked}
                onToggleBookmark={toggleBookmarkCurrent}
              />
            )}

            {activeTab === 'sentence-eng-to-vi' && sentenceEngToViResult && (
              <SentenceEngToViResultView
                data={sentenceEngToViResult}
                isBookmarked={isCurrentBookmarked}
                onToggleBookmark={toggleBookmarkCurrent}
              />
            )}

            {activeTab === 'compare-eng-pali' && compareEngPaliResult && (
              <CompareEngPaliResultView
                data={compareEngPaliResult}
                isBookmarked={isCurrentBookmarked}
                onToggleBookmark={toggleBookmarkCurrent}
              />
            )}
          </>
        )}
      </main>

      {/* Footer (100% giữ nguyên nội dung văn bản theo yêu cầu) */}
      <footer className="border-t border-stone-800/60 pt-5 pb-6 bg-[#0f1117] text-center mt-auto w-full">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          {/* Dòng 1: Màu xám sáng nhẹ, thanh thoát */}
          <p className="text-xs sm:text-sm text-stone-400 font-sans tracking-wide">
            Dự án đang cần kinh phí để nâng cấp và duy trì dung lượng tra cứu (token).
          </p>

          {/* Dòng 2: Lời kêu gọi kèm nút bấm liên kết nổi bật */}
          <p className="text-xs sm:text-sm text-stone-300 font-sans flex items-center justify-center gap-1.5 flex-wrap">
            <span>Tuỳ hỷ ủng hộ bấm vào đây --&gt;</span>
            <button
              onClick={() => setIsSupportModalOpen(true)}
              className="text-amber-400 font-bold font-pali hover:underline hover:text-amber-300 cursor-pointer transition-all inline-flex items-center gap-1 focus:outline-none"
              title="Mở mã QR ngân hàng ủng hộ tác giả"
            >
              <span>Thầy Đạt cute ^v^</span>
            </button>
          </p>

          {/* ĐOẠN CODE BỔ SUNG: KHỐI BỘ ĐẾM */}
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-3 px-4 py-1.5 bg-[#1e1e1e] rounded-full border border-stone-800 text-xs text-stone-300 shadow-sm">
              <span className="flex items-center gap-1">
                <span className="text-amber-500">👁️</span> Lượt truy cập: <strong className="text-amber-400 tracking-wide">{pageViews}</strong>
              </span>
              <span className="text-stone-700">|</span>
              <span className="flex items-center gap-1">
                <span className="text-amber-500">📝</span> Từ đã tra: <strong className="text-amber-400 tracking-wide">{searchCount}</strong>
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Support Modal (QR Ngân Hàng - id="support-modal") */}
      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />

      {/* Info Modal (Hình Của Thầy & Zalo - id="info-modal") */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        items={history}
        onSelectItem={handleSelectHistoryItem}
        onRemoveItem={(id) => saveHistory(history.filter((h) => h.id !== id))}
        onClearAll={() => {
          if (window.confirm('Xóa toàn bộ lịch sử?')) saveHistory([]);
        }}
        onToggleBookmark={(id) =>
          saveHistory(
            history.map((h) => (h.id === id ? { ...h, bookmarked: !h.bookmarked } : h))
          )
        }
      />
    </div>
  );
}
