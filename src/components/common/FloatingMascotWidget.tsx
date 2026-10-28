import { useState } from "react"
import { useNavigate } from "react-router"
import { Icon } from "@/components/common/legacy"
import BrandMark from "@/components/common/BrandMark"

export default function FloatingMascotWidget() {
  const navigate = useNavigate()
  const [isDismissed, setIsDismissed] = useState(false)
  const [showAppModal, setShowAppModal] = useState(false)

  return (
    <>
      {/* Floating Sticker & Comic Callout Widget */}
      <aside
        className="fixed bottom-20 right-3.5 z-40 flex flex-col items-end pointer-events-none select-none sm:bottom-24 sm:right-6"
        aria-label="Khuyến mãi & Chia sẻ cộng đồng"
      >
        <div className="pointer-events-auto flex flex-col items-end">
          {/* 1. Mascot "TẢI APP NHẬN QUÀ" Sticker */}
          <button
            type="button"
            onClick={() => setShowAppModal(true)}
            className="group relative cursor-pointer border-0 bg-transparent p-0 transition-transform duration-300 hover:scale-108 active:scale-95 focus:outline-none"
            title="Tải app Trọ Ơi nhận quà"
            aria-label="Tải app Trọ Ơi nhận quà"
          >
            <img
              src="/images/banners/mascot-app-floating-sticker.jpg"
              alt="Tải app Trọ Ơi nhận quà"
              className="size-20 sm:size-24 rounded-2xl object-contain drop-shadow-xl"
            />
            {/* Pulsing indicator ring */}
            <span className="absolute -top-1 -right-1 flex size-3.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#e36825] opacity-75" />
              <span className="relative inline-flex size-3.5 rounded-full bg-[#e36825]" />
            </span>
          </button>

          {/* 2. Comic Speech Bubble Callout (Nhà Tốt Style) */}
          {!isDismissed ? (
            <div className="relative -mt-1 w-48 sm:w-54 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Close (X) button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsDismissed(true)
                }}
                className="absolute -top-2 -right-1.5 z-20 flex size-5 items-center justify-center rounded-full bg-[#1e293b] text-white shadow-md transition hover:scale-110 hover:bg-black focus:outline-none"
                aria-label="Đóng thông báo review"
                title="Đóng"
              >
                <Icon name="close" size={11} />
              </button>

              {/* Yellow comic card with black border & tail */}
              <div
                onClick={() => navigate("/dien-dan")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") navigate("/dien-dan")
                }}
                className="group relative cursor-pointer rounded-2xl border-[2.5px] border-[#1e293b] bg-[#fbb034] p-2.5 shadow-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-orange-500/20 active:translate-y-0"
              >
                <h4 className="text-center text-[12px] font-black uppercase tracking-tight text-[#1e293b] leading-tight mb-2">
                  RẢNH KHU NÀO?<br />CHIA SẺ LIỀN TAY!
                </h4>

                <div className="rounded-xl border-2 border-[#1e293b] bg-white px-2.5 py-1.5 text-center shadow-inner transition-colors group-hover:bg-[#fffdfa]">
                  <p className="text-[11.5px] font-bold text-[#1e293b] leading-tight m-0">
                    Để lại <span className="text-[#ea580c]">review</span><br />khu bạn biết nhé!
                  </p>
                </div>

                {/* Speech bubble comic tail */}
                <div className="absolute -bottom-2 right-8 size-3.5 rotate-45 border-b-[2.5px] border-r-[2.5px] border-[#1e293b] bg-[#fbb034]" />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsDismissed(false)}
              className="mt-1 inline-flex items-center gap-1 rounded-full border border-[#dfe7e1] bg-white/95 px-2.5 py-1 text-[10.5px] font-bold text-[#ea580c] shadow-md backdrop-blur-sm transition hover:scale-105"
              title="Mở lại gợi ý review"
            >
              <span>Viết review</span>
              <Icon name="chevron" size={12} />
            </button>
          )}
        </div>
      </aside>

      {/* App Download Modal with QR Code */}
      {showAppModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowAppModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center text-[#1e293b] border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowAppModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1"
              aria-label="Đóng"
            >
              <Icon name="close" size={20} />
            </button>

            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-[#fff2e8] text-[#ea580c] shadow-sm">
              <BrandMark size={32} />
            </div>

            <h3 className="text-lg font-extrabold text-gray-900 mb-1">
              Tải App Trọ Ơi - Nhận Quà Ngay!
            </h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Quét mã QR để tải app Trọ Ơi, nhận voucher ăn uống và thông báo phòng trọ mới nhất tại khu vực của bạn!
            </p>

            <div className="mx-auto mb-4 flex size-40 items-center justify-center rounded-2xl border-2 border-dashed border-[#fed7aa] bg-[#fffaf5] p-3 shadow-inner">
              <svg viewBox="0 0 120 120" className="size-full text-[#1e293b]">
                <rect width="120" height="120" fill="white" rx="8" />
                <rect x="12" y="12" width="30" height="30" fill="#245f3b" rx="4" />
                <rect x="17" y="17" width="20" height="20" fill="white" rx="2" />
                <rect x="22" y="22" width="10" height="10" fill="#245f3b" rx="1" />

                <rect x="78" y="12" width="30" height="30" fill="#245f3b" rx="4" />
                <rect x="83" y="17" width="20" height="20" fill="white" rx="2" />
                <rect x="88" y="22" width="10" height="10" fill="#245f3b" rx="1" />

                <rect x="12" y="78" width="30" height="30" fill="#245f3b" rx="4" />
                <rect x="17" y="83" width="20" height="20" fill="white" rx="2" />
                <rect x="22" y="88" width="10" height="10" fill="#245f3b" rx="1" />

                <rect x="48" y="15" width="8" height="8" fill="#e36825" />
                <rect x="60" y="20" width="10" height="6" fill="#1e293b" />
                <rect x="48" y="30" width="6" height="14" fill="#1e293b" />
                <rect x="58" y="32" width="12" height="10" fill="#e36825" />
                <rect x="15" y="48" width="8" height="14" fill="#1e293b" />
                <rect x="30" y="52" width="12" height="8" fill="#1e293b" />
                <rect x="48" y="52" width="24" height="20" fill="#245f3b" rx="3" />
                <rect x="78" y="52" width="14" height="8" fill="#1e293b" />
                <rect x="98" y="50" width="10" height="12" fill="#e36825" />
                <rect x="48" y="80" width="10" height="12" fill="#1e293b" />
                <rect x="64" y="85" width="12" height="14" fill="#1e293b" />
                <rect x="80" y="80" width="28" height="26" fill="#e36825" rx="3" />
              </svg>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => alert("Ứng dụng Trọ Ơi trên iOS sắp phát hành trên App Store!")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-gray-800"
              >
                App Store
              </button>
              <button
                type="button"
                onClick={() => alert("Ứng dụng Trọ Ơi trên Android sắp phát hành trên Google Play!")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#245f3b] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1a492d]"
              >
                Google Play
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
