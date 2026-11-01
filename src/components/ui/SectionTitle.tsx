import { Icon } from "@/components/common/legacy"

export interface SectionTitleProps {
  eyebrow?: string
  title: string
  action?: string
  onAction?: () => void
  subtitle?: string
}

export function SectionTitle({
  title,
  action,
  onAction,
  subtitle,
}: SectionTitleProps) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {subtitle && <p className="text-xs text-[#64748b] mt-1">{subtitle}</p>}
      </div>
      {action && (
        <button
          type="button"
          className="inline-flex items-center gap-1 font-semibold text-[#245f3b] hover:text-[#173e26] transition-colors"
          onClick={onAction}
        >
          {action}
          <Icon name="chevron" size={16} />
        </button>
      )}
    </div>
  )
}

export default SectionTitle
