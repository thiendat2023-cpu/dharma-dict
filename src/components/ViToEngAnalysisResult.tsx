import React, { useState } from 'react';
import {
  Bookmark,
  Copy,
  Check,
  BookOpen,
  ArrowRight,
  Sparkles,
  Table as TableIcon,
  FileText,
} from 'lucide-react';
import { ViToEngAnalysisResult } from '../types/buddhist.ts';
import { SpeakButton } from './SpeakButton.tsx';

interface Props {
  data: ViToEngAnalysisResult;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export const ViToEngAnalysisResultView: React.FC<Props> = ({
  data,
  isBookmarked,
  onToggleBookmark,
}) => {
  const [copied, setCopied] = useState(false);
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);

  const handleCopy = () => {
    const textToCopy =
      data.formattedMarkdown ||
      `${data.vietnameseWord} ➔ ${data.analyzedWord}\nPāḷi: ${data.rootAndType.paliEquivalent || data.rootAndType.root}\nTừ loại: ${data.rootAndType.wordType}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Main Translation Card */}
      <div className="bg-[#14161f]/90 border border-amber-900/40 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800/80">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="text-lg sm:text-xl md:text-2xl font-medium text-stone-300 break-words">
                {data.vietnameseWord}
              </span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0" />
              <span className="text-xl sm:text-2xl md:text-3xl font-bold font-pali text-amber-200 tracking-wide break-words">
                {data.analyzedWord}
              </span>
              <SpeakButton
                text={data.analyzedWord}
                size="md"
                title={`Phát âm: ${data.analyzedWord}`}
              />
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {data.rootAndType.wordType}
              </span>
              {(data.rootAndType.paliEquivalent || data.rootAndType.root) && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-800 text-stone-300 border border-stone-700 font-pali">
                  Pāḷi gốc: <span className="text-amber-300 font-semibold">{data.rootAndType.paliEquivalent || data.rootAndType.root}</span>
                </span>
              )}
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

        {/* 3 Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {/* Ý 1: Căn nguyên & Thuật ngữ đối ứng */}
          <div className="bg-[#10121a]/80 border border-stone-800/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>1. Nguyên ngữ Pāḷi / Phạn & Căn nghĩa</span>
            </div>
            <div className="text-xs sm:text-sm text-stone-300 space-y-1">
              <p><span className="text-stone-400">Pāḷi / Sanskrit:</span> <span className="font-semibold text-amber-200 font-pali">{data.rootAndType.root}</span></p>
              <div className="flex items-center gap-1">
                <span className="text-stone-400">Tiếng Anh chuẩn:</span>
                <span className="text-stone-100 font-semibold">{data.analyzedWord}</span>
                <SpeakButton text={data.analyzedWord} size="sm" inline />
              </div>
              {data.rootAndType.etymologyNote && (
                <p className="text-xs text-stone-400 pt-1 border-t border-stone-800/60 leading-relaxed italic">
                  {data.rootAndType.etymologyNote}
                </p>
              )}
            </div>
          </div>

          {/* Ý 2: Hình thái & Các phương án dịch thuật */}
          <div className="bg-[#10121a]/80 border border-stone-800/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>2. Hình thái & Các phương án dịch thuật</span>
            </div>
            <div className="text-xs sm:text-sm text-stone-300 space-y-1">
              <p><span className="text-stone-400">Từ loại:</span> <span className="text-stone-100">{data.currentMorphology.classification}</span></p>
              <p><span className="text-stone-400">Cách dùng:</span> <span className="text-stone-200">{data.currentMorphology.summary}</span></p>
              {data.currentMorphology.alternativeForms && data.currentMorphology.alternativeForms.length > 0 && (
                <div className="pt-1.5 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] text-stone-400">Các cách dịch khác:</span>
                  {data.currentMorphology.alternativeForms.map((alt, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-800 text-[11px] text-amber-200 border border-stone-700">
                      <span>{alt}</span>
                      <SpeakButton text={alt} size="sm" title={`Phát âm: ${alt}`} />
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Định nghĩa nếu có */}
        {data.directMeaning && (
          <div className="mt-4 bg-[#10121a]/60 border border-stone-800/80 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-stone-300">
            <span className="text-amber-400 font-medium">Định nghĩa tiếng Việt: </span>
            {data.directMeaning}
          </div>
        )}
      </div>

      {/* Bảng đối chiếu các bản dịch học giả quốc tế */}
      {data.tableData && data.tableData.rows && data.tableData.rows.length > 0 && (
        <div className="bg-[#14161f]/90 border border-stone-800/80 rounded-2xl p-4 sm:p-6 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-800">
            <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold">
              <TableIcon className="w-4 h-4 text-amber-400" />
              <span>3. {data.tableData.title || 'Bảng đối chiếu phương án dịch thuật tiếng Anh'}</span>
            </div>
            <span className="text-xs text-stone-400">
              {data.tableData.paradigmType}
            </span>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-none">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[580px]">
              <thead>
                <tr className="border-b border-stone-800 text-stone-400 text-[11px] sm:text-xs uppercase bg-[#0e1017]">
                  <th className="py-2.5 px-3 sm:px-4 font-semibold">Phương án / Học giả</th>
                  <th className="py-2.5 px-3 sm:px-4 font-semibold">Thuật ngữ Tiếng Anh</th>
                  <th className="py-2.5 px-3 sm:px-4 font-semibold">Nghĩa tiếng Việt</th>
                  <th className="py-2.5 px-3 sm:px-4 font-semibold">Thuật ngữ Pāḷi</th>
                  <th className="py-2.5 px-3 sm:px-4 font-semibold">Ngữ cảnh & Đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {data.tableData.rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      row.isCurrentSingular || row.isCurrentPlural
                        ? 'bg-amber-500/10 text-amber-100 font-medium'
                        : 'hover:bg-stone-900/60 text-stone-300'
                    }`}
                  >
                    <td className="py-2.5 px-3 sm:px-4 font-medium text-stone-300 whitespace-nowrap">
                      {row.caseOrPerson}
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 font-semibold text-amber-200">
                      <div className="flex items-center gap-1.5">
                        <span>{row.singularForm}</span>
                        <SpeakButton text={row.singularForm} size="sm" title={`Phát âm: ${row.singularForm}`} />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 text-stone-200">
                      {row.singularMeaning}
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 text-stone-300 font-pali">
                      {row.pluralForm}
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 text-stone-400 text-xs">
                      {row.pluralMeaning}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Raw Markdown Toggle */}
      {data.formattedMarkdown && (
        <div className="bg-[#12141c]/60 border border-stone-800/60 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowRawMarkdown(!showRawMarkdown)}
              className="text-xs text-stone-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showRawMarkdown ? 'Ẩn toàn văn phân tích Markdown' : 'Xem toàn văn phân tích Markdown đầy đủ'}</span>
            </button>
            <button
              onClick={handleCopy}
              className="text-xs text-stone-500 hover:text-stone-300 flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </button>
          </div>

          {showRawMarkdown && (
            <pre className="mt-3 p-3 rounded-lg bg-stone-950 text-stone-300 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-stone-800">
              {data.formattedMarkdown}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
