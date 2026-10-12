import React from 'react';
import { X, Heart, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="support-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-[92%] sm:w-full max-w-md md:max-w-lg mx-auto bg-[#1a1a1a] border border-gray-800 p-5 sm:p-8 rounded-2xl shadow-2xl text-stone-200 space-y-5 overflow-hidden my-auto max-h-[90vh] overflow-y-auto scrollbar-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Ambient Effect */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2 text-amber-400">
            <Heart className="w-5 h-5 fill-amber-400/20 text-amber-400" />
            <h3 className="text-lg sm:text-xl font-bold font-pali text-amber-300">
              Thầy Đạt cute ^v^
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-sans">
          Dự án TRA CỨU ANH VĂN PHẬT PHÁP được phát triển với tâm nguyện phụng sự việc học tập và nghiên cứu Phật pháp.
        </p>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#0d0f15] border border-amber-900/40 space-y-3">
          <div className="w-52 h-52 sm:w-60 sm:h-60 bg-white rounded-xl p-2.5 shadow-lg flex items-center justify-center overflow-hidden">
            <img
              src="/qr-code.png"
              alt="Mã QR ủng hộ dự án"
              className="w-full h-full object-contain rounded-lg"
              onError={(e) => {
                // Fallback to VietQR API if local file qr-code.png is not uploaded yet
                const img = e.currentTarget;
                if (!img.dataset.fallback) {
                  img.dataset.fallback = 'true';
                  img.src = 'https://api.vietqr.io/image/970422-090123456789-compact2.jpg?amount=0&addInfo=Ung%20ho%20Anh%20van%20Phat%20phap&accountName=THAY%20DAT%20CUTE';
                }
              }}
            />
          </div>

          {/* Dòng chữ dưới mã QR */}
          <p className="text-xs sm:text-sm text-amber-300 font-medium font-pali flex items-center gap-1.5 pt-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Tuỳ hỷ ủng hộ tác giả duy trì dự án</span>
          </p>
        </div>

        {/* Nút Đóng */}
        <div className="pt-1">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-stone-100 font-medium text-xs sm:text-sm border border-stone-800 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
