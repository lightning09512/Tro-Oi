import React from 'react'

interface PartnerCardProps {
  onOpenModal: () => void
}

export const PartnerCard: React.FC<PartnerCardProps> = ({ onOpenModal }) => {
  return (
    <div className="home-partner-cta-card" role="region" aria-label="Chương trình Đối tác Trọ Ơi">
      <div className="home-partner-cta-header">
        <h2 className="home-partner-cta-title">
          <span>
            Trở thành <strong className="home-partner-cta-highlight">Đối tác Trọ Ơi</strong>
          </span>
          <svg
            className="partner-verified-shield"
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            aria-label="Xác thực Đối tác"
          >
            <path
              d="M12 2L4 5.5v6c0 5 3.4 9.7 8 10.5 4.6-.8 8-5.5 8-10.5v-6L12 2z"
              fill="#ff5722"
            />
            <path
              d="M9 12l2 2 4-4"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </h2>
      </div>

      <div className="home-partner-benefits-grid">
        {/* 1. Nhãn Đối Tác */}
        <div className="home-partner-benefit-item">
          <div className="home-partner-benefit-icon-wrap" aria-hidden="true">
            <div className="home-partner-badge-pill">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="#ffffff"
                style={{ flexShrink: 0 }}
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
              </svg>
              <span>Đối Tác</span>
            </div>
          </div>
          <div className="home-partner-benefit-content">
            <h4>Nhãn Đối Tác</h4>
            <p>Tăng 40% hiệu quả tin đăng</p>
          </div>
        </div>

        {/* 2. Tin đăng tiếp cận */}
        <div className="home-partner-benefit-item">
          <div className="home-partner-benefit-icon-wrap" aria-hidden="true">
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <path
                d="M5 16.5L12.5 10L18.5 13L27.5 4.5"
                stroke="#ffa173"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 4.5H27.5V11"
                stroke="#ffa173"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect x="5" y="19" width="6" height="11" rx="2" fill="#ff5722" />
              <rect x="13.5" y="14" width="6" height="16" rx="2" fill="#ff5722" />
              <rect x="22" y="8.5" width="6" height="21.5" rx="2" fill="#ff5722" />
            </svg>
          </div>
          <div className="home-partner-benefit-content">
            <h4>Tin đăng tiếp cận</h4>
            <p>Hơn 40 triệu người mua tiềm năng</p>
          </div>
        </div>

        {/* 3. Tài Khoản Doanh Nghiệp */}
        <div className="home-partner-benefit-item">
          <div className="home-partner-benefit-icon-wrap" aria-hidden="true">
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              {/* Office building */}
              <rect x="5" y="5" width="18" height="23" rx="2.5" fill="#ff5722" />
              {/* Windows */}
              <rect x="8" y="8" width="3" height="2.5" rx="0.8" fill="#ffffff" />
              <rect x="13" y="8" width="3" height="2.5" rx="0.8" fill="#ffffff" />
              <rect x="18" y="8" width="3" height="2.5" rx="0.8" fill="#ffffff" />
              <rect x="8" y="12.5" width="3" height="2.5" rx="0.8" fill="#ffffff" />
              <rect x="13" y="12.5" width="3" height="2.5" rx="0.8" fill="#ffffff" />
              <rect x="18" y="12.5" width="3" height="2.5" rx="0.8" fill="#ffffff" />
              <rect x="8" y="17" width="3" height="2.5" rx="0.8" fill="#ffffff" />
              <rect x="13" y="17" width="3" height="2.5" rx="0.8" fill="#ffffff" />
              <rect x="18" y="17" width="3" height="2.5" rx="0.8" fill="#ffffff" />
              <rect x="10.5" y="22" width="5" height="6" rx="0.8" fill="#ffffff" />
              {/* Profile badge overlay bottom-right */}
              <circle cx="25" cy="23" r="7.5" fill="#ffffff" />
              <circle cx="25" cy="23" r="6.2" fill="#ff5722" />
              <circle cx="25" cy="20.8" r="2" fill="#ffffff" />
              <path
                d="M21.2 26.5c.5-1.8 2-2.5 3.8-2.5s3.3.7 3.8 2.5"
                stroke="#ffffff"
                strokeWidth="1.4"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
          <div className="home-partner-benefit-content">
            <h4>Tài Khoản Doanh Nghiệp</h4>
            <p>Giúp tăng hiệu quả quản lý</p>
          </div>
        </div>
      </div>

      <div className="home-partner-cta-btn-wrap">
        <button
          type="button"
          className="home-partner-learn-btn"
          onClick={onOpenModal}
        >
          Tìm hiểu chương trình
        </button>
      </div>
    </div>
  )
}
export default PartnerCard
