import { useEffect, useRef, type ReactNode } from "react"
import { Icon } from "@/components/common/legacy"

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  maxWidth?: "sm" | "md" | "lg" | "xl"
  footer?: ReactNode
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
  footer,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const maxWidthClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={dialogRef}
        className={`w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 ${maxWidthClasses[maxWidth]}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <button
              type="button"
              className="size-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              onClick={onClose}
              aria-label="Đóng cửa sổ"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
