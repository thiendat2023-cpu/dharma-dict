import React, { useState } from 'react';
import {
  Bookmark,
  Copy,
  Check,
  Languages,
  BookOpen,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { SentenceEngToViResult } from '../types/buddhist.ts';
import { SpeakButton } from './SpeakButton.tsx';

interface Props {
  data: SentenceEngToViResult;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export const SentenceEngToViResultView: React.FC<Props> = ({
  data,
  isBookmarked,
  onToggleBookmark,
}) => {
  const [copied, setCopied] = useState(false);
  const [showRawOutput, setShowRawOutput] = useState(false);

  const handleCopy = () => {
    const textToCopy =
      data.rawOutput ||
      `Câu gốc: "${data.originalSentence}"\n\nBản dịch: "${data.smoothTranslation}"`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card with Original and Smooth Translation */}
      <div className="bg-[#14161f]/90 border border-amber-900/40 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-4 pb-4 border-b border-stone-800/80">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Languages className="w-4 h-4" />
            <span>Phân tích cú pháp & Dịch đoạn văn Anh - Việt</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleBookmark}
              className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isBookmarked
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-stone-900/80 hover:bg-stone-800 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
              title={isBookmarked ? 'Bỏ lưu' : 'Lưu vào yêu thích'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400' : ''}`} />
              <span className="hidden sm:inline">{isBookmarked ? 'Đã lưu' : 'Lưu'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-amber-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Sao chép kết quả"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
          </div>
        </div>

        {/* English Sentence Display with TTS */}
        <div className="mt-4 p-4 rounded-xl bg-[#0f1118] border border-stone-800/80">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
              Đoạn văn tiếng Anh gốc:
            </span>
            <SpeakButton
              text={data.originalSentence}
              size="md"
              title="Phát âm toàn bộ câu tiếng Anh gốc"
            />
          </div>
          <p className="text-base sm:text-lg font-medium text-amber-100 font-pali italic leading-relaxed">
            "{data.originalSentence}"
          </p>
        </div>

        {/* Smooth Translation Block */}
        <div className="mt-4 p-4 sm:p-5 rounded-xl bg-gradient-to-r from-amber-950/30 to-stone-900/80 border border-amber-900/40">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
            <span>Bản dịch tiếng Việt mượt mà hoàn chỉnh:</span>
          </div>
          <p className="text-base sm:text-lg font-semibold text-amber-200 leading-relaxed font-sans">
            "{data.smoothTranslation}"
          </p>
        </div>
      </div>

      {/* 3-Tier Word-by-Word Grammatical Dissection */}
      {data.words && data.words.length > 0 && (
        <div className="bg-[#14161f]/90 border border-stone-800/80 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-800">
            <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Giải phẫu ngữ pháp chi tiết từng từ & cụm từ (3 lớp dữ liệu)</span>
            </div>
            <span className="text-xs text-stone-400">{data.words.length} phần tử</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {data.words.map((w, index) => (
              <div
                key={index}
                className="bg-[#10121a] hover:bg-[#121520] border border-stone-800/80 rounded-xl p-3.5 transition-colors space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold text-amber-200 font-pali">
                      {w.word}
                    </span>
                    <SpeakButton
                      text={w.word}
                      size="sm"
                      title={`Phát âm từ: ${w.word}`}
                    />
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-stone-800/90 text-amber-400 border border-stone-700">
                      {w.abbreviation}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-500 font-mono">#{index + 1}</span>
                </div>

                <div className="text-xs sm:text-sm text-stone-100 font-medium">
                  ➔ Nghĩa trực tiếp: <span className="text-amber-100 font-semibold">{w.vietnameseMeaning}</span>
                </div>

                <div className="text-xs text-stone-400 pt-1.5 border-t border-stone-800/60 leading-relaxed">
                  {w.detailedAnalysis}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Output Toggle */}
      {data.rawOutput && (
        <div className="bg-[#12141c]/60 border border-stone-800/60 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowRawOutput(!showRawOutput)}
              className="text-xs text-stone-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showRawOutput ? 'Ẩn văn bản phân tích gốc' : 'Xem toàn văn phân tích định dạng văn bản gốc'}</span>
            </button>
            <button
              onClick={handleCopy}
              className="text-xs text-stone-500 hover:text-stone-300 flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </button>
          </div>

          {showRawOutput && (
            <pre className="mt-3 p-3 rounded-lg bg-stone-950 text-stone-300 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-stone-800">
              {data.rawOutput}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
