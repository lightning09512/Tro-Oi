import React from 'react'
import { Icon } from '../../common/legacy'

interface PartnerBannerProps {
  onOpenModal: () => void
}

export const PartnerBanner: React.FC<PartnerBannerProps> = ({ onOpenModal }) => {
  return (
    <div className="home-partner-listings-banner" role="complementary" aria-label="Tin đăng Đối Tác">
      <h3 className="home-partner-listings-title">
        <span>Tin đăng từ Đối Tác Trọ Ơi</span>
        <button
          type="button"
          className="home-partner-info-btn"
          aria-label="Thông tin đối tác"
          title="Thông tin chương trình đối tác"
          onClick={onOpenModal}
        >
          <Icon name="info" size={16} />
        </button>
      </h3>
      <div className="home-partner-verified-tags">
        <div className="home-partner-verified-tag">
          <span className="home-partner-check-dot" aria-hidden="true">
            <svg
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <span>Thông tin BĐS chính xác</span>
        </div>
        <div className="home-partner-verified-tag">
          <span className="home-partner-check-dot" aria-hidden="true">
            <svg
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <span>Môi giới được xác minh</span>
        </div>
      </div>
    </div>
  )
}
export default PartnerBanner
