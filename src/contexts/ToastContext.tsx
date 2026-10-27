import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { Icon } from "@/components/common/legacy"

export type ToastType = "success" | "error" | "info"

export interface Toast {
  id: number
  message: string
  type: ToastType
}

export interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const TOAST_CONTEXT_KEY = Symbol.for("__TRO_OI_TOAST_CONTEXT__")
type GlobalWithToast = typeof globalThis & {
  [TOAST_CONTEXT_KEY]?: React.Context<ToastContextValue | null>
}

// Preserve context reference across Vite HMR reloads
export const ToastContext =
  (globalThis as GlobalWithToast)[TOAST_CONTEXT_KEY] ??
  ((globalThis as GlobalWithToast)[TOAST_CONTEXT_KEY] = createContext<ToastContextValue | null>(null))

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

  // Listen to global events in case any component dispatches via fallback
  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ message: string; type?: ToastType }>
      if (custom.detail?.message) {
        toast(custom.detail.message, custom.detail.type)
      }
    }
    window.addEventListener("tro-oi-toast", handler)
    return () => window.removeEventListener("tro-oi-toast", handler)
  }, [toast])

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

const fallbackToast: ToastContextValue = {
  toast: (message: string, type: ToastType = "success") => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("tro-oi-toast", { detail: { message, type } }))
    }
  },
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  return context ?? fallbackToast
}
