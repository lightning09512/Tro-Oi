import { createContext, useCallback, useContext, useState, type ReactNode } from "react"
import { Icon } from "@/components/common/legacy"

type ToastType = "success" | "error" | "info"

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++nextId
    setToasts((current) => [...current, { id, message, type }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 3200)
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toasts.length > 0 && (
        <div className="toast-container" aria-live="polite" aria-label="Thông báo">
          {toasts.map((item) => (
            <div className={`toast-item toast-${item.type}`} key={item.id} role="status">
              <span className="toast-icon">
                <Icon
                  name={item.type === "success" ? "check" : item.type === "error" ? "close" : "bell"}
                  size={18}
                />
              </span>
              <span className="toast-message">{item.message}</span>
              <button
                className="toast-dismiss"
                onClick={() => dismiss(item.id)}
                aria-label="Đóng thông báo"
              >
                <Icon name="close" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider")
  }
  return context
}
