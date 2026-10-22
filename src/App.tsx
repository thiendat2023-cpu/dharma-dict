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
                    <span
