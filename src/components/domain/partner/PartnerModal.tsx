import React from 'react'
import { Button } from '../../ui/Button'
import { Icon } from '../../common/legacy'

interface PartnerModalProps {
  isOpen: boolean
  onClose: () => void
  onJoin: () => void
}

export const PartnerModal: React.FC<PartnerModalProps> = ({
  isOpen,
  onClose,
  onJoin
}) => {
  if (!isOpen) return null

  return (
    <div
      className="partner-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="partner-dialog-title"
    >
      <div
        className="partner-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="partner-modal-header">
          <div className="partner-modal-title-box">
            <span className="partner-modal-badge">Chương trình độc quyền</span>
            <h3 id="partner-dialog-title">Trở thành Đối tác Trọ Ơi</h3>
            <p>Nâng tầm uy tín và tăng tốc độ tìm kiếm khách thuê phòng hiệu quả nhất</p>
          </div>
          <button
            type="button"
            className="partner-modal-close"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="partner-modal-body">
          <div className="partner-modal-perk-card">
            <div className="partner-modal-perk-icon">
              <div className="home-partner-badge-pill">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
                </svg>
                <span>Đối Tác</span>
              </div>
            </div>
            <div>
              <strong>Huy hiệu Đối Tác chính thức</strong>
              <p>Mỗi tin đăng của bạn đều được gắn huy hiệu xác thực cam nổi bật, thu hút ánh nhìn và tăng hơn 40% tỉ lệ người thuê bấm vào xem chi tiết.</p>
            </div>
          </div>

          <div className="partner-modal-perk-card">
            <div className="partner-modal-perk-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e36825" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M18.5 8.5L13.5 13.5L9.5 9.5L3.5 15.5" />
                <polyline points="14 8.5 18.5 8.5 18.5 13" />
              </svg>
            </div>
            <div>
              <strong>Độ phủ tiếp cận vượt trội</strong>
              <p>Ưu tiên hiển thị trên trang chủ và danh sách tìm kiếm hàng đầu khu vực. Tiếp cận trực tiếp hàng chục ngàn sinh viên và người đi làm mỗi ngày.</p>
            </div>
          </div>

          <div className="partner-modal-perk-card">
            <div className="partner-modal-perk-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e36825" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="11" height="17" rx="1.5" />
                <line x1="7" y1="8" x2="7.01" y2="8" strokeWidth="2.5" />
                <line x1="10" y1="8" x2="10.01" y2="8" strokeWidth="2.5" />
                <circle cx="18" cy="12" r="3" />
                <path d="M14.5 19a4 4 0 0 1 7 0" />
              </svg>
            </div>
            <div>
              <strong>Bộ công cụ quản lý chuyên nghiệp</strong>
              <p>Bảng điều khiển trực quan giúp bạn theo dõi lượt xem, quản lý danh sách phòng trống, tiếp nhận yêu cầu hẹn xem phòng và chat trực tiếp với khách.</p>
            </div>
          </div>
        </div>

        <div className="partner-modal-footer">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={onJoin}
          >
            Tham gia Đối tác ngay
          </Button>
        </div>
      </div>
    </div>
  )
}
export default PartnerModal
