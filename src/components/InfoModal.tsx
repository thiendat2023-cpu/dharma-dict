import React from 'react';
import { X, Info } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="info-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-[92%] sm:w-full max-w-md md:max-w-lg mx-auto bg-[#1a1a1a] border border-gray-800 p-5 sm:p-8 rounded-2xl shadow-2xl text-stone-200 space-y-5 overflow-hidden my-auto max-h-[90vh] overflow-y-auto scrollbar-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Ambient Effect */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Tiêu đề Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2 text-amber-400">
            <Info className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold font-pali text-amber-100">
              Thông Tin
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

        {/* Thân Modal */}
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Ảnh đại diện: Khung ảnh dọc, bo góc tròn, viền màu vàng amber */}
          <div className="w-28 h-36 sm:w-32 sm:h-40 rounded-2xl overflow-hidden border-2 border-amber-500/60 shadow-lg shadow-amber-950/40 bg-[#0d0f15] flex items-center justify-center">
            <img
              src="/avatar.png"
              alt="Chân dung Sadi Thích Ngộ Pháp Đạt"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hiển thị avatar biểu tượng sang trọng nếu file avatar.png chưa được tải lên
                const img = e.currentTarget;
                if (!img.dataset.fallback) {
                  img.dataset.fallback = 'true';
                  img.src = 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80';
                }
              }}
            />
          </div>

          {/* Tên tác giả */}
          <div className="pt-1">
            <h4 className="text-base sm:text-lg">
              <span className="text-stone-400 font-normal mr-1.5">Sadi</span>
              <span className="font-bold font-pali text-amber-300 tracking-wide text-lg sm:text-xl">
                Thích Ngộ Pháp Đạt
              </span>
            </h4>
            {/* Thông tin phụ */}
            <p className="text-xs text-stone-400 mt-0.5">
              Học viên PHTX Khoá XI
            </p>
          </div>
        </div>

        {/* Khu vực Liên hệ & QR (nằm dưới cùng, chia làm 2 cột) */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-[#0e1017] border border-stone-800/80 grid grid-cols-2 gap-3 items-center">
          {/* Cột trái (Thông tin liên hệ, text màu vàng amber/cam) */}
          <div className="space-y-1.5 text-xs sm:text-sm font-medium text-amber-400 sm:leading-relaxed">
            <div className="truncate">
              Zalo: <span className="font-sans font-semibold text-amber-300">0933.459.385</span>
            </div>
            <div className="truncate text-xs">
              Email: <span className="font-sans text-amber-300">thiendat2023@gmail.com</span>
            </div>
          </div>

          {/* Cột phải (Mã QR Zalo: khung vuông nền trắng) */}
          <div className="flex justify-end">
            <div className="w-20 h-20 sm:w-22 sm:h-22 bg-white rounded-lg p-1.5 shadow flex items-center justify-center overflow-hidden">
              <img
                src="/qr-zalo.png"
                alt="Mã QR Zalo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (!img.dataset.fallback) {
                    img.dataset.fallback = 'true';
                    img.src = 'https://api.vietqr.io/image/970422-0933459385-compact2.jpg?amount=0&addInfo=Ket%20noi%20Zalo';
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Nút Đóng trải dài 100% chiều ngang */}
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
