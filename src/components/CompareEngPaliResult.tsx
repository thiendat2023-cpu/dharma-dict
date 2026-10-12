import React, { useState } from 'react';
import {
  Bookmark,
  Copy,
  Check,
  ArrowRightLeft,
  BookOpen,
  Sparkles,
  FileText,
  Quote,
  Scale,
} from 'lucide-react';
import { CompareEngPaliResult } from '../types/buddhist.ts';
import { SpeakButton } from './SpeakButton.tsx';

interface Props {
  data: CompareEngPaliResult;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export const CompareEngPaliResultView: React.FC<Props> = ({
  data,
  isBookmarked,
  onToggleBookmark,
}) => {
  const [copied, setCopied] = useState(false);
  const [showRawOutput, setShowRawOutput] = useState(false);

  const handleCopy = () => {
    const textToCopy =
      data.rawOutput ||
      `So sánh: ${data.englishTerm} ⇋ ${data.paliTerm} (${data.vietnameseTerm})\n\n${data.semanticComparison}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card: Contrast Display */}
      <div className="bg-[#14161f]/90 border border-amber-900/40 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800/80">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-200 break-words">
                {data.englishTerm}
              </span>
              <SpeakButton
                text={data.englishTerm}
                size="md"
                title={`Phát âm: ${data.englishTerm}`}
              />
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <span className="text-xl sm:text-2xl md:text-3xl font-bold font-pali text-amber-300 break-words">
                {data.paliTerm}
              </span>
              <span className="text-sm sm:text-base md:text-lg font-medium text-stone-300">
                ({data.vietnameseTerm})
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {data.sanskritTerm && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-800 text-stone-300 border border-stone-700">
                  Sanskrit: <span className="text-amber-200">{data.sanskritTerm}</span>
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Đối chiếu ngữ học Phật giáo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
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

        {/* 2 Column Details: Pali Etymology vs English Translations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {/* Pali Root Analysis */}
          <div className="bg-[#10121a]/80 border border-stone-800/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Căn nguyên & Cấu trúc ngữ pháp Pāḷi gốc</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-sans">
              {data.paliEtymology}
            </p>
          </div>

          {/* Western Scholarly Translations */}
          <div className="bg-[#10121a]/80 border border-stone-800/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bản dịch của các học giả Tây phương</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-sans">
              {data.scholarlyTranslations || 'Các bản dịch tiêu biểu từ T.W. Rhys Davids, Bhikkhu Bodhi, Edward Conze, I.B. Horner.'}
            </p>
          </div>
        </div>

        {/* Deep Semantic Contrast */}
        <div className="mt-4 bg-gradient-to-r from-amber-950/25 to-stone-900/60 border border-amber-900/40 rounded-xl p-4 sm:p-5 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5" />
            <span>Phân tích đối chiếu ngữ nghĩa & Các khoảng lệch sắc thái (Nuance Gaps)</span>
          </div>
          <div className="text-xs sm:text-sm text-stone-200 leading-relaxed font-sans whitespace-pre-line">
            {data.semanticComparison}
          </div>
        </div>
      </div>

      {/* Comparison Points Matrix */}
      {data.comparisonPoints && data.comparisonPoints.length > 0 && (
        <div className="bg-[#14161f]/90 border border-stone-800/80 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-800">
            <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Bảng ma trận đối chiếu đa chiều</span>
            </div>
            <span className="text-xs text-stone-400">{data.comparisonPoints.length} khía cạnh</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {data.comparisonPoints.map((point, idx) => (
              <div
                key={idx}
                className="bg-[#10121a] border border-stone-800/80 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-300 uppercase tracking-wide">
                    {point.aspect}
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">#{idx + 1}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm pt-1">
                  <div className="p-3 rounded-lg bg-[#0d0f15] border border-stone-800">
                    <span className="text-stone-400 block text-[11px] mb-1 font-semibold uppercase">
                      Góc nhìn Pāḷi:
                    </span>
                    <span className="text-amber-100 font-pali leading-relaxed">
                      {point.paliPerspective}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0d0f15] border border-stone-800">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-stone-400 text-[11px] font-semibold uppercase">
                        Góc nhìn Tiếng Anh:
                      </span>
                      <SpeakButton text={point.englishPerspective} size="sm" title="Phát âm nhận định tiếng Anh" />
                    </div>
                    <span className="text-stone-200 leading-relaxed">
                      {point.englishPerspective}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-stone-300 pt-1.5 border-t border-stone-800/60 leading-relaxed italic">
                  <span className="text-amber-400 not-italic font-medium">Nhận định học thuật: </span>
                  {point.analysis}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Classical Sutta Quotes */}
      {data.classicalQuotes && (
        <div className="bg-[#14161f]/90 border border-stone-800/80 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-800">
            <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold">
              <Quote className="w-4 h-4 text-amber-400" />
              <span>Trích dẫn kinh điển song ngữ minh họa (Pāḷi - English - Việt)</span>
            </div>
            <SpeakButton text={data.classicalQuotes} size="sm" title="Nghe đọc trích dẫn" />
          </div>
          <div className="p-4 rounded-xl bg-[#0f1118] border border-stone-800 text-xs sm:text-sm text-stone-200 leading-relaxed font-sans whitespace-pre-line">
            {data.classicalQuotes}
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
